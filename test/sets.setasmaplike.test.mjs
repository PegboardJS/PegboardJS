import { asMapLike } from "../src/countingsets.mjs";
import { isFunction } from "../src/shared.mjs";
import { shorthand } from "./helpers.mjs";
import { assert, describe, expect, it } from "vitest";


describe(asMapLike, () => {
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
                expect(asMapLike(value)).toBe(null);
            });
        }
    });
    returns('unproxied Map-like objects', () => {
        whenPassed('Map instances', () => {
            const m = new Map();
            expect(asMapLike(m)).toBe(m);
        });
        whenPassed('map-like proxies', () => {
            const m = new Set();
            const p = asMapLike(m);
            expect(asMapLike(p)).toBe(p);
        });
    });

    returns('proxy when Set-like', () => {
        it('proxy preserves size behavior', () => {
            const s = new Set(['a']);
            const p = asMapLike(s);
            assert(s.size === p.size);
            assert(p.size === 1)
        });
        describe("proxy intercepts Set-like\'s functions", () => {
            const mapLike = shorthand(it, 'map-like');
            //function mapLike(desc, ...rest) {it(`map-like ${desc}`, ...rest); }

            mapLike('get function', () => {
                const s = new Set(['a',]);
                const p = asMapLike(s);
                assert(p != null);
                assert(p.get('a') === 1);
            });

            mapLike('values generator function', () => {
                const p = asMapLike(new Set(['a']));
                assert(isFunction(p['values']));
                for(const v of p.values()) {
                    assert(v === 1);
                }
            });
            mapLike('entries generator function', () => {
                const raw = ['a', 'b', 'c'];
                const s = new Set(raw);
                const p = asMapLike(s);
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