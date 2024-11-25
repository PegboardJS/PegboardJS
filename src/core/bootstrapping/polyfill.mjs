
/********************************************
 *******     Monkeypatch helpers    *********
 ********************************************
 
 You can ignore these. They're a self-contained way to add recent Set
 features on older browsers.
 */
/**
 * Add methods to a prototyoe from a source of backports.
 *
 * By default, this leaves existing methods alone. You can force it to
 * override existing methods by passing true via replaceExisting.
 *
 * @param {object} prototype - A prototype to monkeypatch from a source
 * @param {object} source - An object containing callables to use as polyfills
 * @param {boolean} replaceExisting - Whether to replace existing methods
 */
export function polyfillPrototype(prototype, source, replaceExisting = false) {
    for (const [methodKey, implementation] of Object.entries(source)) {
        if (replaceExisting || !(methodKey in prototype)) {
            prototype[methodKey] = implementation;
        }
    }
}
