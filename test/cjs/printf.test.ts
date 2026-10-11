import assert from "assert";

import { eprintf, format, printf } from "../../dist/cjs/index.js";
import { captureWrite } from "../capture.js";
import { formatCases } from "../cases.js";
import { test } from "../harness.js";

for (const item of formatCases) {
  test(`format: ${item.name}`, () => {
    assert.strictEqual(format(item.template, ...item.args), item.expected);
  });
}

test("%j pada objek sirkular melempar TypeError seperti JSON.stringify", () => {
  const circular: { self?: unknown } = {};
  circular.self = circular;
  assert.throws(() => format("%j", circular), TypeError);
});

test("format tidak menulis apa pun ke stdout", () => {
  const captured = captureWrite(process.stdout, () => {
    format("%s %d", "abc", 1);
    return -1;
  });
  assert.strictEqual(captured.text, "");
});

test("printf menulis hasil format ke stdout", () => {
  const captured = captureWrite(process.stdout, () => printf("halo %s", "dunia"));
  assert.strictEqual(captured.text, "halo dunia");
  assert.strictEqual(captured.bytes, 10);
});

test("printf menghitung byte UTF-8, bukan jumlah karakter", () => {
  assert.strictEqual(captureWrite(process.stdout, () => printf("日本")).bytes, 6);
  assert.strictEqual(captureWrite(process.stdout, () => printf("😀")).bytes, 4);
});

test("printf template kosong menulis apa-apa dan mengembalikan nol", () => {
  const captured = captureWrite(process.stdout, () => printf(""));
  assert.strictEqual(captured.text, "");
  assert.strictEqual(captured.bytes, 0);
});

test("eprintf menulis ke stderr", () => {
  const captured = captureWrite(process.stderr, () => eprintf("galat: %d", 500));
  assert.strictEqual(captured.text, "galat: 500");
  assert.strictEqual(captured.bytes, 10);
});
