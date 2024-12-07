
export class UnexpectedFloat extends RangeError {}
export class UnexpectedNegative extends RangeError {}
export class UnexpectedZero extends RangeError {}


export class ExpectedIterable extends TypeError {}

export class ConflictError extends Error {}
export class DuplicatedValue extends ConflictError {}

export function discardExceptions(closure, ...rest) {
    try   { return closure(...rest); }
    catch { return undefined; }
}
