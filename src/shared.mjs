/**
 * Shared helper functions with no deps outside this module.
 */

/**
 * 
 * @param {*} object 
 * @returns 
 */
export function isFunction(object) {
    return object && object.apply;
}


export function hasFunction(object, lookup) {
    try { return lookup in object && isFunction(object[lookup]); }
    catch { return false; }
}


/**
 * True when at least one item in the iterable is truthy
 *  
 * @param {*} iterable - An iterable of values
 * @returns {boolean}
 */
export function anyOf(iterable) {
    for (const value of iterable) {
        if (value) return true;
    }
    return false;
}


/**
 * Iterate through the iterable, returning false if any if aren't truthy.
 *  
 * @param {*} iterable - An iterable of any items
 * @returns {boolean} - Whether all elements are truthy.
 */
export function allOf(iterable) {
    for (const value of iterable) {
        if (! value) return false;
    }
    return true;
}


/**
 * Iterate through the iterable, returning true if all are falsy.
 * 
 * @param {noneOf} iterable - An iterable of any items
 * @returns {boolean} - Whether no element is truthy
 */
export function noneOf(iterable) {
    for (const value of iterable) {
        if(value) return false;
    }
    return true;
}


/**
 * Wraps the get and has methods for objects which lack
 *
 * @param {*} hasGetAndHas - an object with both get and has methods
 * @param {*} key          - a key to look up
 * @param {*} defaultValue - the default value to return
 * @returns {boolean} - 
 */
export function defaultGet(hasGetAndHas, key, defaultValue) {
    if(hasGetAndHas.has(key)) return hasGetAndHas.get(key);
    return defaultValue;
}


/**
 * Check if an object has all named values.
 *  
 * @param {*} object          - Any object
 * @param {iterable} required - names as symbols or keys
 * @returns {boolean}         - Whether the object has all named elements.
 */
export function hasAll(object, required) {
    if (object === null) return false;
    for (const key of required) {
        if(! (key in object)) return false;
    }
    return true;
}



export function makePassthruCache(cacheObject) {
    function passThruCacheFunction(k, v) {
        cacheObject.set(k, v);
        return v;
    }

    return passThruCacheFunction;
}

const typeCache = new Map();
const cacheType = makePassthruCache(typeCache);

/**
 * An ugly, sorta-working way to get type info.
 *
 * As the name implies, this is not guaranteed to work.
 *  
 * @param {*} classOrInstance - An object to attempt type  
 * @returns {Function} - A constructor / type function
 */
export function tryGetType(classOrInstance) {
    try {
        /* A truly heinous trick:
         * 1. Try to subclass the value
         * 2. If it works, return the name */ 
        class _ extends classOrInstance {}
        return classOrInstance;
    } catch {
        // Don't cache instances themselves because we might check a lot of them
        try { if('constructor' in classOrInstance) {
                const type = classOrInstance.constructor;
                return type;
        }} catch {}
    }

    throw TypeError(
        `expected a type or instance of one, but got neither: ${JSON.stringify(classOrInstance)}`);
}

// const typeNameCache = new Map();
// const cacheTypeName = makePassthruCache();

/**
 * Attempt to get get the name of an instance or class.
 *
 * IMPORTANT: This is half-broken "fast food" / prototyping code!
 * 
 * @param {*} classOrInstance - 
 * @returns {string} - a string with the class name.
 * @throws {TypeError} - a TypeError when no class seems to have been ba not appear to be a class.
 */
export function tryGetTypeName(classOrInstance) {
    try {
        /* A truly heinous trick:
         * 1. Try to subclass the value
         * 2. If it works, return the name */ 
        class _ extends classOrInstance {}
        return classOrInstance.name;
        
    } catch {
        try { if('constructor' in classOrInstance) {
            const name = classOrInstance.constructor.name;
            return name;
        }} catch {}
    }

    throw TypeError(
        `expected a type or instance of one, but got neither: ${JSON.stringify(classOrInstance)}`);
}