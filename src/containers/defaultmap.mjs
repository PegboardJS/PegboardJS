import { defaultGet, getFallthroughProxy } from "../shared.mjs";

/**
 * A Map with a configurable default value for unfound keys. 
 *
 */
export class DefaultMap extends Map {
    #defaultValue;
    get defaultValue()      { return this.#defaultValue;  }
    set defaultValue(value) { this.#defaultValue = value; }

    /**
     * Like Map's constructor, except it allows passing a default value.
     *
     * @param {Iterable} iterable - A Map-like or an iterable of key/value pairs. 
     * @param  {defaultValue} [rest] - Override the value returned for missing keys.
     */
    constructor(iterable, defaultValue = undefined) {
        super(iterable);
        this.defaultValue = defaultValue; 
    }
    /**
     * Like Map.get, except missing keys return a configured default.
     * 
     * @param {*} key - A key to get
     * @returns {*} - undefined or the default provided.
     */
    get(key) {
        if(this.has(key)) return super.get(key);
        else              return this.defaultValue;
    }
}
/**
 * Proxy a Map-like object with DefaultMap-like get behavior.
 *
 * @param {Map} mapLike  - A Map-like object.
 * @param {*} [defaultValue] - A default value to use when a key isn't found.
 * @returns {Proxy} - A DefaultMap-like proxy.
 */


export function proxyMapLikeAsDefaultMapLike(mapLike, defaultValue = 0) {
    const adapter = {
        get: (key) => { defaultGet(mapLike, key, defaultValue); },
    };
    return getFallthroughProxy(mapLike, adapter);
}

