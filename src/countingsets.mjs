import { tryGetTypeName } from "./shared.mjs";
import { implementsIterable, isLikeReadableMap } from "./inspect.mjs";
import { MapWithDefaultGet } from "./nicermap.mjs";


// Shared by Counter and MultiSet
export class UnexpectedFloat    extends RangeError {}
export class UnexpectedNegative extends RangeError {}



/**
 * Map variant which tracks quantities for each key, including negatives.
 * 
 *This is like Python's collections.Counter in some ways.
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
    badSetValue(type, value, prefix = undefined) {
        return new type(`expected integer value, not ${value}`);
    }

    checkValue(value, prefix = undefined) {
        if      (typeof value !== 'number')   { return this.badSetValue(TypeError, value, prefix);       }
        else if ((! Number.isInteger(value))) { return this.badSetValue(UnexpectedFloat, value, prefix); }
        return null;
    }

    constructor(iterable = undefined) {
        // Basic init and early exit if nothing to count
        super();
        if (iterable === undefined) return;

        // Attempt to process it
        if (isLikeReadableMap(iterable)) {
            for(const v of iterable.values) {
                if(!Number.isInteger(v)) throw TypeError();
            }
        } else if (implementsIterable(iterable)) {
            this.countIterable(iterable, this);
        } else {
            throw TypeError(`${JSON.stringify(iterable)} does not appear to be a map`)
        }
    }

    /**
     * 
     * @param {*} key 
     * @param {integer} integer - An int value
     * @returns 
     */
    set(key, integer) {
        const problem = this.checkValue(integer);
        if (problem) throw problem;

        const oldValue = this.get(key, 0);
        if (oldValue === integer) return;
        if (integer  === 0) {
            this.delete(key);
        }
        else {
            const diff = integer - oldValue;
            super.set(key, integer);
            this.#total += diff;
        }
        return this;
    }

    /**
     * 
     * @param {*} key 
     * @param {integer} defaultValue 
     * @returns 
     */
    get(key, defaultValue = 0) {
        return super.get(key, defaultValue);
    }

    increment(key, count=1) {
        var problem;
        if ((problem = this.checkValue(count))) throw problem;

        const newCount = this.get(key) + count;
        this.set(key, newCount);
    }

    decrement(key, count=1) {
        var problem;
        if ((problem = this.checkValue(count))) throw problem;

        const newCount = this.get(key) - count;
        this.set(key, newCount);
    }

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
    static countLinear(iterable, counter = undefined) {
        if (countStore === undefined) counter = new Counter();
        for (const key of iterable) {
            // We might get a Map-like without support for default get as the counter
            const oldCount = (counter.has(key) ? counter.get(key) : 0)
            counter.set(oldCount + 1);
        }
    }
}


/**
 * A data structure which requires all values be integers >= 0.
 * 
 * IMPORTANT: setting a value to 0 deletes the key and it will no
 * longer show up when has() is called. 
 */
export class MultiSet extends Counter {
    badSetValue(type, value, prefix = undefined) {
        return new type(`expected integer value >= 0, not ${value}`);
    }

    constructor(iterable = undefined) {
        super();
        if (iterable === undefined) return;
        for (const [key, value] of iterable.values()) {
            this.set(key, value);
        }
    }

    #checkNewValue(value, prefix = undefined) {
        if (value < 0) { return super.badSetValue(UnexpectedNegative, value, prefix); }
        return null;
    }
    #checkSetArg(value) { 
        return this.checkValue(value) || this.#checkNewValue(value);
    }

    /**
     * Behaves like a standard 
     * 
     * @param {*} key - Any value a map can hold
     * @param {*} value - An integer of value >= 0
     * @returns the same MultiSet 
     */
    set(key, value) {
        // Exceptions on any weird values 
        const problem = this.#checkSetArg(value);
        if(problem) throw problem;
        const oldValue = this.get(key)
        // Early exit to save work

        if (oldValue === value) return;

        else if (value === 0) { this.delete(key); }
        else                  { super.set(key, value); }

        // Match the default JS Map.set behavior per MDN
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/set#return_value
        return this;
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
