

/**
 * Use ugly tricks to attempt to get the name of a 
 * 
 * 
 * @param {*} classOrInstance
 * @returns 
 */
export function tryGetTypeName(classOrInstance) {
    try {
        /* A truly heinous trick:
         * 1. Try to subclass the value
         * 2. If it works, return the name */ 
        class _ extends classOrInstance {}
        return classOrInstance.prototype.constructor.name;
    } catch {
        try { if('constructor' in classOrInstance) {
                 return classOrInstance.constructor.name;
        }} catch {}
    }

    throw TypeError(`expected a type or instance of one, but got neither: ${JSON.stringify(classOrInstance)}`);
}


export function isIterable(object) {
    return (obj !== null) && (typeof object[Symbol.iterator] === 'function');
}