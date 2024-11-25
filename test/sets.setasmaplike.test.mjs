import { asReadOnlyCounterLike } from "../src/countingsets.mjs";
import { isFunction } from "../src/shared.mjs";
import { shorthand } from "./helpers.mjs";
import { assert, describe, expect, it } from "vitest";


describe(asReadOnlyCounterLike, () => {
    const returns = shorthand(describe, 'returns');
    const whenPassed = shorthand(it, 'when passed');

    returns('null for invalid values', () => {
        const cases = [
                {value: null},
                {value: undefined},
                {value: [], display: 'an array'},
                {value: Array, display: 'a type'}
        ];

        for (const testCase of cases) {
            const {value, display = JSON.stringify(value)} = testCase;
            whenPassed(display, () => {
                expect(asReadOnlyCounterLike(value)).toBe(null);
            });
        }
    });
    returns('DefaultMap-like objects', () => {
        whenPassed('Map instances with defaultValue', () => {
            const m = new Map();
            m.defaultValue = 0;
            expect(asReadOnlyCounterLike(m)).toBe(m);
        });
        whenPassed('map-like proxies', () => {
            const m = new Set();
            // TODO: make sure we stub all methods as needed for Set case?
            const p = asReadOnlyCounterLike(m);
            expect(asReadOnlyCounterLike(p)).toBe(p);
        });
    });

    returns('proxy when Set-like', () => {
        it('proxy preserves size behavior', () => {
            const s = new Set(['a']);
            const p = asReadOnlyCounterLike(s);
            assert(s.size === p.size);
            assert(p.size === 1)
        });
        describe("proxy intercepts Set-like\'s functions", () => {
            const mapLike = shorthand(it, 'map-like');
            //function mapLike(desc, ...rest) {it(`map-like ${desc}`, ...rest); }

            mapLike('get function', () => {
                const s = new Set(['a',]);
                const p = asReadOnlyCounterLike(s);
                assert(p != null);
                assert(p.get('a') === 1);
            });

            mapLike('values generator function', () => {
                const p = asReadOnlyCounterLike(new Set(['a']));
                assert(isFunction(p['values']));
                for(const v of p.values()) {
                    assert(v === 1);
                }
            });
            mapLike('entries generator function', () => {
                const raw = ['a', 'b', 'c'];
                const s = new Set(raw);
                const p = asReadOnlyCounterLike(s);
                var i = 0;
                for (const [k,v] of p.entries()) {
                    assert(k === raw[i]);
                    assert(v === 1);
                    i++;
                }
            });
        });
    });
});