import { isLikeReadableMap, implementsIterable, isFunction } from "./inspect.mjs";

export function asMapArgPairs(iterable) {
    if (isLikeReadableMap(iterable))       { return iterable.entries(); }
    else if (implementsIterable(iterable)) { return iterable[Symbol.iterator](); }

    return null;
}


/**
 * Contains requirements for
 */
export class Requirements extends Map {
    constructor(iterable = undefined) {
        super();
        if (iterable === undefined) return;
        const pairs = asMapArgPairs(iterable);
        if (pairs === null)
            throw TypeError(`can't intialize Value requirements ${JSON.stringify(iterable)} appears to be like neither a Map nor pair Array`);

        for (const pair of pairs) this.set(...pair);
    }

    set(requirement, problemWhenFailed) {
        if (!isFunction(requirement)) throw TypeError(`keys must be predicates, but got ${JSON.stringify(requirement)}`);
        if (!isFunction(problemWhenFailed)) throw TypeError(`values must be exception-creating functions, but got ${JSON.string(problemWhenFailed)}`);
    }

    check(value) {
        for (const [requirement, problemWhenFailed] of this.entries()) {
            if (!requirement(value)) return problemWhenFailed;
        }
        return null;
    }
}

/**
 * A small upgrade to the default Map behavior which permits default getting.
 * 
 * IMPORTANT: Not Liskov-compliant since it alters the base type's API.
 * 
 */
export class MapWithDefaultGet extends Map {
    constructor(...rest) {
        super(...rest)
    }

    /**
     * Like Map.get, except it allows passing a default value.
     * 
     * If a default value is passed when a key has a value in the map, then:
     * 1. the provided default will be ignored
     * 2. the value in the map will be returned
     * 
     * @param {*} key - the key to look up
     * @param  {...any} rest - at most 1 additional value to use as default.
     * @returns A value found, or the default.
     */
    get(key, ...rest) {
        switch(rest.length) {
            case 0:
                return super.get(key);
            case 1:
                if (this.has(key)) { return super.get(key); }
                else               { return rest[0]; }
            default:
                throw RangeError(`${this.constructor.name} only supports 1 or 2 arguments`);
        }
    }
}

function alwaysTrue(o) { return true; }


class ValidatingMap extends MapWithDefaultGet {
    checkValue(value) {}
    checkKey(key)     {}
    checkPair(pair)   {}

    constructor(iterable = undefined) {
        super();
        if (iterable === undefined) return;

        const pairs = [...asMapArgPairs(iterable)];
        if (pairs === null)
            throw TypeError(`can't intialize Value requirements ${JSON.stringify(iterable)} appears to be like neither a Map nor pair Array`);
        if (allOf(pairs.map((pair) => {
           const [key, value] = pair;
           // Make sure we don't have an issue
           this.checkKey(key);
           this.checkValue(value);
           this.checkPair(rest);

           if(keyProblem) { throw keyProblem('key failed to meet requirements'); }

           return keyRequirements.check(k) && valueRequirements.check(v);
        })) ) {
            // skip revalidation on the instance set method
            for (const pair of pairs) super.set(...pair);
        } else {
        }
    }
}


