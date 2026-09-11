import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  lowerLimbMotorBindings as bindings,
  lowerLimbMotorRegions as regions,
  lowerLimbMotorExcluded as excluded,
} from '../content/lower-limb-motor.ts';
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(
  createHash('sha256').update(raw).digest('hex'),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const catalog = JSON.parse(raw);
const muscles = catalog.structures.filter(
  (s) => s.system === 'muscles' && s.regions.some((r) => regions.includes(r)),
);
assert.equal(muscles.length, 121);
assert.equal(bindings.length, 120);
assert.equal(
  new Set(bindings.map((b) => b.nerve + '|' + b.fmaId)).size,
  bindings.length,
);
assert.deepEqual(
  [...new Set(bindings.map((b) => b.fmaId))].sort(),
  muscles
    .filter((s) => !excluded.includes(s.fmaId))
    .map((s) => s.fmaId)
    .sort(),
);
assert.deepEqual(
  muscles
    .filter((s) => excluded.includes(s.fmaId))
    .map((s) => s.fmaId)
    .sort(),
  [...excluded].sort(),
);
const entries = catalog.structures.filter(
  (s) =>
    ['muscles', 'skeleton'].includes(s.system) &&
    s.regions.some((r) => regions.includes(r)),
);
const pins = {
  sourceCommit: 'bc3866d3ec33aeb16d02335b9d1b5076ba9182b9',
  sourceVersion: catalog.sourceVersion,
  license: catalog.license,
  coordinateSystem: catalog.coordinateSystem,
  bundles: catalog.bundles.filter((b) =>
    entries.some((s) => s.bundle === b.id),
  ),
  entries,
};
const file = 'content/lower-limb-motor-pins.json',
  output = JSON.stringify(pins, null, 2) + '\n';
if (process.argv.includes('--check'))
  assert.equal((await readFile(file, 'utf8')).replace(/\r\n/g, '\n'), output);
else {
  await assert.rejects(
    access(file),
    'Never overwrite admitted source pins implicitly',
  );
  await writeFile(file, output);
}
console.log(
  JSON.stringify({
    muscleSelections: 118,
    relationships: bindings.length,
    excludedPelvicRecords: excluded.length,
    pinnedContextAndMuscles: entries.length,
    check: process.argv.includes('--check'),
  }),
);
