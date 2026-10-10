import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const parentCommit = '4b991606fb99a09e968180eb7d86549f454cf8e5';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const spineMuscleGroup = name => {
  const n = name.toLowerCase().replace(/^(?:set of )?(?:right |left )?/, '');
  if (/^(?:lumbar|cervical|thoracic) rotator$/.test(n)) return 'rotatores';
  if (/^iliocostalis (?:cervicis|thoracis|lumborum)$/.test(n)) return 'iliocostalis';
  if (/^longissimus (?:capitis|cervicis|thoracis)$/.test(n)) return 'longissimus';
  if (n === 'semispinalis capitis') return 'semispinalisCapitis';
  if (/^semispinalis (?:cervicis|thoracis)$/.test(n)) return 'semispinalisSpinal';
  if (n === 'spinalis') return 'spinalis';
  if (n === 'splenius capitis') return 'spleniusCapitis';
  if (n === 'splenius cervicis') return 'spleniusCervicis';
  if (/^(?:lateral|medial) lumbar intertransversarius$/.test(n)) return 'lumbarIntertransversarii';
  if (/^(?:anterior|posterior) cervical intertransversarii$/.test(n)) return 'cervicalIntertransversarii';
  if (/^interspinalis thoracis$|^interspinales (?:lumborum|cervicis)$/.test(n)) return 'interspinales';
  if (n === 'levatores costarum breves') return 'levatoresCostarumBreves';
  if (n === 'obliquus capitis inferior') return 'obliquusCapitisInferior';
  if (n === 'obliquus capitis superior') return 'obliquusCapitisSuperior';
  if (n === 'rectus capitis posterior major') return 'rectusCapitisPosteriorMajor';
  if (n === 'rectus capitis posterior minor') return 'rectusCapitisPosteriorMinor';
  return undefined;
};
const counts = {
  rotatores: 5, iliocostalis: 6, longissimus: 6, semispinalisCapitis: 2,
  semispinalisSpinal: 4, spinalis: 1, spleniusCapitis: 2, spleniusCervicis: 2,
  lumbarIntertransversarii: 2, cervicalIntertransversarii: 2, interspinales: 4,
  levatoresCostarumBreves: 2, obliquusCapitisInferior: 2, obliquusCapitisSuperior: 2,
  rectusCapitisPosteriorMajor: 2, rectusCapitisPosteriorMinor: 2,
};
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = display.structures.flatMap(identity => {
  if (identity.system !== 'muscles' || identity.region !== 'spine') return [];
  const group = spineMuscleGroup(identity.name);
  if (!group) return [];
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification', identity.id);
  assert.equal(previous.correctAnswer, undefined, identity.id);
  return [{ identity, group, previous }];
});
assert.equal(entries.length, 46);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 46);
assert.deepEqual(Object.fromEntries(Object.keys(counts).map(group => [group, entries.filter(e => e.group === group).length])), counts);
const bundles = display.bundles.filter(bundle => entries.some(entry => entry.identity.bundle === bundle.id));
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = { parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries };
const path = new URL('../content/spine-muscle-quiz-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else {
  assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), '{"entries":[]}\n', 'Only the bootstrap stub may be replaced');
  await writeFile(path, output);
}
console.log(JSON.stringify({ identities: entries.length, groups: Object.keys(counts).length, pinsHash: hash(record), clinicalApproval: false }));
