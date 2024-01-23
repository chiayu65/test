class GoogleAds {
  constructor(config) {
    // this.accountId = config.accountId;//AW-696901813
    this.conversionId = config.conversionID;
    this.conversions = config.conversions || [];
    this.excludes = config.excludes || [];
    this.name = "GOOGLEADS";
  }

  init() {
    const sourceUrl = `https://www.googletagmanager.com/gtag/js?id=${this.conversionId}`;
    (function (id, src, document) {
      // console.log(`in script loader=== ${id}`);
      const js = document.createElement("script");
      js.src = src;
      js.async = 1;
      js.type = "text/javascript";
      js.id = id;
      const e = document.getElementsByTagName("head")[0];
      // console.log("==script==", e);
      e.appendChild(js);
    })("googleAds-integration", sourceUrl, document);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", this.conversionId, {"allow_enhanced_conversions": true});

    // console.log("===in init Google Ads===");
  }

  identify(rudderElement) {
    const msg = rudderElement.message;
    const props = msg.properties;
    const identities = msg.identities;
    var pii = {};

    if (identities.email)
      pii['email'] = identities.email;

    if (identities.email_sha256)
      pii['sha256_email_address'] = identities.email_sha256;

    window.gtag('set', 'user_data', pii);

    // console.log('GoogleAds PII: ', pii);
    return ;
  }

  // https://developers.google.com/gtagjs/reference/event
  track(rudderElement) {
    // console.log("in GoogleAdsAnalyticsManager track");
    const msg = rudderElement.message;
    const props = msg.properties;
    const identities = msg.identities;
    let sentTo = this.conversionId;
    let payload = {user_id: identities.uid, send_to: sentTo};
    let event = msg.event;

    // check event could be sent
    if (!this.canSendEvent(event))
      return;

    // prepare payload
    if (/^AddToCart|ViewContent|Purchase|AddPaymentInfo|InitiateCheckout|AddToWishlist$/.test(event)) {
      if (/InitiateCheckout|AddPaymentInfo|Purchase/.test(event) != false) {
        for(var name in props) {
          if (name == 'contents')
            payload['items'] = props[name];
          else
            payload[name] = props[name];
        }
      } else { // ViewContent or AddToCart
        var items = [];
        payload = {
          value: props.value,
          items: [
            props
          ],
          user_id: identities.uid,
          send_to: sentTo
        };
      }
    } else {
      if (event == 'Search')
        payload['search_string'] = props.keyword;
      else
        for(var name in props)
          payload[name] = props[name];
    }

    const cv = this.getConversion(event);

    if (cv) {
      if (cv.label) {
        payload.send_to += '/' + cv.label;
        window.gtag("event", 'conversion', payload);
      }

      var ev = (cv.alias) ? cv.alias : event,
          json = JSON.parse(JSON.stringify(payload));

      json['send_to'] = sentTo;
      window.gtag('event', ev, json);
    } else {
      window.gtag('event', event, payload);
    }
  }

  page(rudderElement) {
    // console.log("in GoogleAdsAnalyticsManager page");
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

export { GoogleAds };
