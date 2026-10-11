/**
 * Varian harness ESM: hanya dipakai di Node.js >= 12.17, di mana
 * `module.createRequire` sudah tersedia untuk memuat `node:test`
 * secara opsional (baru ada di Node.js 18).
 */

import { createRequire } from "module";

import { createHarness } from "../harness-core.js";

const nodeRequire = createRequire(import.meta.url);

export const { finish, test } = createHarness(nodeRequire);
