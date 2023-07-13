class BingPixel {

  constructor(config) {
    this.name = "BING_PIXEL";
    this.pixelId = config.pixelId;
    this.queueName = 'uetq_' + config.pixelId;
    this.conversions = config.conversions || [];
  }

  init() {
    // console.log("===in init BingPixel===");
    (function(w,d,t,r,u,p){var f,n,i;w[u]=w[u]||[] ,f=function(){var o={ti:p}; o.q=w[u],w[u]=new UET(o),w[u].push("pageLoad")} ,n=d.createElement(t),n.src=r,n.async=1,n.onload=n .onreadystatechange=function() {var s=this.readyState;s &&s!=="loaded"&& s!=="complete"||(f(),n.onload=n. onreadystatechange=null)},i= d.getElementsByTagName(t)[0],i. parentNode.insertBefore(n,i)})(window,document,"script"," //bat.bing.com/bat.js",this.queueName, this.pixelId);
  }

  isLoaded() {
    // console.log("in BingPixel (" + this.queueName + ") isLoaded");
    return window[this.queueName] && window[this.queueName].push !== Array.prototype.push;
  }

  isReady() {
    // console.log("in BingPixel(" + this.queueName + ") isReady");
    return this.isLoaded();
  }

  page(rudderElement) {
    rudderElement.message.event = 'PageView';
    this.track(rudderElement);
  }

  identify(rudderElement) {
    return ;
  }

  track(rudderElement) {
    const msg = rudderElement.message;
    const props = msg.properties;

    // prepare payload
    let payload = {event_label: 'evId:' + msg.messageId},
        ev = msg.event;
    for(var name in props)
      payload[name] = props[name];

    // is using alias to send event
    const conv = this.getConversion(ev);
    if (conv) {
      ev = (conv.alias) ? conv.alias : ev;
      if (conv['ea'])
        payload['event_action'] = conv['ea'];

      if (conv['ec'])
        payload['event_category'] = conv['ec'];

      if (payload['value']) // 增加轉換價值
        payload['revenue_value'] = payload['value'];
    }

    // console.log(payload, ev);

    this.send(ev, payload, {});
    // console.log("in BingPixel (" + this.queueName + ") track");
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
