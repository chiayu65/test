class GoogleAds {
  constructor(config) {
    // this.accountId = config.accountId;//AW-696901813
    this.conversionId = config.conversionID;
    this.pageLoadConversions = config.pageLoadConversions;
    this.clickEventConversions = config.clickEventConversions;
    this.defaultPageConversion = config.defaultPageConversion;
    this.excludes = config.excludes || [];
    this.name = "GOOGLEADS";
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
    })("googleAds-integration", sourceUrl, document);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", this.conversionId);

    console.log("===in init Google Ads===");
  }

  identify(rudderElement) {
    console.log("[GoogleAds] identify:: method not supported");
  }

  // https://developers.google.com/gtagjs/reference/event
  track(rudderElement) {
    console.log("in GoogleAdsAnalyticsManager track");
    const msg = rudderElement.message;
    const props = msg.properties;
    const event = msg.event;

    // check event could be sent
    if (!this.canSendEvent(event))
      return;

    const identities = msg.identities;
    let sentTo = this.conversionId;
    let payload = {};

    // prepare payload
    if (/^AddToCart|ViewContent|Purchase|AddPaymentInfo|InitiateCheckout$/.test(event)) {
      if (/InitiateCheckout|AddPaymentInfo/.test(event) != false) {
        payload = {items: [props]};
      } else {
        payload = props;
      }

      if (event == 'Purchase')
        payload['transaction_id'] = props['order_id'];
    } else {
      if (event == 'Search')
        payload = {search_string: props.keyword};
      else
        payload = props;
    }

    const conversionData = this.getConversionData(
      this.clickEventConversions,
      event
    );

    if (conversionData.conversionLabel) {
      const { conversionLabel } = conversionData;
      sentTo += '/' + conversionLabel;
    }

    payload['user_id'] = identities.uid;
    payload['send_to'] = sentTo;
    console.log(payload);
    window.gtag("event", event, payload);
  }

  page(rudderElement) {
    console.log("in GoogleAdsAnalyticsManager page");
    const msg = rudderElement.message;
    const identities = msg.identities;
    const conversionData = this.getConversionData(
      this.pageLoadConversions,
      rudderElement.message.name
    );

    let sentTo = this.conversionId,
        eventName = 'PageView';

    if (conversionData.conversionLabel) {
      const { conversionLabel } = conversionData;
      const { eventName } = conversionData;
      sentTo += '/' + conversionLabel;
    }

    let props = {
      send_to: sentTo,
      user_id: identities.uid
    };

    if (!this.canSendEvent('PageView'))
      return;

    window.gtag("event", eventName, props);
  }

  getConversionData(eventTypeConversions, eventName) {
    const conversionData = {};
    if (eventTypeConversions) {
      if (eventName) {
        eventTypeConversions.forEach((eventTypeConversion) => {
          if (
            eventTypeConversion.name === eventName
          ) {
            // rudderElement["message"]["name"]
            conversionData.conversionLabel =
              eventTypeConversion.conversionLabel;
            conversionData.eventName = eventTypeConversion.name;
          }
        });
      } else if (this.defaultPageConversion) {
        conversionData.conversionLabel = this.defaultPageConversion;
        conversionData.eventName = "PageView";
      }
    }
    return conversionData;
  }

  isLoaded() {
    return window.dataLayer.push !== Array.prototype.push;
  }

  isReady() {
    return window.dataLayer.push !== Array.prototype.push;
  }

  canSendEvent(ev) {
    return this.excludes.indexOf(ev) === -1;
  }
}

export { GoogleAds };
