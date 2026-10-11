# Yupiter

[![CI](https://github.com/uocazizah/Yupiter/actions/workflows/ci.yml/badge.svg)](https://github.com/uocazizah/Yupiter/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/yupiter.svg)](https://www.npmjs.com/package/yupiter)
[![Node.js](https://img.shields.io/node/v/yupiter.svg)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Standard-library-style utilities for Node.js. Yupiter grows one small, well-tested
module at a time — the first one is printf-style output.

- **Zero runtime dependencies.**
- **ESM and CommonJS** from a single TypeScript source.
- **Node.js 9 and up**, verified on every release line from 9 to the latest in CI.

```js
const { printf } = require("yupiter");

printf("Halo, %s! Kamu punya %d pesan.\n", "dunia", 3);
// Halo, dunia! Kamu punya 3 pesan.
```

## Install

```bash
npm install yupiter
```

## Usage

Both module systems are supported. Pick whichever your project uses:

```js
// CommonJS
const { format, printf, eprintf } = require("yupiter");
```

```js
// ESM
import { eprintf, format, printf } from "yupiter";
```

## API

### `format(template, ...args)`

Returns the formatted string. Performs no I/O, so it is safe to use anywhere.

```js
format("%s pulang %d bulan yang lalu.", "Yupiter", 2);
// "Yupiter pulang 2 bulan yang lalu."
```

### `printf(template, ...args)`

Formats, writes the result to **stdout**, and returns the number of **UTF-8 bytes**
written — the same contract as C's `printf`.

```js
const bytes = printf("%6.2f|\n", 3.14159);
// "  3.14|" written to stdout
console.log(bytes); // 8
```

### `eprintf(template, ...args)`

Same as `printf`, but writes to **stderr**. Handy for logging errors without
polluting stdout:

```js
eprintf("gagal membaca %s: error %d\n", file, status);
```

## Format specifiers

Yupiter supports a focused subset of the C syntax, plus width and precision.

| Specifier | Meaning                       | Example                        | Output         |
| --------- | ----------------------------- | ------------------------------ | -------------- |
| `%s`      | string                        | `format("%s", 42)`             | `"42"`         |
| `%d`      | integer (truncated)           | `format("%d", 3.7)`            | `"3"`          |
| `%f`      | float, default 6 decimals     | `format("%f", 1.5)`            | `"1.500000"`   |
| `%j`      | `JSON.stringify`              | `format("%j", { a: 1 })`       | `'{"a":1}'`    |
| `%%`      | a literal percent sign        | `format("100%%")`              | `"100%"`       |

### Flags, width, and precision

| Syntax    | Meaning                                             | Example                       | Output       |
| --------- | --------------------------------------------------- | ----------------------------- | ------------ |
| `%5s`     | minimum width, padded with spaces on the left       | `format("%5s", "ab")`         | `"   ab"`    |
| `%-5s`    | left-align within the width                         | `format("%-5s\|", "ab")`      | `"ab   \|"`  |
| `%05d`    | pad with zeros (numbers only)                       | `format("%05d", 42)`          | `"00042"`    |
| `%.2f`    | precision (decimals for `%f`)                       | `format("%.2f", 3.14159)`     | `"3.14"`     |
| `%.3d`    | precision as a minimum number of digits             | `format("%.3d", 7)`           | `"007"`      |
| `%.2s`    | precision as a maximum length for `%s`              | `format("%.2s", "halo")`      | `"ha"`       |

Zero-padding keeps the sign in front, exactly like C:

```js
format("%08.2f", -1.5); // "-0001.50"
```

### Escape sequences

| Escape  | Meaning            |
| ------- | ------------------ |
| `\\`    | a backslash        |
| `\n`    | line feed          |
| `\r`    | carriage return    |
| `\t`    | tab                |
| `\0`    | NUL                |
| `\xHH`  | byte from hex, e.g. `\x1b` for ANSI escape |

```js
printf("\x1b[1m%s\x1b[0m\n", "tebal"); // bold text in supporting terminals
```

Any other escape (for example `\q`) is printed literally, backslash included.

## Behavior worth knowing

These rules keep output predictable and match C, where `util.format` would do
something different:

- **Extra arguments are ignored**, not appended:
  `format("%s", "a", "b")` → `"a"`.
- **Missing arguments print the specifier verbatim**:
  `format("%s %s", "a")` → `"a %s"`.
- **Unknown specifiers are printed verbatim** and consume no argument:
  `format("%q %s", "a")` → `"%q a"`.
- **Width is counted in code points**, not bytes and not UTF-16 units, so
  padding looks right for non-ASCII text:
  `format("%5s", "日本")` → `"   日本"`.
- **The return value of `printf`/`eprintf` is a byte count** (`Buffer.byteLength`),
  which is what C counts:
  `printf("日本")` returns `6`.
- `%j` on a circular structure throws `TypeError`, exactly like calling
  `JSON.stringify` yourself.
- `%s` uses `String(value)` — no `util.inspect`, so output does not change
  between Node.js versions.

## Compatibility

| Module system | Minimum Node.js |
| ------------- | --------------- |
| CommonJS (`require`) | **9** |
| ESM (`import`) | **12.17** |

Node.js 9 does not understand the `exports` field, so it resolves the package
through `main` to the CommonJS build. Starting with Node.js 12.17 (and in every
bundler), the `exports` map routes `import` to the ESM build. Both builds are
generated from the same source and ship their own TypeScript declarations.

The library targets ES2017 and deliberately avoids APIs that do not exist in old
Node.js (`Array.prototype.flat`, `Object.fromEntries`, `String.prototype.replaceAll`,
`globalThis`, and friends). These are rejected at compile time by `lib: ES2017`
and at lint time by rules in `biome.json`.

## Development

```bash
npm ci            # install dev dependencies (TypeScript, Biome, @types/node)
npm run lint      # biome check
npm run build     # dist/cjs + dist/esm + .d.ts
npm run typecheck # tsc --noEmit
npm test          # build + run the full suite
```

Tests are written in TypeScript and compiled before running:

- **Node.js 18+** uses the built-in `node:test` runner.
- **Node.js 9-16** automatically falls back to a small `assert`-based runner
  (see `test/harness-core.ts`), so the same suite runs everywhere.
- The ESM suite only runs on Node.js >= 12.17, in a separate child process so
  that old Node.js versions never even parse ESM files.
- `scripts/check-exports.cjs` verifies that `require("yupiter")` and
  `import("yupiter")` really resolve through the published `package.json`.

Continuous integration (`.github/workflows/ci.yml`) runs the quality gate on
Node.js 24 and 26, then re-runs the built output on Node.js
9, 10, 12, 14, 16, 18, 20, 22, 24, and 26.

## License

[MIT](LICENSE) © Uoc Azizah
