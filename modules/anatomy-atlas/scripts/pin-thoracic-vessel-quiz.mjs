import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const parentCommit = '3edd8149384a251c33801408d32472ae6f97ab1c';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const thoracicVesselGroup = name => {
  const n = name.toLowerCase().replace(/^(?:right |left )/, '');
  if (n === 'ascending aorta') return 'ascendingAorta';
  if (n === 'arch of aorta') return 'aorticArch';
  if (n === 'descending thoracic aorta') return 'descendingAorta';
  if (n === 'superior vena cava') return 'superiorVenaCava';
  if (n === 'azygos vein') return 'azygos';
  if (n === 'hemiazygos vein') return 'hemiazygos';
  if (n === 'brachiocephalic artery') return 'brachiocephalicArtery';
  if (name === 'Right subclavian artery') return 'rightSubclavianArtery';
  if (name === 'Left subclavian artery') return 'leftSubclavianArtery';
  if (n === 'brachiocephalic vein') return 'brachiocephalicVein';
  if (n === 'subclavian vein') return 'subclavianVein';
  if (n === 'trunk of right coronary artery') return 'rightCoronary';
  if (n === 'trunk of left coronary artery') return 'leftCoronary';
  if (n === 'anterior interventricular branch of left coronary artery') return 'anteriorInterventricular';
  if (n === 'circumflex branch of left coronary artery') return 'circumflex';
  if (n === 'great cardiac vein') return 'greatCardiac';
  if (n === 'middle cardiac vein') return 'middleCardiac';
  if (n === 'internal thoracic artery') return 'internalThoracicArtery';
  if (n === 'superior epigastric artery') return 'superiorEpigastric';
  if (n === 'musculophrenic artery') return 'musculophrenicArtery';
  if (n === 'internal thoracic vein') return 'internalThoracicVein';
  if (n === 'musculophrenic vein') return 'musculophrenicVein';
  return undefined;
};
const counts = {
  ascendingAorta: 1, aorticArch: 1, descendingAorta: 1, superiorVenaCava: 1,
  azygos: 1, hemiazygos: 1, brachiocephalicArtery: 1, rightSubclavianArtery: 1,
  leftSubclavianArtery: 1, brachiocephalicVein: 2, subclavianVein: 2,
  rightCoronary: 1, leftCoronary: 1, anteriorInterventricular: 1, circumflex: 1,
  greatCardiac: 1, middleCardiac: 1, internalThoracicArtery: 2,
  superiorEpigastric: 2, musculophrenicArtery: 2, internalThoracicVein: 1,
  musculophrenicVein: 2,
};
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = display.structures.flatMap(identity => {
  if (identity.system !== 'vessels' || identity.region !== 'thorax') return [];
  const group = thoracicVesselGroup(identity.name);
  if (!group) return [];
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification', identity.id);
  assert.equal(previous.correctAnswer, undefined, identity.id);
  return [{ identity, group, previous }];
});
assert.equal(entries.length, 28);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 28);
assert.deepEqual(Object.fromEntries(Object.keys(counts).map(group => [group, entries.filter(e => e.group === group).length])), counts);
const allGenerated = display.structures.filter(identity => identity.system === 'vessels' && identity.region === 'thorax' && before.bodyLesson(identity, 'quiz')?.readiness === 'generated-identification');
assert.deepEqual(entries.map(e => e.identity.id), allGenerated.map(e => e.id));
const bundles = display.bundles.filter(bundle => entries.some(entry => entry.identity.bundle === bundle.id));
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = { parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries };
const path = new URL('../content/thoracic-vessel-quiz-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else {
  assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), '{"entries":[]}\n', 'Only the bootstrap stub may be replaced');
  await writeFile(path, output);
}
console.log(JSON.stringify({ identities: entries.length, groups: Object.keys(counts).length, pinsHash: hash(record), clinicalApproval: false }));
