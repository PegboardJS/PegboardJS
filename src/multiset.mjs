import { MapWithDefaultGet } from "./nicermap.mjs";


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
        if (! Number.isInteger(value))
            throw TypeError(this.#badSetValue(value));
        else if (value < 0) {
            throw RangeError(this.#badSetValue(value));
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
     * Add the by value to the map's entry for key.
     * 
     * If the map does not have the key, this is equivalent to
     * setting the key directly. 
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
     * Decrement the value for the passed key by the passed value.
     * 
     * Underflowing zero will throw a RangeError. If value hits exactly zero,
     * the key will be deleted and no longer show up when has() is called.
     * 
     * @param {*} key - Any key supported by a JS Map object
     * @param {number} by - an integer which will not underflow 0 for the key
     */
    decrement(key, by=1) {
        if (typeof by !== 'number')
            throw TypeError(`can't decrement ${JSON.stringify(key)} by non-number ${JSON.stringify(by)}: by must be an integer`);
        else if(! Number.isInteger(by))
            throw RangeError(`can't decrement ${JSON.stringify(key)} by non-int number ${JSON.stringify(by)}: by must be an integer`);
        const operationResult = this.get(key) - by;
        if (operationResult < 0)
            throw RangeError(`can't decrement ${JSON.stringify(key)} by ${by}: result would be negative`);
        
        this.set(key, operationResult);
    }

    /**
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
    /**
     * Subtract another multiset's values from this one. 
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
        for (const [key, otherValue] of otherMultiSet.entries()) {
            const thisValue = this.get(key, 0);

            if (thisValue < otherValue) {
                throw RangeError(
                    `key ${JSON.stringify(key)} would underflow: ${thisValue} in left set, ${otherValue} in other`);
                }
        }
        for (const pair of otherMultiSet.entries()) {
            this.decrement(...pair);
        }
    }
}