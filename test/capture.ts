/**
 * Utilitas untuk menangkap tulisan ke stream keluaran tanpa mengotori
 * laporan test.
 */

export interface Capture {
  readonly text: string;
  readonly bytes: number;
}

export function captureWrite(stream: NodeJS.WriteStream, run: () => number): Capture {
  const original = stream.write;
  let text = "";

  stream.write = ((chunk: string | Uint8Array) => {
    if (typeof chunk === "string") {
      text += chunk;
    }
    return true;
  }) as unknown as typeof stream.write;

  try {
    return { bytes: run(), text };
  } finally {
    stream.write = original;
  }
}
