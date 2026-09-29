import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const parentCommit = '744fc73c6c4d54754688fe93006e62df8b20f9f4';
const deliveryCommit = 'efa08d761641acb3fe5700e3a9191f245374927e';
const require = createRequire(import.meta.url);
const { renderToStaticMarkup } = require('react-dom/server');
const copy = value => JSON.parse(JSON.stringify(value));
const hash = value => createHash('sha256').update(value).digest('hex');
const git = path => execFileSync('git', ['show', `${parentCommit}:${path}`],
  { encoding: 'utf8', windowsHide: true, maxBuffer: 16e6 });
async function compile(contents) {
  const result = await build({ stdin: { contents, loader: 'tsx', resolveDir: process.cwd() },
    bundle: true, platform: 'node', format: 'cjs', write: false });
  const scope = { exports: {} };
  runInNewContext(result.outputFiles[0].text, { module: scope, exports: scope.exports, require, URLSearchParams });
  return scope.exports;
}
const previous = await compile(git('content/eye-imaging-teaching.ts'));
const api = await compile(`
export { eyeImagingTeaching, eyeImagingReferences } from './content/eye-imaging-teaching';
export { bodyDisplayCatalog } from './lib/body-display-catalog';
export { nestedStudyTargets } from './lib/nested-anatomy';
export { nestedTeachingFor, nestedTopicLesson, nestedTeachingReferences } from './lib/nested-teaching';
export { NestedTeaching } from './app/nested-teaching';
`);
const expected = {
  lens: { ids: ['FMA58242', 'FMA58243'], ref: 'lensBiometryUBM', hash: 'c71308116b8adbda8d67d4b9dec4bd53db697052e60c88ce73d96682921a3e14' },
  sclera: { ids: ['FMA58271', 'FMA58272'], ref: 'posteriorScleraBScan', hash: 'a147afbfcbe303730892a7399f793f8d1d90e7ca88765331aff4da34a7b8181d' },
};
const restored = copy(api.eyeImagingTeaching);
for (const [kind, entry] of Object.entries(expected)) {
  assert.equal(previous.eyeImagingTeaching[kind].ultrasound, undefined);
  const section = restored[kind].ultrasound;
  assert.equal(hash(JSON.stringify(section)), entry.hash);
  assert.equal(section.readiness, 'draft');
  assert.deepEqual(section.references, [entry.ref, 'renalReuseLicense']);
  assert(section.body.split(/\s+/).length < 120);
  delete restored[kind].ultrasound;
}
assert.deepEqual(restored, copy(previous.eyeImagingTeaching), 'Every earlier eye imaging entry unchanged');
const refs = copy(api.eyeImagingReferences);
for (const key of ['lensBiometryUBM', 'posteriorScleraBScan']) delete refs[key];
assert.deepEqual(refs, copy(previous.eyeImagingReferences));
assert.equal(api.eyeImagingReferences.lensBiometryUBM.url, 'https://doi.org/10.3389/fmed.2023.1306276');
assert.equal(api.eyeImagingReferences.posteriorScleraBScan.url, 'https://doi.org/10.3389/fopht.2023.1106419');
assert.equal(api.nestedTeachingReferences.renalReuseLicense.url, 'https://creativecommons.org/licenses/by/4.0/');
for (const file of ['content/nested-teaching-bindings.v1.json', 'content/nested-teaching.ts',
  'lib/nested-teaching.ts', 'lib/nested-anatomy.ts', 'app/nested-teaching.tsx',
  'public/models/bodyparts3d/eye-layers/catalog.json']) {
  // Preserve this historical delivery's no-other-changes assertion without
  // forbidding later independently validated anatomy or interface additions.
  const delivered = execFileSync('git', ['show', `${deliveryCommit}:${file}`],
    { encoding: 'utf8', windowsHide: true, maxBuffer: 16e6 });
  assert.equal(delivered.replaceAll('\r\n', '\n'), git(file).replaceAll('\r\n', '\n'), file);
  if (file.startsWith('public/models/'))
    assert.equal((await readFile(file, 'utf8')).replaceAll('\r\n', '\n'), delivered.replaceAll('\r\n', '\n'), 'Current eye geometry is unchanged');
}
const eye = JSON.parse(await readFile('public/models/bodyparts3d/eye-layers/catalog.json', 'utf8'));
for (const bundle of eye.bundles) {
  const path = 'public' + bundle.url.split('?')[0];
  assert.equal(hash(await readFile(path)), bundle.sha256);
}
const catalog = api.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8')));
const targets = api.nestedStudyTargets(catalog).filter(t => t.study === 'eye' &&
  Object.values(expected).some(e => e.ids.includes(t.structure.fmaId)));
assert.equal(targets.length, 4);
assert.deepEqual(copy(targets.map(t => t.structure.fmaId).sort()), Object.values(expected).flatMap(e => e.ids).sort());
const nodes = node => !node || typeof node !== 'object' ? [] : Array.isArray(node)
  ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
let rendered = 0, rejected = 0;
for (const target of targets) {
  const parent = catalog.structures.find(s => s.id === target.parentId);
  const concept = api.nestedTeachingFor(parent, target.study, target.structure);
  assert(concept);
  const lesson = api.nestedTopicLesson(concept, 'ultrasound');
  assert.equal(lesson.readiness, 'draft');
  assert(lesson.note.includes('specialist review pending'));
  assert(lesson.note.includes('No scan access or synchronization'));
  const tree = api.NestedTeaching({ parent, study: target.study, selected: target.structure, initialTopic: 'ultrasound' });
  const section = nodes(tree).find(n => n.props?.['aria-label'] === lesson.title);
  assert(section);
  const html = renderToStaticMarkup(section);
  assert(html.includes('CC BY 4.0')); assert(html.includes('no images reproduced'));
  for (const url of lesson.citations) assert(html.includes(url));
  rendered++;
  for (const key of ['id', 'fmaId', 'laterality', 'bundle', 'name', 'sourceTree']) {
    const changed = { ...target.structure, [key]: 'wrong' };
    assert.equal(api.nestedTeachingFor(parent, target.study, changed), null); rejected++;
  }
  assert.equal(api.nestedTeachingFor({ ...parent, laterality: 'wrong' }, target.study, target.structure), null); rejected++;
  assert.equal(api.nestedTeachingFor(parent, 'brainstem', target.structure), null); rejected++;
  const saved = lesson.body;
  concept.imaging.ultrasound.body = 'mutation';
  assert.equal(api.nestedTeachingFor(parent, target.study, target.structure).imaging.ultrasound.body, saved);
}
console.log({ sourceCommit: parentCommit, concepts: 2, placements: targets.length,
  rendered, rejected, oldImagingUnchanged: true, geometryUnchanged: true,
  clinicalApproval: false, imagesImported: false });
