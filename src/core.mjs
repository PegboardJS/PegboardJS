import {pegboard} from "./core/global.mjs";

import { functional, iteration } from "./core/functional.mjs";

export const pegboard = pegboard; // Imports don't resolve unless we redef?
export const core = {
    functional: functional,
    iteration: iteration
};
pegboard.core = core;



