/**
 * Some basic tools for roughly checking interface compliance.
 * 
 * These are meant to be "good enough" for prototyping work in 2024.
 * They won't be perfect with regard to all JS concepts, especially 
 * historic implemenetations.
 */

import { hasAll, hasFunction } from "./shared.mjs";
import { polyfillSetType } from "./containers/setpolyfill.mjs";


/**
 * Check whether the object has a callable entry for Symbol.iterator.
 * 
 * IMPORTANT: this is one of multiple ways JS objects can be iterable!
 *
 * @param {*} object - any object
 * @returns {boolean}- whether it's a non-null with Symbol.iterator.
 */
export function implementsIterable(object) {
    // Optimize later. This is correct enough for now.
    try   { return Symbol.iterator in object; }
    catch { return false; }
}

/**
 * Returns true if the object has a callable Symbol.iterator and a has method. 
 *
 * @param {*} object 
 * @returns {boolean}
 */
export function implementsIterableWithHas(object) {
    if (! object) return false;
    return implementsIterable(object) && hasFunction(object, 'has');
}


// Needed on lower Node versions
polyfillSetType();


 
const READABLE_MAP_LIKE = new Set([
    'size',
    'entries',
    'forEach',
    'get',
    'has',
    'keys',
    'values',
    Symbol.iterator
]);


const WRITABLE_MAP_LIKE = READABLE_MAP_LIKE.union(new Set([
    'clear',
    'delete',
    'set'
]));


export function isLikeReadableMap(object) {
    return hasAll(object, READABLE_MAP_LIKE);
}


export function isLikeWritableMap(object) {
    return hasAll(object, WRITABLE_MAP_LIKE);
}