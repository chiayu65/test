import is from "is";
import ScriptLoader from "../ScriptLoader";
import logger from "../../utils/logUtil";
import querystring from "component-querystring";

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
    console.log('Cyntelli send page event', rudderElement);
    const msg = rudderElement.message;
    const newProperties = this.buildParams('pi', msg.properties);
    const newIds = this.buildParams('ids', msg.identities);
    let data = {};
    data['ev'] = 'PageView';
    data = this.merge({ev: 'PageView'}, newProperties);
    data = this.merge(data, newIds);
    this.sendRequest(data);
  }

  identify(rudderElement) {

  }

  track(rudderElement) {

  }

  getContentType(rudderElement, defaultValue) {

  }

  merge(obj1, obj2) {
    let obj = {};
    for(let name in obj1)
      obj[name] = obj1[name];

    for(let name in obj2)
      obj[name] = obj2[name];

    return obj;
  }

  formatRevenue(revenue) {
    return Number(revenue || 0).toFixed(2);
  }

  buildPayLoad(rudderElement, isStandardEvent) {

  }

  buildParams(prefix, object) {
    let params = {}
    let key = null;
    for(let name in object) {
      key = prefix + '[' + name + ']';
      params[key] = object[name];
    }

    return params;
  }

  sendRequest(data) {
    console.log(data);
    const url = 'https://r.adgeek.net/' + this.pvId + '/imp/' + this.pId + '?' + querystring.stringify(data);
    let img = new Image;
    img.src = url;
    window.document.body.appendChild(img);
  }
}

export { CyntelliPixel };
