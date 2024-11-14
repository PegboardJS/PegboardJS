import { tryGetTypeName } from '../src/shared.mjs';
import { assert, describe, expect, it } from 'vitest';

describe(tryGetTypeName, () => {
    class Temp {}
    it('works with classes', () => {
        const name = tryGetTypeName(Temp);
        assert(name === 'Temp');
    });
    it('works with instances', () => {
        const instance = new Temp();
        const name = tryGetTypeName(instance);
        assert (name === 'Temp');
    })
    it('throws typeerror on numbers', () => {
        expect(() => { tryGetTypeName(null); }).toThrow('expected a type or instance');
    });
})