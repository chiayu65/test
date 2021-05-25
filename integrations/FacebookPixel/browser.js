import is from "is";
import ScriptLoader from "../ScriptLoader";
import logger from "../../utils/logUtil";
import querystring from "component-querystring";

class FacebookPixel {
  constructor(config) {
    this.name = "FACEBOOK_PIXEL";
    this.pixelId = config.pixelId;
  }

  init() {
    console.log("===in init FacebookPixel===");
    window._fbq = function () {
      if (window.fbq.callMethod) {
        window.fbq.callMethod.apply(window.fbq, arguments);
      } else {
        window.fbq.queue.push(arguments);
      }
    };

    window.fbq = window.fbq || window._fbq;
    window.fbq.push = window.fbq;
    window.fbq.loaded = true;
    window.fbq.disablePushState = true; // disables automatic pageview tracking
    window.fbq.allowDuplicatePageViews = true; // enables fb
    window.fbq.version = "2.0";
    window.fbq.queue = [];

    window.fbq("init", this.pixelId);
    ScriptLoader(
      "fbpixel-integration",
      "https://connect.facebook.net/en_US/fbevents.js"
    );
    // window.fbq("init", this.pixelId);
  }

  isLoaded() {
    console.log("in FBPixel isLoaded");
    return !!(window.fbq && window.fbq.callMethod);
  }

  isReady() {
    console.log("in FBPixel isReady");
    return !!(window.fbq && window.fbq.callMethod);
  }

  page(rudderElement) {
    console.log(this.name + ' send page event');
    window.fbq('track', 'PageView');
  }

  identify(rudderElement) {

  }

  track(rudderElement) {
    console.log(this.name + ' send track event');
    return;
  }

  getContentType(rudderElement, defaultValue) {

  }

  merge(obj1, obj2) {
    let obj = {};
    for(let name in obj1)
      obj[name] = obj1[name];

    for(let name in obj2)
      obj[name] = obj2[name];

    return obj;
  }
}

export { FacebookPixel };
