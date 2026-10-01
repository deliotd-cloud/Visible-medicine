import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { build } from './workspace-test-build.mjs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
export async function bodyReviewDisplayPinsReport() {
  const compiled = await build({
    stdin: {
      contents:
        "export * from './lib/body-review-material.ts'; export * from './lib/body-review-display-evidence.ts';",
      resolveDir: process.cwd(),
      loader: 'ts',
    },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
  });
  const api = await import(
    'data:text/javascript;base64,' +
      Buffer.from(compiled.outputFiles[0].text).toString('base64')
  );
  const pins = api.bodyReviewSummaries
    .map((row) => ({
      structureId: row.id,
      sha256: createHash('sha256')
        .update(
          api.bodyReviewDisplayPreimage(api.bodyReviewSnapshot(row.id), row.id),
        )
        .digest('hex'),
    }))
    .sort((a, b) => a.structureId.localeCompare(b.structureId));
  assert.equal(new Set(pins.map((pin) => pin.structureId)).size, pins.length);
  const report = {
    schema: api.bodyReviewDisplayPinSchema,
    scope: 'body-display-catalog',
    algorithm: 'SHA-256',
    evidenceFields: api.bodyReviewDisplayFields,
    pins,
  };
  const output = JSON.stringify(report, null, 2) + '\n';
  return { report, output };
}
const destination = 'content/body-review-display-pins.json';
export async function checkBodyReviewDisplayPins() {
  const { output, report } = await bodyReviewDisplayPinsReport();
  assert.equal(
    (await readFile(destination, 'utf8')).replaceAll('\r\n', '\n'),
    output,
    'Review display pins are stale; regenerate from trusted source before building',
  );
  console.log(
    JSON.stringify({
      worksheets: report.pins.length,
      bytes: Buffer.byteLength(output),
      mode: 'checked',
    }),
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (process.argv.includes('--check')) await checkBodyReviewDisplayPins();
  else {
    const { report, output } = await bodyReviewDisplayPinsReport();
    await writeFile(destination, output);
    console.log(
      JSON.stringify({
        worksheets: report.pins.length,
        bytes: Buffer.byteLength(output),
        mode: 'generated',
      }),
    );
  }
}
