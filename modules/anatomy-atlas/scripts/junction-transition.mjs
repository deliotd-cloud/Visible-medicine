import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
// Historical baseline files remain immutable. Their tests accept precisely
// this audited 2-record / 1-bundle migration, never an arbitrary changed field.
export async function applyJunctionTransition(baseline, catalog) {
  const bytes = (
    await fs.readFile('content/junction-transition.json', 'utf8')
  ).replace(/\r\n/g, '\n');
  assert.equal(
    hash(bytes),
    'a2c223513997814ba1071b7cac34667fc21619dc7baa7584e597588b2556de21',
  );
  const transition = JSON.parse(bytes);
  assert.equal(transition.structures.length, 2);
  assert.equal(transition.bundles.length, 1);
  for (const { before, after } of transition.structures) {
    const old = baseline.structures.find((s) => s.id === before.id);
    assert(old, 'Historical source identity missing');
    assert.deepEqual(
      catalog.structures.find((s) => s.id === after.id),
      after,
      'Only the exact audited transition is permitted',
    );
    if ('sha256' in old) {
      assert.equal(
        old.sha256,
        hash(JSON.stringify(before)),
        'Do not migrate a different historical revision',
      );
      old.sha256 = hash(JSON.stringify(after));
    } else {
      assert.deepEqual(old, before);
      baseline.structures[baseline.structures.indexOf(old)] =
        structuredClone(after);
    }
  }
  for (const { before, after } of transition.bundles) {
    const index = baseline.bundles.findIndex((b) => b.id === before.id);
    assert.deepEqual(baseline.bundles[index], before);
    assert.deepEqual(
      catalog.bundles.find((b) => b.id === after.id),
      after,
    );
    baseline.bundles[index] = structuredClone(after);
  }
}
