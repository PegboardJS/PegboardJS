import { hasFunction, hasFunctions } from "../../shared.mjs";
import { polyfillSetType } from "../../containers/setpolyfill.mjs";
// pending: re-org to move OOP to other parts?
import { DigitLike } from "../../containers/dial.mjs";
import { DuplicatedValue, UnexpectedFloat, UnexpectedNegative } from "../exceptions.mjs";
import { implementsIterable } from "../../inspect.mjs";

polyfillSetType();

/**
 * True when at least one item in the iterable is truthy
 *  
 * @param {Iterable} iterable - An iterable of values.
 * @returns {boolean} - Whether any items are truthy.
 */
export function anyOf(iterable) {
    for (const value of iterable) {
        if (value) return true;
    }
    return false;
}


/**
 * Iterate through the iterable, returning false if any if aren't truthy.
 *  
 * @param {Iterable} iterable - An iterable of values.
 * @returns {boolean} - Whether all elements are truthy.
 */
export function allOf(iterable) {
    for (const value of iterable) {
        if (! value) return false;
    }
    return true;
}


/**
 * Iterate through the iterable, returning true if all are falsy.
 * 
 * @param {Iterable} iterable - An iterable of values.
 * @returns {boolean} - Whether no element is truthy
 */
export function noneOf(iterable) {
    for (const value of iterable) {
        if(value) return false;
    }
    return true;
}

/**
 * Inner, non-exported generator function.
 * 
 * This is a seperate function because JS generator functions
 * have counter-intuitive behavior compared to those of other
 * languages:
 * 1. The state is stored at creation time
 * 2. No validation (or any other) part of the function body fires till .next()'s called
 *
 * @param {*} arg - An object with begin, end, and step properties.
 */
function* rangeGenerator(arg) {
    const {begin, end, step} = arg;
    for (var i = begin; i < end; i += step)
        yield i;
}

/**
 * Python's range function, ported to JS.
 *
 * @param  {...Number} rest - [end], [start, end], or [start, end, step]
 * @returns {Generator<T = Number>} - a generator over numbers
 */
export function range(...rest) {
    // Validate types
    const len = rest.length;
    if(len > 3) throw RangeError(`this function takes at most 3 arguments, but got ${len}`);
    var problem = null;
    for(const [i, v] of rest.entries()) {
        if      (! (typeof v === 'number')) problem = TypeError;
        else if (! Number.isInteger(v))     problem = RangeError;
        if (problem) throw new problem(`argument ${i} is not an integer`);
    }

    // Structure the data 
    var slots = {begin: 0, end: undefined, step: 1};
    if      (len === 1) { slots.end = rest[0]; }
    else if (len >= 2) {
        slots.begin = rest[0];
        slots.end   = rest[1];
        if  (len === 3) slots.step = rest[2];
    }

    //Instantiate the generator
    return rangeGenerator(slots);
}

export function* emptyGenerator(...any) { return; }

export function firstMatching(iterable, predicate = Boolean) {
    for (const value of iterable) {
        if(predicate(value)) return value
    }
    return undefined;
}

function* uniqueGenrator(iterable, seenSetLike) {
    for(const item of iterable) {
        if(seenSetLike.has(item)) continue;
        seenSetLike.add(item);
        yield item;
    }
}


export function unique(iterable, seen = undefined) {
    if      (seen === undefined) seen = new Set();
    else if (! hasFunctions(iterable, 'has', 'add')) throw TypeError(
        `expected Set-like object, but got ${JSON.stringify(seen)}`);

    return uniqueGenrator(iterable, seen);
}


export function asGenerator(iterable) {
    return (function*(it) { for(const elt of it) yield elt; })(iterable);
}


function* productGenerator(iterables) {
    // Prevent while-loop issues by calculating when to stop ahead of time
    var numPermutations = 1;
    for(const digitLike of iterables) numPermutations *= digitLike.length;
 
    // Yield permutations as invidual arrays by advancing each digit wheel
    for(var currentPermutation = 0; currentPermutation < numPermutations; currentPermutation++) {
        // Yield the current digit configuration
        const perm = [];
        for (const iterable of iterables) perm.push(iterable.currentValue);
        yield perm;

        // Advance the dials, stopping at the first non-carrying increment
        for(const [index, iterable] of iterables.entries()) {
            iterable.resetCarry();
            iterable.advance();
            if(! iterable.carry) break;
        }
    }
}


/**
 * Generator function for the cartesian prodduct of the passed iterables.  
 *
 * IMPORTANT: The passed iterables are converted to arrays for convenience.
 * 
 * @param  {...Iterable} iterables - The iterables to use as digits / to permute.
 * @yields {Array} - Arrays of elements from the passed iterables.
 */
export function product(...iterables) {
    if(iterables.length === 0) return emptyGenerator();

    // Convert the iterables do dial-like automodulo-ing helpers 
    const digits = [];
    for(const [i, iterable] of iterables.entries()) {
        if (! hasFunction(iterable, Symbol.iterator)) throw TypeError(
            `argument ${i} does not appear to be iterable: ${JSON.stringify(iterable)}`);

         const digit = new DigitLike(...iterable);
         digits.push(digit);
    }

    return productGenerator(digits);
}

export class MismatchedLengths extends RangeError {}


/**
 * Internal generator function which assumes pre-validated arguments.
 * 
 * @param {*} iterables 
 * @param {*} strict 
 */
function* zipGenerator(iterables, strict = false) {
    const generators = iterables.map(asGenerator);
    const numGenerators = generators.length;
    const completed = new Set(); // Indices of completed generators

    // TODO: check done value behavior specifics? try / finally
    for(var elapsed = 0; completed.size === 0; elapsed++) {
        // Prepare an array to yield and record any iteration terminations
        const toYield = [];
        for(const [i, generator] of generators.entries()) {
            const {value, done} = generator.next();
            if(done)
                completed.add(i);
            toYield.push(value);
        }

        // Terminate early or yield the value we just built
        const nDone = completed.size;
        if(nDone) {
            if(nDone < numGenerators && strict)
                throw new MismatchedLengths(`iteratables stopped early at index ${elapsed}`);
            else
                break;
        }
        else {
            yield toYield;
        }
    }
}


/**
 * Get a generator over n-length arrays from the passed n iterables.
 *
 * This is one half of an attempt at porting Python's built-in zip
 * function. It terminates early if passed iterables do not have equal
 * amounts of items.
 * 
 * See zipStrict if you for a version of this function which raises an
 * exception.
 *
 * @param  {...Iterable} iterables 
 * @returns {Generator} - A generator of n-length arrays.
 */
export function zip(...iterables) {
    for(const [i, item] of iterables.entries()) {
        if (! hasFunction(item, Symbol.iterator)) throw TypeError(
            `argument ${i} does not appear to be iterable: ${item}`);
    }
    return zipGenerator(iterables)
}
const z = zip([1], [1]);
const a = Array.from(z);
console.log(a);


/**
 * Unlike zip, this function returns a generator which throws an exception on mismatch.
 *
 * When iterables do not all terminate at once, it length-mismatched 
 * This is an attempt at a 1-1 port of Python's built-in zip function. It will
 * terminate early if the passed iterables do not have equal amounts of items.
 * 
 * NOTE: See zip if you don't wan't an exception on mismatched iterable lengths.
 *
 * @param  {...Iterable} iterables 
 * @returns {Generator} - A generator of n-length arrays.
 * @throws {MismatchedLengths} - A RangeError subclass.
 */
export function zipStrict(...iterables) {
    for(const [i, item] of iterables.entries()) {
        if (! hasFunction(item, Symbol.iterator)) throw TypeError(
            `argument ${i} does not appear to be iterable: ${item}`);
    }
    return zipGenerator(iterables, true)
}



function* repeatGenerator(item, nTimes) {
    for(const _ of range(nTimes)) yield item;
}

export function repeat(item, nTimes) {
    var problem = null;
    if      (typeof nTimes !== 'number') problem = TypeError;
    else if (! Number.isInteger(nTimes)) problem = UnexpectedFloat;
    else if (! nTimes < 0)               problem = UnexpectedNegative;
    if (problem) throw new problem(`nTimes expects an integer >= 0, not ${nTimes}`);

    return repeatGenerator(item, nTimes);
}

