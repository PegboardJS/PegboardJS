import { canSubclass, tryGetTypeName } from "../../shared.mjs";
import { pegboard } from "../global.mjs";
const denewCache = new Map()

pegboard.denewCache = denewCache;

/**
 * Wrap a type in a function to prevent requiring the new keyword.
 * 
 * This is a bit ugly and best saved for helping with tests.
 *
 * @param {type} type - a type to wrap.
 * @returns {Function} - a function returning the same type.
 */
export function newless(type) {
    if (! canSubclass(type)) throw TypeError(
        `denew expects subclassable types,  but got ${type}`);
    if (denewCache.has(type)) return denewCache.get(type);


    // Create and cache the wrapper function
    const name = tryGetTypeName(type).toLowerCase();
    function denewWrapper(...args) { return new type(...args); }
    Object.defineProperty(denewWrapper, 'name', {
        value: name
    });
    denewCache.set(type, denewWrapper);

    return denewWrapper;
}
