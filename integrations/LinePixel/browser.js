import logger from "../../utils/logUtil";

class LinePixel {
  constructor(config) {
    this.tagId = config.tagId;//AW-696901813
    this.conversions = config.conversions || [];
    this.name = "LinePixel";
  }

  init() {
    (function(g,d,o){
      console.log(`in script loader=== LINE tag`);
      g._ltq=g._ltq||[];g._lt=g._lt||function(){g._ltq.push(arguments)};
      var h=location.protocol==='https:'?'https://d.line-scdn.net':'http://d.line-cdn.net';
      var s=d.createElement('script');s.async=1;
      s.src=o||h+'/n/line_tag/public/release/v1/lt.js';
      var t=d.getElementsByTagName('script')[0];t.parentNode.insertBefore(s,t);
      console.log(t);
    })(window, document);

    window._lt('init', {
      customerType: 'account',
      tagId: this.tagId
    });


    logger.debug("===in init LinePixel ===");
  }

  identify(rudderElement) {
    logger.debug("[LinePixel] identify:: method not supported");
  }

  track(rudderElement) {
    console.log("in LinePixel track");
    const msg = rudderElement.message;
    const ev = msg.event;
    const cv = this.getConversion(ev);
    if (cv !== false)
      window._lt('send', 'cv', {type: cv.alias}, [this.tagId]);

    window._lt('send', 'cv', {type: ev}, [this.tagId]);
  }

  page(rudderElement) {
    console.log("in LinePixel page");
    const msg = rudderElement.message;
    const ev = msg.event;
    window._lt('send', 'pv', [this.tagId]);
    window._lt('send', 'cv', {type: ev}, [this.tagId]);
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
    return typeof window._lt === 'function';
  }

  isReady() {
    return typeof window._lt === 'function';
  }
}

export { LinePixel };
