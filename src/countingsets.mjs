/**
 * Counter and multi-set classes and their helpers.
 * 
 */
import { tryGetTypeName } from "./shared.mjs";
import { hasFunction, implementsIterable, implementsIterableWithHas, isLikeReadableMap } from "./inspect.mjs";
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
        counter.set(oldCount + 1);
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

export function setAsMapLike(object) {
    if      (implementsIterableWithHas(object)) return null;
    else if (hasFunction(other, 'get'))         return object;
    else {
        return new Proxy(other, {
            get(key) { return other.has(key) ? 1 : 0; }
        });
    }
}

/**
 * Map variant which tracks quantities for each key, including negatives.
 * 
 * NOTE: If a key's value is set to 0, it will be deleted from the Counter.
 * 
 * This is like Python's collections.Counter. in some ways.
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
     * Set a key to an integer value.
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
     * @param {integer} defaultValue - A value to return if the key isn't found
     * @returns {integer} -  
     */
    get(key, defaultValue = 0) {
        return super.get(key, defaultValue);
    }

    increment(key, by=1) {
        var problem;
        if ((problem = this.checkValue(by))) throw problem;

        const newCount = this.get(key) + by;
        this.set(key, newCount);
        return this;
    }

    decrement(key, by=1) {
        var problem;
        if ((problem = this.checkValue(by))) throw problem;

        const newCount = this.get(key) - by;
        this.set(key, newCount);
        return this;
    }

    operatorBase(operator, operand, counter = undefined, keyChoice = sharedKeys) {
        if (! implementsIterable(iterable)) throw TypeError('expected linear iterable or map');
        if (counter === undefined) counter = new this.prototype.constructor();

        var maplike;
        if (hasFunction(operand, 'get')) {
            var problem = this.checkMapLikeValues(operand, Counter.checkValue);
            if (problem) throw problem;
            maplike = operand;
        }
        else { count(operand, counter); }

        for (const k of keyChoice(this, maplike)) {
            const a = this.get(k);
            const b = other.has(k) ? other.get(k) : 0;
            newValue = operator(a, b);
            counter.set(k, newValue);
        }
        return counter;
    }

    isSubsetOf(otherSetLike) {
        const other = setAsMapLike(otherSetLike)
        if (other === null) throw TypeError(
            `expected set-like object, not ${JSON.stringify(otherSetLike)}`);

        for (const [k, v] of this.entries()) {
            if(! other.has(k)) return false;
            const otherV = other.get(k);

            if      (! Number.isInteger(otherV))                       return false;
            else if (this.v != 0 && Math.sign(otherV) != Math.sign(v)) return false;
            else if (Math.abs(v) > Math.abs(otherV))                   return false;
        }
        return true;
    }

    isSupersetOf() {

    }

    union(iterable, counter = undefined) {
        return this.operator(add, iterable, counter);
    }

    intersection(iterable, counter = undefined) {
        return this.operator(Math.min, iterable, counter);
    }

    difference(iterable, counter = undefined) {
        return this.operator(subtract, iterable, counter);
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
