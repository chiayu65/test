import ScriptLoader from "../ScriptLoader";

class ElandPixel {
  constructor(config) {
    this.name = "ELAND_PIXEL";
    this.source = config.source;
    this.subFolder = config.subFolder;
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
    const newIds = msg.identities;
    const payload = {
        source: this.source, //"adgeek",
        trackType: "view",
        targetType: "usual",
        trackSubfolderDepth: 1,
        subFolder: this.subFolder, //"footer",
        adInfo: {adId: ""},
        ecInfo: {
            memberID: newIds.uid
        }
    };

    return this.sendRequest(payload);
  }

  identify(rudderElement) {
    return ;
  }

  track(rudderElement) {
    return;
  }

  sendRequest(data) {
    this.sdk.Track(data);
    return true;
  }
}

export { ElandPixel };
