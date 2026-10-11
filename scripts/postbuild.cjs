"use strict";

/**
 * Pasang penanda format modul di hasil build:
 *
 * - `dist/cjs/package.json`        → {"type":"commonjs"}
 * - `dist/esm/package.json`        → {"type":"module"}
 * - `test-build/cjs/package.json`  → {"type":"commonjs"}
 * - `test-build/esm/package.json`  → {"type":"module"}
 *
 * Node.js 9 mengabaikan field `type`, jadi penanda ini aman untuk semua versi.
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const flags = process.argv.slice(2);

function mkdirpSync(dir) {
  const parent = path.dirname(dir);
  if (parent !== dir && !fs.existsSync(parent)) {
    mkdirpSync(parent);
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

function writeMarker(dir, type) {
  mkdirpSync(dir);
  fs.writeFileSync(path.join(dir, "package.json"), `${JSON.stringify({ type }, null, 2)}\n`);
}

if (flags.indexOf("--dist") !== -1) {
  writeMarker(path.join(root, "dist", "cjs"), "commonjs");
  writeMarker(path.join(root, "dist", "esm"), "module");
}

if (flags.indexOf("--tests") !== -1) {
  // Suite CJS sengaja tanpa penanda: berada di dalam paket bertipe "commonjs".
  writeMarker(path.join(root, "test-build-esm"), "module");
}
