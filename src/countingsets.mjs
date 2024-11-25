/**
 * Counter and multi-set classes and their helpers.
 * 
 */
import { implementsIterable, implementsIterableWithHas } from "./inspect.mjs";
import { getDefaultMapLikeProxy, getFallthroughProxy, hasFunction } from "./shared.mjs";


/**
 * Helper static method for counting linear iterables such as arrays.
 *
 * Pass a target Map-like object to write count values to it. If a count
 * for a key is absent, it will be created on demand. When the counter
 * object not provided, this method will create a new Counter to use and
 * return it.
 *
 * @param {Iterable} iterable - The linear iterable to count.
 * @param {Map} countInto - An optional Map-like to write to.
 * @returns {Map} The counter object used: either the passed one or a new Counter.
 */
export function count(iterable, countInto = undefined) {
    if (! implementsIterable(iterable))
        throw TypeError(`expected iterable, but got ${JSON.stringify(iterable)}`);
    else if (countInto === undefined)
        countInto = new Map();
    else if (! (hasFunction(countInto, 'set') && hasFunction(countInto, 'get')))
        throw new TypeError(`any provided counter must be have map-like get and set methods, but got ${JSON.stringify(countInto)}`);

    var oldCount;
    for (const key of iterable) {
        // We might get a Map-like without support for default get as the counter
        if (countInto.has(key)) { oldCount = countInto.get(oldCount); }
        else                    { oldCount = 0; }
        countInto.set(key, oldCount + 1);
    }
    return countInto;
}


/**
 * Proxy a Map-like object with DefaultMap-like get behavior.
 *  
 * @param {Map} mapLike  - A Map-like object.
 * @param {*} [defaultValue] - A default value to use when a key isn't found.
 * @returns {Proxy} - A DefaultMap-like proxy.
 */
export function proxyMapLikeAsCounterLike(mapLike, defaultValue = 0) {
    return getDefaultMapLikeProxy(mapLike, defaultValue);
}


/**
 * Get a Map-like (almost-Counter-like) proxy for a Set-like object.
 * 
 * The proxy will behave as follows:
 * 1. Iterating over values() yields 1 for each item in the set
 * 2. The get method returns 1 for present keys and 0 for absent 
 * 3. The entries method yields a [$KEY, 1] pairs for each Set item
 * 
 * @param {Set} setLike - A set to proxy as a Map-like.
 * @returns {Proxy} - A Map-like proxy.
 */
export function proxySetLikeWithOnes(setLike) {
    const adapter = {
        // Booleans coerce to numbers cleanly
        get     : (key) => 1 * setLike.has(key),
        values  : function*() { for (const item of setLike) yield 1; },
        // Non-existent keys imply n = 0 for a key
        entries : function*() { for(const k of setLike.keys()) yield [k, 1]; }
    };

    const proxy = getFallthroughProxy(setLike, adapter);
    // pending: a way around defaultValue: 0 in the proxy config not working?
    Object.defineProperty(proxy, 'defaultValue', {
        value: 0,
        writable: true,
        configurable: true
    });
    return proxy;
}

/**
 * Proxy Set or Map-like objects as readably Counter-like enough to use in count().
 * 
 * Fails by returning null when passed non-iterables or ones without .has() methods.
 * 
 * Otherwise, the return value tries to construct a count() compatible Proxy adapter:
 * 
 * 1. Map-like objects with a defaultValue attribute are returned as-is (Counter-like)
 * 2. Other Map-like objects get a DefaultMap-like proxy
 * 3. Set-like objects get a more complex adapter
 * 
 * @param {Set|Map} likeSetOrMap - An object we want to read as an int-valued Map-like.
 * @returns {Proxy|Map|null} - null on fail, or a map-like (has get) object.
 */
export function asReadOnlyCounterLike(likeSetOrMap) {
    // Exit ASAP if it isn't even Set-like.
    if      (! implementsIterableWithHas(likeSetOrMap)) return null;

    // In theory, we could nest proxies, but no. That is silly.
    else if (! hasFunction(likeSetOrMap, 'get')) return proxySetLikeWithOnes(likeSetOrMap);
    else if ('defaultValue' in likeSetOrMap)     return likeSetOrMap;
    else
        return proxyMapLikeAsCounterLike(likeSetOrMap);
}

