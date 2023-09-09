import ScriptLoader from "../ScriptLoader";

class ClickForcePixel {
  constructor(config) {
    this.pixelId = config.pixelId;
    this.rtid = config.rtid;
    this.conversionId = config.conversionID;
    this.conversions = config.conversions || [];
    this.excludes = config.excludes || [];
    this.name = "CLICKFORCE_PIXEL";
  }

  init() {
    [
      
      'https://cdn.holmesmind.com/dmp/cft/tracker.js',
      'https://cdn.holmesmind.com/dmp/cft/triggerTracker.js',
      'https://cdn.holmesmind.com/js/rtid.js'
    ].forEach(function (src, idx) {
      ScriptLoader('cft-' + idx, src);
    });

    /* Website track (tracker.js) - B.I.DMP By ClickForce */
    window.cft = window.cft || function(){(cft.q=cft.q||[]).push([].slice.call(arguments))};
  }

  identify(rudderElement) {
    // console.log('[CLICKFORCE_PIXEL] identify');
  }

  track(rudderElement) {
    const msg = rudderElement.message;
    const props = msg.properties;
    const identities = msg.identities;
    let event = msg.event;
    let cv = this.getConversion(event);

    // check event could be sent
    if (!this.canSendEvent(event))
      return;

    window.clickforce_rtid(cv.rtid);
    window.cft("send", "event", {
          action: cv.alias,
          //action: "CFgeneratelead_INFINITI_CV",
          category: cv.category || "",
          //category: "generatelead",
          label: cv.label || ""
          //label: ""
    });
    // console.log('send clickforce event', event);
  }

  page(rudderElement) {
    window.clickforce_rtid(this.rtid); //clickforce_rtid("9967001");
    window.clickForceMyyCFT = (function(cftsdk_pixelId){
      return function(){
        window.cft("setSiteId", cftsdk_pixelId); //  cft("setSiteId", "CF-230800137287");
        window.cft("setViewPercentage");
        // console.log('set clickforce site id', cftsdk_pixelId);
      }
    })(this.pixelId);
    window.clickForceDelayLoading();
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
    // console.log('isLoaded', window.clickforce_rtid);
    return window.clickforce_rtid ? true : false;
  }

  isReady() {
    // console.log('isReady', window.clickforce_rtid);
    return window.clickforce_rtid ? true : false;
  }

  canSendEvent(ev) {
    if (this.excludes.length === 0)
      return true;

    return this.excludes.indexOf(ev) === -1;
  }
}

export { ClickForcePixel };
