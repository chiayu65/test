class TaboolaPixel {
  constructor(config) {
    this.pixelId = config.pixelId;
    this.conversions = config.conversions || [];
    this.excludes = config.excludes || [];
    this.name = "TABOOLA_PIXEL";
  }

  init() {
      window._tfa = window._tfa || [];
      !function (t, f, a, x) {
             if (!document.getElementById(x)) {
                t.async = 1;t.src = a;t.id=x;f.parentNode.insertBefore(t, f);
             }
      }(document.createElement('script'),
      document.getElementsByTagName('script')[0],
      '//cdn.taboola.com/libtrc/unip/' + this.pixelId + '/tfa.js',
      'tb_tfa_script');
  }

  identify(rudderElement) {
    return ;
  }

  // https://help.taboola.com/hc/en-us/articles/360007856794-Developer-Notes
  track(rudderElement) {
    // prepare payload
    const msg = rudderElement.message;
    const props = msg.properties;
    const identities = msg.identities;
    let ev = msg.event;
    let payload = {notify: 'event', name: ev, id: this.pixelId};

    if (!this.canSendEvent(ev))
      return;

    // prepare payload
    if (/Purchase/.test(ev) != false) {
      payload['orderid'] = props.order_id || 1;
      payload['revenue'] = props.value || 0;
      payload['currency'] = props.currency || 'TWD';
      payload['quantity'] = 1;

      // sum quantity
      let qty = 0;
      if (props.contents)  {
        console.log(props.contents);
        for(var idx in props.contents) {
          qty += (props.contents[idx].quantity || 0);
        }

        if (qty>=1)
          payload['quantity'] = qty;
      }
    }

    const cv = this.getConversion(ev);
    if (cv) {
      payload['name'] = cv.name;
    }

    window._tfa.push(payload);
    console.log('taboola: ' + ev, payload);
  }

  page(rudderElement) {
    const msg = rudderElement.message;
    const identities = msg.identities;
    let ev = 'page_view';
    window._tfa.push({notify: 'event', name: ev, id: this.pixelId});
    console.log('taboola page view');
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
    return window._tfa.push !== Array.prototype.push;
  }

  isReady() {
    return window._tfa.push !== Array.prototype.push;
  }

  canSendEvent(ev) {
    if (this.excludes.length === 0)
      return true;

    return this.excludes.indexOf(ev) === -1;
  }
}

export { TaboolaPixel };
