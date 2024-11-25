import { product, range } from "../../src/core/functional.mjs";
import { assert, describe, expect, it } from 'vitest';
import { NOT_NUMBERS } from "../helpers.mjs";


describe(range, () => {
    describe('validation behavior', () => {
        describe('rejects floats', () => {
            it('rejects 1 float', () => {
                expect(() => { range(1.1)})
                    .toThrow(RangeError);
            });

        });

        describe(`it throws TypeError for any non-Numbers`, () => {
            describe('rejects 1 non-number', () => {
                for(const bad of NOT_NUMBERS) {
                    it(`rejects ${JSON.stringify(bad)}`, () => {
                        expect(() => range(bad)).toThrow(TypeError);
                    });
                }
            });
        });

    });
    describe('single argument treated as end', () => {
        for (var i = 0; i < 5; i++) {
            it(`generates ${i} values starting at 0`, () => {
                const arr = Array.from(range(i));
                const len = arr.length;
                expect(len).toEqual(i);
                const minusOne = len - 1;
                expect(arr[minusOne]).toEqual(minusOne);
            })
        }
    });

})