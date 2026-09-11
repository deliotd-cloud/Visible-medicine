import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  upperLimbMotorBindings,
  upperLimbMotorRegions,
} from '../content/upper-limb-motor.ts';
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(
  createHash('sha256').update(raw).digest('hex'),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const catalog = JSON.parse(raw);
const muscles = catalog.structures.filter(
  (s) =>
    s.system === 'muscles' &&
    s.regions.some((r) => upperLimbMotorRegions.includes(r)),
);
assert.equal(muscles.length, 102);
assert.equal(upperLimbMotorBindings.length, 112);
assert.deepEqual(
  [...new Set(upperLimbMotorBindings.map((b) => b.fmaId))].sort(),
  muscles.map((s) => s.fmaId).sort(),
);
assert.equal(
  new Set(upperLimbMotorBindings.map((b) => b.nerve + '|' + b.fmaId)).size,
  112,
);
const entries = catalog.structures.filter(
  (s) =>
    ['muscles', 'skeleton'].includes(s.system) &&
    s.regions.some((r) => upperLimbMotorRegions.includes(r)),
);
const pins = {
  sourceCommit: '3143a76c24b541473792adb430bf37de5c17d645',
  sourceVersion: catalog.sourceVersion,
  license: catalog.license,
  coordinateSystem: catalog.coordinateSystem,
  bundles: catalog.bundles.filter((b) =>
    entries.some((s) => s.bundle === b.id),
  ),
  entries,
};
const file = 'content/upper-limb-motor-pins.json',
  output = JSON.stringify(pins, null, 2) + '\n';
if (process.argv.includes('--check'))
  assert.equal(await readFile(file, 'utf8'), output);
else {
  await assert.rejects(
    access(file),
    'Never overwrite admitted source pins implicitly',
  );
  await writeFile(file, output);
}
console.log(
  JSON.stringify({
    muscles: muscles.length,
    relationships: upperLimbMotorBindings.length,
    pinnedContextAndMuscles: entries.length,
    check: process.argv.includes('--check'),
  }),
);
