import logger from "../../utils/logUtil";

class CompassPixel {
  constructor(config) {
    this.advId = config.advId;//AW-696901813
    this.conversions = config.conversions || [];
    this.name = "CompassPixel";
  }

  init() {
    logger.debug("===in init CompassPixel ===");
  }

  identify(rudderElement) {
    logger.debug("[CompassPixel] identify:: method not supported");
  }

  track(rudderElement) {
    console.log("in CompassPixel track");
    const msg = rudderElement.message;
    const ev = msg.event;
    const cv = this.getConversion(ev);
    if (cv === false)
      return;

    const s = document.createElement('script');
    let src = 'https://dsp.logly.co.jp/conv/v2.js?adv_id=' + this.advId + '&cv_type=';
    src += cv.type;
    s.async = true;
    s.src = src;
    const s0 = document.getElementsByTagName('script')[0];
    s0.parentNode.insertBefore(s, s0);
    // console.log("send conversion of compass: " + src);
  }

  page(rudderElement) {
    console.log("in CompassPixel page");
    (function () {
      var _lgy     = document.createElement('script');
      var _lgy_adv = 1639;
      window._lgy_advs = window._lgy_advs || {};
      window._lgy_advs[_lgy_adv] = false;
      window._lgy_options = window._lgy_options || {};
      window._lgy_options[_lgy_adv] = {};
      _lgy.async = true;
      _lgy.src = 'https://dsp.logly.co.jp/seg.js';
      var _lgy0 = document.getElementsByTagName('script')[0];
      _lgy0.parentNode.insertBefore(_lgy, _lgy0);
    })();
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
    return true;
  }

  isReady() {
    return true;
  }
}

export { CompassPixel };
