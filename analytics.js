
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
import Emitter from "component-emitter";
import Storage from "./utils/storage";
// import logger from "./utils/logUtil";

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

var logger = {debug: function(data){console.log(data)}};

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
    console.log('aid', this.getAnonymousId());
    // console.log(generateUUID());
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
    this.storage.setAnonymousId(this.anonymousId);
    this.storage.setAnonymousTraits(this.anonymousTraits);
    this.storage.setGroupId(this.groupId);
    this.storage.setUserTraits(this.userTraits);
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
    var integrations = [
      {t: 'Fb', pid: '123123'},
      {t: 'CyntelliDMP', pvId: 1, pId: 1}
    ];

    // process again new push elements
    processDataInAnalyticsArray(this);
  }

  page() {
    logger.debug("inside page");
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
