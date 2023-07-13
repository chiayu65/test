class YahooPixel  {

  constructor(config) {
    this.name = "YAHOO_PIXEL";
    this.pixelId = config.pixelId;
    // this.advId = config.advId;
    this.queueName = 'dotq_' + config.pixelId;
    this.conversions = config.conversions || [];
  }

  init() {
    // console.log("===in init YahooPixel (" + this.queueName + ") ===");
    (function(w,d,t,r,u,p){w[u]=w[u]||[];w[u].push({projectId:"10000",properties:{pixelId:p}});var s=d.createElement(t);s.src=r;s.async=true;s.onload=s.onreadystatechange=function(){var y,rs=this.readyState,c=w[u];if(rs&&rs!="complete"&&rs!="loaded"){return}try{y=YAHOO.ywa.I13N.fireBeacon;w[u]=[];w[u].push=function(p){y([p])};y(c)}catch(e){}};var scr=d.getElementsByTagName(t)[0],par=scr.parentNode;par.insertBefore(s,scr)})(window,document,"script","https://s.yimg.com/wi/ytc.js",this.queueName, this.pixelId);
  }

  isLoaded() {
    // console.log("in YahooPixel (" + this.pixelId + ") isLoaded");
    return window[this.queueName] && window[this.queueName].push !== Array.prototype.push;
  }

  isReady() {
    // console.log("in YahooPixel (" + this.queueName + ") isReady");
    return window[this.queueName] && window[this.queueName].push !== Array.prototype.push;
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
    // let payload = {el: 'evId:' + msg.messageId, advertiser_id: this.advId};
    let payload = {et: 'custom', el: 'evId:' + msg.messageId, ev: msg.event};
    for(var name in props)
      payload[name] = props[name];

    // is using alias to send event
    const conv = this.getConversion(msg.event);
    if (conv) {
      for(var name in conv) {
        if (name == 'ea' || name == 'ec')
          payload[name] = conv[name];
        else {
          if (props[name])
            payload[name] = props[name];
        }
      }

      // conversion value
      if (payload['value'])
        payload['gv'] = payload['value'];

      payload['ev'] = (conv.alias) ? conv.alias : payload.ev;
    }

    this.send(payload);
    // console.log("in YahooPixel (" + this.queueName + ") track");
  }

  send(payload) {
      window[this.queueName].push({
        projectId: '10000',
        properties: {
          pixelId: this.pixelId,
          qstrings: payload,
        }
      });
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

export { YahooPixel  };
