import ScriptLoader from "../ScriptLoader";

class AmobeePixel {
  constructor(config) {
    this.pvId = config.pvId;
    this.pId = config.pId;
    this.name = "AMOBEE PIXEL";
    this.conversions = config.conversions || [];
    this.excludes = config.excludes || [];
    this.isIint = false;
  }

  init() {
    console.log("===in init AmobeePixel===");
    this.isIint = true;
  }

  isLoaded() {
    console.log("in Amobee Pixel isLoaded");
    return this.isIint;
  }

  isReady() {
    console.log("in Amobee Pixel isReady");
    return this.isLoaded();
  }

  page(rudderElement) {
    // check event could be sent
    if (!this.canSendEvent('PageView'))
      return;

    const cv = this.getConversion('PageView');
    if (cv)
      this.sendRequest(cv);
  }

  identify(rudderElement) {
    return ;
  }

  track(rudderElement) {
    const msg = rudderElement.message;
    const event = msg.event;

    // check event could be sent
    if (!this.canSendEvent('PageView'))
      return;

    const cv = this.getConversion(event);
    if (cv)
      this.sendRequest(cv);
  }

  sendRequest(cv) {
    let img = new Image;
    img.width = 1;
    img.height =1;
    img.style = 'display:none';
    img.src = 'https://r.turn.com/r/beacon?b2=' + cv.label;
    window.document.body.appendChild(img);
    console.log("in AmobeePixel (" + cv.label + ") track");
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

  canSendEvent(ev) {
    if (this.excludes.length === 0)
      return true;

    return this.excludes.indexOf(ev) === -1;
  }
}

export { AmobeePixel };
