import assert, {deepEqual} from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';

const parentCommit = 'ff5ff41986f2d87e6b1ecb4d572fb811510461fb';
const path = 'public/models/bodyparts3d/full-body/catalog.json';
const bytes = readFileSync(path, 'utf8');
assert.equal(bytes, execFileSync('git', ['show', `${parentCommit}:${path}`], {encoding: 'utf8', maxBuffer: 32e6}), 'No source substitution');
const catalog = JSON.parse(bytes);
const correctionPath = 'public/models/bodyparts3d/celiac-display/display-correction.json';
const correctionBytes = readFileSync(correctionPath, 'utf8');
assert.equal(correctionBytes, execFileSync('git', ['show', `${parentCommit}:${correctionPath}`], {encoding: 'utf8', maxBuffer: 32e6}), 'No display correction substitution');
const correction = JSON.parse(correctionBytes);
assert.equal(correction.version, 1);
deepEqual(correction.coordinateSystem, catalog.coordinateSystem);
const targets = [
  ['celiac-artery', 'FMA50737', 'unspecified'],
  ['superior-mesenteric-artery', 'FMA14749', 'midline'],
  ['inferior-mesenteric-artery', 'FMA14750', 'unspecified'],
  ['hepatic-portal-vein', 'FMA50735', 'unspecified'],
  ['abdominal-aorta', 'FMA3789', 'midline'],
  ['inferior-vena-cava', 'FMA10951', 'unspecified'],
];
const entries = targets.map(([slug, fma, side]) => {
  const matches = catalog.structures.filter(s => s.id === `vm:anatomy:body:abdomen:${side}:vessel:${slug}` && s.fmaId === fma);
  assert.equal(matches.length, 1, `Expected one complete source identity for ${slug}`);
  const raw = matches[0];
  if (slug === 'celiac-artery') {
    deepEqual(correction.original, raw, 'Display correction must start from the exact raw celiac identity');
    deepEqual(correction.originalBundle, catalog.bundles.find(b => b.id === raw.bundle));
    deepEqual(correction.replacement, {...raw, bundle: correction.bundle.id}, 'Only the corrected display bundle may differ');
    assert.equal(correction.bundle.structures, 1);
  }
  const identity = slug === 'celiac-artery' ? correction.replacement : raw;
  assert.equal(identity.sourceTree, 'isa');
  assert.equal(identity.region, 'abdomen');
  assert.equal(identity.bundle, slug === 'celiac-artery' ? correction.bundle.id : 'abdomen-vessels-recovery');
  assert.ok(identity.sources.length > 0);
  return {key: `abdominal-vessel-${slug}`, identity};
});
assert.equal(new Set(entries.map(e => e.identity.id)).size, 6);
const data = {
  parentCommit,
  sourceVersion: catalog.sourceVersion,
  coordinateSystem: catalog.coordinateSystem,
  bundles: [
    ...catalog.bundles.filter(b => entries.some(e => e.identity.bundle === b.id)),
    correction.bundle,
  ],
  entries,
};
const output = JSON.stringify(data, null, 2) + '\n';
const target = 'content/abdominal-vessel-reasoning-pins.json';
if (process.argv.includes('--check')) assert.equal(readFileSync(target, 'utf8'), output);
else writeFileSync(target, output);
console.log('6 complete abdominal vessel display identities pinned; celiac correction retained; anatomy unchanged');
