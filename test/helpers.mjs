/**
 * Various library-wide test helpers.
 */

import { skip } from "vitest";


export function shorthand(fn, prefix) {
    function _shorthand(description, ...rest) {
        fn(`${prefix} ${description}`, ...rest);
    }
    return _shorthand;
}

export const NOT_FUNCTIONS = [
    null,
    undefined,
    1,
    "string",
    [1, 2, 3],
    new Map()
];

export const NOT_ITERABLES = [
    null, undefined,
    1,
    {}
];

export const NOT_NUMBERS = [
    null, undefined, {a: 1},
];
export const NOT_INTEGERS = [
    ...NOT_NUMBERS, 0.1
];
export const NOT_NATURAL_NUMBERS = [
    ...NOT_INTEGERS, -1
];
const versionNumber = []



function ensureNumber() {
    if (versionNumber.length) return;
    versionNumber.push(...((process.version
        .split('.')
        .map(Number)
    )));
}

export function nodeVersionIsGt(...rest) {
    ensureNumber();
    for (var i = 0; i < rest.length; i++) {
        if (versionNumber[i] > rest[i]) return true;
    }
    return false;
}

export function skipIfNodeVersionGt(...rest) {
    if(nodeVersionIsGt(...rest)) skip();
}
