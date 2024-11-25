/**
 * Various library-wide test helpers.
 */

import { skip } from "vitest";
import { isFunction, tryGetTypeName } from "../src/shared.mjs";

import { describe as vitestDescribe } from "vitest";

export function describe(msgOrFunction, ...rest) {
    var message;
    if(typeof msgOrFunction === 'string') message = msgOrFunction;
    if(isFunction(msgOrFunction)) message = msgOrFunction.name;
    vitestDescribe(message, ...rest);
}


export function shorthand(fn, prefix) {
    function _shorthand(description, ...rest) {
        fn(`${prefix} ${description}`, ...rest);
    }
    return _shorthand;
}

export function typeComboToString(combo, sep = ' x ') {
    const out = [];
    for(const item of combo()) {
        tryGetTypeName(item)
    }
    return combo.map((item) => tryGetTypeName(item)).join(sep);
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
