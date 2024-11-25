import { product, range } from "../../src/core/functional.mjs";

import { NOT_ITERABLES } from "../helpers.mjs";
import {assert, describe, expect, it} from "vitest";

describe(product, () => {
    describe('rejects TypeError on non-iterable arguments', () => {

        for(const i of range(3)) {
            it(`it throws TypeError for non-number as argument ${i}`, () => {
                for (const bad of NOT_ITERABLES) {
                    const local = [];
                    for(const inner of range(3)) local.push([inner,]);
                    local[i] = bad;
                    expect(() => product(...local)).toThrow(TypeError);
                }
            });
        }
    });
    it('yields nothing if no iterables provided', () => {
        const result = Array.from(product());
        expect(result.length).toEqual(0);
    });

    describe('yields 1-length arrays when given 1 iterable', () => {
        const ref = [0,1,2];
        for(const iterable of [range(3), ref]) {
            it(`it does so for ${iterable}`, () => {
                var i = 0 ;
                for (const value of product(iterable)) {
                expect(value).toEqual([ref[i]]);
                i++;
                }
            });
        }
    });

    describe('no dupes when each iterable has unique values', () => {
        const part = [0];
        for(var n = 1; n <= 3; n++) {
            const titleParts = [];
            for(var i = 0; i < 0; i++) titleParts.push(JSON.stringify(n));
            const nResults = Math.pow(n,n);
            // Make n x n
            const args = [];
            for(var i = 0; i < n; i++) {
                args.push(Array.from(part));
            }
            it(`produces ${nResults} unique value for n=${n} iterables, each length=${n}`, () => {
                const p = product(...args);
                const s = new Set(p);
                assert(s.size === nResults);
            });
            part.push(n);
        }
    })
})