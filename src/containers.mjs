import { pegboard } from "./core.mjs"
import { DefaultMap } from "./containers/defaultmap.mjs";
import { Counter } from "./containers/counter.mjs";

export const DefaultMap = DefaultMap;
export const Counter    = Counter;

export const containers = {
    DefaultMap: DefaultMap,
    Counter: Counter,
};

pegboard.containers = containers;


