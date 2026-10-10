// Pin existing complete display identities; never change source geometry.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const parentCommit = '456e6d7358e0648b8d7bc8f0f706a4c74f14c5bd';
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const catalogBytes = readFileSync(catalogPath, 'utf8');
assert.equal(catalogBytes, execFileSync('git', ['show', `${parentCommit}:${catalogPath}`], {
  encoding: 'utf8', maxBuffer: 32e6,
}), 'Source catalogue differs from the fixed parent');
const catalog = JSON.parse(catalogBytes);
const quizPins = JSON.parse(readFileSync('content/brain-connections-quiz-pins.json', 'utf8'));
const targets = [
  ['amygdala', 'FMA72832', 'right'],
  ['amygdala', 'FMA72833', 'left'],
  ['fornix', 'FMA72924', 'right'],
  ['fornix', 'FMA72925', 'left'],
  ['anterior-commissure', 'FMA61961', 'midline'],
  ['corpus-callosum', 'FMA86464', 'midline'],
];
const entries = targets.map(([slug, fma, side]) => {
  const matches = catalog.structures.filter(s => s.fmaId === fma);
  assert.equal(matches.length, 1, `Expected one source identity for ${fma}`);
  const identity = matches[0];
  assert.equal(identity.id, `vm:anatomy:body:head-neck:${side}:organ:${identity.sourceName.replaceAll(' ', '-')}`);
  assert.equal(identity.system, 'nerves');
  assert.equal(identity.category, 'organ');
  assert.equal(identity.laterality, side);
  assert.equal(identity.region, 'head-neck');
  assert.deepEqual(identity.regions, ['head-neck']);
  assert.equal(identity.sourceTree, 'isa');
  assert.equal(identity.bundle, 'head-neck-nerves-deep-brain');
  assert.equal(identity.sources.length, 1);
  const old = quizPins.entries.filter(e => e.identity.fmaId === fma);
  assert.equal(old.length, 1, `Expected one existing quiz pin for ${fma}`);
  assert.deepEqual(identity, old[0].identity, `Existing quiz identity changed for ${fma}`);
  assert.equal(old[0].group, slug === 'anterior-commissure' ? 'anteriorCommissure'
    : slug === 'corpus-callosum' ? 'corpusCallosum' : slug);
  return { key: `brain-connections-${slug}`, identity };
});
assert.equal(new Set(entries.map(e => e.identity.id)).size, targets.length);
const bundle = catalog.bundles.find(b => b.id === 'head-neck-nerves-deep-brain');
assert.ok(bundle);
assert.deepEqual(quizPins.bundles.find(b => b.id === bundle.id), bundle);
const pins = {
  parentCommit, sourceVersion: catalog.sourceVersion,
  coordinateSystem: catalog.coordinateSystem,
  bundles: [bundle], entries,
};
const path = 'content/brain-connections-reasoning-pins.json';
const output = JSON.stringify(pins, null, 2) + '\n';
if (process.argv.includes('--record')) writeFileSync(path, output, { flag: 'wx' });
else if (process.argv.includes('--check')) assert.equal(readFileSync(path, 'utf8'), output);
else throw new Error('Specify --record once or --check');
console.log('Six existing brain connection display identities pinned; source geometry unchanged');
