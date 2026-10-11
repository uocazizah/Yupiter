"use strict";

/**
 * Hapus direktori build. Sengaja ditulis tanpa API Node modern
 * (tanpa fs.rmSync) supaya bisa dijalankan di Node.js mana pun.
 */

const fs = require("fs");
const path = require("path");

function rimrafSync(target) {
  if (!fs.existsSync(target)) {
    return;
  }
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(target)) {
      rimrafSync(path.join(target, entry));
    }
    fs.rmdirSync(target);
    return;
  }
  fs.unlinkSync(target);
}

const root = path.join(__dirname, "..");
rimrafSync(path.join(root, "dist"));
rimrafSync(path.join(root, "test-build"));
rimrafSync(path.join(root, "test-build-esm"));
