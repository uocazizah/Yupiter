"use strict";

/**
 * Uji wiring `package.json` (field `main` dan `exports`) di semua versi Node.
 *
 * Caranya: salin `dist` + `package.json` ke sebuah `node_modules/yupiter`
 * tiruan, lalu jalankan skrip yang melakukan `require("yupiter")`
 * dan (di Node >= 12.17) `import("yupiter")`. Dengan begitu resolusi paket
 * diuji sungguhan tanpa perlu `npm install` (npm bawaan Node 9 tidak
 * bisa memakai lockfile modern).
 */

const childProcess = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = path.join(__dirname, "..");

function mkdirpSync(dir) {
  const parent = path.dirname(dir);
  if (parent !== dir && !fs.existsSync(parent)) {
    mkdirpSync(parent);
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

function rimrafSync(target) {
  if (!fs.existsSync(target)) {
    return;
  }
  if (fs.statSync(target).isDirectory()) {
    for (const entry of fs.readdirSync(target)) {
      rimrafSync(path.join(target, entry));
    }
    fs.rmdirSync(target);
    return;
  }
  fs.unlinkSync(target);
}

function copyDirSync(from, to) {
  mkdirpSync(to);
  for (const entry of fs.readdirSync(from)) {
    const source = path.join(from, entry);
    const destination = path.join(to, entry);
    if (fs.statSync(source).isDirectory()) {
      copyDirSync(source, destination);
    } else {
      fs.copyFileSync(source, destination);
    }
  }
}

function nodeSupportsEsm() {
  const parts = process.versions.node.split(".");
  const major = Number(parts[0]);
  const minor = Number(parts[1]);
  return major > 12 || (major === 12 && minor >= 17);
}

const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "yupiter-exports-"));
const packageDir = path.join(workspace, "node_modules", "yupiter");

mkdirpSync(packageDir);
fs.copyFileSync(path.join(root, "package.json"), path.join(packageDir, "package.json"));
copyDirSync(path.join(root, "dist"), path.join(packageDir, "dist"));

const commonChecks = [
  'if (typeof yupiter.format !== "function") throw new Error("format tidak ditemukan");',
  'if (typeof yupiter.printf !== "function") throw new Error("printf tidak ditemukan");',
  'if (typeof yupiter.eprintf !== "function") throw new Error("eprintf tidak ditemukan");',
  'if (yupiter.format("%s-%d", "a", 2) !== "a-2") throw new Error("format menghasilkan output salah");',
];

const cjsCheckPath = path.join(workspace, "check.js");
fs.writeFileSync(
  cjsCheckPath,
  [
    '"use strict";',
    'const yupiter = require("yupiter");',
    ...commonChecks,
    'const bytes = yupiter.printf("");',
    'if (bytes !== 0) throw new Error("jumlah byte salah: " + bytes);',
    'process.stdout.write("ok - require(yupiter) di " + process.version + "\\n");',
    "",
  ].join("\n"),
);

try {
  childProcess.execFileSync(process.execPath, [cjsCheckPath], { cwd: workspace, stdio: "inherit" });
} catch (error) {
  console.error(`gagal: require("yupiter") di ${process.version}`);
  console.error(error);
  rimrafSync(workspace);
  process.exit(1);
}

if (nodeSupportsEsm()) {
  const esmCheckPath = path.join(workspace, "check.mjs");
  fs.writeFileSync(
    esmCheckPath,
    [
      'import { eprintf, format, printf } from "yupiter";',
      ...commonChecks.map((line) => line.replace("yupiter.", "")),
      'const bytes = printf("");',
      'if (bytes !== 0) throw new Error("jumlah byte salah: " + bytes);',
      'if (typeof eprintf !== "function") throw new Error("eprintf tidak ditemukan");',
      'process.stdout.write("ok - import(yupiter) di " + process.version + "\\n");',
      "",
    ].join("\n"),
  );

  try {
    childProcess.execFileSync(process.execPath, [esmCheckPath], {
      cwd: workspace,
      stdio: "inherit",
    });
  } catch (error) {
    console.error(`gagal: import("yupiter") di ${process.version}`);
    console.error(error);
    rimrafSync(workspace);
    process.exit(1);
  }
} else {
  console.log(`# pemindaian ESM dilewati di ${process.version} (butuh Node.js >= 12.17)`);
}

rimrafSync(workspace);
