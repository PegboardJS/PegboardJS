import {add, subtract, divide, multiply, mod} from "./functional/operators.mjs";
export * from "./functional/iteration.mjs";

// Ugly but it works
export const functional = {
    operators: {
        add: add,
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

global.pegboard.functional = functional;
