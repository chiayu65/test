import logger from "../../utils/logUtil";

class DV360Node {
  constructor() {
    logger.debug("nothing to construct");
  }

  init() {
    logger.debug("node not supported");

    logger.debug("===in init===");
  }

  identify(rudderElement) {
    logger.debug("node not supported");
  }

  track(rudderElement) {
    logger.debug("node not supported");
  }

  page(rudderElement) {
    logger.debug("node not supported");
  }

  loaded() {
    logger.debug("node not supported");
  }
}

export { DV360Node };
