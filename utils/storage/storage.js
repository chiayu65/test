import logger from "../logUtil";
import { Cookie } from "./cookie";
import { Store } from "./store";

const defaults = {
  user_storage_key: "_cuserid",
  user_storage_trait: "_cusertrait",
  user_storage_old_anonymousId: '_uid',
  user_storage_anonymousId: "_cuid",
  user_storage_anonymous_trait: "_ctrait",
  group_storage_key: "_cgrpid",
  group_storage_trait: "_cgrptrait",
  user_storage_ga: '_ga',
  user_storage_fbp: '_fbp',
  user_storage_fbc: '_fbc',
};

/**
 * An object that handles persisting key-val from Analytics
 */
class Storage {
  constructor() {
    this.data = {};

    // First try setting the storage to cookie else to localstorage
    Cookie.set("adg_cookies", true);

    if (Cookie.get("adg_cookies")) {
      Cookie.remove("adg_cookies");
      this.storage = Cookie;
      return;
    }

    // localStorage is enabled.
    if (Store.enabled) {
      this.storage = Store;
    }
  }

  /**
   * Json stringify the given value
   * @param {*} value
   */
  stringify(value) {
    return JSON.stringify(value);
  }

  /**
   * JSON parse the value
   * @param {*} value
   */
  parse(value) {
    // if not parseable, return as is without json parse
    try {
      return value ? JSON.parse(value) : null;
    } catch (e) {
      logger.error(e);
      return value || null;
    }
  }

  /**
   * trim using regex for browser polyfill
   * @param {*} value
   */
  trim(value) {
    return value.replace(/^\s+|\s+$/gm, "");
  }

  /**
   *
   * @param {*} value
   */
  setUserId(value) {
    if (typeof value !== "string") {
      logger.error("[Storage] setUserId:: userId should be string");
      return;
    }
    this.storage.set(
      defaults.user_storage_key,
      this.trim(value)
    );
  }

  /**
   *
   * @param {*} value
   */
  setUserTraits(value) {
    this.storage.set(
      defaults.user_storage_trait,
      this.stringify(value)
    );
  }

  /**
   *
   * @param {*} value
   */
  setGroupId(value) {
    if (typeof value !== "string") {
      logger.error("[Storage] setGroupId:: groupId should be string");
      return;
    }
    this.storage.set(
      defaults.group_storage_key,
      this.trim(value)
    );
  }

  /**
   *
   * @param {*} value
   */
  setGroupTraits(value) {
    this.storage.set(
      defaults.group_storage_trait,
      this.stringify(value)
    );
  }

  /**
   *
   * @param {*} value
   */
  setAnonymousId(value) {
    console.log('set anon id: ' + value);
    if (typeof value !== "string") {
      logger.error("[Storage] setAnonymousId:: anonymousId should be string");
      return;
    }

    this.storage.set(
      defaults.user_storage_anonymousId,
      this.trim(value)
    );
  }

  /**
   *
   * @param {*} value
   */
  setAnonymousTraits(value) {
    this.storage.set(
      defaults.user_storage_anonymous_trait,
      this.stringify(value)
    );
  }

  /**
   * get the stored userId
   */
  getUserId() {
    return this.storage.get(defaults.user_storage_key);
  }

  /**
   * get the stored user traits
   */
  getUserTraits() {
    return this.parse(
      this.storage.get(defaults.user_storage_trait)
    );
  }

  /**
   * get the stored userId
   */
  getGroupId() {
    return this.storage.get(defaults.group_storage_key);
  }

  /**
   * get the stored user traits
   */
  getGroupTraits() {
    return this.parse(
      this.storage.get(defaults.group_storage_trait)
    );
  }

  /**
   * get stored anonymous id
   */
  getAnonymousId() {
    const origUid = this.storage.get(defaults.user_storage_old_anonymousId);
    if (origUid != 'undefined')
      this.setAnonymousId(origUid);

    return this.storage.get(defaults.user_storage_anonymousId);
  }

  /**
   * get anonymous traits
   */
  getAnonymousTraits() {
    return this.parse(
      this.storage.get(defaults.user_storage_anonymous_trait)
    );
  }

  /**
   * get stored google analytics id
   */
  getGa() {
    return this.storage.get(defaults.user_storage_ga);
  }

  /**
   * get stored facebook screen id
   */
  getFbp() {
    return this.storage.get(defaults.user_storage_fbp);
  }

  /**
   * get stored facebook click id
   */
  getFbc() {
    return this.storage.get(defaults.user_storage_fbc);
  }

  /**
   * get identities
   */
  getIdentities() {
    let ids = {
      user_id: this.getUserId(),
      user_traits: this.getUserTraits(),
      uid: this.getAnonymousId(),
      traits: this.getAnonymousTraits(),
      ga: this.getGa(),
      fbp: this.getFbp(),
      fbc: this.getFbc()
    };

    for(let name in this.data)
      ids[name] = this.data[name];

    return ids;
  }

  /**
   * set
   * @param string name
   * @param string value
   */
  setData(name, value) {
    this.data[name] = value;
  }

  /**
   *
   * @param {*} key
   */
  removeItem(key) {
    return this.storage.remove(key);
  }
}

export { Storage };
