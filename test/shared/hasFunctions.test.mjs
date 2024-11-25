import { assert, describe, expect, it } from 'vitest';
import { hasFunctions } from "../../src/shared.mjs";

describe(hasFunctions, () => {

    const EMPTY_SET = new Set();
    describe('return behavior', () => {
        it('returns false for non-values', () => {
            expect(hasFunctions(undefined)).toBe(false);
            expect(hasFunctions(null)).toBe(false);
        });
        it('returns true when instance methods present', () => {
            expect(hasFunctions(EMPTY_SET, 'has', 'keys')).toBe(true);
        })

    });
    it('accepts Symbol.iterator', () => {
        expect(hasFunctions(EMPTY_SET, Symbol.iterator)).toBe(true);
    });
});