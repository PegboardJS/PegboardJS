import { pegboard } from "./global.mjs";
import {add, subtract, divide, multiply, mod, positiveMod} from "./functional/operators.mjs";
export * from "./functional/iteration.mjs";


export function spreadInto(spreadable, fn) {
    return fn(...spreadable);              
}

const spreadCache = new Map();
export function getSpread(fn) {
    if(spreadCache.has(fn)) return spreadCache.get(fn);
    const spread = (iterable) => { fn(...iterable); };
    spreadCache.set(fn, spread);
    return spread;
}

// Ugly but it works
export const functional = {
    spreadInto: spreadInto,
    operators: {
        add: add,
        subtract: subtract,
        divide: divide,
        multiply: multiply,
        mod: mod,
        positiveMod: positiveMod 
    }
};
// export const operators = {
//     add: add,
//     subtract: subtract,
//     multiply: multiply,
//     divide: divide,
//     mod: mod
// }
// functional.operators = operators;

// export const iteration = {
//     allOf: allOf,
//     noneOf: noneOf,
//     anyOf: anyOf
// }
// functional.iteration = iteration;

pegboard.functional = functional;
