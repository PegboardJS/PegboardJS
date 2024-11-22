import { Requirements } from '../../src/experimental/validation.mjs';
import { assert, describe, expect, it } from 'vitest';


describe(Requirements, () => {
    describe('constructor', () => {
        it('permits 0-arg construction', () => {
            const r = new Requirements();
            assert(r.size === 0);
        });
        it('rejects non-function keys', () => {
            expect(() => {
                const _ = new Requirements([
                    ['a', TypeError],
                ]);
            }).toThrow(TypeError);
        });
        it('rejects non-function problem types', () => {
            expect(() => {
                const _ = new Requirements([
                    [Number.isInteger, 'a'],
                ]);
            }).toThrow(TypeError);
        });
    });
});