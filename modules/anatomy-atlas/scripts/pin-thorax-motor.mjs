import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { thoraxMotorBindings } from '../content/thorax-motor.ts';
import { thoraxRespiratoryBindings } from '../content/thorax-respiratory-study.ts';

const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(
  createHash('sha256').update(raw).digest('hex'),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
  'BodyParts3D catalog changed; review source before repinning',
);
const catalog = JSON.parse(raw);
const targetIds = ['FMA13295', 'FMA9756', 'FMA9757', 'FMA9758'];
assert.deepEqual(thoraxMotorBindings.map((b) => b.fmaId).sort(), targetIds.sort());
assert.deepEqual(thoraxRespiratoryBindings.map((b) => b.fmaId).sort(), targetIds);
const entries = catalog.structures.filter(
  (s) => s.regions.includes('thorax') && ['muscles', 'skeleton'].includes(s.system),
);
assert.equal(entries.length, 52);
for (const source of thoraxRespiratoryBindings) {
  const matches = entries.filter((s) => s.id === source.id);
  assert.equal(matches.length, 1);
  const [entry] = matches;
  for (const field of ['fmaId', 'bundle', 'nodeName'])
    assert.equal(entry[field], source[field]);
  assert.deepEqual(entry.sources, source.sources);
  assert.equal(entry.laterality, 'midline');
  assert.equal(entry.system, 'muscles');
}
const pins = {
  sourceCommit: '3143a76c24b541473792adb430bf37de5c17d645',
  sourceVersion: catalog.sourceVersion,
  license: catalog.license,
  coordinateSystem: catalog.coordinateSystem,
  bundles: catalog.bundles.filter((b) => entries.some((s) => s.bundle === b.id)),
  entries,
};
const file = 'content/thorax-motor-pins.json';
const output = JSON.stringify(pins, null, 2) + '\n';
if (process.argv.includes('--check'))
  assert.equal(await readFile(file, 'utf8'), output);
else {
  await assert.rejects(access(file), 'Never overwrite source pins implicitly');
  await writeFile(file, output);
}
console.log(JSON.stringify({ targetMuscles: 4, sourceAndSkeletonRecords: entries.length, check: process.argv.includes('--check') }));
