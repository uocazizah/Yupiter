/**
 * Tabel kasus `format` yang dipakai oleh suite CJS (Node.js 9+) dan
 * suite ESM (Node.js >= 12.17). Data murni, tanpa dependensi test runner.
 */

export interface FormatCase {
  readonly name: string;
  readonly template: string;
  readonly args: readonly unknown[];
  readonly expected: string;
}

export const formatCases: readonly FormatCase[] = [
  // --- teks biasa & escape -------------------------------------------------
  { name: "teks polos", template: "halo dunia", args: [], expected: "halo dunia" },
  { name: "template kosong", template: "", args: [], expected: "" },
  { name: "%% jadi satu persen", template: "100%% benar", args: [], expected: "100% benar" },
  { name: "% di akhir string", template: "abc%", args: [], expected: "abc%" },
  { name: "% tanpa konversi di tengah", template: "abc%5", args: [], expected: "abc%5" },
  { name: "escape newline", template: "a\\nb", args: [], expected: "a\nb" },
  { name: "escape tab", template: "a\\tb", args: [], expected: "a\tb" },
  { name: "escape carriage return", template: "a\\rb", args: [], expected: "a\rb" },
  { name: "escape nol", template: "a\\0b", args: [], expected: "a\u0000b" },
  { name: "escape backslash", template: "a\\\\b", args: [], expected: "a\\b" },
  { name: "escape hex", template: "\\x1b[1mmerah", args: [], expected: "\u001b[1mmerah" },
  { name: "escape hex tidak valid dipertahankan", template: "\\xZZ", args: [], expected: "\\xZZ" },
  { name: "escape tak dikenal dipertahankan", template: "\\q", args: [], expected: "\\q" },
  { name: "backslash di akhir string", template: "abc\\", args: [], expected: "abc\\" },

  // --- %s ------------------------------------------------------------------
  { name: "%s dengan string", template: "%s", args: ["halo"], expected: "halo" },
  { name: "%s dengan number", template: "%s", args: [42], expected: "42" },
  { name: "%s dengan boolean", template: "%s", args: [true], expected: "true" },
  { name: "%s dengan undefined", template: "%s", args: [undefined], expected: "undefined" },
  { name: "%s dengan null", template: "%s", args: [null], expected: "null" },
  { name: "%s dengan object", template: "%s", args: [{ a: 1 }], expected: "[object Object]" },
  { name: "%s dengan symbol", template: "%s", args: [Symbol("kode")], expected: "Symbol(kode)" },
  { name: "%s presisi memotong", template: "%.2s", args: ["halo dunia"], expected: "ha" },
  {
    name: "%s presisi memotong per code point",
    template: "%.2s",
    args: ["日本語"],
    expected: "日本",
  },
  { name: "%s lebar rata kanan", template: "%5s", args: ["ab"], expected: "   ab" },
  { name: "%s lebar rata kiri", template: "%-5s|", args: ["ab"], expected: "ab   |" },
  {
    name: "%s lebar dihitung per code point",
    template: "%5s",
    args: ["日本"],
    expected: "   日本",
  },
  { name: "%s flag nol diabaikan", template: "%05s", args: ["ab"], expected: "   ab" },

  // --- %d ------------------------------------------------------------------
  { name: "%d membuang bagian desimal", template: "%d", args: [3.7], expected: "3" },
  { name: "%d bilangan negatif", template: "%d", args: [-3.7], expected: "-3" },
  { name: "%d nol", template: "%d", args: [0], expected: "0" },
  { name: "%d dari string numerik", template: "%d", args: ["42"], expected: "42" },
  { name: "%d dari string non numerik", template: "%d", args: ["abc"], expected: "NaN" },
  { name: "%d dari undefined", template: "%d", args: [undefined], expected: "NaN" },
  { name: "%d dari boolean", template: "%d", args: [true], expected: "1" },
  { name: "%d presisi = digit minimum", template: "%.3d", args: [7], expected: "007" },
  { name: "%d presisi negatif", template: "%.3d", args: [-7], expected: "-007" },
  { name: "%d presisi lebih panjang dari angka", template: "%.5d", args: [42], expected: "00042" },
  { name: "%d lebar", template: "%5d", args: [42], expected: "   42" },
  { name: "%d padding nol", template: "%05d", args: [42], expected: "00042" },
  { name: "%d padding nol negatif", template: "%05d", args: [-42], expected: "-0042" },
  { name: "%d rata kiri", template: "%-5d|", args: [42], expected: "42   |" },

  // --- %f ------------------------------------------------------------------
  { name: "%f default enam desimal", template: "%f", args: [1.5], expected: "1.500000" },
  { name: "%f presisi dua", template: "%.2f", args: [1.239], expected: "1.24" },
  { name: "%f presisi nol ikut membulatkan", template: "%.0f", args: [2.5], expected: "3" },
  { name: "%f negatif dengan padding nol", template: "%08.2f", args: [-1.5], expected: "-0001.50" },
  { name: "%f lebar dan presisi", template: "%10.3f|", args: [2.75], expected: "     2.750|" },
  { name: "%f rata kiri", template: "%-8.2f|", args: [2.75], expected: "2.75    |" },
  { name: "%f NaN", template: "%f", args: [Number.NaN], expected: "NaN" },
  { name: "%f Infinity", template: "%f", args: [Infinity], expected: "Infinity" },
  { name: "%f -Infinity", template: "%f", args: [-Infinity], expected: "-Infinity" },
  { name: "%f dari string numerik", template: "%f", args: ["2.5"], expected: "2.500000" },
  { name: "%f negatif kecil", template: "%f", args: [-0.5], expected: "-0.500000" },

  // --- %j ------------------------------------------------------------------
  { name: "%j object", template: "%j", args: [{ a: 1 }], expected: '{"a":1}' },
  { name: "%j array", template: "%j", args: [[1, "x"]], expected: '[1,"x"]' },
  { name: "%j string", template: "%j", args: ["hi"], expected: '"hi"' },
  { name: "%j undefined", template: "%j", args: [undefined], expected: "undefined" },
  { name: "%j null", template: "%j", args: [null], expected: "null" },
  { name: "%j lebar", template: "%10j|", args: [[1]], expected: "       [1]|" },

  // --- pencampuran & penanganan argumen ------------------------------------
  { name: "beberapa argumen", template: "%s = %d", args: ["umur", 30], expected: "umur = 30" },
  { name: "argumen kurang dipertahankan", template: "%s %s", args: ["a"], expected: "a %s" },
  { name: "argumen berlebih diabaikan", template: "%s!", args: ["a", "b"], expected: "a!" },
  {
    name: "spesifier tak dikenal tidak mengonsumsi argumen",
    template: "%q %s",
    args: ["a"],
    expected: "%q a",
  },
  {
    name: "escape dan spesifier campur",
    template: "baris: %s\\n",
    args: ["x"],
    expected: "baris: x\n",
  },
  { name: "lebar dan presisi bersamaan", template: "%7.3s|", args: ["halo"], expected: "    hal|" },
];
