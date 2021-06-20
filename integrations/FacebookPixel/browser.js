import is from "is";
import ScriptLoader from "../ScriptLoader";
import logger from "../../utils/logUtil";
import querystring from "component-querystring";

class FacebookPixel {

  constructor(config) {
    this.name = "FACEBOOK_PIXEL";
    this.pixelId = config.pixelId;
    this.enableDPA = config.enableDPA || false;
    this.contentType = config.contentType || 'product';
    this.standEventsReg = /^(AddPaymentInfo|AddToCart|AddToWishlist|CompleteRegistration|Contact|CustomizeProduct|Donate|FindLocation|InitiateCheckout|Lead|PageView|Purchase|Schedule|Search|StartTrial|SubmitApplication|Subscribe|ViewContent)$/;
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
    const msg = rudderElement.message;
    const identities = msg.identities
    const payload = {eventID: msg.messageId, external_id: identities.uid};
    this.send('PageView', payload);
  }

  identify(rudderElement) {
    return;
  }

  track(rudderElement) {
    const msg = rudderElement.message;
    const identities = msg.identities;
    const props = msg.properties;
    const event = msg.event;
    let options = {eventID: msg.messageId};
    let payload;
    if (/^AddToCart|ViewContent|Purchase$/.test(event)) {
      if (event != 'Purchase') {
        const qty = parseInt(props.quantity || 1);
        const value = parseInt(props.value || 1);
        const currency = props.currency || 'TWD';
        payload = {value: qty*value, contents: [props], currency: currency};
      } else {
        payload = props;
      }
      if (this.enableDPA)
        payload['content_type'] = this.contentType;
    } else {
      payload = props;
    }

    // const payload = props;
    this.send(msg.event, payload, options);
  }

  send(event, payload, options) {
    if (event != 'PageView') {
      console.log(options);
      const track = (this.standEventsReg.test(event)) ? 'trackSingle' : 'trackSingleCustom';
        window.fbq(track, this.pixelId, event, payload, options);
    } else
      window.fbq('trackSingle', this.pixelId, event, payload);
  }
}

export { FacebookPixel };
