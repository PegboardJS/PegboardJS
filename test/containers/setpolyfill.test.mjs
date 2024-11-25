/**
 * Q: Why vitest if no front-end components?
 * A: It's the 1st JS test framework which worked
 */

import { setPatches, setMethods, polyfillSetType, allPolyfillMethods } from "../../src/containers/setpolyfill.mjs";
import { setsEqual } from "../../src/containers/helpers.mjs";
import { isFunction, tryGetTypeName } from "../../src/shared.mjs";
import { range, product, zipStrict } from "../../src/core/functional.mjs";

import { skipIfNodeVersionGt } from "../helpers.mjs";
import { expect, test, assert, it } from "vitest"
import { describe } from "../helpers.mjs";
import { Subclass, setNewless } from "./common.mjs";

skipIfNodeVersionGt(20);

const opCache = {};
global.opCache = opCache;
opCache.setsEqual = setsEqual;
function resolveName(fnOrName) {
    if(isFunction(fnOrName)) return fnOrName.name;
    else if (typeof fnOrName === 'string') return fnOrName;
    return null   
}
function setFnNameProp(f, name) {
    Object.defineProperty(f, 'name', {value: name});
}

function asBinop(fn) {
    const name = resolveName(fn);
    function binOp(a, b) {
        return a[name](b);
    }
    setFnNameProp(binOp, name);
    return binOp;
}

function opShort(fnOrName) {
    const name = resolveName(fnOrName);
    if(name === null) throw TypeError(`expected function or string, not ${fnOrName}`);
    const lines = [
        `const ${name} = a.${name}(b);`,
        `return opCache.setsEqual(${name}, expected);`];
    const f = new Function(['a', 'b', 'expected'], lines.join("\n"));
    setFnNameProp(f, name);
    return f;
}

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
describe('polyfillSetType replaces all elements when replaceExisting == true', () => {
    polyfillSetType(Set, {replaceExisting : true}); // force monkeypatching
    const setProto = Set.prototype
    for (const [name, patch] of Object.entries(allPolyfillMethods)) {
        test(`Set.${name} replaced from polyfill`, () => {
            expect(setProto[name]).toBe(patch);
        });
    }
});


// Some shared constants
const EMPTY_SET           = new Set();
const SIMPLE_SET_0_1      = new Set([0,1]);
const SIMPLE_SET_2_3      = new Subclass([2,3]);
const SIMPLE_SET_0_THRU_3 = new Set([0,1,2,3]);


describe('test method polyfill type checking', () => {
// Test type checking for all methods which expect a set
for (const [name, fn] of Object.entries(allPolyfillMethods)) {
    if (
        fn.length === 0
        || name === 'equals'
    ) continue; // Skip 0-arg methods
    testSetMethodPolyfill(name, 'throws TypeError on non-set other value', () => {
        // IMPORTANT: vitest requires error-throwing code to be function-wrapped
        expect(() => { fn(null) }).toThrow(TypeError);
    });
}});


describe('All set-returning methods return new sets', () => {
    for (const [name, fn] of Object.entries(setMethods)) {
        // exclude "is" method names since they return bools
        if (
            (fn.length === 0)
            || name.startsWith('is')
            || name === 'equals'
        ) continue;
        testSetMethodPolyfill(name, 'returns new set', () => {
            const returned = EMPTY_SET[name](EMPTY_SET);
            expect(EMPTY_SET).not.toBe(true);
            expect(returned).toBeInstanceOf(Set);
        });
    }
});

function* classPermute(...argsForTypes) {
    const productArgs = Array(argsForTypes.length)
        .fill(setNewless);
    for(const factories of product(...productArgs)) {
        const toYield = Array
            .from(zipStrict(factories, argsForTypes))
            .map((pair) => pair[0](pair[1]));
        yield toYield;
    }
}

// pending: better fixture / parametrization setup?
describe(Set.prototype.isSubsetOf, () => {
    const op = asBinop('isSubsetOf');
    function* i(argA, argB) {
        for(const [a, b] of classPermute(argA, argB))
            yield op(a, b);
    }
    it('returns true when base set is an empty set', () => { 
        for(const [a, b] of product(setNewless, setNewless)) {
            assert(op(a([]), b([])));
            assert(op(a([]), b(SIMPLE_SET_0_1)));
        }
    });

    it('returns true for same set', () => {
        for(const isSubset of i(SIMPLE_SET_0_1, SIMPLE_SET_0_1))
            assert(isSubset);
    });

    it('returns false when not subset', () => { 
        for(const isSubset of i(SIMPLE_SET_0_1, EMPTY_SET))
            assert(! isSubset);
    });
});


describe(Set.prototype.isSupersetOf, () => {
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
    function f(a, b) { return (a.isDisjointFrom(b)); }
    it('returns true when no shared elements', () => {
        assert(f(SIMPLE_SET_0_1, SIMPLE_SET_2_3));
        assert(f(SIMPLE_SET_2_3, SIMPLE_SET_0_1));
    });
    it('returns false when shared elements', () => {
        expect(! f(SIMPLE_SET_0_THRU_3,SIMPLE_SET_2_3));
        assert(! f(SIMPLE_SET_0_THRU_3,SIMPLE_SET_0_1));
        assert(! f(SIMPLE_SET_0_1, SIMPLE_SET_0_THRU_3));
        assert(! f(SIMPLE_SET_2_3, SIMPLE_SET_0_THRU_3));
    })
});


describe('test Set.difference', () => {
    const d = opShort('difference');
    testSetMethodPolyfill('difference', 'returns equal set when empty set is base', () => {
        assert(d(EMPTY_SET, EMPTY_SET, EMPTY_SET));
        assert(d(EMPTY_SET, SIMPLE_SET_0_1, EMPTY_SET));
    });

    testSetMethodPolyfill('difference', 'returns elements in this set but not other', () => {
        assert(d(SIMPLE_SET_0_1,EMPTY_SET,SIMPLE_SET_0_1));
        expect(d(SIMPLE_SET_0_1, SIMPLE_SET_2_3, SIMPLE_SET_0_1));
    });

    testSetMethodPolyfill('difference', 'returns empty set when sets equal', () => {
        assert(d(SIMPLE_SET_0_1,SIMPLE_SET_0_1, EMPTY_SET));
        assert(d(SIMPLE_SET_2_3, SIMPLE_SET_2_3, EMPTY_SET));
    });
});


describe('test Set.union', () => {
    const u = opShort('union');
    it('returns empty set when both are empty', () => {
        expect(u(EMPTY_SET, EMPTY_SET, EMPTY_SET));
    }) 
    it('returns set equal first when empty set is used as base', () => {
        assert(u(EMPTY_SET, SIMPLE_SET_0_1, SIMPLE_SET_0_1));
        assert(u(EMPTY_SET, SIMPLE_SET_2_3, SIMPLE_SET_2_3));
    });

    it('returns set equal first when empty set is used as argument', () => {
        assert(u(SIMPLE_SET_0_1, EMPTY_SET, SIMPLE_SET_0_1));
        assert(u(SIMPLE_SET_2_3, EMPTY_SET, SIMPLE_SET_2_3));
    });
});


describe(Set.prototype.intersection, () => {
    // describe('returns empty set when', () => {
    //     it('empty set is passed any set', () => {
    //         expect(EMPTY_SET.intersection(SIMPLE_SET_0_1)).to
    //     });
    // });
    const i = opShort('intersection');
    it('returns empty when both base and argument are empty sets', () => {
        assert(i(EMPTY_SET, new Set(), EMPTY_SET));
    });
    it('returns empty set when base is argument common elements', () => {
        assert(i(EMPTY_SET, SIMPLE_SET_0_1, EMPTY_SET));
        assert(i(EMPTY_SET, SIMPLE_SET_2_3, EMPTY_SET));
        assert(i(SIMPLE_SET_0_1, SIMPLE_SET_2_3, EMPTY_SET));
        assert(i(SIMPLE_SET_2_3, SIMPLE_SET_0_1, EMPTY_SET));
    });

    it('returns equal set when other has same elements', () => {
        assert(i(SIMPLE_SET_0_1,SIMPLE_SET_0_1, SIMPLE_SET_0_1));
        assert(i(SIMPLE_SET_2_3, SIMPLE_SET_2_3, SIMPLE_SET_2_3));
    });

    it('returns shared values when other has some elements', () => {
        assert(i(SIMPLE_SET_0_THRU_3, SIMPLE_SET_0_1, SIMPLE_SET_0_1));
        assert(i(SIMPLE_SET_0_THRU_3, SIMPLE_SET_2_3, SIMPLE_SET_2_3));
    });

});

describe('test symmetricDifference', () => {
    const s = opShort('symmetricDifference');

    testSetMethodPolyfill('symmetricDifference', 'returns values found in either set but not both', () => {
        assert(s(EMPTY_SET, EMPTY_SET, EMPTY_SET));
        assert(s(SIMPLE_SET_0_1, SIMPLE_SET_2_3, SIMPLE_SET_0_THRU_3));
        assert(s(SIMPLE_SET_2_3, SIMPLE_SET_0_1, SIMPLE_SET_0_THRU_3));
    });

    testSetMethodPolyfill('symmetricDifference', 'removes values found in both sets', () => {
        assert(s(SIMPLE_SET_0_1, SIMPLE_SET_0_1, EMPTY_SET));
        expect(s(SIMPLE_SET_2_3, SIMPLE_SET_2_3, EMPTY_SET));
    });

});
