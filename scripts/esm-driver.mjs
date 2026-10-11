/**
 * Driver suite ESM: impor semua test ESM yang sudah di-compile lalu selesaikan.
 *
 * Hanya dijalankan di Node.js >= 12.17 oleh `scripts/run-tests.cjs`.
 * Sengaja tanpa top-level `await` karena Node.js 12/14.0-14.7 belum mendukungnya.
 */

import fs from "fs";
import { fileURLToPath, pathToFileURL } from "url";

import { finish } from "../test-build-esm/esm/harness.js";

const testDir = fileURLToPath(new URL("../test-build-esm/esm/", import.meta.url));

async function main() {
  const files = fs
    .readdirSync(testDir)
    .filter((name) => name.endsWith(".test.js"))
    .sort();

  for (const file of files) {
    await import(pathToFileURL(`${testDir}${file}`).href);
  }

  await finish();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
