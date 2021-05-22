
import {
  getJSONTrimmed,
  generateUUID,
  handleError,
  getDefaultPageProperties,
  getUserProvidedConfigUrl,
  findAllEnabledDestinations,
  tranformToRudderNames,
  transformToServerNames,
  checkReservedKeywords
} from "./utils/utils";
import {
  CONFIG_URL,
  MAX_WAIT_FOR_INTEGRATION_LOAD,
  INTEGRATION_LOAD_CHECK_INTERVAL
} from "./utils/constants";
import Emitter from "component-emitter";
import Storage from "./utils/storage";
import { integrations } from "./integrations";
// import logger from "./utils/logUtil";
import CyntelliElementBuilder from "./utils/CyntelliElementBuilder";

/**
 * consts
 */
const serverHost = 'https://r.adgeek.net';
const apiServerUrl = serverHost + '/api';

/**
 * global functions
 */
function pushQueryStringDataToAnalyticsArray(obj) {
  if (obj.anonymousId) {
    if (obj.userId) {
      instance.toBeProcessedArray.push(
        ["setAnonymousId", obj.anonymousId],
        ["identify", obj.userId, obj.traits]
      );
    } else {
      instance.toBeProcessedArray.push(["setAnonymousId", obj.anonymousId]);
    }
  } else if (obj.userId) {
    instance.toBeProcessedArray.push(["identify", obj.userId, obj.traits]);
  }

  if (obj.event) {
    instance.toBeProcessedArray.push(["track", obj.event, obj.properties]);
  }
}

function processDataInAnalyticsArray(analytics) {
  if (instance.loaded) {
    for (let i = 0; i < analytics.toBeProcessedArray.length; i++) {
      const event = [...analytics.toBeProcessedArray[i]];
      const method = event[0];
      event.shift();
      logger.debug("=====from analytics array, calling method:: " + method);
      analytics[method](...event);
    }

    instance.toBeProcessedArray = [];
  }
}

var logger = {debug: function(data){console.log(data)}, error: function(){console.log.apply(this, arguments)}};

console.log(integrations);

/**
 * class responsible for handling core
 * event tracking functionalities
 */
class Analytics {
  /**
   * Creates an instance of Analytics.
   * @memberof Analytics
   */
  constructor() {
    this.toBeProcessedArray = [];
    this.loaded = false;
    this.storage = Storage;
    this.integrations = [];
    this.failedToBeLoadedIntegration = [];
    this.successfullyLoadedIntegration = [];
  }

  /**
   * initializeUser
   */
  initializeUser() {
    this.userId =
      this.storage.getUserId() != undefined ? this.storage.getUserId() : "";

    this.userTraits =
      this.storage.getUserTraits() != undefined
        ? this.storage.getUserTraits()
        : {};

    this.groupId =
      this.storage.getGroupId() != undefined ? this.storage.getGroupId() : "";

    this.groupTraits =
      this.storage.getGroupTraits() != undefined
        ? this.storage.getGroupTraits()
        : {};

    this.anonymousId = this.getAnonymousId();

    this.anonymousTraits =
      this.storage.getAnonymousTraits() != undefined
        ? this.storage.getAnonymousTraits()
        : {};

    // get ga id
    this.gaId = this.storage.getGa();

    // get fbp, fbc id
    this.fbp = this.storage.getFbp();
    this.fbc = this.storage.getFbc();

    // save once for storing older values to encrypted
    this.storage.setUserId(this.userId);
    this.storage.setUserTraits(this.userTraits);
    this.storage.setAnonymousId(this.anonymousId);
    this.storage.setAnonymousTraits(this.anonymousTraits);
    this.storage.setGroupId(this.groupId);
    this.storage.setGroupTraits(this.groupTraits);
  }

  /**
   * Call control pane to get client configs
   *
   * @param {*} writeKey
   * @memberof Analytics
   */
  load(writeKey, options) {
    logger.debug("inside load");
    if (this.loaded) return;

    // validate writeKye
    if (!/^[0-9a-z]{8}\-[0-9a-z]{4}\-[0-9a-z]{4}\-[0-9a-z]{4}\-[0-9a-z]{12}$/.test(writeKey)) {
      handleError({
        message:
          "[Analytics] load:: Unable to load due to wrong writeKey or serverUrl"
      });
      throw Error("failed to initialize");
    }

    // prepare anonymousId
    this.initializeUser();
    this.loaded = true;


    // fetch config

    // load integrtion
    const intgArray = [
      {name: 'CYNTELLI_PIXEL', config: {pvId: 0, pId:0}},
      {name: 'FACEBOOK_PIXEL', config: {pixelId: '137401291692595'}}
    ];
    this.initIntegrations(intgArray);


    // process again new push elements
    processDataInAnalyticsArray(this);
  }

  /**
   * Initialize all integrtions
   */
  initIntegrations(intgArray) {
    logger.debug("init integrtions");

    const self = this;
    if (intgArray.length == 0) {
      return;
    }

    let intgInstance;
    intgArray.forEach(intg => {
      try {
        logger.debug(
          "[Analytics] init :: trying to initialize integration name:: " + intg.name
        );
        const intgClass = integrations[intg.name];
        const destConfig = intg.config;
        intgInstance = new intgClass(destConfig, self);
        intgInstance.init();

        logger.debug("initializing destination: ", intg);
        console.log(intg, intgInstance);

        this.isInitialized(intgInstance).then(this.replayEvents);
      } catch (e) {
        logger.error(
          "[Analytics] initialize integration (integration.init()) failed :: ",
          intg.name
        );
        this.failedToBeLoadedIntegration.push(intgInstance);
      }
    })
  }

  replayEvents(object) {

  }

  pause(time) {
    return new Promise(resolve => {
      setTimeout(resolve, time);
    });
  }

  /**
   * prepare promise for particular instance
   */
  isInitialized(instance, time = 0) {
    return new Promise(resolve => {
      if (instance.isLoaded()) {
        logger.debug("===integration loaded successfully====", instance.name);
        this.successfullyLoadedIntegration.push(instance);
        return resolve(this);
      }
      if (time >= MAX_WAIT_FOR_INTEGRATION_LOAD) {
        logger.debug("====max wait over====");
        this.failedToBeLoadedIntegration.push(instance);
        return resolve(this);
      }

      this.pause(INTEGRATION_LOAD_CHECK_INTERVAL).then(() => {
        logger.debug("====after pause, again checking====");
        return this.isInitialized(
          instance,
          time + INTEGRATION_LOAD_CHECK_INTERVAL
        ).then(resolve);
      });
    });
  }

  page(category, name, properties, options, callback) {
    logger.debug("inside page");
    if (!this.loaded)
      return;

    if (typeof options === "function")
      (callback = options), (options = null);

    if (typeof properties === "function")
      (callback = properties), (options = properties = null);

    if (typeof name === "function")
      (callback = name), (options = properties = name = null);


    if (
      typeof category === "object" &&
      category != null &&
      category != undefined
    )
      (options = name), (properties = category), (name = category = null);

    if (typeof name === "object" && name != null && name != undefined)
      (options = properties), (properties = name), (name = null);

    if (typeof category === "string" && typeof name !== "string")
      (name = category), (category = null);

    console.log(category, name, properties, options, callback);

    // if (this.sendAdblockPage && category != "RudderJS-Initiated") {
    //   this.sendSampleRequest();
    // }

    this.processPage(category, name, properties, options, callback);
  }

  track() {
    logger.debug("inside track");
  }

  identify(userId, userTraits) {
    logger.debug("inside identify");
    if (userId)
      this.storage.setUserId(userId);

    if (userTraits)
      this.storage.setUserTraits(userTraits);
  }

  alias() {
    logger.debug("inside alias");
  }

  ready() {
    logger.debug("inside ready");
  }

  reset() {
    logger.debug("inside reset");
  }

  initializeCallbacks() {
    logger.debug("inside initializeCallbacks");
  }

  registerCallbacks(bool) {
    logger.debug("inside registerCallbacks");
  }

  parseQueryString(search) {
    logger.debug("inside registerCallbacks");
    logger.debug(search);
    return {};
  }

  getAnonymousId() {
    // if (!this.loaded) return;
    this.anonymousId = this.storage.getAnonymousId();
    if (!this.anonymousId) {
      this.setAnonymousId();
    }
    return this.anonymousId;
  }

  /**
   * Sets anonymous id in the followin precedence:
   * 1. anonymousId: Id directly provided to the function.
   * 2. rudderAmpLinkerParm: value generated from linker query parm (rudderstack)
   *    using praseLinker util.
   * 3. generateUUID: A new uniquie id is generated and assigned.
   *
   * @param {string} anonymousId
   * @param {string} rudderAmpLinkerParm
   */
  setAnonymousId(anonymousId, rudderAmpLinkerParm) {
    // if (!this.loaded) return;
    const parsedAnonymousIdObj = rudderAmpLinkerParm
      ? parseLinker(rudderAmpLinkerParm)
      : null;
    const parsedAnonymousId = parsedAnonymousIdObj
      ? parsedAnonymousIdObj.rs_amp_id
      : null;
    this.anonymousId = anonymousId || parsedAnonymousId || generateUUID();
    this.storage.setAnonymousId(this.anonymousId);
  }

  /**
   * get identity
   */
  getIdentities() {
    return this.storage.getIdentities()
  }

  /**
   * Send page call to Rudder BE and to initialized integrations
   *
   * @param {*} category
   * @param {*} name
   * @param {*} properties
   * @param {*} options
   * @param {*} callback
   * @memberof Analytics
   */
  processPage(category, name, properties, options, callback) {
    const rudderElement = new CyntelliElementBuilder().setType("page").build();

    if (!properties) {
      properties = {};
    }
    if (name) {
      rudderElement.message.name = name;
      properties.name = name;
    }
    if (category) {
      rudderElement.message.category = category;
      properties.category = category;
    }
    rudderElement.message.properties = this.getPageProperties(properties); // properties;
    this.trackPage(rudderElement, options, callback);
  }

  /**
   * Page call supporting ruddrElement from builder
   *
   * @param {*} rudderElement
   * @param {*} callback
   * @memberof Analytics
   */
  trackPage(rudderElement, options, callback) {
    this.processAndSendDataToDestinations(
      "page",
      rudderElement,
      options,
      callback
    );
  }

  /**
   * process options parameter
   * Apart from top level keys merge everyting under context
   * context.page's default properties are overriden by same keys of
   * provided properties in case of page call
   *
   * @param {*} rudderElement
   * @param {*} options
   * @memberof Analytics
   */
  processOptionsParam(rudderElement, options) {
    const { type, properties } = rudderElement.message;

    // this.addCampaignInfo(rudderElement);

    // assign page properties to context.page
    rudderElement.message.context.page =
      type == "page"
        ? this.getContextPageProperties(properties)
        : this.getContextPageProperties();

    const toplevelElements = [
      "integrations",
      "anonymousId",
      "originalTimestamp"
    ];
    for (const key in options) {
      if (toplevelElements.includes(key)) {
        rudderElement.message[key] = options[key];
      } else if (key !== "context") {
        rudderElement.message.context = merge(rudderElement.message.context, {
          [key]: options[key]
        });
      } else if (typeof options[key] === "object" && options[key] != null) {
        rudderElement.message.context = merge(rudderElement.message.context, {
          ...options[key]
        });
      } else {
        logger.error(
          "[Analytics: processOptionsParam] context passed in options is not object"
        );
      }
    }
  }

  getPageProperties(properties, options) {
    const defaultPageProperties = getDefaultPageProperties();
    const optionPageProperties = options && options.page ? options.page : {};
    for (const key in defaultPageProperties) {
      if (properties[key] === undefined) {
        properties[key] =
          optionPageProperties[key] || defaultPageProperties[key];
      }
    }
    return properties;
  }

  // Assign page properties to context.page if the same property is not provided under context.page
  getContextPageProperties(properties) {
    const defaultPageProperties = getDefaultPageProperties();
    const contextPageProperties = {};
    for (const key in defaultPageProperties) {
      contextPageProperties[key] =
        properties && properties[key]
          ? properties[key]
          : defaultPageProperties[key];
    }
    return contextPageProperties;
  }

  /**
   * Process and send data to destinations along with rudder BE
   *
   * @param {*} type
   * @param {*} rudderElement
   * @param {*} callback
   * @memberof Analytics
   */
  processAndSendDataToDestinations(type, rudderElement, options, callback) {
    try {
      if (!this.anonymousId) {
        this.setAnonymousId();
      }

      // assign page properties to context
      rudderElement.message.context.page = getDefaultPageProperties();
      rudderElement.message.context.traits = {
        ...this.userTraits
      };

      logger.debug("anonymousId: " + this.anonymousId);
      rudderElement.message.anonymousId = this.anonymousId;
      rudderElement.message.userId = rudderElement.message.userId
        ? rudderElement.message.userId
        : this.userId;
      rudderElement.message.identities = this.removeEmptyName(this.getIdentities());
      rudderElement.message.properties = this.removeEmptyName(rudderElement.message.properties);
      console.log(rudderElement);

      this.processOptionsParam(rudderElement, options);
      logger.debug(JSON.stringify(rudderElement));

      console.log(this.successfullyLoadedIntegration);
      this.successfullyLoadedIntegration.forEach(function(integration){
        integration[type](rudderElement);
      });

    } catch (error) {
      handleError(error);
    }
  }

  /**
   * remove name by empty value
   */
  removeEmptyName(props) {
    let newProps = {};
    console.log(typeof props, 'props');
    if (typeof props !== 'object')
      return props;

    let type = null;
    let valid = 0;
    for(let name in props) {
      type = typeof props[name];

      if (type === 'object') {
        let tmpProps = this.removeEmptyName(props[name]);
        if (tmpProps)
          newProps[name] = tmpProps;
      } else if (type === 'string') {
        if (props[name].trim().length > 0)
          newProps[name] = props[name].trim();
      } else if (type === 'undefined')
        continue;
      else
        newProps[name] = props[name];

      valid ++;
    }

    return (valid>0) ? newProps : null;
  }
}

// new instance
const instance = new Analytics();

// emiiter instance
Emitter(instance);

// add error handler
window.addEventListener(
  "error",
  e => {
    handleError(e, instance);
  },
  true
);

// if (process.browser) {
// test for adblocker
// instance.sendSampleRequest()

// initialize supported callbacks
instance.initializeCallbacks();

// register supported callbacks
instance.registerCallbacks(false);
const eventsPushedAlready =
  !!window.cyntellianalytics &&
  window.cyntellianalytics.push == Array.prototype.push;
  console.log(window.cyntellianalytics.push, typeof window.cyntellianalytics.push);

// exchange to internal variable
const argumentsArray = window.cyntellianalytics;

// check initial start from load
while (argumentsArray && argumentsArray[0] && argumentsArray[0][0] !== "load") {
  argumentsArray.shift();
}

// run load and shift this task
if (
  argumentsArray &&
  argumentsArray.length > 0 &&
  argumentsArray[0][0] === "load"
) {
  const method = argumentsArray[0][0];
  argumentsArray[0].shift();
  logger.debug("=====from init, calling method:: " + method);
  console.log(...argumentsArray[0]);
  instance[method](...argumentsArray[0]);
  argumentsArray.shift();
}

// once loaded, parse querystring of the page url to send events
const parsedQueryObject = instance.parseQueryString(window.location.search);

pushQueryStringDataToAnalyticsArray(parsedQueryObject);

// process the others tasks
if (argumentsArray && argumentsArray.length > 0) {
  for (let i = 0; i < argumentsArray.length; i++) {
    instance.toBeProcessedArray.push(argumentsArray[i]);
  }
}

if (eventsPushedAlready) {
  processDataInAnalyticsArray(instance);
}
// }

const ready = instance.ready.bind(instance);
const page = instance.page.bind(instance);
const track = instance.track.bind(instance);
const identify = instance.identify.bind(instance);
const load = instance.load.bind(instance);
const initialized = (instance.initialized = true);
const getAnonymousId = instance.getAnonymousId.bind(instance);

export {
  initialized,
  ready,
  page,
  track,
  load,
  identify,
  getAnonymousId
};
