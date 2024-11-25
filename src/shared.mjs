/**
 * Shared helper functions with no deps outside this module.
 */


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
        try   { if(! (key in object)) return false; }
        catch { return false; }
    }
    return true;
}


/**
 * Shallow check for function-like behavior.
 *
 * @param {*} object - An object to check
 * @returns {boolean} - Whether a function appears to be a function.
 */
export function isFunction(object, required = ['call', 'apply', 'bind']) {
    return hasAll(object, required);
}

export function canSubclass(object)  {
    try {
        class local extends object {}
        return true;
    } catch { return false; }
}

/**
 * True if the object has a function-like value for the lookup key.
 *
 * @param {*} object - Any object.
 * @param {string|Symbol} lookup - A string or symbol
 * @param {functionPredicate} - A predicate.
 * @returns {boolean} - Whether lookup gets a function-like value.
 */
export function hasFunction(object, lookup) {
    if(object === null || object === undefined) return false;
    var fn;
    try   { fn = object[lookup]; }
    catch { return false; }
    return isFunction(fn)
}


export function hasFunctions(object, ...lookups) {
    if(object === null || object === undefined) return false;
    var fn;
    for(const lookup of lookups) {
        try   { fn = object[lookup]; }
        catch { return false; }
        if(! isFunction(fn) ) return false;
    }
    return true;
}


/**
 * Create a proxy which checks all adapters in order before the object.
 *
 * This has two main benefits which outweigh O(N) behavior in PegboardJS: 
 * 1. Simplcity of implementation
 * 2. The original adapter objects remain mutable and inspectable
 *
 * @param {*} toProxy - an object to proxy.
 * @param  {...any} adapters - One or more Proxy-compatible objects in lookup order.
 * @returns {Proxy} - the resulting proxy.
 */
export function getFallthroughProxy(toProxy, ...adapters) {
    if(toProxy === null || toProxy === undefined) throw TypeError(`got impermissible value ${toProxy}`);

    return new Proxy(toProxy, {
        get: (obj, prop) => {
            for (const adapter of adapters) {
                if (prop in adapter) return adapter[prop];
            }
            return obj[prop];
        }
    });
}

export class ImmutableError extends TypeError {}

const immutableCache = new WeakMap();
const immutableConfig = {
    get(object, key) {
        var value = object[key];
        //Nasty special-casing for Map-likes
        if (isFunction(value)) {
            switch(key) {
                case 'set':
                    function set(key, value) {
                        throw new ImmutableError(`cant set ${JSON.stringify(key)} with value ${JSON.stringify(value)} on immutable proxy of ${JSON.stringify(object)}`);
                    }
                    return immutableView(set);
                case 'get':
                    function get(key) {
                        return object.get(key);
                    }
                    return immutableView(get);
                default:
                    break;
            }
        }
        // These types are immutable by default anyway
        else if (typeof value !== 'object') return value;
        // Recursively immutable views for all else
        else
            return  immutableView(value);
    },
    set(object, key, value) {
        throw new ImmutableError(`can't set ${JSON.stringify(key)} to ${JSON.stringify(value)} on immutable proxy of ${JSON.stringify(object)}`);
    }
};

/**
 * Attempt to create an immutable view of the passed object.
 * 
 * WARNING: Maps are currently the only special-cased object for this.
 * 
 * @param {} object 
 * @param {*} config 
 * @returns 
 */
export function immutableView(object, config = immutableConfig) {
    if(immutableCache.has(object)) return immutableCache.get(object);
    const proxy = new Proxy(
        object, config
    );
    immutableCache.set(object, proxy);
    return proxy;
}

/**
 * Wraps the get and has methods for objects which lack
 *
 * @param {*} hasGetAndHas - an object with both get and has methods
 * @param {*} key          - a key to look up
 * @param {*} defaultValue - the default value to return
 * @returns {boolean} - Either the value or the default. 
 */
export function defaultGet(hasGetAndHas, key, defaultValue) {
    if(hasGetAndHas.has(key)) return hasGetAndHas.get(key);
    return defaultValue;
}


/**
 * Create an object-based representation of defaultGet for a Map-like.
 *
 * @param {Map} mapLike - Anything with a .get() method.
 * @param {*} defaultValue - The default value to return
 * @returns {Proxy} - A Map-like we want to act like a DefaultMap.
 */
export function getDefaultMapLikeProxy(mapLike, defaultValue) {
    const adapter = {
        get: (key) => {defaultGet(mapLike, key, defaultValue); },
        entries: function*() { return mapLike.entries(); },
        // TODO: check this
        [Symbol.iterator]: function*() {for (const v of mapLike.keys()) yield v; }
    };
    return getFallthroughProxy(mapLike, adapter);
}


/**
 * An ugly, sorta-working way to get type info.
 *
 * As the name implies, this is not guaranteed to work.
 *  
 * @param {*} classOrInstance - An object to attempt type  
 * @returns {Function} - A constructor / type function
 */
export function tryGetType(classOrInstance) {
    if     (canSubclass(classOrInstance)) return classOrInstance;
    try { if('constructor' in classOrInstance) {
            const type = classOrInstance.constructor;
            return type;
    }} catch {}
    throw TypeError(
        `expected a type or instance of one, but got neither: ${JSON.stringify(classOrInstance)}`);
}


/**
 * An ugly, sorta-working way to get the type name.
 *
 * IMPORTANT: This is half-broken "fast food" / prototyping code!
 * 
 * @param {*} classOrInstance - A class or instance of one.
 * @returns {string} - a string with the class name.
 * @throws {TypeError} - a TypeError when no class seems to have been ba not appear to be a class.
 */
export function tryGetTypeName(classOrInstance) {
    try {
        /* A truly heinous trick:
         * 1. Try to subclass the value
         * 2. If it works, return the name */ 
        class _ extends classOrInstance {}
        const name = classOrInstance.name;
        return name;
    } catch {
        try   {
            // Separate th
            const constructor = classOrInstance.constructor;
            const name = constructor.name;
            return name;
        }
        catch {}
    }
    throw TypeError(
            `expected a type or instance of one, but got neither: ${JSON.stringify(classOrInstance)}`);
}


/**
 * Merge all keys from all Set-like or Map-like arguments.
 *
 * @param  {...Map|Set} from - Items with keys() methods
 * @returns {Set} - All keys seen, in the order encountered.
 */
export function allKeys(...from) {
    var result = new Set();
    for (const item of from) {
        // Maps are considered Set-like here
        if(hasFunctions(item, 'has', 'keys'))
            for (const k of item.keys()) result.add(k);
        else
            throw TypeError(`non-Set-like value: ${item}`);
    }
    return result;
}
