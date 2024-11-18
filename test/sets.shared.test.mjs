import { tryGetType, tryGetTypeName } from '../src/shared.mjs';
import { assert, describe, expect, it } from 'vitest';

class Temp {}


describe(tryGetTypeName, () => {
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


describe(tryGetType, () => {
    it('returns types unchanged', () => {
        expect(tryGetType(Temp)).toBe(Temp);
    })

    it('returns instance types', () => {
        expect(tryGetType(new Temp())).toBe(Temp);
    })

    it('throws TypeError when given things without a new-style class', () => {
        for (const bad of [undefined, 1]) {
            expect(() => {tryGetType(bad); }).toThrow(/expected a type or instance/);
        }
    })
});

