"use strict";

/**
 * Runner test Yupiter — dijalankan di Node.js 9 s/d terbaru.
 *
 * - Suite CJS: selalu dijalankan. Di Node.js 18+ dijalankan lewat `node --test`
 *   (test runner bawaan Node); di Node.js 9-16 dijalankan di proses ini dengan
 *   harness yang otomatis memakai `assert` biasa.
 * - Suite ESM: hanya dijalankan di Node.js >= 12.17, selalu lewat child process
 *   supaya file ESM tidak pernah diparse oleh Node.js versi lama.
 */

const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function nodeMajor() {
  return Number(process.versions.node.split(".")[0]);
}

function nodeSupportsTestRunner() {
  return nodeMajor() >= 18;
}

function nodeSupportsEsm() {
  const parts = process.versions.node.split(".");
  return Number(parts[0]) > 12 || (Number(parts[0]) === 12 && Number(parts[1]) >= 17);
}

function testFilesIn(dir) {
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".test.js"))
    .sort()
    .map((name) => path.join(dir, name));
}

function runWithTestRunner(files) {
  const result = childProcess.spawnSync(process.execPath, ["--test", ...files], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status === null ? 1 : result.status);
  }
}

async function runCjsSuite() {
  const files = testFilesIn(path.join(root, "test-build", "cjs"));
  if (nodeSupportsTestRunner()) {
    runWithTestRunner(files);
    return;
  }
  const harness = require(path.join(root, "test-build", "harness.js"));
  for (const file of files) {
    require(file);
  }
  await harness.finish();
}

function runEsmSuite() {
  const files = testFilesIn(path.join(root, "test-build-esm", "esm"));
  if (nodeSupportsTestRunner()) {
    runWithTestRunner(files);
    return;
  }
  const driver = path.join(__dirname, "esm-driver.mjs");
  const result = childProcess.spawnSync(process.execPath, [driver], { cwd: root, stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status === null ? 1 : result.status);
  }
}

console.log(`# yupiter test runner — node ${process.version}`);

runCjsSuite()
  .then(() => {
    if (nodeSupportsEsm()) {
      runEsmSuite();
    } else {
      console.log("# suite ESM dilewati (butuh Node.js >= 12.17)");
    }
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
