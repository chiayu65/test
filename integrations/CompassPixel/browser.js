import ScriptLoader from "../ScriptLoader";

class CompassPixel {
  constructor(config) {
    this.advId = config.advId;
    this.conversions = config.conversions || [];
    this.excludes = config.excludes || [];
    this.name = "CompassPixel";
  }

  init() {
    console.log("===in init CompassPixel ===");
    var _lgy_adv = this.advId;
    window._lgy_advs = window._lgy_advs || {};
    window._lgy_advs[_lgy_adv] = false;
    window._lgy_options = window._lgy_options || {};
    window._lgy_options[_lgy_adv] = {};
    ScriptLoader(
      "compasspixel-integration",
      "https://send.mad-infeed.jp/seg.js"
    );
  }

  identify(rudderElement) {
    console.log("[CompassPixel] identify:: method not supported");
  }

  track(rudderElement) {
    console.log("in CompassPixel track");
    const msg = rudderElement.message;
    const ev = msg.event;

    if (!this.canSendEvent(ev))
      return;

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

    // this.track(rudderElement);
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

  canSendEvent(ev) {
    return this.excludes.indexOf(ev) === -1;
  }
}

export { CompassPixel };
