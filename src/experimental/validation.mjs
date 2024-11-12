import { isFunction } from "../shared.mjs";
import { asMapArgPairs, MapWithDefaultGet } from "../nicermap.mjs";

/**
 * A canned error.
 */
class Problem {
    constructor(errorType, errorMsg) {
        this.errorType = errorType;
        this.errorMsg  = errorMsg;
        Object.freeze(this);
    }
}

export class Requirement {
    #predicate;      get predicate()      { return this.#predicate; }
    #errorType;      get errorType()      { return this.#errorType; }
    #errorTemplater; get errorTemplater() { return this.#errorTemplater; }

    constructor(predicate, errorType, errorTemplater = undefined) {
        if(! isFunction(predicate)) throw TypeError(
            `requirement predicates must be functions, but got ${JSON.stringify(predicate)}`);
        if(! isFunction(errorType)) throw TypeError(
            `errorType must be a type, but got ${JSON.stringify(predicate)}`);
        if (! (errorTemplater === undefined || isFunction(errorTemplater))) throw TypeError(
            `if errorTemplater is defined, it must be a function, not ${errorTemplater}`);

        this.#predicate = predicate;
        this.#errorType = errorType;
        this.#errorTemplater = errorTemplater 
    }


}

export class Validator {
    constructor() {

    }
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
        if (! isFunction(requirement)) throw TypeError(`keys must be predicates, but got ${JSON.stringify(requirement)}`);
        if (! isFunction(problemWhenFailed)) throw TypeError(`values must be exception-creating functions, but got ${JSON.string(problemWhenFailed)}`);
    }

    check(value) {
        for (const [requirement, problemWhenFailed] of this.entries()) {
            if (!requirement(value)) return problemWhenFailed;
        }
        return null;
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

