class BingPixel {

  constructor(config) {
    this.name = "BING_PIXEL";
    this.pixelId = config.pixelId;
    this.queueName = 'uetq_' + config.pixelId;
    this.conversions = config.conversions || [];
  }

  init() {
    console.log("===in init BingPixel===");
    (function(w,d,t,r,u){var f,n,i;w[u]=w[u]||[] ,f=function(){var o={ti:this.pixelId}; o.q=w[u],w[u]=new UET(o),w[u].push("pageLoad")} ,n=d.createElement(t),n.src=r,n.async=1,n.onload=n .onreadystatechange=function() {var s=this.readyState;s &&s!=="loaded"&& s!=="complete"||(f(),n.onload=n. onreadystatechange=null)},i= d.getElementsByTagName(t)[0],i. parentNode.insertBefore(n,i)})(window,document,"script"," //bat.bing.com/bat.js",this.queueName);
  }

  isLoaded() {
    console.log("in BingPixel (" + this.pixelId + ") isLoaded");
    return !!(window[this.queueName] && window[this.queueName].callMethod);
  }

  isReady() {
    console.log("in BingPixel isReady");
    return !!(window[this.queueName] && window[this.queueName].callMethod);
  }

  page(rudderElement) {
    const msg = rudderElement.message;
    const identities = msg.identities
    const payload = {event_label: 'evId:' + msg.messageId};

    // is using alias to send event
    const conv = this.getConversion('PageView');
    let ev = (conv) ? conv.alias : msg.event;
    this.send('PageView', payload);
  }

  identify(rudderElement) {
    console.log('BingPixel cann\'t support identify method');
    return;
  }

  track(rudderElement) {
    const msg = rudderElement.message;
    const props = msg.properties;

    // prepare payload
    let payload = {event_label: 'evId:' + msg.messageId};
    for(var name in props)
      payload[name] = props[name];

    // is using alias to send event
    const conv = this.getConversion(msg.event);
    if (conv) {
      let ev = (conv) ? conv.alias : msg.event;
      if (conv['ea'])
        payload['event_action'] = conv['ea'];

      if (conv['ec'])
        payload['event_category'] = conv['ec'];
    } else {
      ev = msg.event;
    }

    this.send(ev, payload, {});
  }

  send(event, payload, options) {
      window[this.queueName].push('event', event, payload);
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
}

export { BingPixel };
