
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
