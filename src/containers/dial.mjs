import { positiveMod } from "../core/functional/operators.mjs"; 

/**
 * A digit-wheel which tracks the current position on it.
 * 
 * For simplicity of design, the values are immutable-like and not
 * exposed externally.
 */
export class DigitLike {

    #values; // Values array

    #currentIndex = 0; // Index in array
    #carry        = 0; // Whether the last advance wrapped under or over 

    /**
     * Get whether the last advance() wrapped under or over the max.
     */
    get carry()  { return this.#carry }
    get length() { return this.#values.length; }
    get currentIndex() { return this.#currentIndex; }
    get currentValue() { return this.#values[this.#currentIndex]; }

    resetCarry() { this.#carry = 0; }

    constructor(...digitOptions) {
        if(digitOptions.length < 1) throw RangeError(
            `at least 1 digit options are required, but got ${digitOptions.length}`)
        this.#values = digitOptions;
    }

    /**
     * Advance the dial by n steps in either direction defaulting to 1. 
     *
     * @param {Number} [n] - an integer number of steps,  d
     * @returns {Number} - The carry sign: -1 for underflow, 1 for overflow.
     */
    advance(n = 1) {
        if (! (Number.isInteger(n))) throw TypeError(`
            can only advance by int values, not ${n}`);
 
        const length = this.length;
        var nextRaw = this.#currentIndex + n;
        var carry = 0;
        // Detect carry and wrap the index back into the dial's index space
        if      (nextRaw < 0)       carry = -1;
        else if (length <= nextRaw) carry =  1;
        nextRaw = positiveMod(nextRaw, length);

        this.#currentIndex = nextRaw;
        this.#carry = carry;

        return carry;
    }
}