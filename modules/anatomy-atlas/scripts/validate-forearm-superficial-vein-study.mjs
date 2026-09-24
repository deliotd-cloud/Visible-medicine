import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { build } from './workspace-test-build.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const pins = JSON.parse(await readFile('content/forearm-superficial-vein-pins.json'));
const fullBytes = await readFile('public/models/bodyparts3d/full-body/catalog.json');
const cubitalBytes = await readFile('public/models/bodyparts3d/cubital-veins/catalog.json');
assert.equal(hash(fullBytes), pins.catalogSha256);
assert.equal(hash(cubitalBytes), pins.cubitalCatalogSha256);

const compiled = await build({
  stdin: { contents: "export {bodyDisplayCatalog} from './lib/body-display-catalog'; export * from './app/dissection-data'; export * from './lib/study-library'; export * from './lib/study-links'; export {forearmSuperficialVeinStudy} from './content/forearm-superficial-vein-study'; export {forearmSuperficialVeinStudyReady} from './lib/forearm-superficial-veins'; export {limbVascularStudyReady} from './lib/limb-vascular-studies';", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog = api.bodyDisplayCatalog(JSON.parse(fullBytes));
const catalogBefore = JSON.stringify(catalog);
const study = api.forearmSuperficialVeinStudy;
assert.equal(study.id, 'forearm-superficial-veins');
assert.deepEqual(study.regions, ['forearm']);
assert.deepEqual(study.targetFmaIds, pins.targets.map(row => row[0]));
assert.deepEqual(study.context, [{fmaIds:pins.context.map(row => row[0])}]);
assert.equal(study.view, 'anterior');

const allPins = [...pins.targets, ...pins.context];
function verifySource(input) {
  assert.equal(input.sourceVersion, pins.sourceVersion);
  assert.equal(input.license, pins.license);
  for (const [fma, side, bundle, file, sourceHash] of allPins) {
    const found = input.structures.filter(s => s.fmaId === fma);
    assert.equal(found.length, 1, `${fma} absent or duplicated`);
    const s = found[0];
    assert.equal(hash(JSON.stringify(s)), pins.recordSha256[fma], `${fma} source record altered`);
    assert.equal(s.id, `vm:anatomy:body:forearm:${side}:${pins.targets.some(row => row[0] === fma) ? 'vessel' : 'bone'}:${s.sourceName.replaceAll(' ', '-')}`);
    assert.equal(s.laterality, side);
    assert.equal(s.region, 'forearm');
    assert(s.regions.includes('forearm'));
    assert.equal(s.bundle, bundle);
    assert.equal(s.nodeName, fma);
    assert.deepEqual(s.sources, [{file, sha256:sourceHash}]);
    assert.equal(s.validation.status, 'unvalidated');
    assert.equal(s.validation.anatomicalReview, false);
  }
  for (const [id, expected] of pins.bundles) {
    const found = input.bundles.filter(b => b.id === id);
    assert.equal(found.length, 1, `${id} bundle absent or duplicated`);
    assert.equal(found[0].sha256, expected);
  }
}
verifySource(catalog);
assert(api.forearmSuperficialVeinStudyReady(catalog, 'forearm', study.id));
assert(api.limbVascularStudyReady(catalog, 'forearm', study.id));
assert(!api.forearmSuperficialVeinStudyReady(catalog, 'whole-body', study.id));
assert(!api.forearmSuperficialVeinStudyReady(null, 'forearm', study.id));
assert(api.forearmSuperficialVeinStudyReady(null, 'forearm', 'another-study'));
const linkedVein = catalog.structures.find(s => s.fmaId === 'FMA13325');
const href = api.makeStudyLink(catalog, 'forearm', linkedVein.id, 'right', study.id);
assert(href);
const request = api.parseStudyLink(Object.fromEntries(new URL(href, 'https://atlas.invalid').searchParams));
assert.equal(api.resolveStudyLink(catalog, 'forearm', request).status, 'ready');
const changedContext = structuredClone(catalog);
changedContext.structures.find(s => s.fmaId === 'FMA23464').sources[0].sha256 = '0'.repeat(64);
assert.deepEqual(api.resolveStudyLink(changedContext, 'forearm', request), {status:'rejected',reason:'source-changed'});
let rejected = 0;
function reject(mutate) {
  const altered = structuredClone(catalog);
  mutate(altered);
  assert.throws(() => verifySource(altered));
  assert.equal(api.forearmSuperficialVeinStudyReady(altered, 'forearm', study.id), false);
  assert.equal(api.limbVascularStudyReady(altered, 'forearm', study.id), false);
  rejected++;
}
for (const [fma] of allPins) {
  reject(c => { c.structures = c.structures.filter(s => s.fmaId !== fma); });
  reject(c => { c.structures.find(s => s.fmaId === fma).laterality = 'midline'; });
  reject(c => { c.structures.find(s => s.fmaId === fma).sources[0].sha256 = 'altered'; });
  reject(c => { c.structures.find(s => s.fmaId === fma).nodeName = 'altered'; });
  reject(c => { c.structures.find(s => s.fmaId === fma).bounds.max[1] += 0.01; });
}
for (const [id] of pins.bundles) reject(c => { c.bundles.find(b => b.id === id).sha256 = 'altered'; });

for (const [id, expected] of pins.bundles) {
  const bundle = catalog.bundles.find(b => b.id === id);
  assert.equal(hash(await readFile('public' + bundle.url.split('?')[0])), expected);
}
const profile = api.dissectionProfiles.forearm;
assert(!profile.stages.some(s => s.id === study.id));
const focuses = profile.focuses.filter(s => s.id === study.id);
assert.equal(focuses.length, 1);
assert.equal(focuses[0].title, study.title);
assert.deepEqual(focuses[0].rule, {fmaIds: study.targetFmaIds});
assert.deepEqual(focuses[0].context, study.context);
const priorProfiles = structuredClone(api.dissectionProfiles);
priorProfiles.forearm.focuses = priorProfiles.forearm.focuses.filter(f => f.id !== study.id);
assert.deepEqual(priorProfiles.forearm.references.slice(-2), [
  'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html',
  'https://pubmed.ncbi.nlm.nih.gov/23131916/',
]);
priorProfiles.forearm.references.splice(-2);
const priorProfileHash = hash(JSON.stringify(priorProfiles));
assert.equal(priorProfileHash, 'e036bb888c17565f87c7601d41877a4e1334ce7dfc11230ad6c5d6ea7bf21533', 'Earlier recipes must retain their source identity');
const expected = new Set(allPins.map(row => row[0]));
let scopes = 0;
for (const side of ['both', 'left', 'right']) {
  const scope = catalog.structures.filter(s => s.regions.includes('forearm') && (side === 'both' || s.laterality === side || s.laterality === 'midline'));
  const cards = api.studyLibrary(scope, profile);
  const recipe = cards.flatMap(c => c.recipes).find(r => r.id === study.id && r.kind === 'focus');
  assert(recipe?.available);
  assert.equal(recipe.targets.length, side === 'both' ? 8 : 4);
  assert.equal(recipe.visible.length, side === 'both' ? 12 : 6);
  assert(recipe.visible.every(s => expected.has(s.fmaId)));
  const state = api.dissectionReducer(api.initialDissection, {type:'focus', id:study.id});
  const visible = api.resolveDissection(scope, profile, state).visible;
  assert.deepEqual(visible.map(s => s.id).sort(), recipe.visible.map(s => s.id).sort());
  const removed = api.dissectionReducer(state, {type:'remove', id:visible[0].id});
  assert.equal(api.resolveDissection(scope, profile, removed).visible.length, visible.length - 1);
  assert.deepEqual(api.resolveDissection(scope, profile, api.dissectionReducer(removed, {type:'undo'})).visible, visible);
  scopes++;
}
assert.equal(JSON.stringify(catalog), catalogBefore);
console.log(JSON.stringify({targets:8, context:4, bundleHashes:3, rejectedAlterations:rejected, sideScopes:scopes, priorCatalogUnchanged:true, clinicalApproval:false}));
