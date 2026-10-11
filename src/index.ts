/**
 * Yupiter — utilitas gaya standard library untuk Node.js.
 *
 * Modul pertama: printf-style I/O.
 *
 * @example CJS
 * const { printf } = require("yupiter");
 * printf("Halo, %s!\n", "dunia");
 *
 * @example ESM
 * import { printf } from "yupiter";
 * printf("Halo, %s!\n", "dunia");
 */

export { format } from "./format.js";
export { eprintf, printf } from "./io.js";
