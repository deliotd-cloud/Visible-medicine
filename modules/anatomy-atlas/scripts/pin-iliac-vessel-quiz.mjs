import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const parentCommit = 'b7ed1802210cfc12110bcac57b3c6fe7471e0f13';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const expected = new Map([
  ['FMA14765', ['Right common iliac artery', 'commonIliacArtery', 'right', ['FJ3565']]],
  ['FMA14766', ['Left common iliac artery', 'commonIliacArtery', 'left', ['FJ3464']]],
  ['FMA18806', ['Right external iliac artery', 'externalIliacArtery', 'right', ['FJ3567']]],
  ['FMA18807', ['Left external iliac artery', 'externalIliacArtery', 'left', ['FJ3466']]],
  ['FMA18809', ['Right internal iliac artery', 'internalIliacArtery', 'right', ['FJ3569']]],
  ['FMA18810', ['Left internal iliac artery', 'internalIliacArtery', 'left', ['FJ3468']]],
  ['FMA21387', ['Right common iliac vein', 'commonIliacVein', 'right', ['FJ3566']]],
  ['FMA21388', ['Left common iliac vein', 'commonIliacVein', 'left', ['FJ3465']]],
  ['FMA18885', ['Right external iliac vein', 'externalIliacVein', 'right', ['FJ3568']]],
  ['FMA18886', ['Left external iliac vein', 'externalIliacVein', 'left', ['FJ3484', 'FJ3522', 'FJ3523', 'FJ3524']]],
  ['FMA18887', ['Right internal iliac vein', 'internalIliacVein', 'right', ['FJ3570', 'FJ3571', 'FJ3572', 'FJ3607', 'FJ3608', 'FJ3609']]],
  ['FMA18888', ['Left internal iliac vein', 'internalIliacVein', 'left', ['FJ3469', 'FJ3470', 'FJ3471']]],
]);
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = display.structures.flatMap(identity => {
  const match = expected.get(identity.fmaId);
  if (!match) return [];
  assert.equal(identity.name, match[0], identity.fmaId);
  assert.equal(identity.system, 'vessels', identity.fmaId);
  assert.equal(identity.category, 'vessel', identity.fmaId);
  assert.equal(identity.laterality, match[2], identity.fmaId);
  assert.equal(identity.region, 'pelvis', identity.fmaId);
  assert.equal(identity.sourceTree, 'isa', identity.fmaId);
  assert.deepEqual(identity.sources.map(source => source.file), match[3], identity.fmaId);
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification', identity.id);
  assert.equal(previous.correctAnswer, undefined, identity.id);
  return [{ identity, group: match[1], previous }];
});
assert.equal(entries.length, 12);
assert.equal(new Set(entries.map(e => e.identity.fmaId)).size, 12);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 12);
for (const [fma] of expected) assert.equal(entries.filter(e => e.identity.fmaId === fma).length, 1);
for (const group of new Set([...expected.values()].map(value => value[1]))) assert.equal(entries.filter(e => e.group === group).length, 2);
const eligible = display.structures.filter(identity => identity.region === 'pelvis' && identity.system === 'vessels' && before.bodyLesson(identity, 'quiz')?.readiness === 'generated-identification');
assert.deepEqual(entries.map(e => e.identity.id), eligible.map(e => e.id));
const bundles = display.bundles.filter(bundle => entries.some(entry => entry.identity.bundle === bundle.id));
assert.equal(bundles.length, 1);
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = { parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries };
const path = new URL('../content/iliac-vessel-quiz-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else {
  assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), '{"entries":[]}\n', 'Only the bootstrap stub may be replaced');
  await writeFile(path, output);
}
console.log(JSON.stringify({ identities: entries.length, groups: 6, pinsHash: hash(record), clinicalApproval: false }));
