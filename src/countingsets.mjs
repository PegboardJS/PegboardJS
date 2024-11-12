/**
 * Counter and multi-set classes and their helpers.
 * 
 */
import { defaultGet, tryGetTypeName } from "./shared.mjs";
import { implementsIterable, implementsIterableWithHas, isLikeReadableMap } from "./inspect.mjs";
import { hasFunction } from "./shared.mjs";
import { MapWithDefaultGet } from "./nicermap.mjs";
import { add, subtract } from "./operators.mjs";


// Shared by Counter and MultiSet
export class UnexpectedFloat    extends RangeError {}
export class UnexpectedNegative extends RangeError {}


/**
 * Helper static method for counting linear iterables such as arrays.
 *
 * Pass a target Map-like object to write count values to it. If a count
 * for a key is absent, it will be created on demand. When the counter
 * object not provided, this method will create a new Counter to use and
 * return it.
 *
 * @param {*} iterable - The linear iterable to count.
 * @param {*} counter - An optional counter to write to.
 * @returns The counter object used: either the passed one or a new Counter.
 */
export function count(iterable, counter) {
    if (! implementsIterable(iterable))
        throw TypeError(`expected iterable, but got ${JSON.stringify(iterable)}`);
    if (! (hasFunction(counter, 'set') && hasFunction(counter, 'get')))
        throw new TypeError(`any provided counter must be have map-like get and set methods, but got ${JSON.stringify(counter)}`);

    var oldCount;
    for (const key of iterable) {
        // We might get a Map-like without support for default get as the counter
        if (counter.has(key)) { oldCount = counter.get(oldCount); }
        else                  { oldCount = 0; }
        counter.set(key, oldCount + 1);
    }
    return counter;
}

export function sharedKeys(...haveKeys) {
    var allKeys = new Set();
    for(const item in haveKeys) {
        allKeys = allKeys.union(haveKeys);
    }
    return allKeys;
}


/**
 * Try to get a map-like view of the passed object, or null on fail.
 * 
 * If the object is Set-like (has )
 * 
 * @param {*} likeSetOrMap - An object which is like a set or a map.
 * @returns {Proxy|Map} - null on fail, or a map-like (has get) object.
 */
export function asMapLike(likeSetOrMap) {
    if      (! implementsIterableWithHas(likeSetOrMap)) return null;
    else if (hasFunction(likeSetOrMap, 'get'))          return likeSetOrMap;

    // Proxy closures convert calls from the set-like to map-like behavior
    const table = {
        'get'     : (key) => likeSetOrMap.has(key) ? 1 : 0,
        'values'  : function*() {
            for (var i = 0; i < likeSetOrMap.size; i++) yield 1;
        },
        'entries' : function*() {
            for(const k of likeSetOrMap.keys()) {
                yield [k, 1];
            }
        }
    };
    return new Proxy(likeSetOrMap, {
        get(obj, prop) {
            // Proxy table needs to be higher
            if (prop in table) return table[prop];
            return obj[prop];
        }
    });
}

/**
 * Tracks quantities for each key, including negatives.
 * 
 * If a key's value is set to 0, it will be deleted from the Counter.
 * 
 * For set operations, either subclass this directly or see the default
 * MultiSet implementation. You can use the operatorBase helper method to
 * help implement your operator functions.
 *
 * Counter leaves set-like operators up to subclasses because negative
 * lack a commonly agreed upon meaning for multisets.
 */
export class Counter extends MapWithDefaultGet {
    #total; // How many elements we have total

    /**
     * The total of all values as a read-only value.
     * 
     * IMPORTANT: For the number of keys, use size.
     * 
     * This can be negative if total counts are negative.
     * 
     * @returns {integer} - the total count.
     */
    get total() { return this.#total; }

    badSetValue(type, value) {
        return new type(`expected integer value, not ${value}`);
    }

    checkValue(value) {
        if      (typeof value !== 'number')   { return this.badSetValue(TypeError, value);       }
        else if ((! Number.isInteger(value))) { return this.badSetValue(UnexpectedFloat, value); }
        return null;
    }

    checkMapLikeValues(mapLike, checker) {
        var problem;
        for (v in mapLike.values()) {
            if((problem = checker(v))) return v;
        }
        return null;
    }

    /**
     * Create a Counter, optionally counting an iterable to get started.
     *
     * @param {*} [iterable] an iterable to count when creating the Counter.
     */
    constructor(iterable = undefined) {
        // Basic init and early exit if nothing to count
        super();

        if      (iterable === undefined)       { return; }
        else if (implementsIterable(iterable)) {
            if (hasFunction(iterable, 'get') && hasFunction(iterable, 'keys')) {
                // It's Map-like
                var problem;
                if ((problem = this.checkMapLikeValues(iterable, this.checkValue)))
                    throw problem;
                for (const k of iterable.keys()) {
                    this.set(k, iterable.get(k));
                }
            } else {
                count(iterable, this);
            }
        } else {
            throw TypeError(`${JSON.stringify(iterable)} does not appear to be an iterable`);
        }
    }

    /**
     * Set a key on this counter to an integer value.
     *     
     * @param {*} key 
     * @param {integer} integer - An int value
     * @returns {Counter} - This counter instance, as with the JS Set type.
     */
    set(key, integer) {
        const problem = this.checkValue(integer);
        if (problem) throw problem;

        const oldValue = this.get(key, 0);
        switch(integer) {
            case oldValue:
                return;
            case 0:
                this.delete(key);
                break;
            default:
                const diff = integer - oldValue;
                super.set(key, integer);
                this.#total += diff;
                break;
        }
        return this;
    }

    /**
     * Get a value for the passed key, or the defaultValue if not found.
     *  
     * @param {*} key - A key to get the value for
     * @param {integer} [defaultValue] - A value to return if the key isn't found
     * @returns {integer} - Either a value or the defaultValue
     */
    get(key, defaultValue = 0) {
        return super.get(key, defaultValue);
    }

    /**
     * Add the passed amount to the value for the given key.
     * 
     * @param {*} key - the key to add to
     * @param {*} [by]  - the amount to add to the key (defaults to 1)
     * @returns {Counter} - the same object.
     */
    increment(key, by=1) {
        var problem;
        if ((problem = this.checkValue(by))) throw problem;

        const newCount = this.get(key) + by;
        this.set(key, newCount);
        return this;
    }
    
    /**
     * Remove the passed amount from the value for the given key.
     *  
     * @param {*} key - The key to subtract from.
     * @param {*} [by]  - the amount to add (defaults to 1)
     * @returns {Counter} - the same object.
     */
    decrement(key, by=1) {
        var problem;
        if ((problem = this.checkValue(by))) throw problem;

        const newCount = this.get(key) - by;
        this.set(key, newCount);
        return this;
    }

    /**
     * Helper method for defining operators over Counter and subclasses.
     *
     * The write destination for operators is selectable using the to argument.
     * This allows users who dislike JavaScript's inconsistent API Set API to
     * create their own more mutable sets with in-place operations as needed.
     *
     * When no Map-like to write to is provided, this helper follows the built-in
     * Set type's API conventions by:
     * 1. Creating a new object of the parent object's type
     * 2. Writing the count to it
     * 3. Returning it.
     * 
     * See the following MDN page to learn more:
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
     *
     * @param {CallableFunction} operator - An binary operator as a function
     * @param {Counter} operand - Another counter to operate on
     * @param {*} [to] - A Map-like write destination.
     * @param {CallableFunction} [keyChoice] - A function selecting keys from 2+ Map-likes
     * @returns {Map} - the Map-like written to.
     */
    operatorBase(operator, operand, to = undefined, keyChoice = sharedKeys) {
        if (! implementsIterable(iterable)) throw TypeError('expected linear iterable or map');
        if (to === undefined) to = new this.prototype.constructor();

        var maplike;
        if (hasFunction(operand, 'get')) {
            var problem = this.checkMapLikeValues(operand, Counter.checkValue);
            if (problem) throw problem;
            maplike = operand;
        }
        else { count(operand, to); }

        for (const k of keyChoice(this, maplike)) {
            const a = this.get(k);
            const b = other.has(k) ? other.get(k) : 0;
            newValue = operator(a, b);
            to.set(k, newValue);
        }
        return to;
    }
}


/**
 * Like Counter, but it requires all values be >= 0.
 * 
 */
export class MultiSet extends Counter {
    badSetValue(type, value) {
        return new type(`expected integer value >= 0, not ${value}`);
    }

    checkValue(value) {
        var problem = super.checkValue(value);
        if(problem  === null && value < 0) {
            problem = this.badSetValue(UnexpectedNegative, value);
        }
        return problem;
    }

    constructor(iterable = undefined) {
        super();
        if (iterable === undefined) return;
        for (const [key, value] of iterable.values()) {
            this.set(key, value);
        }
    }
    isSubsetOf(otherSetLike) {
        const other = asMapLike(otherSetLike)
        if (other === null) throw TypeError(
            `expected set-like object, not ${JSON.stringify(otherSetLike)}`);

        for (const k of this.keys()) {
            const thisV  = this.get(         k, 0);
            const otherV = defaultGet(other, k, 0);
            if (! (Number.isInteger(otherV) && otherV >= thisV)) return false;
        }
        return true;
    }

    // isSupersetOf() {
        
    // }

    union       (other, to = undefined) { return this.operatorBase(add,      other, to); }
    intersection(other, to = undefined) { return this.operatorBase(Math.min, other, to); }
    difference  (other, to = undefined) { return this.operatorBase(subtract, other, to); }


    /**
     * Add another multi-set's values to this one in-place.
     * 
     * The same considerations apply as with increment.
     * 
     * @param {*} otherMultiSet
     */
    addMultiSet(otherMultiSet) {
        if (! (otherMultiSet instanceof MultiSet)) {
            throw TypeError(`can't add non-MultiSet value ${JSON.stringify(otherMultiSet)}`);
        }
        for(const pair of otherMultiSet.entries()) {
            this.increment(...pair);
        }
    }

    #checkForUnderflow(src, returnsTrueWhenPairOkay) {
        const underflow = new Map();
        for (const [k, otherValue] of src.entries()) {
            const pair = [this.get(k, 0), otherValue];
            if (! returnsTrueWhenPairOkay(...pair)) {
                underflow.set(k, pair);
            }
        }
        return underflow;
    }
    /**
     * Subtract another multiset's values from this one in-place. 
     * 
     * @param {MultiSet} otherMultiSet 
     */
    substractMultiSet(otherMultiSet) {
        if (! (otherMultiSet instanceof MultiSet)) {
            throw TypeError(`can't subtract non-MultiSet value ${JSON.stringify(otherMultiSet)}`);
        }
        else if (otherMultiSet.size < 1) {
            // Early exit when no other elements
            return;
        }

        /*
        * Look before we leap:
        * 1. Someone could create a non-valid set at the very end 
        * 2. We don't want to allow leaving multi-sets in invalid states
        */
        const underflow = this.#checkForUnderflow(otherMultiSet, (a, b) => a >= b);

        // Maps aren't falsy when empty
        if (underflow.size) {
            const keyStr = underflow.size > 1
                ? 'keys'
                : 'key';

            const prefix = `can't subtract: ${keyStr} would underflow`;
            const parts = [];
            for (const [k, vals] of underflow.entries()) {
                const [a, b] = vals;
                parts.push(`${JSON.stringify(k)} (this ${a}) < (other ${b})`);
            }
            throw new UnexpectedNegative(`${prefix}:  ${parts.join(', ')}`);

        }
        for (const pair of otherMultiSet.entries()) {
            this.decrement(...pair);
        }
    }
}
