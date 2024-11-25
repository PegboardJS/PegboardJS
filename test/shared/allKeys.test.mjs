
import { allKeys, tryGetTypeName } from '../../src/shared.mjs';
import { setsEqual } from '../../src/containers/helpers.mjs';
import { polyfillSetType } from '../../src/containers/setpolyfill.mjs';
import { product } from "../../src/core/functional/iteration.mjs";

import { assert, describe, expect, it } from 'vitest';
polyfillSetType();

describe(allKeys, () => {
    it('returns empty set for no args', () => {
        const result = allKeys();
        assert(result instanceof Set);
        assert(result.size === 0);
    });

    it('throws TypeError for non-Set-like args', () => {
        expect(() => {
            allKeys(MAP_A, []);
        }).toThrow(TypeError);
    });


    const A_ARGS = [['a', 1], ['c', 1]];
    const B_ARGS = [['b', 2], ['c', 1]];


    const MAP_A = new Map(A_ARGS);
    const MAP_B = new Map(B_ARGS);
    const SET_A = new Set(MAP_A.keys());
    const SET_B = new Set(MAP_B.keys());
    const mergedKeys = new Set(['a', 'b', 'c']);



    describe('merges all keys present', () => {

        const p = product([MAP_A, SET_A], [MAP_B, SET_B]);
        for(const pair of p) {
            const [nameA, nameB] = pair.map(tryGetTypeName);
            it(`merges ${nameA} x ${nameB}`, () => {
                assert(setsEqual(allKeys(...pair),  mergedKeys))
            })
        }
        
    });
});