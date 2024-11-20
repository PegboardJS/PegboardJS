import { isFunction, hasFunction, implementsIterable, implementsIterableWithHas } from "../src/inspect.mjs";
import { assert, describe, except, it } from 'vitest';
import { NOT_FUNCTIONS } from "./helpers.mjs";

describe(isFunction, () => {
    it('returns false for non-function objects', () => {
        for (const notFn of NOT_FUNCTIONS) {
            assert(! isFunction(notFn));
        }
    });

    it('returns true for function objects', () => {
        for(const fn of [() => {}, Math.abs, Set]) {
            assert(isFunction(fn));
        }
    });
});

describe(hasFunction, () => {
    it('returns true for instance methods', () => {
        const s = new Set();
        assert(hasFunction(s, 'has'));
    })
    it('returns true for prototype methods', () => {
        assert(hasFunction(Set.prototype, 'has'));
    });
})

describe(implementsIterable, () => {
    it('true for Arrays', () => {
        assert(implementsIterable([1,2,3]));
    })
    it('true for Set instances', () => {
        assert(implementsIterable(new Set()));
    });
    it('true for Map instances', () => {
        assert(implementsIterable(new Map()));
    });
    it('true for objects with the Symbol.iterator method', () => {
        const f = () => {};
        const o = new Object();
        o[Symbol.iterator] = f;
        assert(implementsIterable(o));
    })
    it('false for objects without it', () => {
        for (const no of [1, new Object(), 'e']) {
            assert(! implementsIterable(no));
        }
    });
})

describe(implementsIterableWithHas, () => {
    it('true for Set instances', () => {
        assert(implementsIterable(new Set()));
    });
    it('true for Map instances', () => {
        assert(implementsIterable(new Map()));
    });
    it('false for Array instances', () => {
        assert(! implementsIterableWithHas([]));
    })
});
