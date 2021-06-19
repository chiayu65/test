import is from "is";
import ScriptLoader from "../ScriptLoader";
import logger from "../../utils/logUtil";
import querystring from "component-querystring";

class CyntelliPixel {
  constructor(config) {
    this.pvId = config.pvId;
    this.pId = config.pId;
    this.name = "CYNTELLI_PIXEL";
    this.baseUri = 'https://r.adgeek.net';
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
    logger.debug('Cyntelli send page event');
    const msg = rudderElement.message;
    const newProperties = this.buildParams('pi', msg.page_properties);
    const newIds = this.buildParams('i', msg.identities);
    let data = null;
    data = this.merge({ev: msg.event, hit:msg.originalTimestamp, evId: msg.messageId}, newProperties);
    data = this.merge(data, newIds);
    this.sendRequest(data);
  }

  identify(rudderElement) {

  }

  track(rudderElement) {
    logger.debug('Cyntelli send track event');
    const msg = rudderElement.message;
    const pageProperties = this.buildParams('pi', msg.page_properties);
    const newIds = this.buildParams('i', msg.identities);
    let name = 'p';
    if (/^ViewContent|Purchase|AddToCart$/.test(msg.event))
        name = 'ec';

    const properties = this.buildParams(name, msg.properties);
    let data = null;
    data = this.merge({ev: msg.event, hit:msg.originalTimestamp, evId: msg.messageId}, pageProperties);
    data = this.merge(data, newIds);
    data = this.merge(data, properties);
    this.sendRequest(data);
  }

  merge(obj1, obj2) {
    let obj = {};
    let value;
    for(let name in obj1) {
      value = obj1[name];
      if (typeof value == 'object')
        value = JSON.stringify(value);

      obj[name] = value;
    }

    for(let name in obj2) {
      value = obj2[name];
      if (typeof value == 'object')
        value = JSON.stringify(value);

      obj[name] = value;
    }

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
    logger.debug('Send Request by CyntelliPixel:', data);
    const url = this.baseUri + '/' + this.pvId + '/imp/' + this.pId + '?' + querystring.stringify(data);
    let img = new Image;
    img.src = url;
    window.document.body.appendChild(img);
  }
}

export { CyntelliPixel };
