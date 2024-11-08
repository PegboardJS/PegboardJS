/**
 * Q: Why vitest if no front-end components?
 * A: It's the 1st JS test framework which worked
 */
import { expect, test } from "vitest"
import { setPatches, polyfillSetType } from "../src/sets.setpolyfill"


/**
 * Avoid boilerplate by making test helpers.
 * 
 * @param {string} kind - 
 * @param {*} namePreprocess 
 * @returns 
 */
function buildTestHelper(kind, namePreprocess = (fnName) => fnName) {
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
        test(`${kind} ${preprocessed} ${condition}`, ...rest);
    }
}

const testHelperFunction    = buildTestHelper('helper function');
const testSetMethodPolyfill = buildTestHelper('method polyfill', (name) => `Set.${name}`);

// Let's not clobber the base Set type
class PolyfilledSet extends Set {}


testHelperFunction('polyfillSetType', 'replaces all elements when forcePatch == true', () => {
    polyfillSetType(PolyfilledSet, {force : true}); // force monkeypatching
    const setProto = PolyfilledSet.prototype
    for (const [name, patch] of Object.entries(setPatches)) {
        expect(setProto[name]).toBe(patch);
    }
});


// Some shared constants
const EMPTY_SET           = new PolyfilledSet();
const SIMPLE_SET_0_1      = new PolyfilledSet([0,1]);
const SIMPLE_SET_2_3      = new PolyfilledSet([2,3]);
const SIMPLE_SET_0_THRU_3 = new PolyfilledSet([0,1,2,3]);


// Test type checking for all methods which expect a set
for (const [name, fn] of Object.entries(setPatches)) {
    if (fn.length === 0) continue; // Skip 0-arg methods
    testSetMethodPolyfill(name, 'throws TypeError on non-set other value', () => {
        // IMPORTANT: vitest requires error-throwing code to be function-wrapped
        expect(() => { fn(null) }).toThrowError(/is not/);
    });
}


// Make sure each set-returning method returns a new set
for (const [name, fn] of Object.entries(setPatches)) {
    // exclude "is" method names since they return bools
    if ((fn.length === 0) || name.startsWith('is')) continue;
    testSetMethodPolyfill(name, 'returns new set', () => {
        const returned = EMPTY_SET[name](EMPTY_SET);
        expect(returned !== EMPTY_SET).toBe(true);
        expect(returned instanceof PolyfilledSet).toBe(true);
    });
}


// isSubsetOf tests
testSetMethodPolyfill('isSubsetOf', 'returns true when base set is an empty set', () => { 
    expect(EMPTY_SET.isSubsetOf(EMPTY_SET)).toBe(true);
    expect(EMPTY_SET.isSubsetOf(SIMPLE_SET_0_1)).toBe(true);
});

testSetMethodPolyfill('isSubsetOf', 'returns true for same set', () => {
    expect(SIMPLE_SET_0_1.isSubsetOf(SIMPLE_SET_0_1)).toBe(true);
});

testSetMethodPolyfill('isSubsetOf', 'returns false when not subset', () => { 
    expect(SIMPLE_SET_0_1.isSubsetOf(EMPTY_SET)).toBe(false);
});


// isSupersetOfTests
testSetMethodPolyfill('isSupersetOf', 'returns true when emptyset passed as other', () => {
    expect(SIMPLE_SET_0_1.isSupersetOf(EMPTY_SET)).toBe(true);
});

testSetMethodPolyfill('isSupersetOf', 'returns false when non-subset passed as other', () => {
    expect(EMPTY_SET.isSupersetOf(SIMPLE_SET_0_1)).toBe(false);
});


testSetMethodPolyfill('isSupersetOf', 'returns true when passed same set', () => {
    expect(EMPTY_SET.isSupersetOf(EMPTY_SET)).toBe(true);
    expect(SIMPLE_SET_0_1.isSupersetOf(SIMPLE_SET_0_1)).toBe(true);
});

testSetMethodPolyfill('isDisjointFrom', 'returns true when no shared elements', () => {
    expect(SIMPLE_SET_0_1.isDisjointFrom(SIMPLE_SET_2_3)).toBe(true);
    expect(SIMPLE_SET_2_3.isDisjointFrom(SIMPLE_SET_0_1)).toBe(true);
})

// Difference tests
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


// Union tests
testSetMethodPolyfill('union', 'returns set equal first when empty set is used as base', () => {
    expect(EMPTY_SET.union(EMPTY_SET)).toEqual(EMPTY_SET);
    expect(EMPTY_SET.union(SIMPLE_SET_0_1)).toEqual(SIMPLE_SET_0_1);
    expect(EMPTY_SET.union(SIMPLE_SET_2_3)).toEqual(SIMPLE_SET_2_3);
});


// Intersection tests
testSetMethodPolyfill('intersection', 'returns empty set when no common elements', () => {
    expect(EMPTY_SET.intersection(EMPTY_SET)).toEqual(EMPTY_SET);
    expect(EMPTY_SET.intersection(SIMPLE_SET_0_1)).toEqual(EMPTY_SET);
    expect(EMPTY_SET.intersection(SIMPLE_SET_2_3)).toEqual(EMPTY_SET);
    expect(SIMPLE_SET_0_1.intersection(SIMPLE_SET_2_3)).toEqual(EMPTY_SET);
    expect(SIMPLE_SET_2_3.intersection(SIMPLE_SET_0_1)).toEqual(EMPTY_SET);
});

testSetMethodPolyfill('intersection', 'returns equal set when other has same elements', () => {
    expect(SIMPLE_SET_0_1.intersection(SIMPLE_SET_0_1)).toEqual(SIMPLE_SET_0_1);
    expect(SIMPLE_SET_2_3.intersection(SIMPLE_SET_2_3)).toEqual(SIMPLE_SET_2_3);
});

testSetMethodPolyfill('intersection', 'returns shared values when other has some elements', () => {
    expect(SIMPLE_SET_0_THRU_3.intersection(SIMPLE_SET_0_1)).toEqual(SIMPLE_SET_0_1);
    expect(SIMPLE_SET_0_THRU_3.intersection(SIMPLE_SET_2_3)).toEqual(SIMPLE_SET_2_3);
});


// Symmetric difference tests
testSetMethodPolyfill('symmetricDifference', 'returns values found in either set but not both', () => {
    expect(EMPTY_SET.symmetricDifference(EMPTY_SET)).toEqual(EMPTY_SET);
    expect(SIMPLE_SET_0_1.symmetricDifference(SIMPLE_SET_2_3)).toEqual(SIMPLE_SET_0_THRU_3);
    expect(SIMPLE_SET_2_3.symmetricDifference(SIMPLE_SET_0_1)).toEqual(SIMPLE_SET_0_THRU_3);
});

testSetMethodPolyfill('symmetricDifference', 'removes values found in both sets', () => {
    expect(SIMPLE_SET_0_1.symmetricDifference(SIMPLE_SET_0_1)).toEqual(EMPTY_SET);
    expect(SIMPLE_SET_2_3.symmetricDifference(SIMPLE_SET_2_3)).toEqual(EMPTY_SET);
});
