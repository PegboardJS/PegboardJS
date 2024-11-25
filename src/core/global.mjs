export const pegboard = {};

global.pegboard = pegboard;


// export function registerGlobal(path, item, makeAll = false) {
//     const pathParts = path.split('.');
//     if(pathParts.length < 1 || pathParts[0] !== 'pegboard') throw Error(
//         `object path did not start with pegboard, but ${JSON.stringify(pathParts[0])}`);

//     const lastIndex = pathParts.length - 1;
//     pathParts.shift();
//     var previous = undefined;
//     var current  = global;
//     for (const [i, component] of pathParts.entries()) {
//         previous = current;
//         if (current[component] === undefined) {
//             if      (makeAll || i < lastIndex) { current[component] = {}; }
//             else if (i === lastIndex) {
//                 current[component] = item;
//                 break;
//             }
//             else { throw new ReferenceError(
//                 `missing path component ${JSON.stringify(component)} at index ${i} of {path}`
//             );}
//         }
//         current = current[component];
//     }
// }