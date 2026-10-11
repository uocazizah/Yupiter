/**
 * Varian harness CommonJS: memakai `require` global, jadi tetap jalan
 * di Node.js 9 ke atas. `node:test` dipakai bila tersedia.
 */

import { createHarness } from "./harness-core.js";

declare const require: (id: string) => unknown;

export const { finish, test } = createHarness(require);
