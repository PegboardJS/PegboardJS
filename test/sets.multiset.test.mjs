import { MultiSet } from "../src/countingsets.mjs";

import { assert, describe, expect, it } from "vitest";


const OBJECT_KEY = {a: 'alice', b: 'bob'};
const NEGATIVE_KEYS = [[-1, 2],[-2,1], [-999, 5]];

describe('test MultiSet', () => {
    describe('constructor', () => {
        describe('rejects invalid values', () => {
            it('negative values for a key throw RangeError', () => {
                expect(() => {
                    const m = new MultiSet([[0, -1],]);
                }).toThrow(/values must be integers \>\= 0/);
                expect(() => {
                    const m = new MultiSet([[-1, -1],]);
                }).toThrow(/values must be integers \>\= 0/);
            });

            it('float values rejected with RangeError', () => {
                expect(() => {
                const m = new MultiSet(['a', 1.2]);
                }).toThrow(/values must be integers \>\= 0/);
            });
        })
        describe('test accepting valid values', () => {
            it('accepts negative integer keys with valid values', () => {
                const m = new MultiSet(NEGATIVE_KEYS);
            });
            it('accepts string keys with valid values', () => {
                const m = new MultiSet([['a', 0], ['b', 1000]]);
            });
            it('accepts object keys with valid values', () => {
                const m = new MultiSet([[OBJECT_KEY, 1]]);
            });
        });

    })

    describe('test MultiSet.get', () => {
        it('returns zero for absent keys of all types', () => {
            const m = new MultiSet();
            assert(m.get(-1) === 0);
            assert(m.get('a') === 0);
            assert(m.get(OBJECT_KEY) === 0);
        });

        it('returns values for negative keys', () => {
            const m = new MultiSet(NEGATIVE_KEYS);
            for (const [k, v] of NEGATIVE_KEYS) {
                assert(m.get(k) === v);
            }
        });
    })

    describe('test MultiSet.set', () => {
        const pairs = [[0, 1], ['a',2 ], [OBJECT_KEY, 5]];
        it('accepts zero for existing key', () => {
            for (const [k, v] of pairs) {
                const m = new MultiSet([[k,v]]);
                m.set(k, 0);
            }
        });
        it('deletes key on zero', () => {
            for (const [k, v] of pairs) {
                const m = new MultiSet([[k,v]]);
                assert((m.has(k)));
                m.set(k, 0);
                assert(! (m.has(k)));
            }
        });
    });

    function badShifter(incOrDecName, m = undefined) {
        if (m === undefined) m = new MultiSet();
        it(`${incOrDecName} rejects non-integers`, () => {
           expect(() => { m[incOrDecName](OBJECT_KEY, 'not a number') }).toThrow(/by non\-number/);
           expect(() => { m[incOrDecName](OBJECT_KEY, 0.1) }).toThrow(/by non\-int number/);
        })
    }
    describe('test increment', () => {

        const keys = ['a', OBJECT_KEY, 0, -1];
        const m = new MultiSet();
        it('accepts int values which don\'t cause underflow', () => {
            for (const [v, k] of keys.entries()) {
               m.increment(k, v);
               if(v) assert(m.has(k));
            }
            assert(m.size === (keys.length - 1));
        
        });
        it('throws exception for negative values which would overflow', () => {
            for(const [v, k] of keys.entries()) {
                expect(() => m.increment(k, -1 * (v + 1))).toThrow(/result would be negative/)
            }
        });
        badShifter('increment', new MultiSet());
    });

    describe('test decrement', () => {
        it('throws exception for values which could cause underflow', () => {
            expect(() => { new MultiSet().decrement('a') }).toThrow(/result would be negative/);
            expect(() => { new MultiSet().decrement(OBJECT_KEY) }).toThrow(/result would be negative/);
            expect(() => { new MultiSet().decrement(0) }).toThrow(/result would be negative/);
        });
        badShifter('decrement');
    })
    describe('test addMultiSet', () => {
        it('throws exception for non-MultiSet values', () => {
            const m = new MultiSet()
            // TODO: expand API to allow Map?
            const values = [0, [1,2], new Map([[1,2], [2,3]])]
            for (const bad of values) {
                expect(() => m.addMultiSet(bad).toThrow(/can\'t add non-\MultiSet/));
            }
        });
    });
    describe('test subtractMultiSet', () => {
        it('throws exception when values would be invalid', () => {
            const zeroed = new MultiSet()
            const hasValues = new MultiSet([['someKey',2],]);
            assert(Array.from(hasValues.entries()).length === 1);
            expect(() => { zeroed.substractMultiSet(hasValues); }).toThrow(/would underflow/);
        });

        it('subtracts from keys when none would underflow', () => {
            const big = [['a', 1], ['b', 2], ['c', 3]];
            const values = new MultiSet(big);
            values.substractMultiSet(values);
            assert(values.size === 0);
        });
    });
})