class DV360 {
  constructor(config) {
    // this.accountId = config.accountId;//AW-696901813
    this.conversionId = config.conversionID;
    this.conversions = config.conversions || [];
    this.allowCustomScripts = config.allowCustomScripts;
    this.excludes = config.excludes || [];
    this.name = "DV360";
  }

  init() {
    const sourceUrl = `https://www.googletagmanager.com/gtag/js?id=${this.conversionId}`;
    (function (id, src, document) {
      console.log(`in script loader=== ${id}`);
      const js = document.createElement("script");
      js.src = src;
      js.async = 1;
      js.type = "text/javascript";
      js.id = id;
      const e = document.getElementsByTagName("head")[0];
      console.log("==script==", e);
      e.appendChild(js);
    })("dv360-integration", sourceUrl, document);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", this.conversionId);

    console.log("===in init DV360 ===");
  }

  identify(rudderElement) {
    console.log("[DV360] identify:: method not supported");
  }

  // https://developers.google.com/gtagjs/reference/event
  track(rudderElement) {
    const msg = rudderElement.message;
    const props = msg.properties;
    const identities = msg.identities;
    let sentTo = this.conversionId;
    let payload = {allow_custom_scripts: this.allowCustomScripts, dc_custom_params: {match_id: identities.uid}, send_to: sentTo};
    let event = msg.event;

    // check event could be sent
    if (!this.canSendEvent(event))
      return;

    const cv = this.getConversion(event);
    if (cv.label) {
      payload.send_to += '/' + cv.label;
      event = 'conversion';
      if (/sales/.test(cv.label))
        event = 'purchase';
    }

    for(var name in props) {
      payload[name] = props[name];
    }

    window.gtag("event", event, payload);
    console.log("in DV360Manager (" + this.conversionId + ") track");
  }

  page(rudderElement) {
    console.log("in DV360Manager page");
    const msg = rudderElement.message;
    const identities = msg.identities;
    const sentTo = this.conversionId;
    let ev = 'PageView';
    let props = {
      send_to: sentTo,
      user_id: identities.uid
    };

    if (!this.canSendEvent(ev))
      return;

    const cv = this.getConversion(ev);
    if (cv.label) {
      props.send_to += '/' + cv.label;
      ev = 'conversion';
      if (/sales/.test(cv.label))
        ev = 'purchase';
    }

    window.gtag("event", ev, props);
  }

  getConversion(event) {
    const cvs = this.conversions;
    if (cvs.length == 0)
      return false;

    for(let i=0; i<cvs.length; i++) {
      const cv = cvs[i];
      if (cv.event == event)
        return cv;
    }

    return false;
  }

  isLoaded() {
    return window.dataLayer.push !== Array.prototype.push;
  }

  isReady() {
    return window.dataLayer.push !== Array.prototype.push;
  }

  canSendEvent(ev) {
    if (this.excludes.length === 0)
      return true;

    return this.excludes.indexOf(ev) === -1;
  }
}

export { DV360 };
