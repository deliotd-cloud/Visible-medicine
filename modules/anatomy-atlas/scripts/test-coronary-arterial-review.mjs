import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url);
const compiled = await build({
  stdin: {
    contents: "export { bodyDisplayCatalog } from './lib/body-display-catalog'; export { coronaryArterialReviewChecks } from './lib/coronary-arterial-review'; export { coronaryArterialStudyFor } from './lib/coronary-arterial-study';",
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, platform: 'node', format: 'cjs', write: false,
});
const module = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, {
  module, exports: module.exports, require, structuredClone,
});
const api = module.exports;
const same = (actual, expected, label) =>
  assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected, label);
const raw = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const displayCatalog = api.bodyDisplayCatalog(raw);
const original = JSON.stringify(displayCatalog);
const study = api.coronaryArterialStudyFor(displayCatalog);
assert(study, 'canonical display catalog admits study');
const participants = [...study.targets, ...study.context];
assert.equal(participants.length, 5);
assert.equal(study.targets.length, 4);
assert.equal(study.context.length, 1);

const reference = api.coronaryArterialReviewChecks(displayCatalog, participants[0].id);
assert.equal(reference.length, 10, 'five source checks plus five comparison checks');
for (const participant of participants) {
  const checks = api.coronaryArterialReviewChecks(displayCatalog, participant.id);
  same(checks, JSON.parse(JSON.stringify(reference)), 'all five participants receive identical comparison scope');
  const index = participants.indexOf(participant);
  const line = checks[index];
  const bundle = study.bundles.find(item => item.id === participant.bundle);
  for (const token of [participant.name, participant.fmaId, participant.id, bundle.id, bundle.sha256,
    ...participant.sources.map(item => item.file)]) assert(line.includes(token), `${participant.fmaId}: ${token}`);
}
same(api.coronaryArterialReviewChecks(null, participants[0].id), []);
same(api.coronaryArterialReviewChecks(displayCatalog, 'unrelated'), []);
same(api.coronaryArterialReviewChecks(displayCatalog,
  displayCatalog.structures.find(item => !participants.some(p => p.id === item.id)).id), []);
for (const phrase of ['0%', 'nonselectable', 'separation', 'reassembly', 'removed', 'system',
  'thorax', 'whole-body', 'Both sides', 'four artery', 'clicked', 'labelled', 'isolated',
  'camera', 'complete coronary tree', 'ostia', 'lumen', 'dominance', 'flow',
  'registration', 'does not approve', 'radiologist sign-off']) {
  assert(reference.join(' ').includes(phrase), `comparison check: ${phrase}`);
}
assert.equal(reference.filter(line => line.startsWith('Inspect the displayed source surface')).length, 5);
assert.equal(JSON.stringify(displayCatalog), original, 'helper leaves input unchanged');
reference[0] = 'caller mutation';
assert.notEqual(api.coronaryArterialReviewChecks(displayCatalog, participants[0].id)[0], 'caller mutation');

let refusals = 0;
function refuses(label, mutate) {
  const changed = structuredClone(displayCatalog);
  mutate(changed);
  for (const participant of participants) {
    same(api.coronaryArterialReviewChecks(changed, participant.id), [], label);
  }
  refusals++;
}
for (const participant of participants) {
  refuses(`${participant.fmaId} missing`, catalog => {
    catalog.structures = catalog.structures.filter(item => item.id !== participant.id);
  });
  refuses(`${participant.fmaId} duplicate`, catalog => {
    catalog.structures.push(structuredClone(catalog.structures.find(item => item.id === participant.id)));
  });
  refuses(`${participant.fmaId} source mutation`, catalog => {
    catalog.structures.find(item => item.id === participant.id).sources[0].sha256 = '0'.repeat(64);
  });
}
refuses('frame mutation', catalog => { catalog.coordinateSystem.unitsPerMillimetre *= 2; });
refuses('licence mutation', catalog => { catalog.license = 'changed'; });
refuses('credit mutation', catalog => { catalog.credit = 'changed'; });
for (const bundle of study.bundles) {
  refuses(`${bundle.id} bundle mutation`, catalog => {
    catalog.bundles.find(item => item.id === bundle.id).sha256 = '0'.repeat(64);
  });
}
console.log(JSON.stringify({ passed: true, participants: participants.length, checks: 10,
  refusals, clinicalApproval: false }));
