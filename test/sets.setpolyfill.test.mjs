/**
 * Q: Why vitest if no front-end components?
 * A: It's the 1st JS test framework which worked
 */
import { expect, test, assert, describe, it } from "vitest"
import { setPatches, polyfillSetType } from "../src/sets.setpolyfill"
import { skipIfNodeVersionGt } from "./helpers.mjs";


skipIfNodeVersionGt(20);


/**
 * Avoid boilerplate by making test helpers.
 * 
 * @param {function} namePreprocess - A function which extracts a formatted name string
 * @returns {function} - a test function
 */
function buildTestHelper(namePreprocess = (fnName) => fnName) {
    return (fnOrAction, condition, ...rest) => {
        var name;
        const typeOfAction = typeof fnOrAction;
        switch (typeOfAction) {
            case 'function':
                name = fnOrAction.name;
                break;
            case 'string':
                name = fnOrAction;
                break;
            default:
                throw TypeError(`expected string or function with name, not ${typeOfAction}`);
        }
        const preprocessed = namePreprocess(name);
        test(`${preprocessed} ${condition}`, ...rest);
    }
}

const testSetMethodPolyfill = buildTestHelper((name) => `Set.${name}`);

// Let's not clobber the base Set type
class PolyfilledSet extends Set {}

describe('polyfillSetType replaces all elements when replaceExisting == true', () => {
    polyfillSetType(PolyfilledSet, {replaceExisting : true}); // force monkeypatching
    const setProto = PolyfilledSet.prototype
    for (const [name, patch] of Object.entries(setPatches)) {
        test(`Set.${name} replaced from polyfill`, () => {
            expect(setProto[name]).toBe(patch);
        });
    }
});


// Some shared constants
const EMPTY_SET           = new PolyfilledSet();
const SIMPLE_SET_0_1      = new PolyfilledSet([0,1]);
const SIMPLE_SET_2_3      = new PolyfilledSet([2,3]);
const SIMPLE_SET_0_THRU_3 = new PolyfilledSet([0,1,2,3]);


describe('test method polyfill type checking', () => {
// Test type checking for all methods which expect a set
for (const [name, fn] of Object.entries(setPatches)) {
    if (fn.length === 0) continue; // Skip 0-arg methods
    testSetMethodPolyfill(name, 'throws TypeError on non-set other value', () => {
        // IMPORTANT: vitest requires error-throwing code to be function-wrapped
        expect(() => { fn(null) }).toThrowError(/is not/);
    });
}});


describe('All set-returning methods return new sets', () => {
    for (const [name, fn] of Object.entries(setPatches)) {
        // exclude "is" method names since they return bools
        if ((fn.length === 0) || name.startsWith('is')) continue;
        testSetMethodPolyfill(name, 'returns new set', () => {
            const returned = EMPTY_SET[name](EMPTY_SET);
            expect(EMPTY_SET).not.toBe(true);
            expect(returned).toBeInstanceOf(PolyfilledSet);
        });
    }
});


describe('test Set.isSubsetOf', () => {
    it('returns true when base set is an empty set', () => { 
        assert(EMPTY_SET.isSubsetOf(EMPTY_SET));
        assert(EMPTY_SET.isSubsetOf(SIMPLE_SET_0_1));
    });

    it('returns true for same set', () => {
        assert(SIMPLE_SET_0_1.isSubsetOf(SIMPLE_SET_0_1));
    });

    it('returns false when not subset', () => { 
        assert(! (SIMPLE_SET_0_1.isSubsetOf(EMPTY_SET)) );
    });
});


describe('test Set.isSupersetOf', () => {
    // isSupersetOfTests
    it('returns true when emptyset passed as other', () => {
        assert(SIMPLE_SET_0_1.isSupersetOf(EMPTY_SET));
    });

    it('returns false when non-subset passed as other', () => {
        assert(! (EMPTY_SET.isSupersetOf(SIMPLE_SET_0_1)) );
    });

    it('returns true when passed same set', () => {
        assert(EMPTY_SET.isSupersetOf(EMPTY_SET));
        assert(SIMPLE_SET_0_1.isSupersetOf(SIMPLE_SET_0_1));
    });

});


describe('test Set.isDisjointFrom', () => {
    it('returns true when no shared elements', () => {
        assert(SIMPLE_SET_0_1.isDisjointFrom(SIMPLE_SET_2_3));
        assert(SIMPLE_SET_2_3.isDisjointFrom(SIMPLE_SET_0_1));
    });
    it('returns false when shared elements', () => {
        assert(! (SIMPLE_SET_0_THRU_3.isDisjointFrom(SIMPLE_SET_2_3)) );
        assert(! (SIMPLE_SET_0_THRU_3.isDisjointFrom(SIMPLE_SET_0_1)) );
        assert(! (SIMPLE_SET_0_1.isDisjointFrom(SIMPLE_SET_0_THRU_3)) );
        assert(! (SIMPLE_SET_2_3.isDisjointFrom(SIMPLE_SET_0_THRU_3)) );
    })
});


describe('test Set.difference', () => {
    testSetMethodPolyfill('difference', 'returns equal set when empty set is base', () => {
        expect(EMPTY_SET.difference(EMPTY_SET)).toEqual(EMPTY_SET);
        expect(EMPTY_SET.difference(SIMPLE_SET_0_1)).toEqual(EMPTY_SET);
    });

    testSetMethodPolyfill('difference', 'returns elements in this set but not other', () => {
        expect(SIMPLE_SET_0_1.difference(EMPTY_SET)).toEqual(SIMPLE_SET_0_1);
        expect(SIMPLE_SET_0_1.difference(SIMPLE_SET_2_3)).toEqual(SIMPLE_SET_0_1);
    });

    testSetMethodPolyfill('difference', 'returns empty set when sets equal', () => {
        expect(SIMPLE_SET_0_1.difference(SIMPLE_SET_0_1)).toEqual(EMPTY_SET);
        expect(SIMPLE_SET_2_3.difference(SIMPLE_SET_2_3)).toEqual(EMPTY_SET);
    });
});


describe('test Set.union', () => {
    it('returns empty set when both are empty', () => {
        expect(EMPTY_SET.union(EMPTY_SET)).toEqual(EMPTY_SET);
    }) 
    it('returns set equal first when empty set is used as base', () => {
        expect(EMPTY_SET.union(SIMPLE_SET_0_1)).toEqual(SIMPLE_SET_0_1);
        expect(EMPTY_SET.union(SIMPLE_SET_2_3)).toEqual(SIMPLE_SET_2_3);
    });

    it('returns set equal first when empty set is used as argument', () => {
        expect(SIMPLE_SET_0_1.union(EMPTY_SET)).toEqual(SIMPLE_SET_0_1);
        expect(SIMPLE_SET_2_3.union(EMPTY_SET)).toEqual(SIMPLE_SET_2_3);
    });
});


describe('test Set.intersection', () => {
    it('returns empty when both base and argument are empty sets', () => {
        expect(EMPTY_SET.intersection(new PolyfilledSet())).toEqual(EMPTY_SET);
    });
    it('returns empty set when base is argument common elements', () => {
        expect(EMPTY_SET.intersection(SIMPLE_SET_0_1)).toEqual(EMPTY_SET);
        expect(EMPTY_SET.intersection(SIMPLE_SET_2_3)).toEqual(EMPTY_SET);
        expect(SIMPLE_SET_0_1.intersection(SIMPLE_SET_2_3)).toEqual(EMPTY_SET);
        expect(SIMPLE_SET_2_3.intersection(SIMPLE_SET_0_1)).toEqual(EMPTY_SET);
    });

    it('returns equal set when other has same elements', () => {
        expect(SIMPLE_SET_0_1.intersection(SIMPLE_SET_0_1)).toEqual(SIMPLE_SET_0_1);
        expect(SIMPLE_SET_2_3.intersection(SIMPLE_SET_2_3)).toEqual(SIMPLE_SET_2_3);
    });

    it('returns shared values when other has some elements', () => {
        expect(SIMPLE_SET_0_THRU_3.intersection(SIMPLE_SET_0_1)).toEqual(SIMPLE_SET_0_1);
        expect(SIMPLE_SET_0_THRU_3.intersection(SIMPLE_SET_2_3)).toEqual(SIMPLE_SET_2_3);
    });

});

describe('test symmetricDifference', () => {
    testSetMethodPolyfill('symmetricDifference', 'returns values found in either set but not both', () => {
        expect(EMPTY_SET.symmetricDifference(EMPTY_SET)).toEqual(EMPTY_SET);
        expect(SIMPLE_SET_0_1.symmetricDifference(SIMPLE_SET_2_3)).toEqual(SIMPLE_SET_0_THRU_3);
        expect(SIMPLE_SET_2_3.symmetricDifference(SIMPLE_SET_0_1)).toEqual(SIMPLE_SET_0_THRU_3);
    });

    testSetMethodPolyfill('symmetricDifference', 'removes values found in both sets', () => {
        expect(SIMPLE_SET_0_1.symmetricDifference(SIMPLE_SET_0_1)).toEqual(EMPTY_SET);
        expect(SIMPLE_SET_2_3.symmetricDifference(SIMPLE_SET_2_3)).toEqual(EMPTY_SET);
    });

});