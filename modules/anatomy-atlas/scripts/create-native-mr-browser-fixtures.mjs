// Synthetic engineering fixtures only: never reads or derives from patient data.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
const directory = realpathSync(resolve(process.argv[2] ?? ''));
assert.ok(process.argv[2], 'Supply an existing directory outside Git repositories');
for (let current = directory; ; current = dirname(current)) {
  assert.ok(!existsSync(join(current, '.git')), 'Fixtures must remain outside Git repositories');
  if (dirname(current) === current) break;
}
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const common = {
  schema: 'vm-native-mr/1', release: 'NOT_FOR_PUBLICATION', modality: 'MR',
  privacyCertified: false, clinicalApproved: false, atlasRegistration: null,
  units: 'stored-MR-signal', order: 'column-row-slice',
  sourceSha256: sha(Buffer.from('Visible Medicine synthetic browser QA; no anatomical or patient content')),
};
const definitions = [
  { name: 'synthetic-anisotropic', header: {
    scalarType: 'uint16', dimensions: [4, 3, 3], spacing: [3, 2],
    directions: [[0, 1, 0], [-1, 0, 0]],
    positions: [[50, 40, 30], [50, 40, 33.6], [50, 40, 37.2]], thickness: 3, window: [0, 35],
  }, values: Uint16Array.from({ length: 36 }, (_, index) => index),
    initial: { slice: 2, column: 3, row: 2, signal: 18, lps: [48, 46, 33.6], aspect: 2, edges: ['A', 'P', 'L', 'R'] } },
  { name: 'synthetic-oblique', header: {
    scalarType: 'int16', dimensions: [8, 6, 5], spacing: [0.7, 1.1],
    directions: [[0.6, 0.8, 0], [0, 0, 1]],
    positions: Array.from({ length: 5 }, (_, k) => [20 + 1.6 * k, -40 - 1.2 * k, 15]), thickness: 1, window: [-120, 119],
  }, values: Int16Array.from({ length: 240 }, (_, index) => index - 120),
    initial: { slice: 3, column: 5, row: 4, signal: 4, lps: [24.88, -40.16, 18.3], aspect: 5.6 / 6.6, edges: ['AR', 'PL', 'I', 'S'] } },
];
const outputs = definitions.map(definition => join(directory, definition.name + '.vmmr'));
const invalidPath = join(directory, 'synthetic-invalid.vmmr'), reportPath = join(directory, 'synthetic-fixture-evidence.json');
for (const path of [...outputs, invalidPath, reportPath]) assert.ok(!existsSync(path), 'Refuse overwrite: ' + path);
const records = definitions.map((definition, index) => {
  const body = Buffer.from(definition.values.buffer);
  const header = Buffer.from(JSON.stringify({ ...common, ...definition.header, bodySha256: sha(body) }));
  const start = Math.ceil((16 + header.length) / 8) * 8, bytes = Buffer.alloc(start + body.length);
  bytes.write('VMMR0001'); bytes.writeUInt32LE(header.length, 8); bytes.writeUInt32LE(body.length, 12);
  header.copy(bytes, 16); body.copy(bytes, start);
  writeFileSync(outputs[index], bytes, { flag: 'wx' });
  return { path: outputs[index], bytes: bytes.length, sha256: sha(bytes), expected: definition.initial };
});
writeFileSync(invalidPath, 'INVALID SYNTHETIC FIXTURE — NOT MRI', { flag: 'wx' });
writeFileSync(reportPath, JSON.stringify({ syntheticOnly: true, records, invalidPath }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ syntheticOnly: true, records, invalidPath, reportPath }));
