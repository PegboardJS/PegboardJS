
export function anyOf(iterable) {
    for (const value of iterable) {
        if (value) return true;
    }
    return false;
}

export function allOf(iterable) {
    for (const value of iterable) {
        if (! value) return false;
    }
    return true;
}

export function noneOf(iterable) {
    for (const value of iterable) {
        if(value) return false;
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

export function defaultGet(hasGet, key, defaultValue) {
    if(hasGet.has(key)) return hasGet.get(key);
    return defaultValue;
}

const typeCache = new Map();
const cacheType = makePassthruCache(typeCache);


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

    throw TypeError(`expected a type or instance of one, but got neither: ${JSON.stringify(classOrInstance)}`);
}

// const typeNameCache = new Map();
// const cacheTypeName = makePassthruCache();
/**
 * Attempts to get the name of an instance or class.
 *
 * IMPORTANT: This is "fast food" / prototyping code!
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

    throw TypeError(`expected a type or instance of one, but got neither: ${JSON.stringify(classOrInstance)}`);
}




/**
 * Check if an object has all named values.
 * 
 *  
 * @param {*} object 
 * @param {iterable} required - names as symbols or keys
 * @returns {boolean} Whether the object has all named elements.
 */
export function hasAll(object, required) {
    if (object === null) return false;
    for (const key of required) {
        if(! (key in object)) return false;
    }
    return true;
}


