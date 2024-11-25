import { Counter } from "../containers.mjs";
import { asQuantifiedMapLike } from "../countingsets.mjs";
import { UnexpectedNegative } from "../core/exceptions.mjs";
import { add, subtract } from "../operators.mjs";
import { defaultGet } from "../shared.mjs";


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
        if (problem === null && value < 0) {
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
        const other = asQuantifiedMapLike(otherSetLike);
        if (other === null) throw TypeError(
            `expected set-like object, not ${JSON.stringify(otherSetLike)}`);

        for (const k of this.keys()) {
            const thisV = this.get(k, 0);
            const otherV = defaultGet(other, k, 0);
            if (!(Number.isInteger(otherV) && otherV >= thisV)) return false;
        }
        return true;
    }

    // isSupersetOf() {
    // }
    union(other, to = undefined) { return this.operatorBase(add, other, to); }
    intersection(other, to = undefined) { return this.operatorBase(Math.min, other, to); }
    difference(other, to = undefined) { return this.operatorBase(subtract, other, to); }


    /**
     * Add another multi-set's values to this one in-place.
     *
     * The same considerations apply as with increment.
     *
     * @param {*} otherMultiSet
     */
    addMultiSet(otherMultiSet) {
        if (!(otherMultiSet instanceof MultiSet)) {
            throw TypeError(`can't add non-MultiSet value ${JSON.stringify(otherMultiSet)}`);
        }
        for (const pair of otherMultiSet.entries()) {
            this.increment(...pair);
        }
    }

    #checkForUnderflow(src, returnsTrueWhenPairOkay) {
        const underflow = new Map();
        for (const [k, otherValue] of src.entries()) {
            const pair = [this.get(k, 0), otherValue];
            if (!returnsTrueWhenPairOkay(...pair)) {
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
        if (!(otherMultiSet instanceof MultiSet)) {
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
