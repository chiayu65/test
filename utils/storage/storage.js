import logger from "../logUtil";
import { Cookie } from "./cookie";
import { Store } from "./store";

const defaults = {
  user_storage_key: "_ctgcid",
  user_storage_trait: "_ctgtt",
  user_storage_old_anonymousId: '_uid',
  user_storage_anonymousId: "_ctguid",
  group_storage_key: "_ctggid",
  group_storage_trait: "_ctggtt",
};

/**
 * An object that handles persisting key-val from Analytics
 */
class Storage {
  constructor() {
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
   * @param {*} key
   * @param {*} value
   */
  setItem(key, value) {
    this.storage.set(key, this.stringify(value));
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
      this.stringify(value)
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
      this.stringify(value)
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
    if (typeof value !== "string") {
      logger.error("[Storage] setAnonymousId:: anonymousId should be string");
      return;
    }
    this.storage.set(
      defaults.user_storage_anonymousId,
      value
    );
  }

  /**
   *
   * @param {*} key
   */
  getItem(key) {
    return this.parse(this.storage.get(key));
  }

  /**
   * get the stored userId
   */
  getUserId() {
    return this.parse(
      this.storage.get(defaults.user_storage_key)
    );
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
    return this.parse(
      this.storage.get(defaults.group_storage_key)
    );
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
    if (/^[a-z0-9]{32}$/.test(origUid))
      this.setAnonymousId(origUid);

    return this.storage.get(defaults.user_storage_anonymousId);
  }

  /**
   *
   * @param {*} key
   */
  removeItem(key) {
    return this.storage.remove(key);
  }

  /**
   * remove stored keys
   */
  clear() {
    this.storage.remove(defaults.user_storage_key);
    this.storage.remove(defaults.user_storage_trait);
    this.storage.remove(defaults.group_storage_key);
    this.storage.remove(defaults.group_storage_trait);
    // this.storage.remove(defaults.user_storage_anonymousId);
  }
}

export { Storage };
