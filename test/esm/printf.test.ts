import assert from "assert";

import { eprintf, format, printf } from "../../dist/esm/index.js";
import { captureWrite } from "../capture.js";
import { formatCases } from "../cases.js";
import { test } from "./harness.js";

for (const item of formatCases) {
  test(`esm format: ${item.name}`, () => {
    assert.strictEqual(format(item.template, ...item.args), item.expected);
  });
}

test("esm %j pada objek sirkular melempar TypeError seperti JSON.stringify", () => {
  const circular: { self?: unknown } = {};
  circular.self = circular;
  assert.throws(() => format("%j", circular), TypeError);
});

test("esm printf menulis ke stdout dan mengembalikan jumlah byte", () => {
  const captured = captureWrite(process.stdout, () => printf("halo %s", "dunia"));
  assert.strictEqual(captured.text, "halo dunia");
  assert.strictEqual(captured.bytes, 10);
  assert.strictEqual(captureWrite(process.stdout, () => printf("日本")).bytes, 6);
});

test("esm eprintf menulis ke stderr", () => {
  const captured = captureWrite(process.stderr, () => eprintf("galat: %d", 500));
  assert.strictEqual(captured.text, "galat: 500");
  assert.strictEqual(captured.bytes, 10);
});
