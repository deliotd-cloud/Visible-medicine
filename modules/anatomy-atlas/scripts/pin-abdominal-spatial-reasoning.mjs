// Pin six already displayed root records; never imply complete organ geometry.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { contentContext } from './content-contract-tools.mjs';

const parentCommit = 'f89b6c01aec40fba4de81e26ec433ef4fe2b5e96';
assert.equal(execFileSync('git', ['rev-parse', `${parentCommit}^{commit}`], { encoding: 'utf8' }).trim(), parentCommit);
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
assert.equal(readFileSync(catalogPath, 'utf8'), execFileSync('git', ['show', `${parentCommit}:${catalogPath}`], {
  encoding: 'utf8', maxBuffer: 32e6,
}), 'Raw source catalogue differs from the fixed baseline');
const { api, catalog: raw } = await contentContext();
const catalog = api.bodyDisplayCatalog(raw);
const imaging = JSON.parse(readFileSync('content/abdominal-organ-imaging-pins.json', 'utf8'));
const quiz = JSON.parse(readFileSync('content/abdominal-organ-quiz-pins.json', 'utf8'));
const targets = [
  ['liver', 'FMA7197', 'unpaired', 'partof'],
  ['pancreas', 'FMA7198', 'unpaired', 'partof'],
  ['kidney', 'FMA7204', 'right', 'partof'],
  ['kidney', 'FMA7205', 'left', 'partof'],
  ['adrenal', 'FMA15629', 'right', 'isa'],
  ['adrenal', 'FMA15630', 'left', 'isa'],
];
const files = new Map([
  ['FMA7197', 'FJ1883,FJ1893,FJ1913,FJ1914,FJ1916,FJ2386,FJ2404,FJ2405,FJ2409,FJ2816,FJ2818,FJ2819,FJ2820,FJ2821,FJ2822,FJ2823,FJ2824,FJ3071,FJ3072,FJ3073,FJ3074,FJ3075,FJ3076,FJ3077,FJ3083,FJ3086,FJ3088,FJ3089,FJ3090,FJ3091,FJ3092,FJ3093,FJ3095,FJ3096,FJ3102,FJ3103,FJ3104,FJ3105,FJ3106,FJ3107,FJ3108,FJ3109,FJ3110,FJ3111,FJ3112,FJ3113,FJ3114,FJ3115,FJ3116,FJ3117,FJ3122,FJ3123,FJ3124,FJ3125,FJ3126,FJ3127,FJ3128'],
  ['FMA7198', 'FJ1895,FJ1896,FJ2630'], ['FMA7204', 'FJ3147'], ['FMA7205', 'FJ3145'],
  ['FMA15629', 'FJ3130'], ['FMA15630', 'FJ3129'],
]);
const entries = targets.map(([slug, fma, side, tree]) => {
  const matches = catalog.structures.filter(s => s.fmaId === fma);
  assert.equal(matches.length, 1, `One displayed record required for ${fma}`);
  const identity = matches[0];
  assert.equal(identity.system, 'organs'); assert.equal(identity.category, 'organ');
  assert.equal(identity.laterality, side); assert.equal(identity.sourceTree, tree);
  assert.equal(identity.region, 'abdomen'); assert.deepEqual(identity.regions, ['abdomen']);
  assert.equal(identity.sources.map(s => s.file).join(','), files.get(fma));
  const old = imaging.entries.filter(e => e.identity.fmaId === fma);
  assert.equal(old.length, 1); assert.deepEqual(identity, old[0].identity);
  if (fma !== 'FMA7197') {
    const oldQuiz = quiz.entries.filter(e => e.identity.fmaId === fma);
    assert.equal(oldQuiz.length, 1); assert.deepEqual(identity, oldQuiz[0].identity);
  }
  return { key: `abdominal-spatial-${slug}`, identity };
});
assert.equal(new Set(entries.map(e => e.identity.id)).size, 6);
const bundles = catalog.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
assert.deepEqual(bundles.map(b => b.id), ['abdomen-organs', 'pancreas-corrected-parent']);
for (const bundle of bundles) assert.deepEqual(imaging.bundles.find(b => b.id === bundle.id), bundle);
const pins = { parentCommit, sourceVersion: catalog.sourceVersion, coordinateSystem: catalog.coordinateSystem, bundles, entries };
const path = 'content/abdominal-spatial-reasoning-pins.json';
const output = JSON.stringify(pins, null, 2) + '\n';
if (process.argv.includes('--record')) writeFileSync(path, output, { flag: 'wx' });
else if (process.argv.includes('--check')) assert.equal(readFileSync(path, 'utf8'), output);
else throw Error('Specify --record once or --check');
console.log('Six displayed abdominal spatial roots pinned; source geometry unchanged');
