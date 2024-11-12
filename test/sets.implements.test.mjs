import { assert, describe, expect, it } from "vitest";
import { isLikeReadableMap, isLikeWritableMap } from "../src/inspect.mjs";
import { Counter, MultiSet } from "../src/countingsets.mjs";

const returnsEmpty = () => [];

const mapLike = {
    'size': () => 0,
    'entries': returnsEmpty,
    'forEach': () => {return;},
    'get': () => {throw RangeError();},
    'has': () => false,
    'keys': returnsEmpty,
    'values': returnsEmpty,
}
mapLike[Symbol.iterator] = returnsEmpty;

const readOnlyLikes = [
            new Map(),
            new Counter(),
            new MultiSet(),
            mapLike
        ];

        
describe('isLikeReadableMap', () => {
    it('recognizes Map instances', () => {
        for (const imp of readOnlyLikes) {
            assert(isLikeReadableMap(imp));
        }
    });
    it('rejects non-Maplike', () => {
        assert(! (isLikeReadableMap(new Set())));
    })
});


describe('isLikeWritableMap', () => {
    it('rejects read-only-likes', () => {
        assert(! (isLikeWritableMap(mapLike)))
    });
})
