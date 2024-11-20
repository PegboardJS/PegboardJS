/**
 * Some basic tools for roughly checking interface compliance.
 * 
 * These are meant to be "good enough" for prototyping work in 2024.
 * They won't be perfect with regard to all JS concepts, especially 
 * historic implemenetations.
 */

import { hasAll } from "./shared.mjs";
import { polyfillSetType } from "./sets.setpolyfill.mjs";



export function isFunction(object) {
    return object && object.apply;
}

export function hasFunction(object, lookup) {
    if (! (lookup in object)) return false;
    const fn = object[lookup];
    return Boolean(fn) && isFunction(fn);
}

/**
 * Check whether the object has a callable entry for Symbol.iterator.
 * 
 * IMPORTANT: this is one of multiple ways JS objects can be iterable!
 *
 * @param {*} object - any object
 * @returns {boolean}- whether it's a non-null with Symbol.iterator.
 */
export function implementsIterable(object) {
    if (Boolean(object) && hasFunction(object, Symbol.iterator));
}

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


