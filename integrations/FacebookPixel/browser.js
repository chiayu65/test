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
    logger.debug("===in init FacebookPixel===");
    // !function(f,b,e,v,n,t,s) {
    //   if (f.fbq)
    //     return;

    //   n = f.fbq = function() {
    //     n.callMethod ? n.callMethod.apply(n,arguments) : n.queue.push(arguments)
    //   };

    //   if(!f._fbq)
    //     f._fbq = n;

    //   n.push = n;
    //   n.loaded = !0;
    //   n.version = '2.0';
    //   n.queue = [];
    //   t = b.createElement(e);
    //   t.async = !0;
    //   t.src = v;
    //   s = b.getElementsByTagName(e)[0];
    //   s.parentNode.insertBefore(t,s)
    // }(window, document,'script', 'https://connect.facebook.net/en_US/fbevents.js');

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
    // logger.debug("in FBPixel isLoaded");
    console.log("in FBPixel isLoaded");
    return !!(window.fbq && window.fbq.callMethod);
  }

  isReady() {
    logger.debug("in FBPixel isReady");
    return !!(window.fbq && window.fbq.callMethod);
  }

  page(rudderElement) {
    // logger.debug('FACEBOOK send page event');
    console.log('FACEBOOK send page event');
    window.fbq('track', 'PageView');
  }

  identify(rudderElement) {

  }

  track(rudderElement) {

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
