class YahooPixel  {

  constructor(config) {
    this.name = "YAHOO_PIXEL";
    this.pixelId = config.pixelId;
    this.advId = config.advId;
    this.queueName = 'dotq_' + config.pixelId;
    this.conversions = config.conversions || [];
  }

  init() {
    console.log("===in init YahooPixel ===");
    (function(w,d,t,r,u){w[u]=w[u]||[];w[u].push({projectId:"10000",properties:{pixelId:this.pixelId}});var s=d.createElement(t);s.src=r;s.async=true;s.onload=s.onreadystatechange=function(){var y,rs=this.readyState,c=w[u];if(rs&&rs!="complete"&&rs!="loaded"){return}try{y=YAHOO.ywa.I13N.fireBeacon;w[u]=[];w[u].push=function(p){y([p])};y(c)}catch(e){}};var scr=d.getElementsByTagName(t)[0],par=scr.parentNode;par.insertBefore(s,scr)})(window,document,"script","https://s.yimg.com/wi/ytc.js",this.queueName);
  }

  isLoaded() {
    console.log("in YahooPixel  (" + this.pixelId + ") isLoaded");
    return !!(window[this.queueName] && window[this.queueName].callMethod);
  }

  isReady() {
    console.log("in YahooPixel  isReady");
    return !!(window[this.queueName] && window[this.queueName].callMethod);
  }

  page(rudderElement) {
    rudderElement.message.event = 'PageView';
    this.track(rudderElement);
  }

  identify(rudderElement) {
    console.log('YahooPixel  cann\'t support identify method');
    return;
  }

  track(rudderElement) {
    const msg = rudderElement.message;
    const props = msg.properties;

    // prepare payload
    let payload = {el: 'evId:' + msg.messageId, advertiser_id: this.advId};
    for(var name in props)
      payload[name] = props[name];

    // is using alias to send event
    const conv = this.getConversion(msg.event);
    if (conv) {
      let ev = (conv) ? conv.alias : msg.event;
      for(var name in conv) {
        if (name == 'ea' || name == 'ec')
          payload[name] = conv[name];
        else {
          if (props[name])
            payload[name] = props[name];
        }
      }

      payload['ev'] = ev;
    } else {
      payload['ev'] = msg.event;
    }

    this.send(payload);
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
