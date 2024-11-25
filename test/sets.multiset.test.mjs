import { count } from "../src/countingsets.mjs";
import { UnexpectedNegative } from "../src/core/exceptions.mjs";
import { UnexpectedFloat } from "../src/core/exceptions.mjs";
import { MultiSet } from "../src/containers/multiset.mjs";
import { Counter } from "../src/containers/counter.mjs";

import { assert, describe, expect, it } from "vitest";
import { NOT_INTEGERS, NOT_ITERABLES, NOT_NUMBERS } from "./helpers.mjs";
import { tryGetTypeName } from "../src/shared.mjs";

const OBJECT_KEY = {a: 'alice', b: 'bob'};
const NEGATIVE_KEYS = [[-1, 2],[-2,1], [-999, 5]];

function getCounterVals() {
    return [new Map(), new Counter()];
}

describe(Counter, () => {
    describe('checkValue', () => {
        const c = new Counter();
        it('returns TypeError for non-numbers', () => {
            for(const non of NOT_NUMBERS) {
                const result = c.checkValue(non);
                expect(result).toBeInstanceOf(TypeError);
            }
        });
        it('returns RangeError for non-natural', () => {
            for(const non of [0.1, -0.1]) {
                const result = c.checkValue(non);
                expect(result).toBeInstanceOf(RangeError);
            }
        });
    });
    describe('get', () => {
        it('returns zero for non-existent values when no default provided', () => {
            assert((new Counter().get('a') === 0));
        });
        it('returns default for non-existent values when provided', () => {
            assert((new Counter().get('b') === 0));
        });
    });
    describe('set', () => {
        it('sets value when valid on fresh', () => {
            const c = new Counter();
            c.set(1, 1);
            assert(c.has(1));
            assert(c.get(1) == 1);
        });
        it('adjusts total on fresh instance', () => {
            const c = new Counter();
            c.set(2,1);
            assert(c.total == 1);
        });
        it('sets value when valid overwriting old value', () => {
            const c = new Counter();
            c.set(1, 1);
            c.set(1, 2);
            assert(c.get(1) == 2);
        });
        it('deletes key when overwriting with zero', () => {
            const c = new Counter();
            c.set(1, 1);
            c.set(1, 0);
            assert(! c.has(1));
        });
    });
    describe('delete', () => {
        it('returns false when do not have key', () => {
            const c = new Counter();
            assert(c.delete('missing key') === false);
        });
        it('returns true when have key', () => {
            const c = new Counter();
            c.set('present', 1);
            assert(c.has('present'));
            assert(c.delete('present') === true);
        });
        it('deletes value', () => {
            const c = new Counter();
            c.set('present', 1);
            c.delete('present');
            assert(c.has('present')  === false);
        });
        it('reduces total value', () => {
            const c = new Counter();
            c.set('filler', 20);
            c.set(2, 1);
            c.delete(2);
            assert(c.total === 20);
        });
    });
});

describe(count, () => {
    // function forAllCounterVals(string, values, fn) {
    //     it(string, () => {
    //         for (const v of values) {
    //             fn()
    //         }
    //     });
    // }
    it('rejects counters which are non-iterables', () => {
        for (const notIt of NOT_ITERABLES) {
            for (const counter of getCounterVals()) {
                expect(() => {
                    count(notIt, counter);
                }).toThrow(TypeError);
            }
        }
    });
    it('rejects counters with partial get / set ', () => {
        for (const iterable of [
            {get: (key) => 0},
            {set: (key, value) => {return this; }}
        ]) {
            iterable[Symbol.iterator] = () => [];
            expect(() => { count([], iterable);} ).toThrow(TypeError);
        }
    });

    for (const counter of getCounterVals()) {
        describe(`when counter is a ${tryGetTypeName(counter)}`, () => {
            for (const iterable of [[1,2,3], new Set([1,2,3])]) {
                it(`count accepts ${tryGetTypeName(iterable)} iterables`, () => {
                        count(iterable, counter);
                });
            }
        });
    }

});


describe('test MultiSet', () => {
    describe('constructor', () => {
        describe('rejects invalid values', () => {
            it('negative values for a key throw RangeError', () => {
                expect(() => {
                    const m = new MultiSet([[0, -1],]);
                }).toThrow(UnexpectedNegative);
                expect(() => {
                    const m = new MultiSet([[-1, -1],]);
                }).toThrow(UnexpectedNegative);
            });

            it('float values rejected with RangeError', () => {
                expect(() => {
                const m = new MultiSet([['a', 1.2],]);
                }).toThrow(UnexpectedFloat);
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
           expect(() => { m[incOrDecName](OBJECT_KEY, 'not a number') }).toThrow(TypeError);
           expect(() => { m[incOrDecName](OBJECT_KEY, 0.1) }).toThrow(UnexpectedFloat);
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
                expect(() => m.increment(k, -1 * (v + 1))).toThrow(UnexpectedNegative)
            }
        });
        badShifter('increment', new MultiSet());
    });

    describe('test decrement', () => {
        it('throws exception for values which could cause underflow', () => {
            expect(() => { new MultiSet().decrement('a') }).toThrow(UnexpectedNegative);
            expect(() => { new MultiSet().decrement(OBJECT_KEY) }).toThrow(UnexpectedNegative);
            expect(() => { new MultiSet().decrement(0) }).toThrow(UnexpectedNegative);
        });
        badShifter('decrement');
    })
    describe('test addMultiSet', () => {
        it('throws exception for non-MultiSet values', () => {
            const m = new MultiSet()
            // TODO: expand API to allow Map?
            const values = [0, [1,2], new Map([[1,2], [2,3]])]
            for (const bad of values) {
                expect(() => m.addMultiSet(bad).toThrow(TypeError));
            }
        });
    });
    describe('test subtractMultiSet', () => {
        it('throws exception when values would be invalid', () => {
            const zeroed = new MultiSet()
            const hasValues = new MultiSet([['someKey',2],]);
            assert(Array.from(hasValues.entries()).length === 1);
            expect(() => { zeroed.substractMultiSet(hasValues); }).toThrow(UnexpectedNegative);
        });

        it('subtracts from keys when none would underflow', () => {
            const big = [['a', 1], ['b', 2], ['c', 3]];
            const values = new MultiSet(big);
            values.substractMultiSet(values);
            assert(values.size === 0);
        });
    });
})