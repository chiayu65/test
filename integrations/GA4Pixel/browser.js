class GA4Pixel {
  constructor(config) {
    this.conversionId = config.conversionID;
    this.conversions = config.conversions || [];
    this.excludes = config.excludes || [];
    this.name = "GA4_PIXEL";
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
    })("google-analytics4-integration", sourceUrl, document);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", this.conversionId);

    console.log("===in init GA4 ===");
  }

  identify(rudderElement) {
    // console.log("[GA4] identify:: method not supported");
    const msg = rudderElement.message;
    const props = msg.properties;
    const identities = msg.identities;

    if (identities['user_id']) {
      window.gtag('config', this.conversionId, {user_id: identities.user_id});
      console.log('[GA4] identify user id ' + identities.user_id);
    }

    console.log('[GA4] identify');
  }

  // https://developers.google.com/gtagjs/reference/event
  track(rudderElement) {
    console.log("in GA4 track");
    const msg = rudderElement.message;
    const props = msg.properties;
    const identities = msg.identities;
    let sentTo = this.conversionId;
    let payload = {user_id: identities.user_id ? identities.user_id : identities.uid, send_to: sentTo};
    let event = msg.event;
    let cv = this.getConversion(event);
    let cvEvent = (cv) ? cv.alias : '';

    // check event could be sent
    if (!this.canSendEvent(event))
      return;

    // prepare payload
    if (/^Purchase|AddPaymentInfo|InitiateCheckout$/.test(event) || /^purchase|begin_checkout|add_payment_info$/.test(cvEvent)) {
      for(var name in props) {
        // set trasaction id
        if (name == 'order_id')
          payload['transaction_id'] = props[name];
        else if (name == 'amount')
          payload['value'] = props[name];
        else if (name == 'contents') {
          let items = [];
          for(var i=0; i<props[name].length; i++) {
            items.push({
              item_id: props[name][i]['id'],
              item_name: props[name][i]['name'],
              item_category: props[name][i]['category'],
              price: props[name][i]['value'],
              quantity: props[name][i]['quantity']
            });
          }
          payload['items'] = items;
        } else {
          payload[name] = props[name];
        }
      }
    } else if (/^AddToCart|ViewContent$/.test(event) || /^add_to_cart|view_item$/.test(cvEvent)) {
      // set value
      payload['value'] = props['value'] ? props['value'] : 0;
      payload['items'] = [
        {
          item_id: props['id'],
          item_name: props['name'],
          item_category: props['category'],
          price: props['value'],
          quantity: props['quantity']
        }
      ];
    } else {
      if (event == 'Search')
        payload['search_string'] = props.keyword;
      else
        for(var name in props)
          payload[name] = props[name];
    }

    if (cv) {
      var ev = (cvEvent) ? cvEvent : event,
          json = JSON.parse(JSON.stringify(payload));

      json['send_to'] = sentTo;
      window.gtag('event', ev, json);
    } else {
      window.gtag('event', event, json);
    }
  }

  page(rudderElement) {
    console.log("in GA4 page");
    const msg = rudderElement.message;
    const identities = msg.identities;
    const sentTo = this.conversionId;
    let ev = 'PageView';
    let props = {
      send_to: sentTo,
      user_id: identities.user_id ? identities.user_id : identities.uid
    };

    if (!this.canSendEvent(ev))
      return;

    const cv = this.getConversion(ev);
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

export { GA4Pixel };
