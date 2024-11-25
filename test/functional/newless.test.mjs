import { newless } from "../../src/core/functional/meta.mjs";
import { product } from "../../src/core/functional.mjs";
import { assert, expect, describe, it } from 'vitest';
import { isFunction, tryGetTypeName } from "../../src/shared.mjs";

const GOOD = [
    Set,
    class A {},
];

const BAD = [
    Math.abs,
    1,
    undefined,
    null
];
describe('rejects values other than extensible classes', () => {
    for(const b of BAD) {
        const display = isFunction(b)
            ? `function ${b.name}`
            : JSON.stringify(b);

        it(`rejects ${display}`, () => {
            expect(() => newless(b)).toThrow(TypeError);
        });
    }
});

describe('returns same value for same args', ()  => {
    for(const type of GOOD) {
        it(`returns same wrapper for ${tryGetTypeName(type)}`, () => {

            const firstCall = newless(type);
            const secondCall = newless(type);
            assert(firstCall === secondCall);
        });
    }
})
describe('wrappers return instances of classes', () => {
    for(const type of GOOD) {
        it(`returns wrapper for ${tryGetTypeName(type)}`, () => {
            const f = newless(type);
            const result = f();
            expect(result).toBeInstanceOf(type);
        });
    }
});


// class A {}
// describe(`caches values`, () => {
//     class A
//     for(const t of [class A {}, class B{}])
//     it(`returns same value for same args`, () => {

//     })
// })