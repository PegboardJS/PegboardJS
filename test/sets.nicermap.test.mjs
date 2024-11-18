import { MapWithDefaultGet, Requirements } from "../src/nicermap.mjs";

import { assert, describe, expect, it } from "vitest";


describe(MapWithDefaultGet, () => {
    describe('test constructor', () => {
        it('creates from passed elements', () => {
            const m = new MapWithDefaultGet([[0, '0'], [1, '1']]);
            assert(m.get(0) === '0');
            assert(m.get(1) === '1');
        })
    });

    describe('test get', () => {
        it('works with one argument', () => {
            const m = new MapWithDefaultGet([[0, '0']]);
            assert(m.get(0) === '0');
        });

        it('returns default when not found', () => {
            const m = new MapWithDefaultGet();
            assert(m.get(5, '5') === '5');
        });

        it('throws RangeError for more arguments than 2', () => {
            const m = new MapWithDefaultGet();
            const args = [0, 1];
            for (var i = 2; i < 5; i++) {
                args.push(i);
                expect(() => {
                    m.get(...args);
                }).toThrow(/only supports 1 or 2/);
            }
        })
    });
});


describe(Requirements, () => {
    describe('constructor', () => {
        it('permits 0-arg construction', () => {
            const r = new Requirements();
            assert(r.size === 0);
        });
        it('rejects non-function keys', () => {
            expect(() => {
                const _ = new Requirements([
                    ['a', TypeError],
                ]);
            }).toThrow(/keys must be predicates/);
        });
        it('rejects non-function problem types', () => {
            expect(() => {
                const _ = new Requirements([
                    [Number.isInteger, 'a'],
                ]);
            }).toThrow(TypeError);
        });
    });
});