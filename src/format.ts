/**
 * Parser format string dan formatter ala C `printf`.
 *
 * Spesifier yang didukung: `%s`, `%d`, `%f`, `%j`, dan `%%`,
 * dengan flag `-` (rata kiri) dan `0` (padding nol), lebar (`%5s`),
 * dan presisi (`%.2f`). Escape yang didukung: `\\`, `\n`, `\r`, `\t`,
 * `\0`, dan `\xHH`.
 *
 * Modul ini bebas API Node.js — tidak ada I/O di sini.
 */

/** Spesifier hasil parsing, mis. `%5.2f`. */
interface Specifier {
  /** Teks mentah spesifier, dipakai ulang saat spesifier tidak dikenal. */
  readonly raw: string;
  /** Karakter konversi (`s`, `d`, `f`, `j`, `%`); string kosong bila tidak ada. */
  readonly conversion: string;
  readonly leftAlign: boolean;
  readonly zeroPad: boolean;
  readonly width: number | null;
  readonly precision: number | null;
}

/** Hasil parsing satu escape sequence. */
interface EscapeResult {
  readonly value: string;
  /** Indeks karakter setelah escape sequence. */
  readonly next: number;
}

/** Hasil parsing satu spesifier `%`. */
interface SpecifierResult {
  readonly spec: Specifier;
  /** Indeks karakter setelah spesifier. */
  readonly next: number;
}

const ESCAPES: Record<string, string> = {
  "\\": "\\",
  n: "\n",
  r: "\r",
  t: "\t",
  "0": "\0",
};

const KNOWN_CONVERSIONS = "sdfj";

/**
 * Format `template` mengikuti spesifier printf ala C lalu kembalikan hasilnya sebagai string.
 *
 * Perilaku yang perlu diketahui:
 * - Argumen berlebih diabaikan (ala C), bukan ditempel seperti `util.format`.
 * - Argumen kurang: spesifier dicetak utuh, mis. `format("%s %s", "a")` → `"a %s"`.
 * - Spesifier tak dikenal (mis. `%q`) dicetak utuh dan tidak mengonsumsi argumen.
 * - Lebar (`width`) dihitung dalam jumlah code point, bukan byte.
 *
 * @example
 * format("%s pulang %d yang lalu", "Yupiter", 2) // "Yupiter pulang 2 yang lalu"
 */
export function format(template: string, ...args: unknown[]): string {
  const length = template.length;
  let out = "";
  let index = 0;
  let argIndex = 0;

  while (index < length) {
    const char = template.charAt(index);

    if (char === "\\") {
      const sequence = readEscape(template, index);
      out += sequence.value;
      index = sequence.next;
      continue;
    }

    if (char === "%") {
      const parsed = readSpecifier(template, index);
      const spec = parsed.spec;
      index = parsed.next;

      if (spec.conversion === "") {
        // "%" tanpa karakter konversi, mis. di akhir string: cetak apa adanya.
        out += spec.raw;
        continue;
      }
      if (spec.conversion === "%") {
        out += "%";
        continue;
      }
      if (KNOWN_CONVERSIONS.indexOf(spec.conversion) === -1) {
        out += spec.raw;
        continue;
      }

      if (argIndex >= args.length) {
        // Argumen habis: cetak spesifier apa adanya, seperti util.format.
        out += spec.raw;
        continue;
      }

      out += render(spec, args[argIndex]);
      argIndex += 1;
      continue;
    }

    out += char;
    index += 1;
  }

  return out;
}

/** Panjang string dalam satuan code point (bukan UTF-16 code unit). */
function codePointLength(value: string): number {
  return Array.from(value).length;
}

/** Potong `value` maksimum `max` code point. */
function truncateCodePoints(value: string, max: number): string {
  const characters = Array.from(value);
  if (characters.length <= max) {
    return value;
  }
  return characters.slice(0, max).join("");
}

function isDigit(char: string): boolean {
  return char >= "0" && char <= "9";
}

function isHexDigit(char: string): boolean {
  return (
    (char >= "0" && char <= "9") || (char >= "a" && char <= "f") || (char >= "A" && char <= "F")
  );
}

/** Baca escape sequence yang dimulai pada `start` (indeks karakter `\`). */
function readEscape(template: string, start: number): EscapeResult {
  const length = template.length;
  if (start + 1 >= length) {
    // backslash terakhir tanpa pasangan
    return { value: "\\", next: start + 1 };
  }

  const char = template.charAt(start + 1);
  if (char === "x") {
    const high = template.charAt(start + 2);
    const low = template.charAt(start + 3);
    if (isHexDigit(high) && isHexDigit(low)) {
      const code = Number.parseInt(high + low, 16);
      return { value: String.fromCharCode(code), next: start + 4 };
    }
    return { value: "\\x", next: start + 2 };
  }

  const mapped = ESCAPES[char];
  if (mapped !== undefined) {
    return { value: mapped, next: start + 2 };
  }
  return { value: `\\${char}`, next: start + 2 };
}

/** Baca spesifier yang dimulai pada `start` (indeks karakter `%`). */
function readSpecifier(template: string, start: number): SpecifierResult {
  const length = template.length;
  let index = start + 1;
  let leftAlign = false;
  let zeroPad = false;

  while (index < length) {
    const flag = template.charAt(index);
    if (flag === "-") {
      leftAlign = true;
      index += 1;
      continue;
    }
    if (flag === "0") {
      zeroPad = true;
      index += 1;
      continue;
    }
    break;
  }

  let width: number | null = null;
  const widthStart = index;
  while (index < length && isDigit(template.charAt(index))) {
    index += 1;
  }
  if (index > widthStart) {
    width = Number(template.slice(widthStart, index));
  }

  let precision: number | null = null;
  if (template.charAt(index) === ".") {
    index += 1;
    const precisionStart = index;
    while (index < length && isDigit(template.charAt(index))) {
      index += 1;
    }
    precision = index > precisionStart ? Number(template.slice(precisionStart, index)) : 0;
  }

  if (index >= length) {
    return {
      spec: {
        raw: template.slice(start),
        conversion: "",
        leftAlign,
        zeroPad,
        width,
        precision,
      },
      next: index,
    };
  }

  return {
    spec: {
      raw: template.slice(start, index + 1),
      conversion: template.charAt(index),
      leftAlign,
      zeroPad,
      width,
      precision,
    },
    next: index + 1,
  };
}

/** Terapkan lebar (width) dengan padding spasi atau nol sesuai flag. */
function applyWidth(value: string, spec: Specifier, numeric: boolean): string {
  const width = spec.width;
  if (width === null) {
    return value;
  }

  const length = codePointLength(value);
  if (length >= width) {
    return value;
  }

  const fill = width - length;
  if (spec.leftAlign) {
    return value + " ".repeat(fill);
  }
  if (spec.zeroPad && numeric) {
    if (value.charAt(0) === "-") {
      // Tanda minus tetap di depan, nol disisipkan setelahnya.
      return `-${"0".repeat(fill)}${value.slice(1)}`;
    }
    return `${"0".repeat(fill)}${value}`;
  }
  return `${" ".repeat(fill)}${value}`;
}

/** Ubah argumen menjadi string untuk konversi `%s`. */
function toStringValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value === undefined) {
    return "undefined";
  }
  if (value === null) {
    return "null";
  }
  return String(value);
}

/** Ubah argumen menjadi number untuk konversi `%d` dan `%f`. */
function toNumberValue(value: unknown): number {
  return Number(value);
}

/** Render satu spesifier beserta argumennya. */
function render(spec: Specifier, value: unknown): string {
  switch (spec.conversion) {
    case "s": {
      let text = toStringValue(value);
      if (spec.precision !== null) {
        text = truncateCodePoints(text, spec.precision);
      }
      return applyWidth(text, spec, false);
    }
    case "d": {
      const number = toNumberValue(value);
      if (Number.isNaN(number)) {
        return applyWidth("NaN", spec, false);
      }
      if (!Number.isFinite(number)) {
        return applyWidth(number > 0 ? "Infinity" : "-Infinity", spec, false);
      }
      const truncated = Math.trunc(number);
      let text = String(Math.abs(truncated));
      if (spec.precision !== null) {
        text = text.padStart(spec.precision, "0");
      }
      if (truncated < 0) {
        text = `-${text}`;
      }
      return applyWidth(text, spec, true);
    }
    case "f": {
      const number = toNumberValue(value);
      if (Number.isNaN(number)) {
        return applyWidth("NaN", spec, false);
      }
      if (!Number.isFinite(number)) {
        return applyWidth(number > 0 ? "Infinity" : "-Infinity", spec, false);
      }
      const text = number.toFixed(spec.precision === null ? 6 : spec.precision);
      return applyWidth(text, spec, true);
    }
    case "j": {
      const serialized = JSON.stringify(value);
      const text = serialized === undefined ? "undefined" : serialized;
      return applyWidth(text, spec, false);
    }
    default:
      return "";
  }
}
