import { add } from "../core/functional/operators.mjs";
import { asReadOnlyCounterLike, count } from "../countingsets.mjs";
import { allKeys, getDefaultMapLikeProxy } from "../shared.mjs";
import { UnexpectedFloat } from "../core/exceptions.mjs";
import { implementsIterable } from "../inspect.mjs";
import { hasFunctions, hasFunction } from "../shared.mjs";
import { DefaultMap } from "./defaultmap.mjs";
import { getSpread } from "../core/functional.mjs";


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

export class Counter extends DefaultMap {
    #total = 0; // How many elements we have total

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
        if (typeof value !== 'number') { return this.badSetValue(TypeError, value); }
        else if ((!Number.isInteger(value))) { return this.badSetValue(UnexpectedFloat, value); }
        return null;
    }

    checkMapLikeValues(mapLike, checker) {
        var problem;
        for (v in mapLike.values()) {
            const problem = checker(v);
            if (problem) return problem;
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
        super(undefined, 0);
        if (iterable === undefined) return;

        const asMapLike = asReadOnlyCounterLike(iterable);
        if (asMapLike === null) throw TypeError(
            `expected a Set-like or Map-like, not ${JSON.stringify(iterable)}`);
        console.log(asMapLike);
        for(cont [k,v] of asMapLike.entries()) this.set(k, v);

    }

    /**
     * Extends Map.delete behavior by updating the Counter's total.
     *
     * @param {*} key - The key to delete.
     * @returns {boolean} - true if deleted a present key, false if not.
     */
    delete(key) {
        if(this.has(key)) this.#total -= super.get(key);
        return super.delete(key);
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

        const oldValue = this.get(key);
        switch (integer) {
            case oldValue : break;
            case        0 : this.delete(key); break;
            default       :
                const diff = integer - oldValue;
                super.set(key, integer);
                this.#total += diff;
        }
        return this;
    }

    //pending: rework to add / Symbol.PegboardSetALL
    /**
     * Add the passed amount to the value for the given key.
     *
     * @param {*} key - the key to add to
     * @param {*} [by]  - the amount to add to the key (defaults to 1)
     * @returns {Counter} - the same object.
     */
    increment(key, by = 1) {
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
    decrement(key, by = 1) {
        var problem;
        if ((problem = this.checkValue(by))) throw problem;

        const newCount = this.get(key) - by;
        this.set(key, newCount);
        return this;
    }
    // pending: symbol in-place control
    // pending: wtf's up with proxies?
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
    operatorBase(operator, operand, to = undefined, keyChoice = allKeys) {
        console.log('\noperand', operand);
        if (!implementsIterable(operand)) 

        var maplike = asReadOnlyCounterLike(operand);
        console.log("result is", maplike);
        if(! maplike ) throw TypeError(`expected Set-like or Map-like iterable or map, not ${operand}`);

        // TODO: redo the rproblem return here
        var problem = this.checkMapLikeValues(operand, this.checkValue);
        if (problem) throw problem;//.type(problem.msg);

        if (to === undefined) to = new this.constructor();
        const v = [this, maplike ];
        console.log('v', v);
        const keys = keyChoice(...v);
        console.log(keys);

        const candidates = new Map();
        //TODO: special-case things thing to just ship it?
        for(const k of keys) {
                const pair = [
                    this.get(k),
                    maplike.get(k)
                ];
                const keyResult = operator(...pair);
                candidates.set(k, keyResult);
        }

        problem = this.checkMapLikeValues(candidates, this.checkValue);
        if(problem) throw problem;
        // for (const k of keyChoice(this, maplike)) {
        //     const a = this.get(k);
        //     const b = maplike.get(k);
        //     newValue = operator(a, b);
        //     to.set(k, newValue);
        // }
        for(const pair of candidates.entries()) to.set(k,v);
        return to;
    }

    add     (other, to = undefined) { return this.operatorBase(add, other, to); }
    //difference(other, to = undefined) { return this.operatorBase(subtract, other, to); }

}

const a = new Counter(new Map([['a', 1], ['b',2]]));

//a.set('a', 1);
//a.set('b' ,2);

const b = new Counter();
b.set('c', 3);
b.set('a', 2);

const c = a.add(b);
console.log(c);
