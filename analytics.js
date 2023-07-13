
import {
  getJSONConfig,
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
import after from "after";
import Emitter from "component-emitter";
import Storage from "./utils/storage";
import { integrations } from "./integrations";
// import logger from "./utils/logUtil";
import CyntelliElementBuilder from "./utils/CyntelliElementBuilder";

/**
 * consts
 */
const API_ENDPOINT = 'https://r.adgeek.net/api';

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

var logger = {debug: function(){console.log.apply(null, arguments)}, error: function(){console.log.apply(this, arguments)}};

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
    this.autoTrackHandlersRegistered = false;
    this.autoTrackFeatureEnabled = false;
    this.initialized = false;
    this.areEventsReplayed = false;
    this.trackValues = [];
    this.eventsBuffer = [];
    this.clientIntegrations = [];
    this.loadOnlyIntegrations = {};
    this.clientIntegrationObjects = undefined;
    this.successfullyLoadedIntegration = [];
    this.failedToBeLoadedIntegration = [];
    this.toBeProcessedArray = [];
    this.toBeProcessedByIntegrationArray = [];
    this.storage = Storage;
    this.sendAdblockPage = false;
    this.sendAdblockPageOptions = {};
    this.clientSuppliedCallbacks = {};
    this.readyCallback = () => {};
    this.executeReadyCallback = undefined;
    this.methodToCallbackMapping = {
      syncPixel: "syncPixelCallback"
    };
    this.loaded = false;
    this.loadIntegration = true;
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
   * @param {*} clientId
   * @memberof Analytics
   */
  load(clientId, options) {
    logger.debug("inside load");
    if (this.loaded) return;

    // validate writeKye
    if (!/^[0-9a-z]{8}\-[0-9a-z]{4}\-[0-9a-z]{4}\-[0-9a-z]{4}\-[0-9a-z]{12}$/.test(clientId)) {
      handleError({
        message:
          "[Analytics] load:: Unable to load due to wrong clientId or serverUrl"
      });
      throw Error("failed to initialize");
    }

    if (!options) {
      options = {
         maxRetryDelay: 360000, // Upper cap on maximum delay for an event
         minRetryDelay: 1000, // minimum delay before sending an event
         backoffFactor: 2, // exponentional base
         maxAttempts: 10, // max attempts
         maxItems: 100,  // max number of events in storage
       };
    }

    if (options && options.loadIntegration != undefined) {
      this.loadIntegration = !!options.loadIntegration;
    }

    // prepare anonymousId
    this.initializeUser();
    this.loaded = true;


    // fetch config

    // load integrtion
    getJSONConfig(this, API_ENDPOINT, clientId, this.processResponse);

    // process again new push elements
    processDataInAnalyticsArray(this);
  }

  /**
   * Process the response from control plane and
   * call initialize for integrations
   *
   * @param {*} status
   * @param {*} response
   * @memberof Analytics
   */
  processResponse(status, response) {
    try {
      logger.debug(`===in process response=== ${status}`);
      response = JSON.parse(response);
      if (
        response.source.useAutoTracking &&
        !this.autoTrackHandlersRegistered
      ) {
        this.autoTrackFeatureEnabled = true;
        addDomEventHandlers(this);
        this.autoTrackHandlersRegistered = true;
      }
      response.source.destinations.forEach(function (destination, index) {
        logger.debug(
          `Destination ${index} Enabled? ${destination.enabled} Type: ${destination.destinationDefinition.name} Use Native SDK? true`
        );
        if (destination.enabled) {
          this.clientIntegrations.push({
            name: destination.destinationDefinition.name,
            config: destination.config
          });
        }
      }, this);

      logger.debug("this.clientIntegrations: ", this.clientIntegrations);
      // intersection of config-plane native sdk destinations with sdk load time destination list
      this.clientIntegrations = findAllEnabledDestinations(
        this.loadOnlyIntegrations,
        this.clientIntegrations
      );

      // remove from the list which don't have support yet in SDK
      this.clientIntegrations = this.clientIntegrations.filter(intg => {
        return integrations[intg.name] != undefined;
      });

      this.init(this.clientIntegrations);
    } catch (error) {
      handleError(error);
      logger.debug("===handling config BE response processing error===");
      logger.debug(
        "autoTrackHandlersRegistered",
        this.autoTrackHandlersRegistered
      );
      if (this.autoTrackFeatureEnabled && !this.autoTrackHandlersRegistered) {
        addDomEventHandlers(this);
        this.autoTrackHandlersRegistered = true;
      }
    }
  }

  /**
   * Initialize integrations by addinfg respective scripts
   * keep the instances reference in core
   *
   * @param {*} intgArray
   * @returns
   * @memberof Analytics
   */
  init(intgArray) {
    const self = this;
    logger.debug("supported intgs ", integrations);
    // this.clientIntegrationObjects = [];

    if (!intgArray || intgArray.length == 0) {
      if (this.readyCallback) {
        this.readyCallback();
      }
      this.toBeProcessedByIntegrationArray = [];
      return;
    }
    let intgInstance;
    intgArray.forEach(intg => {
      try {
        logger.debug(
          "[Analytics] init :: trying to initialize integration name:: ",
          intg.name
        );
        const intgClass = integrations[intg.name];
        const destConfig = intg.config;
        intgInstance = new intgClass(destConfig, self);
        intgInstance.init();

        logger.debug("initializing destination: ", intg);

        this.isInitialized(intgInstance).then(this.replayEvents);
      } catch (e) {
        logger.error(
          "[Analytics] initialize integration (integration.init()) failed :: ",
          intg.name
        );
        this.failedToBeLoadedIntegration.push(intgInstance);
      }
    });
  }

  replayEvents(object) {
    if (
      (object.successfullyLoadedIntegration.length +
        object.failedToBeLoadedIntegration.length ===
        object.clientIntegrations.length) &&
      !object.areEventsReplayed
    ) {
      logger.debug(
        "===replay events called====",
        " successfully loaded count: ",
        object.successfullyLoadedIntegration.length,
        " failed loaded count: ",
        object.failedToBeLoadedIntegration.length
      );
      // eslint-disable-next-line no-param-reassign
      object.clientIntegrationObjects = [];
      // eslint-disable-next-line no-param-reassign
      object.clientIntegrationObjects = object.successfullyLoadedIntegration;

      logger.debug(
        "==registering after callback===",
        " after to be called after count : ",
        object.clientIntegrationObjects.length
      );
      object.executeReadyCallback = after(
        object.clientIntegrationObjects.length,
        object.readyCallback
      );

      logger.debug("==registering ready callback===");
      object.on("ready", object.executeReadyCallback);

      object.clientIntegrationObjects.forEach(intg => {
        logger.debug("===looping over each successful integration====");
        if (!intg.isReady || intg.isReady()) {
          logger.debug("===letting know I am ready=====", intg.name);
          object.emit("ready");
        }
      });

      if (object.toBeProcessedByIntegrationArray.length > 0) {
        // send the queued events to the fetched integration
        object.toBeProcessedByIntegrationArray.forEach(event => {
          const methodName = event[0];
          event.shift();

          // convert common names to sdk identified name
          if (Object.keys(event[0].message.integrations).length > 0) {
            tranformToRudderNames(event[0].message.integrations);
          }

          // if not specified at event level, All: true is default
          const clientSuppliedIntegrations = event[0].message.integrations;

          // get intersection between config plane native enabled destinations
          // (which were able to successfully load on the page) vs user supplied integrations
          const succesfulLoadedIntersectClientSuppliedIntegrations = findAllEnabledDestinations(
            clientSuppliedIntegrations,
            object.clientIntegrationObjects
          );

          // send to all integrations now from the 'toBeProcessedByIntegrationArray' replay queue
          for (
            let i = 0;
            i < succesfulLoadedIntersectClientSuppliedIntegrations.length;
            i += 1
          ) {
            try {
              if (
                !succesfulLoadedIntersectClientSuppliedIntegrations[i]
                  .isFailed ||
                !succesfulLoadedIntersectClientSuppliedIntegrations[
                  i
                ].isFailed()
              ) {
                if (
                  succesfulLoadedIntersectClientSuppliedIntegrations[i][
                    methodName
                  ]
                ) {
                  succesfulLoadedIntersectClientSuppliedIntegrations[i][
                    methodName
                  ](...event);
                }
              }
            } catch (error) {
              handleError(error);
            }
          }
        });
        object.toBeProcessedByIntegrationArray = [];
      }
      object.areEventsReplayed = true;
    }
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
      logger.debug('isInit', instance.isLoaded());
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

    // if (this.sendAdblockPage && category != "RudderJS-Initiated") {
    //   this.sendSampleRequest();
    // }

    this.processPage(category, name, properties, options, callback);
  }

  track(event, properties, options, callback) {
    if (!this.loaded) return;
    if (typeof options === "function") (callback = options), (options = null);
    if (typeof properties === "function")
      (callback = properties), (options = null), (properties = null);
    this.processTrack(event, properties, options, callback);
  }

  identify(values) {
    if (typeof values == 'string')
      this.storage.setUserId(values);

    if (typeof values == 'object') {
      let value;
      for(let name in values) {
        name = name.trim();
        value = values[name] || '';
        if (name.length > 0 && value.length > 0)
          this.storage.setData(name, value.trim());
      }
    }

    const rudderElement = new CyntelliElementBuilder().setType("identify")
                                                      .setPageProperty(this.getPageProperties())
                                                      .build();
    this.processAndSendDataToDestinations(
      "identify",
      rudderElement
    );
  }

  alias() {
    logger.debug("inside alias");
  }

  ready(callback) {
    if (!this.loaded) return;
    if (typeof callback === "function") {
      this.readyCallback = callback;
      return;
    }
    logger.error("ready callback is not a function");
  }

  reset() {
    logger.debug("inside reset");
  }

  initializeCallbacks() {
    Object.keys(this.methodToCallbackMapping).forEach(methodName => {
      if (this.methodToCallbackMapping.hasOwnProperty(methodName)) {
        this.on(methodName, () => {});
      }
    });
  }

  registerCallbacks(calledFromLoad) {
    if (!calledFromLoad) {
      Object.keys(this.methodToCallbackMapping).forEach(methodName => {
        if (this.methodToCallbackMapping.hasOwnProperty(methodName)) {
          if (window.cyntellianalytics) {
            if (
              typeof window.cyntellianalytics[
                this.methodToCallbackMapping[methodName]
              ] === "function"
            ) {
              this.clientSuppliedCallbacks[methodName] =
                window.cyntellianalytics[
                  this.methodToCallbackMapping[methodName]
                ];
            }
          }
          // let callback =
          //   ? typeof window.cyntellianalytics[
          //       this.methodToCallbackMapping[methodName]
          //     ] == "function"
          //     ? window.cyntellianalytics[this.methodToCallbackMapping[methodName]]
          //     : () => {}
          //   : () => {};

          // logger.debug("registerCallbacks", methodName, callback);

          // this.on(methodName, callback);
        }
      });
    }

    Object.keys(this.clientSuppliedCallbacks).forEach(methodName => {
      if (this.clientSuppliedCallbacks.hasOwnProperty(methodName)) {
        logger.debug(
          "registerCallbacks",
          methodName,
          this.clientSuppliedCallbacks[methodName]
        );
        this.on(methodName, this.clientSuppliedCallbacks[methodName]);
      }
    });
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
    const rudderElement = new CyntelliElementBuilder().setType("page")
                                                      .setPageProperty(this.getPageProperties())
                                                      .build();

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

    rudderElement.setEventName('PageView');
    rudderElement.setProperty(properties);
    this.trackPage(rudderElement, options, callback);
  }

  /**
   * Send track call to Rudder BE and to initialized integrations
   *
   * @param {*} event
   * @param {*} properties
   * @param {*} options
   * @param {*} callback
   * @memberof Analytics
   */
  processTrack(event, properties, options, callback) {
    const rudderElement = new CyntelliElementBuilder().setType("track")
                                                      .setPageProperty(this.getPageProperties({}))
                                                      .build();
    if (event) {
      rudderElement.setEventName(event);
    }
    if (properties) {
      rudderElement.setProperty(properties);
    } else {
      rudderElement.setProperty({});
    }

    console.log('props @ processTrack', properties);
    console.log('element @ processTrack', rudderElement);

    this.trackEvent(rudderElement, options, callback);
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
   * Track call supporting rudderelement from builder
   *
   * @param {*} rudderElement
   * @param {*} callback
   * @memberof Analytics
   */
  trackEvent(rudderElement, options, callback) {
    this.processAndSendDataToDestinations(
      "track",
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
    if (!properties)
      properties = {};

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
      // rudderElement.message.properties = this.removeEmptyName(rudderElement.message.properties);

      this.processOptionsParam(rudderElement, options);

      // structure user supplied integrations object to rudder format
      if (Object.keys(rudderElement.message.integrations).length > 0) {
        tranformToRudderNames(rudderElement.message.integrations);
      }

      // if not specified at event level, All: true is default
      const clientSuppliedIntegrations = rudderElement.message.integrations;

      // get intersection between config plane native enabled destinations
      // (which were able to successfully load on the page) vs user supplied integrations
      const succesfulLoadedIntersectClientSuppliedIntegrations = findAllEnabledDestinations(
        clientSuppliedIntegrations,
        this.clientIntegrationObjects
      );

      // try to first send to all integrations, if list populated from BE
      try {
        succesfulLoadedIntersectClientSuppliedIntegrations.forEach(obj => {
          if (!obj.isFailed || !obj.isFailed()) {
            if (obj[type]) {
              obj[type](rudderElement);
            }
          }
        });
      } catch (err) {
        handleError({ message: `[sendToNative]:${err}` });
      }

      // logger.debug(rudderElement);

      // config plane native enabled destinations, still not completely loaded
      // in the page, add the events to a queue and process later
      if (!this.clientIntegrationObjects) {
        logger.debug("pushing in replay queue");
        // new event processing after analytics initialized  but integrations not fetched from BE
        this.toBeProcessedByIntegrationArray.push([type, rudderElement]);
      }

      // convert integrations object to server identified names, kind of hack now!
      transformToServerNames(rudderElement.message.integrations);

      logger.debug(`${type} is called `);
      if (callback) {
        callback();
      }

    } catch (error) {
      handleError(error);
    }
  }

  /**
   * remove name by empty value
   */
  removeEmptyName(props) {
    let newProps = {};
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

// set version
window.cyntellianalytics.version = '1.7.3';

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

// add listener of cyntellianalytics.push
argumentsArray.push = function() {
  let args = arguments[0].map(function(value){return value});
  const method = args[0];
  args.shift();
  instance[method](...args);
  return Array.prototype.push.call(this, arguments[0]);
}

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
