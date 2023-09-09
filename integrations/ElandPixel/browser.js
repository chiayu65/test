import ScriptLoader from "../ScriptLoader";

class ElandPixel {
  constructor(config) {
    this.name = "ELAND_PIXEL";
    this.source = config.source;
    this.subFolder = config.subFolder;
    this.conversions = config.conversions || [];
    this.excludes = config.excludes || [];
    this.sdk = null;
  }

  init() {
    // console.log("===in init ELAND_PIXEL ===");
    ScriptLoader(
      "elandpixel-integration",
      "//dmp.eland-tech.com/dmpreceiver/eland_tracker.js"
    );
  }

  isLoaded() {
    return !!(window.ElandTracker);
  }

  isReady() {
    if (!this.isLoaded())
      return false;

    this.sdk = window.ElandTracker;
    return true;
  }

  page(rudderElement) {
    const msg = rudderElement.message;
    const identities = msg.identities;
    const props = msg.properties;
    let event = msg.event;
    const payload = {
        source: this.source, //"adgeek",
        trackType: 'view',
        targetType: "usual",
        trackSubfolderDepth: 1,
        subFolder: this.subFolder, //"footer",
        adInfo: {adId: ""},
        ecInfo: {
            memberID: identities.uid
        }
    };

    return this.sendRequest(payload);
  }

  identify(rudderElement) {
    return ;
  }

  track(rudderElement) {
    const msg = rudderElement.message;
    const identities = msg.identities;
    const props = msg.properties;
    let event = msg.event;

    // check event could be sent
    if (!this.canSendEvent(event))
      return;

    // get conversion
    const cv = this.getConversion(event);
    if (!cv)
      return;

    const payload = {
        source: this.source, //"adgeek",
        trackType: cv.trackType,
        targetType: "usual",
        trackSubfolderDepth: 1,
        subFolder: cv.subFolder, //"footer",
        adInfo: {adId: ""},
        ecInfo: {
            memberID: identities.uid
        }
    };

    return this.sendRequest(payload);
  }

  sendRequest(data) {
    this.sdk.Track(data);
    return true;
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

export { ElandPixel };
