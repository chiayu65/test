import ScriptLoader from "../ScriptLoader";

class FacebookPixel {

  constructor(config) {
    this.name = "FACEBOOK_PIXEL";
    this.pixelId = config.pixelId;
    this.enableDPA = config.enableDPA || false;
    this.contentType = config.contentType || 'product';
    this.excludes = config.excludes || [];
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
    const payload = {eventID: msg.messageId};
    const names = {phone: 'ph', email: 'em', uid: 'external_id'};
    const userData = {};
    let value;
    let alias;

    for(let name in names) {
      value = identities[name] || null;
      alias = names[name];
      if (value)
        userData[alias] = value;
    }

    window.fbq("init", this.pixelId, userData);
    if (!this.canSendEvent('PageView'))
      return;

    this.send('PageView', {}, payload);
  }

  identify(rudderElement) {
    console.log('fb identify');
    return;
  }

  track(rudderElement) {
    const msg = rudderElement.message;
    const props = msg.properties;
    const event = msg.event;

    // check event could be sent
    if (!this.canSendEvent(event))
      return;

    let options = {eventID: msg.messageId};
    let payload;
    if (/^AddToCart|ViewContent|Purchase|AddPaymentInfo|InitiateCheckout$/.test(event)) {
      if (/Purchase|InitiateCheckout|AddPaymentInfo/.test(event) == false) {
        const qty = parseInt(props.quantity || 1);
        const value = parseInt(props.value || 1);
        const currency = props.currency || 'TWD';
        payload = {value: qty*value, contents: [props], currency: currency};
      } else {
        payload = props;
        payload['num_items'] = (props.contents || []).length;
      }

      if (this.enableDPA)
        payload['content_type'] = this.contentType;

    } else {
      if (event == 'Search')
        payload = {search_string: props.keyword};
      else
        payload = props;
    }

    // const payload = props;
    this.send(msg.event, payload, options);
  }

  send(event, payload, options) {
      const track = (this.standEventsReg.test(event)) ? 'trackSingle' : 'trackSingleCustom';
      window.fbq(track, this.pixelId, event, payload, options);
  }

  canSendEvent(ev) {
    return this.excludes.indexOf(ev) === -1;
  }
}

export { FacebookPixel };
