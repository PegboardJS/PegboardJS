import { zip, zipStrict, range, product, allOf, MismatchedLengths } from "../../src/core/functional.mjs";
import { hasFunction } from "../../src/shared.mjs";

import { assert, describe, expect, it } from "vitest";

const MAX_SEQ_LENGTH = 4;


const IT_SOURCES = [
    function set(iterable = undefined) { return new Set(iterable); },
    function array(iterable = undefined) { return Array.from(iterable); },
    function generator(iterable) { return (function*(it){
        for(const item of it) yield item;
    })(iterable); }
];

const ZIP_FUNCS = [
    zip, zipStrict
];

for(const zipFunc of ZIP_FUNCS) { describe(zipFunc, () => {
    describe('rejects non-iterables', () => {
        const variations = [[], 1];
        
        const args =[];
        for(const totalSeqLength of range(1,MAX_SEQ_LENGTH)) {
            it(`rejects args of length when at least 1 non-iterable ${totalSeqLength}`, () => {
            args.push(variations);
            for(const permutation of product(...args)) {
                if(allOf(permutation.map((i) => hasFunction(i, Symbol.iterator))))
                    continue;
                //it(`rejects ${permutation}`, () => {
                expect(() => zipFunc(...permutation)).toThrow(TypeError);
                //});
            }});
        }
    });

    describe('returns a generator', () => {
        const z = zipFunc([1],[1]);
        it('has next function', () => {
        assert(hasFunction(z, 'next'));
        });
        it('yields arrays', () => {
            for(const yielded of z) {
                expect(yielded).toBeInstanceOf(Array);
            }
        });
    });

    describe('accepts appropriate kinds of iterables', () => {
        const expected = [];
        const argFactories = [];

        // Zero iterables is a valid length here
        for(const totalSeqLength of range(0,MAX_SEQ_LENGTH)) {
            // In which we don't care about efficiency
            it(`accepts iterables of length ${totalSeqLength}`, () => {
                
                for(const perm of product(...argFactories)) {
                    const s = perm.map((f) => f.name).join(', ');

                    //it(`works for ${s}`, () => {
                        const args = perm.map((f) => f([1]));

                        const z = zipFunc(...args);
                        // Remember, .next() produces a state report object with a done value
                        const { value }  = z.next();

                        expect(value).toEqual(expected);
                    //});
                }
            });

            argFactories.push(IT_SOURCES);
            expected.push(1);
        }
    });
    const MISMATCH = [
        [1,],
        [1,2,3]
    ];
    if(zipFunc === zipStrict) {
        
        it('throws an exception on mismatch', () => {
            expect(() => {
                for(const f of zipFunc(...MISMATCH)){}
            }).toThrow(MismatchedLengths);
        });
    } else {
        const a = Array.from(zip(...MISMATCH));
        expect(a.length).toEqual(1);
    }
});}
