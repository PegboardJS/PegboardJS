import { isLikeReadableMap, implementsIterable } from "./inspect.mjs";

export function asMapArgPairs(iterable) {
    if (isLikeReadableMap(iterable))       { return iterable.entries(); }
    else if (implementsIterable(iterable)) { return iterable[Symbol.iterator](); }

    return null;
}

/**
 * Adds a configurable default value to standard Map behavior.
 * 
 */
// export class DefaultMap extends Map {
//     constructor(iterable, defaultValue) {
//         super(iterable);
//         this.defaultValue = defaultValue;
//     }

//     get(key) {
//         if (this.has(key)) { return super.get(key);   }
//         else               { return this.defaultValue }
//     }
// }

