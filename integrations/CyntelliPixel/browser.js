import ScriptLoader from "../ScriptLoader";

class CyntelliPixel {
  constructor(config) {
    this.pvId = config.pvId;
    this.pId = config.pId;
    this.name = "CYNTELLI_PIXEL";
    this.baseUri = 'https://r.adgeek.net';
    this.isIint = false;
  }

  init() {
    // console.log("===in init CyntelliPixel===");
    this.isIint = true;
  }

  isLoaded() {
    // console.log("in Cyntelli Pixel isLoaded");
    return this.isIint;
  }

  isReady() {
    // console.log("in Cyntelli Pixel isReady");
    return this.isLoaded();
  }

  page(rudderElement) {
    // console.log('Cyntelli send page event');
    const msg = rudderElement.message;
    const newProperties = this.buildParams('pi', msg.page_properties);
    const newIds = this.buildParams('i', msg.identities);
    let data = null;
    data = this.merge({ev: msg.event, hit:msg.originalTimestamp, evId: msg.messageId}, newProperties);
    data = this.merge(data, newIds);
    this.sendRequest(data);

    let syncData = this.merge(newIds, {ev: 'idsync', action: 'sync'}),
        qs = [];
    for(let name in syncData) {
      qs.push(name + '=' + encodeURIComponent(syncData[name]));
    }
    const url = this.baseUri + '/' + this.pvId + '/imp/' + this.pId + '?' + qs.join('&');
    let img = new Image;
    img.width = 1;
    img.height =1;
    img.style = 'display:none';
    img.alt = '';
    img.src = url;
    window.document.body.appendChild(img);
  }

  identify(rudderElement) {
    return ;
  }

  track(rudderElement) {
    const msg = rudderElement.message;
    const pageProperties = this.buildParams('pi', msg.page_properties);
    const newIds = this.buildParams('i', msg.identities);
    let name = 'p';
    if (/^AddToCart|ViewContent|Purchase|AddPaymentInfo|InitiateCheckout|AddToWishlist$/.test(msg.event))
        name = 'ec';

    const properties = this.buildParams(name, msg.properties);
    let data = {ev: msg.event, hit:msg.originalTimestamp, evId: msg.messageId};
    data = this.merge(data, pageProperties);

    data = this.merge(data, newIds);
    data = this.merge(data, properties);
    this.sendRequest(data);
    // console.log("in CyntelliPixel (" + this.pvId + ':' + this.pId + ") track");
  }

  merge(obj1, obj2) {
    const result = {};

    Object.keys(obj1).forEach(function(key){
      if (typeof obj1[key] == 'object')
        result[key] = JSON.stringify(obj1[key]);
      else
        result[key] = obj1[key];
    });

    Object.keys(obj2).forEach(function(key){
      if (typeof obj2[key] == 'object')
        result[key] = JSON.stringify(obj2[key]);
      else
        result[key] = obj2[key];
    });

    return result;
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
    let qs = [];
    for(let name in data) {
      qs.push(name + '=' + encodeURIComponent(data[name]));
    }

    const url = this.baseUri + '/' + this.pvId + '/tr/' + this.pId + '?' + qs.join('&');
    let img = new Image;
    img.width = 1;
    img.height =1;
    img.style = 'display:none';
    img.alt = '';
    img.src = url;
    window.document.body.appendChild(img);
  }
}

export { CyntelliPixel };
