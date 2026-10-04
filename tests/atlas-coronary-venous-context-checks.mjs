import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname} from 'node:path';
import {runInNewContext} from 'node:vm';
import {build} from 'esbuild';

const sourceRevision = '910c553d21529f24d872c4c9e74d59aa7abc464a';
// Preserve the original teaching/source epoch while tracking the current delivery.
const deliveryRevision = '4bb78ac5a29c88984a735523775ec69aeff942d6';
const sourceDir = 'C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
const websiteBaseline = 'd661997c0854116e7e320415df9065d6582529e2';
const websiteBaselineTree = 'ba09c3819384cf4d764040c995880178127726fe';
const gitOptions = {maxBuffer: 32e6, windowsHide: true, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}};
const previousFile = path => execFileSync('git', ['show', `${websiteBaseline}:atlas-review/${path}`], gitOptions);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = path => JSON.parse(readFileSync(path, 'utf8'));
const source = path => execFileSync('git', ['show', `${sourceRevision}:${path}`], {cwd: sourceDir, maxBuffer: 32e6, windowsHide: true, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}});
assert.equal(execFileSync('git', ['rev-parse', `${websiteBaseline}^{tree}`], gitOptions).toString().trim(), websiteBaselineTree);
assert.equal(JSON.parse(previousFile('manifest.json')).revision, 'c5c99ba11e6533d306587e71f5fc2854d882fbd6');
const pin = JSON.parse(source('public/models/bodyparts3d/coronary-venous/root-vessel-context.json'));
assert.deepEqual(readFileSync('atlas-review/public/models/bodyparts3d/coronary-venous/root-vessel-context.json'), source('public/models/bodyparts3d/coronary-venous/root-vessel-context.json'));
assert.equal(pin.schemaVersion, 1);
assert.deepEqual(pin.structures.map(s => s.fmaId), ['FMA76767', 'FMA4707', 'FMA4713']);
assert.deepEqual(pin.structures.map(s => s.sources.map(f => f.file)), [
  ['FJ2725', 'FJ2730'], ['FJ2656'],
  ['FJ2678', 'FJ2679', 'FJ2680', 'FJ2681', 'FJ2682', 'FJ2683', 'FJ2684', 'FJ2685', 'FJ2686', 'FJ2687', 'FJ2688', 'FJ2689', 'FJ2690', 'FJ2691'],
]);
assert.deepEqual(pin.bundles.map(b => b.id), ['anterior-cardiac-vein', 'thorax-vessels-recovery']);

const exports = `export * from './atlas-review/lib/coronary-venous-context';
export * from './atlas-review/lib/coronary-venous';
export * from './atlas-review/lib/nested-review-material';
export * from './atlas-review/lib/nested-review';
export * from './atlas-review/lib/nested-review-client';
export * from './atlas-review/lib/nested-review-api';
export * from './atlas-review/lib/specimen-links';
export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';`;
async function load(previous = false) {
  const result = await build({stdin: {contents: exports, resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm', plugins: previous ? [{name: 'previous-coronary-review', setup(api) {
    for (const path of ['lib/nested-review-material.ts', 'content/body-renderer-revision.json']) {
      const filter = new RegExp(`[\\\\/]${path.replaceAll('/', '[\\\\/]').replace('.', '\\.')}$`);
      api.onLoad({filter}, args => ({contents: previousFile(path).toString('utf8'), loader: path.endsWith('.json') ? 'json' : 'ts', resolveDir: dirname(args.path)}));
    }
  }}] : []});
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const now = await load(), before = await load(true);
const root = now.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
const parent = root.structures.find(s => s.fmaId === 'FMA7088');
assert(parent);
const context = now.coronaryVenousContextFor(parent, root);
const children = now.coronaryVenousFor(parent);
assert.deepEqual(context, pin.structures);
assert.deepEqual(children.map(s => s.fmaId), ['FMA4706', 'FMA4714']);
assert.equal(new Set([...context, ...children].flatMap(s => s.sources.map(f => f.file))).size, 20);
assert(!context.some(s => s.id === parent.id || children.some(c => c.id === s.id)));
assert.deepEqual(now.coronaryVenousContextViewCatalog(parent, false, root), now.coronaryVenousCatalog);
const shown = now.coronaryVenousContextViewCatalog(parent, true, root);
assert.deepEqual(shown.structures.map(s => s.id), [...children, ...context].map(s => s.id));
assert.deepEqual(shown.contextIds, context.map(s => s.id));
assert.deepEqual(shown.selectableIds, children.map(s => s.id));
const material = now.coronaryVenousContextMaterial(parent, root);
assert(material);
const {schemaVersion: _schemaVersion, ...pinnedMaterial} = pin;
assert.deepEqual(material, {...pinnedMaterial, copy: now.coronaryVenousContextCopy});
assert.equal(material.parentBundle.id, parent.bundle);
for (const bundle of [...material.bundles, material.parentBundle]) {
  const filename = 'public/atlas-runtime/head-neck' + new URL(bundle.url, 'https://atlas.test').pathname;
  const bytes = readFileSync(filename);
  assert.equal(bytes.length, bundle.bytes, bundle.id);
  assert.equal(sha(bytes), bundle.sha256, bundle.id);
}
const clean = now.coronaryVenousContextFor(parent, root);
clean[0].sources[0].sha256 = '0'.repeat(64);
assert.deepEqual(now.coronaryVenousContextFor(parent, root), context);
let rejected = 0;
for (const mutate of [
  c => {c.structures.find(s => s.fmaId === 'FMA4707').sources[0].sha256 = '0'.repeat(64);},
  c => {c.structures.find(s => s.fmaId === 'FMA76767').sources.pop();},
  c => {c.structures.find(s => s.fmaId === 'FMA4713').name += ' altered';},
  c => {c.bundles.find(b => b.id === 'thorax-vessels-recovery').sha256 = '0'.repeat(64);},
  c => {c.bundles.find(b => b.id === 'anterior-cardiac-vein').bytes++;},
  c => {c.bundles.find(b => b.id === parent.bundle).sha256 = '0'.repeat(64);},
  c => {c.license = 'altered';},
  c => {c.credit = 'altered';},
  c => {c.coordinateSystem.unitsPerMillimetre = 2;},
  c => {c.structures.find(s => s.id === parent.id).sources.pop();},
  c => {c.structures.push(structuredClone(context[0]));},
]) {
  const changed = structuredClone(root); mutate(changed);
  assert.deepEqual(now.coronaryVenousContextFor(parent, changed), []);
  assert.equal(now.coronaryVenousContextMaterial(parent, changed), null);
  assert.deepEqual(now.coronaryVenousContextViewCatalog(parent, true, changed), now.coronaryVenousCatalog);
  rejected++;
}
for (const mutate of [p => {p.sources[0].sha256 = '0'.repeat(64);}, p => {p.bounds.min[0] += 0.1;}]) {
  const changed = structuredClone(parent); mutate(changed);
  assert.deepEqual(now.coronaryVenousContextFor(changed, root), []);
  rejected++;
}

// Verify the emitted graph and the exact input list, not bundled string presence.
for (const name of ['head-neck', 'shoulder', 'female-pelvis', 'lower-limb']) {
  const folder = `public/atlas-runtime/${name}/`, manifest = json(folder + 'manifest.json');
  assert.equal(manifest.sourceCommit, deliveryRevision, name);
  assert.equal(manifest.patientDataIncluded, false);
  for (const file of manifest.files) {
    if (!file.path.endsWith('.js')) continue;
    assert.equal(sha(readFileSync(folder + file.path)), file.sha256, `${name}:${file.path}`);
  }
  const inputs = json(folder + 'source-inputs.json');
  const expected = 'lib/coronary-venous-context.ts';
  if (name === 'head-neck') assert.deepEqual(inputs.filter(i => i.path === expected), [{path: expected, sha256: sha(source(expected))}]);
  else assert(!inputs.some(i => i.path === expected), name + ':scope');
}

const rows = now.nestedReviewRows.filter(g => g.study === 'coronary-venous');
assert.equal(rows.length, 1);
assert.equal(rows[0].surfaces.length, 2);
let storageCalls = 0, stale = 0, forged = 0;
const storage = new Proxy({}, {get() {storageCalls++; throw Error('Stale review reached storage');}});
const digest = value => sha(now.canonicalSpecimenValue(JSON.parse(JSON.stringify(value))));
for (const row of rows[0].surfaces) {
  const current = await now.nestedReviewMaterial(rows[0].key, row.id);
  const previous = await before.nestedReviewMaterial(rows[0].key, row.id);
  assert(current && previous);
  const c = current.context, p = previous.context, landmark = current.source.orientationContext;
  assert.deepEqual(landmark, (({copy, ...rest}) => rest)(material));
  assert.deepEqual(current.teaching.orientationContext, material.copy);
  assert.deepEqual((({orientationContext, ...rest}) => rest)(current.source), previous.source);
  assert.deepEqual((({orientationContext, ...rest}) => rest)(current.teaching), previous.teaching);
  for (const track of ['geometry', 'teaching']) {
    assert.deepEqual(c.checklists[track].filter(x => x.id !== 'coronary-landmarks'), p.checklists[track]);
    assert.equal(c.checklists[track].filter(x => x.id === 'coronary-landmarks').length, 1);
  }
  assert.match(c.checklists.geometry.find(x => x.id === 'coronary-landmarks').label, /separation\/reassembly/);
  assert.match(c.checklists.teaching.find(x => x.id === 'coronary-landmarks').label, /caption/);
  assert.notEqual(c.sourceHash, p.sourceHash);
  assert.notEqual(c.teachingHash, p.teachingHash);
  assert.notEqual(c.materialHash, p.materialHash);
  assert.notEqual(c.revisions.geometry, p.revisions.geometry);
  assert.notEqual(c.revisions.teaching, p.revisions.teaching);
  assert.equal(c.revisions.imaging, null);
  assert.deepEqual(c.blockers, p.blockers);
  assert.deepEqual(c.teachingTabs, p.teachingTabs);
  assert.equal(await now.nestedReviewSelection(rows[0].key, row.id, p.sourceHash), null);
  assert.deepEqual(await now.nestedReviewSelection(rows[0].key, row.id, c.sourceHash), current);
  for (const mutate of [
    s => {s.orientationContext.structures.pop();},
    s => {s.orientationContext.structures[0].sources[0].sha256 = '0'.repeat(64);},
    s => {s.orientationContext.bundles[0].sha256 = '0'.repeat(64);},
    s => {s.orientationContext.coordinateSystem.unitsPerMillimetre = 2;},
    s => {s.orientationContext.license = 'altered';},
  ]) {
    const altered = structuredClone(current.source); mutate(altered);
    assert.equal(await now.nestedReviewSelection(rows[0].key, row.id, digest(altered)), null);
    forged++;
  }
  for (const track of ['geometry', 'teaching']) for (const delta of [
    {materialHash: p.materialHash}, {revisionHash: p.revisions[track]},
  ]) {
    const packet = {catalogScope: c.catalogScope, nestedKey: c.nestedKey, structureId: c.structureId,
      sourceFrame: c.sourceFrame, materialHash: c.materialHash, revisionHash: c.revisions[track],
      checklistVersion: c.checklistVersion, track, expectedVersion: 0,
      draft: now.blankNestedReview(c, track), ...delta};
    const response = await now.postNestedReview(new Request('https://review.test/api/nested-review', {
      method: 'POST', headers: {'origin': 'https://review.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_CORONARY_CONTEXT'}, body: JSON.stringify(packet)}), storage);
    assert.equal(response.status, 409);
    stale++;
  }
  const again = await now.nestedReviewMaterial(rows[0].key, row.id);
  assert.deepEqual(again, current);
}
assert.equal(forged, 10);
assert.equal(stale, 8);
assert.equal(storageCalls, 0);

// Exercise actual workbench handlers without mounting WebGL.
const nodeRequire = createRequire(import.meta.url), React = nodeRequire('react');
const link = await import('vinext/shims/link');
const view = await build({stdin: {contents: "export {VentricularView} from './atlas-review/app/ventricles';", resolveDir: process.cwd(), loader: 'tsx'}, bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', loader: {'.css': 'empty'}, plugins: [{name: 'gpu-boundary', setup(api) {
  api.onLoad({filter: /body-scene\\.tsx$/}, () => ({contents: 'export const BodyScene=()=>null;export const retryBodyAssets=()=>{};', loader: 'tsx'}));
}}]});
let slots = [], cursor = 0;
const useState = initial => {const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
  return [slots[i], next => {slots[i] = typeof next === 'function' ? next(slots[i]) : next;}];};
const shim = {...React, useState,
  useReducer: (reduce, initial, init) => {const [v, set] = useState(() => init ? init(initial) : initial); return [v, action => set(old => reduce(old, action))];},
  useRef: value => useState(() => ({current: value}))[0], useMemo: fn => fn(), useCallback: fn => fn,
  useEffect: () => {}, useLayoutEffect: () => {}};
const module = {exports: {}};
runInNewContext(view.outputFiles[0].text, {module, exports: module.exports,
  require: id => id === 'react' ? shim : id === 'next/link' ? {__esModule: true, ...link} : nodeRequire(id),
  structuredClone, requestAnimationFrame: fn => fn()});
const nodes = value => !value || typeof value !== 'object' ? [] : Array.isArray(value) ? value.flatMap(nodes) : [value, ...nodes(value.props?.children)];
const label = value => typeof value === 'string' ? value : !value ? '' : Array.isArray(value) ? value.map(label).join('') : label(value.props?.children);
let tree;
const render = () => {cursor = 0; tree = module.exports.VentricularView({parent, educationCatalog: root, study: 'coronary-venous'});};
const scene = () => nodes(tree).find(n => n.props?.onRendererHealth)?.props;
const button = name => nodes(tree).find(n => n.props?.onClick && label(n) === name)?.props;
render();
assert.deepEqual(Array.from(scene().structures, s => s.id), children.map(s => s.id));
assert.equal(scene().contextIds.length, 0);
button(now.coronaryVenousContextCopy.button).onClick(); render();
assert.deepEqual(Array.from(scene().contextIds), context.map(s => s.id));
assert.equal(scene().landmarks.length, 2);
assert(label(tree).includes(now.coronaryVenousContextCopy.guide));
const selected = scene().selectedId;
scene().onSelect(context[0].id); render();
assert.equal(scene().selectedId, selected);
const slider = () => nodes(tree).find(n => n.props?.['aria-label'] === 'Coronary venous separation')?.props;
slider().onValueChange([25]); render(); assert.equal(scene().contextIds.length, 0);
slider().onValueChange([0]); render(); assert.equal(scene().contextIds.length, 3);
button('Reassemble').onClick(); render(); assert.equal(scene().contextIds.length, 3);
button(now.coronaryVenousContextCopy.button).onClick(); render();
assert.equal(scene().contextIds.length, 0);
console.log(JSON.stringify({passed: true, context: 3, children: 2, sourceFiles: 20,
  bundleHashes: 3, rejectedCatalogs: rejected, forgedPackets: forged, stalePackets: stale,
  storageCalls, clinicalApproval: false}));
