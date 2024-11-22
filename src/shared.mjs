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


/**
 * True if the object has a function-like value for the lookup key.
 *
 * @param {*} object - Any object.
 * @param {string|Symbol} lookup - A string or symbol
 * @param {functionPredicate} - A predicate.
 * @returns {boolean} - Whether lookup gets a function-like value.
 */
export function hasFunction(object, lookup, functionPredicate = isFunction) {
    try   { return lookup in object && functionPredicate(object[lookup]); }
    catch { return false; }
}


/**
 * True when at least one item in the iterable is truthy
 *  
 * @param {*} iterable - An iterable of values.
 * @returns {boolean} - Whether any items are truthy.
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
 * @param {*} iterable - An iterable of values.
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
 * @param {noneOf} iterable - An iterable of values.
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
 * @returns {boolean} - Either the value or the default. 
 */
export function defaultGet(hasGetAndHas, key, defaultValue) {
    if(hasGetAndHas.has(key)) return hasGetAndHas.get(key);
    return defaultValue;
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
    try {
        // If we can subclass it, it's a class
        class _ extends classOrInstance {}
        return classOrInstance;
    } catch {
        try { if('constructor' in classOrInstance) {
                const type = classOrInstance.constructor;
                return type;
        }} catch {}
    }

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
