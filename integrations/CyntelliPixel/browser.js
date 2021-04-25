import is from "is";
import each from "@ndhoule/each";
import ScriptLoader from "../ScriptLoader";
import logger from "../../utils/logUtil";

class CyntelliPixel {
  constructor(config) {
    this.pvId = config.pvId;
    this.pId = config.pId;
    this.name = "CYNTELLI_PIXEL";
    this.isIint = false;
  }

  init() {
    logger.debug("===in init CyntelliPixel===");
    this.isIint = true;
  }

  isLoaded() {
    logger.debug("in Cyntelli Pixel isLoaded");
    return this.isIint;
  }

  isReady() {
    logger.debug("in Cyntelli Pixel isReady");
    return this.isLoaded();
  }

  page(rudderElement) {

  }

  identify(rudderElement) {

  }

  track(rudderElement) {

  }

  getContentType(rudderElement, defaultValue) {

  }

  merge(obj1, obj2) {

  }

  formatRevenue(revenue) {
    return Number(revenue || 0).toFixed(2);
  }

  buildPayLoad(rudderElement, isStandardEvent) {

  }
}

export { CyntelliPixel };
