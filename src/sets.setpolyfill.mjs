/**
 * Backports of newer Set functionality.
 * 
 * For more on which recently added set methods are covered, see the following:
 * https://developer.mozilla.org/en-US/blog/javascript-set-methods/
 * 
 * @module sets/setpolyfill
 */

/********************************************
 *******     Monkeypatch helpers    *********
 ********************************************
 
 You can ignore these. They're a self-contained way to add recent Set
 features on older browsers.
 */

/**
 * Add methods to a prototyoe from a source of backports.
 * 
 * By default, this leaves existing methods alone. You can force it to
 * override existing methods by passing true via replaceExisting.
 *
 * @param {object} prototype - A prototype to monkeypatch from a source
 * @param {object} source - An object containing callables to use as polyfills
 * @param {boolean} replaceExisting - Whether to replace existing methods
 */
function polyfillPrototype(prototype, source, replaceExisting = false) {
    for (const [methodKey, implementation] of Object.entries(source)) {
        if (replaceExisting || ! (methodKey in prototype) ) {
            prototype[methodKey] = implementation;
        }
    }
}


/**
 * Shallow check for absence of size, has, and keys attributes.
 * 
 * IMPORTANT:
 * 1. This doesn't validate them as callable methods
 * 2. This doesn't cover browser APIs
 * 
 * It implements things under this heading:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set#set-like_objects
 * 
 * @param {*} object - An object to check
 * @returns {string|null} - A string if something's missing, or null if none are.
 */
 function errorIfNotSetlike(
    object,
    requiredAndDisplayString = {size: 'property', has: 'method', keys: 'method'}
) {
    // Early exit on instances
    if (object instanceof Set) return;

    const missing = [];
    function addEltAsMissing(name, kind) {
        const missingElt = `a ${name}${kind === 'method' ? '()' : ''} ${kind}`;
        missing.push(missingElt);
    }

    for (const [name, kind] of Object.entries(requiredAndDisplayString)) {
        try {
            if (! (name in object)) addEltAsMissing(name, kind);
        }
        catch (TypeError) {
            addEltAsMissing(name, kind);
        }
    }
    if (missing) {
        const joined = missing.join(', ');
        throw TypeError(`${object} is not set-like: lacks ${joined}`);
    }
    return;
}

/**
 * Returns true if the object has all of the following attributes:
 * 1. size
 * 2. has
 * 3. values
 * 
 * @param {*} object - An object to check for set-like behavior.
 * @returns {bool} Whether the object is set-like.
 */
export function isSetLike(object) {
    return ! notSetLike(object);
}

// Helper encalsulated swapping set sizes
function smallLarge(setA, setB) {
    if (setA.size <= setB.size) return [setA, setB];
    return [setB, setA];
}



// Exported to make unit testing easier 
export const setPatches = {
        // Predicate methods

        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/isSubsetOf
        isSubsetOf: function isSubsetOf(other) {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set#set-like_objects
            errorIfNotSetlike(other);
            for (const element of this) {
                if (! other.has(element) ) return false;
            }
            return true;
        },
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/isSupersetOf
        isSupersetOf: function isSupersetOf(other) {
            errorIfNotSetlike(other);
            for (const element of other) {
                if (! this.has(element) ) return false;
            }
            return true;
        },
        isDisjointFrom: function isDisjointFrom(other) {
            errorIfNotSetlike(other);
            const [smaller, larger] = smallLarge(other, this);
            for (const elt of smaller) {
                if (larger.has(elt)) return false;
            }
            return true;
        },

        // Inter-set operations

        // IMPORTANT: This returns items in this set, but not the other!
        difference: function difference(other) {
            errorIfNotSetlike(other);

            const result = new this.constructor();
            for (const item of this) {
                if (! other.has(item)) result.add(item);
            }
            return result;
        },
        union: function union(other) {
            errorIfNotSetlike(other);
            const result = new this.constructor(this);
            for (const item of other) result.add(item);
            return result;
        },
        intersection: function intersection(other) {
            errorIfNotSetlike(other);
            const [smaller, larger] = smallLarge(other, this)
            const result = new this.constructor();
            for (const item of smaller) {
                if (larger.has(item)) result.add(item);
            }
            return result;
        },
        symmetricDifference: function symmetricDifference(other) {
            errorIfNotSetlike(other);

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


// Local Set subtype and instance track types we've already polyfilled
class _LocalPatchedTracker extends Set {}
polyfillPrototype(_LocalPatchedTracker.prototype, setPatches);
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
    {replaceExisting = false, source = setPatches} = {}
) {
    if (alreadyPolyfilled.has(type)) console.warn(
        `The type ${type.constructor.name} appears to have already been polyfilled`);
 
    alreadyPolyfilled.add(type)
    polyfillPrototype(type.prototype, source, replaceExisting);
}
