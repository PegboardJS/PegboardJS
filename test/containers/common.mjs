import { newless } from "../../src/core/functional/meta.mjs";


// Let's not clobber the base Set type?
class PolyfilledSet extends Set { }
Set = PolyfilledSet;
export class Subclass extends Set { }
const setClasses = [Set, Subclass];
export const setNewless = setClasses.map(newless);
