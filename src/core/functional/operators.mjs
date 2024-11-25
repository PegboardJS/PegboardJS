
export const add      = (a, b) => a + b;
export const subtract = (a, b) => a - b;
export const multiply = (a, b) => a * b;
export const divide   = (a ,b) => a / b;
export const mod      = (a, b) => a % b;

/**
 * Wraps module back into the positive domain, as you may want when handling negative indices.
 * 
 * The JS % operator doesn't do thins by default.
 * @param {Number} a - the operand
 * @param {Number} b - the mod base
 * @returns {Number} - the positive-domain mod
 */
export function positiveMod(a, b) {
    var result = a % b;
    if (result < 0) result += b;
    return result;
}
