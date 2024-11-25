import { DefaultMap } from "../src/containers.mjs";

import { assert, describe, expect, it } from "vitest";


describe(DefaultMap, () => {
    describe('test constructor', () => {
        it('creates from passed elements', () => {
            const m = new DefaultMap([[0, '0'], [1, '1']]);
            assert(m.get(0) === '0');
            assert(m.get(1) === '1');
        });
        it('permits setting default', () => {
            const m = new DefaultMap([], Symbol.for('default'));
            assert(m.defaultValue === Symbol.for('default'));
        });
    });

    describe('test get', () => {
        const m = new DefaultMap([['present', 1]], 0);
        it('works with one argument', () => {
            assert(m.get('present') === 1);
        });

        it('returns default when not found', () => {
            assert(m.get('absent') === 0);
        });
    });
});


