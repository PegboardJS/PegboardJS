/**
 * Backports of newer Set functionality.
 * 
 * This is kept in core rather than containers because it's
 * used within the functional API.
 * 
 * For more on which recently added set methods are covered, see the following:
 * https://developer.mozilla.org/en-US/blog/javascript-set-methods/
 * 
 * @module pegboardjs/containers/setpolyfill
 */

import { polyfillPrototype } from "../core/bootstrapping/polyfill.mjs";
import { ExpectedIterable } from "../core/exceptions.mjs";
import { hasFunction, hasFunctions} from "../shared.mjs";


// Helper encalsulated swapping set sizes
function smallLarge(...items) {
    items.sort((a, b) => Math.sign(a.size - b.size));
    return items;
}


export const predicateMethods = {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/isSubsetOf
    isSubsetOf(other) {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set#set-like_objects
        if (! hasFunction(other, 'has')) throw ExpectedIterable(
            `expected Set-like object with has method, but got ${JSON.stringify(other)}`);
        if(other === this) return true;
        for (const element of this) {
            if (! other.has(element) ) return false;
        }
        return true;
    },
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/isSupersetOf
    isSupersetOf(other) {
        if (! hasFunction(other, Symbol.iterator)) throw ExpectedIterable(
            `expected Set-like object with Symbol.iterator, but got ${JSON.stringify(other)}`);
        for (const element of other) {
            if (! this.has(element) ) return false;
        }
        return true;
    },
    isDisjointFrom(other) {
        if(! ('size' in other &&  hasFunction(other, Symbol.iterator))) throw ExpectedIterable(
            `expected Set-like object with both size property and Symbol.iterator, but got ${JSON.stringify(other)}`);
    
        const [smaller, larger] = smallLarge(other, this);
        for (const elt of smaller) {
            if (larger.has(elt)) return false;
        }
        return true;
    },
}

// Exported separately to make unit testing easier
export const setMethods = {

    // IMPORTANT: This returns items in this set, but not the other!
    difference(other) {
        if(! hasFunction(other, 'has')) throw ExpectedIterable(
            `expected Set-like object with has() method, but got ${JSON.stringify(other)}`);
        const result = new this.constructor();
        for (const item of this) {
            if (! other.has(item)) result.add(item);
        }
        return result;
    },
    union(other) {
        if(! hasFunctions(other, 'has', Symbol.iterator)) throw ExpectedIterable(
            `expected Set-like object to be iterable with has() method, but got ${JSON.stringify(other)}`);

        const result = new this.constructor(this);
        for (const item of other) result.add(item);
        return result;
    },
    intersection(other) {
        if (! hasFunction(other, 'has')) throw TypeError(
            `expected Set-like object with has() method, but got ${JSON.stringify(other)}`);

        const [smaller, larger] = smallLarge(other, this)
        const result = new this.constructor();
        for (const item of smaller) {
            if (larger.has(item)) result.add(item);
        }
        return result;
    },
    symmetricDifference(other) {
        if(! hasFunction(other, 'has')) throw TypeError(
            `expected Set-like object with has() method, but got ${JSON.stringify(other)}`);

        const allElts = this.union(other);
        const result  = new this.constructor();
        for (const elt of allElts) {
            if (this.has(elt) && other.has(elt)) continue;
            result.add(elt);
        }
        return result;
    },
    // These currently cause some issues, so leaving them out for now
    // Keys is an alias of values https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/keys
    // values:  function* () { for (const item of this[Symbol.iterator]()) yield item; },
    // keys:    function*() { for (const item of this.values()) yield item; },
    // entries: function*() { for (const item of this.values()) yield [item, item]; }
};


// Unite them via destructure for easier application as a default
export const allPolyfillMethods = {
    ...predicateMethods,
    ...setMethods
}

// Local Set subtype and instance track types we've already polyfilled
class _LocalPatchedTracker extends Set {}
const alreadyPolyfilled = new _LocalPatchedTracker();


/**
 * Polyfill a set type with good-enough versions of recent operations.
 *
 * For the moment, this mostly helps unit testing ahead for future
 * compatibility efforts. Improving this requires one of the following:
 * 
 * 1. setting up babel or other transpilation
 * 2. moving this file from ES6 module style.
 *
 * @param {type} type - The Set type or a subclass of it.
 * @param {bool} replaceExisting - Whether to force-replace prototype members
 * @param {object} source - An object to copy polyfill elements from
 */
export function polyfillSetType(
    type = Set,
    {replaceExisting = false, source = allPolyfillMethods} = {}
) {
    if (alreadyPolyfilled.has(type)) console.warn(
        `The type ${type.constructor.name} appears to have already been polyfilled`);
 
    alreadyPolyfilled.add(type)
    polyfillPrototype(type.prototype, source, replaceExisting);
}
polyfillPrototype(_LocalPatchedTracker, allPolyfillMethods);
