import { discardExceptions } from "../core/exceptions.mjs";
import { hasFunction } from "../shared.mjs";
import { polyfillSetType } from "./setpolyfill.mjs";
polyfillSetType();



export function howBig(setLike, checkOrder = ['total', 'size']) {
    for (const source of checkOrder) {
        const size = discardExceptions(() => setLike[source]);
        if (typeof size === 'number') return size;
    }
    return undefined;
}


/**
 * Not actually a built-in, but set equality appears utterly broken.
 *
 * @param {...Set} sets - Sets to compare.
 * @returns {boolean} - Whether the sets appear equal
 */
export function setsEqual(...sets) {
    if (sets.length < 2) return true;

    for (const [index, set] of sets.entries())
        if (! (hasFunction(set, 'symmetricDifference') && 'size' in set))
            throw TypeError(`non-set at index ${index}: ${JSON.stringify(set)}`);

    const lengths = new Set(sets.map((s) => s.length));
    if (lengths.length > 1) return false;

    const first =  sets[0];
    for (var i = 1; i < sets.length; i++) {
        const other = sets[i];
        if (first.symmetricDifference(other).size) return false;
    }
    return true;
}

