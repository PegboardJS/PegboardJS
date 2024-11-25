import { immutableView, ImmutableError } from "../src/shared.mjs";

import {assert, describe, expect, it } from 'vitest';


describe('can read values', () => {
        const a = {
            string: 'value',
            int: 0,
            object: {
                inner: 'inner string',
                object: {
                    inner: 'another inner string'
                }
            }
        };
        const proxy = immutableView(a);

    it('returns non-proxied values for primitives', () => {
        expect(proxy.string).toEqual('value');
        expect(proxy.int).toEqual(0);
    });

    describe('blocks write of compound types', () => {
        it('blocks array mutation', () => {
            const a = [1,2];
            const aProxy = immutableView(a);
            expect(() => aProxy[1] = 1).toThrow(ImmutableError);
        });
        it('blocks map mutation', () => {
            const m = new Map();
            const proxy = immutableView(m);
            expect(() => proxy.set('key', 'value')).toThrow(TypeError);
            m.set('key', 'value');
            assert(proxy.get('key') === 'value');
        });
    })

    it('returns proxied values recursively for child values', () => {
        const p = proxy.object;
        expect(() => p.inner = 'should error').toThrow(ImmutableError);
        const p2 = p.object;
        expect(() => p2.inner = 'should error').toThrow(ImmutableError);
    });
});


