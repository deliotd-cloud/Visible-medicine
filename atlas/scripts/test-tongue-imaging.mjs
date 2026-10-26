import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {execFileSync} from 'node:child_process';
import esbuild from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const proposal = root;
const oldSnapshot = JSON.parse(execFileSync('git', ['show', '643fd47491a41a0207f106806c17035cb938048b:content/regional-teaching/head-neck.json'], {cwd:root,windowsHide:true,maxBuffer:32e6,encoding:'utf8'}));
const oldLessons = new Map(oldSnapshot.entries.map(e=>[JSON.parse(e.identity).id,e.lessons]));
const pins = JSON.parse(await readFile(`${proposal}/content/tongue-imaging-pins.json`, 'utf8'));
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]` :
  value && typeof value === 'object' ? `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}` : JSON.stringify(value);
const leaves = (value, path = []) => value === null || typeof value !== 'object' ? [path] :
  Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));
const compile = async contents => {
  const result = await esbuild.build({
    stdin: { contents, resolveDir: root, loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm',
    plugins: [{ name: 'proposal-base-imports', setup(build) {
      build.onResolve({ filter: /^\.\/body-source-additions$/ }, () => ({ path: `${root}/lib/body-source-additions.ts` }));
      build.onResolve({ filter: /^\.\.\/app\/body-types$/ }, () => ({ path: `${root}/app/body-types.ts` }));
      build.onResolve({ filter: /^\.\.\/app\/anatomy-data$/ }, () => ({ path: `${root}/app/anatomy-data.ts` }));
      build.onResolve({ filter: /^\.\/content-types$/ }, () => ({ path: `${root}/lib/content-types.ts` }));
    } }],
  });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
};
const { bodyDisplayCatalog, bodyLesson, tongueImagingLesson, tongueImagingReferences, tongueImagingTopics } = await compile(
  `export {bodyDisplayCatalog} from './lib/body-display-catalog.ts';
   export {bodyLesson} from './app/body-content.ts';
   export {tongueImagingLesson} from '${proposal.replaceAll('\\', '/')}/lib/tongue-imaging.ts';
   export {tongueImagingReferences, tongueImagingTopics} from '${proposal.replaceAll('\\', '/')}/content/tongue-imaging.ts';`,
);
const raw = JSON.parse(await readFile(`${root}/public/models/bodyparts3d/full-body/catalog.json`, 'utf8'));
const display = bodyDisplayCatalog(raw);
assert.equal(pins.sourceRevision, '643fd47491a41a0207f106806c17035cb938048b');
assert.equal(pins.sourceVersion, display.sourceVersion);
assert.equal(pins.license, display.license);
assert.equal(canonical(pins.coordinateSystem), canonical(display.coordinateSystem));
assert.deepEqual(pins.entries.map(e => e.identity.fmaId), ['FMA54640', 'FMA46702', 'FMA46698', 'FMA46704', 'FMA46703']);
assert.deepEqual(pins.entries.map(e => e.identity.laterality), ['unpaired', 'left', 'right', 'left', 'right']);
assert.equal(new Set(pins.entries.map(e => e.identity.id)).size, 5);
for (const bundle of pins.bundles) {
  assert.deepEqual(bundle, display.bundles.find(b => b.id === bundle.id));
  const bytes = await readFile(`${root}/public${bundle.url}`);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const ids = new Set(pins.entries.map(e => e.identity.id));
const references = new Set(Object.values(tongueImagingReferences));
assert.equal(references.size, 4);
let placements = 0, rejected = 0, preserved = 0;
for (const entry of pins.entries) {
  const record = display.structures.find(s => s.id === entry.identity.id);
  assert.equal(canonical(record), canonical(entry.identity));
  assert.equal(record.fmaId, entry.identity.fmaId);
  for (const tab of ['ct', 'mri']) {
    assert.equal(oldLessons.get(record.id)[tab].readiness, 'pending', `${record.fmaId}/${tab} original`);
    assert.deepEqual(bodyLesson(record, tab), tongueImagingLesson(record, tab), 'Actual resolver includes the exact lesson');
    const lesson = tongueImagingLesson(record, tab);
    assert.equal(lesson?.readiness, 'draft');
    assert(lesson.body.length > 70 && lesson.bullets.length >= 2);
    assert(lesson.citations.length >= 2 && lesson.citations.every(url => references.has(url)));
    assert.deepEqual(lesson.citations, tongueImagingTopics[entry.group][tab].citations);
    assert(lesson.citations.includes(tongueImagingReferences.tongue));
    assert(lesson.note.includes('radiologist review pending'));
    placements++;
  }
  for (const tab of ['anatomy', 'function', 'xray', 'ultrasound', 'pathology', 'clinical', 'quiz']) {
    assert.equal(tongueImagingLesson(record, tab), undefined);
  }
  const changes = [
    s => { s.id += '-foreign'; }, s => { s.fmaId += '-foreign'; },
    s => { s.laterality = s.laterality === 'left' ? 'right' : 'left'; },
    s => { s.name += ' foreign'; }, s => { s.sourceName += ' foreign'; },
    s => { s.bundle += '-foreign'; }, s => { s.nodeName += '-foreign'; },
    s => { s.regions = ['foreign']; }, s => { s.sourceTree += '-foreign'; },
    s => { s.sources[0].sha256 = '0'.repeat(64); },
    s => { s.sources[0].file += '-foreign'; },
    s => { s.bounds.min[0] += 0.01; }, s => { s.center[0] += 0.01; },
    s => { s.anchor[0] += 0.01; }, s => { s.provenance.sourceVersion += '-foreign'; },
    s => { s.validation.anatomicalReview = !s.validation.anatomicalReview; },
  ];
  for (const mutate of changes) {
    const altered = structuredClone(record); mutate(altered);
    assert.equal(tongueImagingLesson(altered, 'ct'), undefined);
    assert.equal(tongueImagingLesson(altered, 'mri'), undefined);
    rejected += 2;
  }
  for (const path of leaves(record)) {
    const altered = structuredClone(record);
    let parent = altered;
    for (const key of path.slice(0, -1)) parent = parent[key];
    const key = path.at(-1), old = parent[key];
    parent[key] = typeof old === 'number' ? old + 0.01 : typeof old === 'boolean' ? !old : `${old}-foreign`;
    assert.equal(tongueImagingLesson(altered, 'ct'), undefined, `${record.fmaId} ${path.join('.')}`);
    rejected++;
  }
}
for (const record of display.structures) {
  if (ids.has(record.id)) continue;
  for (const tab of ['ct', 'mri']) {
    assert.equal(tongueImagingLesson(record, tab), undefined);
    const resolved = tongueImagingLesson(record, tab) ?? bodyLesson(record, tab);
    assert.deepEqual(resolved, bodyLesson(record, tab));
    preserved++;
  }
}
assert.equal(placements, 10);
assert.equal(preserved, 2 * (display.structures.length - 5));
console.log(JSON.stringify({ placements, rejectedMutations: rejected, preservedNonTargets: preserved, sourceStructures: display.structures.length }));
