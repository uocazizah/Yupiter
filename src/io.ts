/**
 * I/O printf: menulis hasil `format` ke stdout/stderr dan mengembalikan
 * jumlah byte UTF-8 yang ditulis, seperti `printf` di C.
 */

import { format } from "./format.js";

/** Tipe minimal untuk stream keluaran (hanya butuh `write`). */
interface Writable {
  write(chunk: string): boolean;
}

/**
 * Format `template` lalu tulis hasilnya ke stdout.
 *
 * @returns Jumlah byte UTF-8 yang ditulis.
 *
 * @example
 * printf("%s pulang %d yang lalu\n", "Yupiter", 2); // 22
 */
export function printf(template: string, ...args: unknown[]): number {
  return writeTo(process.stdout, template, args);
}

/**
 * Format `template` lalu tulis hasilnya ke stderr.
 *
 * @returns Jumlah byte UTF-8 yang ditulis.
 */
export function eprintf(template: string, ...args: unknown[]): number {
  return writeTo(process.stderr, template, args);
}

function writeTo(stream: Writable, template: string, args: unknown[]): number {
  const text = format(template, ...args);
  stream.write(text);
  return Buffer.byteLength(text, "utf8");
}
