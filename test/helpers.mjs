/**
 * Various library-wide test helpers.
 */

import { skip } from "vitest";

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
