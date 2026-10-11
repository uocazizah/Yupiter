/**
 * Harness test ganda:
 *
 * - Bila `node:test` tersedia (Node.js 18+), delegasikan ke sana sehingga
 *   laporan TAP dan exit code ditangani oleh test runner bawaan Node.
 * - Bila tidak (Node.js 9-16), jalankan antrean test secara sekuensial
 *   dengan `assert` dan set `process.exitCode` sendiri.
 */

export type TestFn = () => void | Promise<void>;

export interface Harness {
  readonly test: (name: string, fn: TestFn) => void;
  /** Selesaikan semua test yang terdaftar. Tidak berarti bila memakai `node:test`. */
  readonly finish: () => Promise<void>;
}

interface NodeTestModule {
  readonly test: (name: string, fn: TestFn) => unknown;
}

export function createHarness(nodeRequire: (id: string) => unknown): Harness {
  let nodeTest: NodeTestModule | null = null;
  try {
    const loaded: unknown = nodeRequire("node:test");
    // Modul node:test bisa berupa function (Node versi baru) maupun object.
    if (
      loaded !== null &&
      loaded !== undefined &&
      typeof (loaded as NodeTestModule).test === "function"
    ) {
      nodeTest = loaded as NodeTestModule;
    }
  } catch (_error) {
    nodeTest = null;
  }

  if (nodeTest !== null) {
    const runner = nodeTest;
    const pending: unknown[] = [];
    return {
      test: (name, fn) => {
        // node:test mengembalikan promise yang selesai ketika test selesai.
        pending.push(runner.test(name, fn));
      },
      // Tunggu semua test node:test selesai sebelum suite berikutnya dijalankan,
      // supaya laporan tidak tercampur dan kegagalan tetap terhitung.
      finish: async () => {
        await Promise.all(pending);
      },
    };
  }

  const queue: Array<{ name: string; fn: TestFn }> = [];
  let passed = 0;
  let failed = 0;

  return {
    test: (name, fn) => {
      queue.push({ name, fn });
    },
    finish: async () => {
      for (const item of queue) {
        try {
          await item.fn();
          passed += 1;
          process.stdout.write(`ok - ${item.name}\n`);
        } catch (error) {
          failed += 1;
          const detail =
            error instanceof Error && error.stack !== undefined ? error.stack : String(error);
          process.stdout.write(`not ok - ${item.name}\n${detail}\n`);
        }
      }
      process.stdout.write(`# fallback runner (assert): ${passed} lulus, ${failed} gagal\n`);
      if (failed > 0) {
        process.exitCode = 1;
      }
    },
  };
}
