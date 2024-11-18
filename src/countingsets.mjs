import { tryGetTypeName } from "./shared.mjs";
import { implementsIterable, isLikeReadableMap } from "./inspect.mjs";
import { MapWithDefaultGet } from "./nicermap.mjs";


/**
 * Map variant akin to Python's collections.Counter built-in.
 * 
 * 
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

    // static valueRequirements = new Map([
    //     [(value) => (typeof value === 'number'), TypeError],
    //     [Number.isInteger, RangeError]
    // ]);

    // /**
    //  *  
    //  * @param {object} value 
    //  * @returns 
    //  */
    // checkValue(value) {
    //     for(const [requirement, failType ] of this.valueRequirements.entries()) {
    //         if(! requirement(value) ) return failType;
    //     }
    //     return null;
    // }

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
        if (! (typeof integer !== 'number')) {
            throw TypeError(`${tryGetTypeName(this)} takes integer values, not ${integer}`);
        } else if (! Number.isInteger(integer)) {
            throw RangeError(`${tryGetTypeName(this)} takes integer values, not ${integer}`);
        }
        var diff = 0;
        if (this.has(key)) {
            const oldValue = this.get(key);
            if (oldValue === integer) return;
            diff += integer - oldValue;
        } else {
            diff += 1;
        }
        super.set(key, integer);
        // Validation occurs
        this.#total += diff;
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
            if (counter.has(key)) {
                const oldCount = counter.get(key);
                counter.set(oldCount + 1);
            } else {
                counter.set(key, 1);
            }
        }
    }
}


/**
 * A data structure which requires all values be integers >= 0.
 * 
 * IMPORTANT: setting a value to 0 deletes the key and it will no
 * longer show up when has() is called. 
 */
export class MultiSet extends MapWithDefaultGet {
    constructor(iterable = undefined) {
        super();
        if (iterable === undefined) return;
        for (const [key, value] of iterable.values()) {
            this.set(key, value);
        }
    }
    get(key) { return super.get(key, 0); }

    #badSetValue(value) {
        return `${this.constructor.name} values must be integers >= 0, not ${value}`;
    }

    /**
     * Behaves like a standard 
     * 
     * @param {*} key - Any value a map can hold
     * @param {*} value - An integer of value >= 0
     * @returns the same MultiSet 
     */
    set(key, value) {
        if (typeof value !== 'number')
            throw TypeError(this.#badSetValue(value));
        else if ((! Number.isInteger(value)) || value < 0) {
            throw RangeError(this.#badSetValue(value));
        }
        if (this.has(key) && this.get(key) == value) {
            return;
        }
        else if (value === 0) {
            this.delete(key);
        }
        else {
            super.set(key, value);
        }
        // Match the default JS Map.set behavior per MDN
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/set#return_value
        return this;
    }

    /**
     * Attempt to add the count value to the entry for the given key.
     * 
     * For absent keys, this is equivalent to setting the key directly.
     * 
     * @param {*} key - Any key supported by a JS Map object
     * @param {number} count - an integer which will not underflow 0 for the key
     */
    increment(key, count=1) {
        if (! ((typeof count) === 'number')) {
            throw TypeError(`can't increment by non-number ${JSON.stringify(count)}: by must be an integer`);
        }
        else if(! Number.isInteger(count)) {
            throw RangeError(`can't increment by non-int number ${JSON.stringify(count)}: by must be an integer`);
        }
        const operationResult = this.get(key) + count;
        if (operationResult < 0) {
            throw RangeError(`can't increment by ${count}: result would be negative`);
        }
        this.set(key, operationResult);
    }

    /**
     * Attempt to substract the count from the stored value for this key.
     * 
     * If a call would underflow 0:
     * 1. This function will throw a RangeError
     * 2. The subtraction will not be applied
     * 
     * If a value hits exactly zero, the key will be deletd afterward.
     * 
     * @param {*} key - Any key supported by a JS Map object
     * @param {number} count - an integer which will not underflow 0 for the key
     */
    decrement(key, count=1) {
        if (typeof count !== 'number')
            throw TypeError(`can't decrement ${JSON.stringify(key)} by non-number ${JSON.stringify(count)}: by must be an integer`);
        else if(! Number.isInteger(count))
            throw RangeError(`can't decrement ${JSON.stringify(key)} by non-int number ${JSON.stringify(count)}: by must be an integer`);
        const operationResult = this.get(key) - count;
        if (operationResult < 0)
            throw RangeError(`can't decrement ${JSON.stringify(key)} by ${count}: result would be negative`);
        
        this.set(key, operationResult);
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
            throw RangeError(`${prefix}:  ${parts.join(', ')}`);

        }
        for (const pair of otherMultiSet.entries()) {
            this.decrement(...pair);
        }
    }
}
