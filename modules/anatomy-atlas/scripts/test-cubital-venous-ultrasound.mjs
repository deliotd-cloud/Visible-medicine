import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { build } from './workspace-test-build.mjs';
import source from '../public/models/bodyparts3d/cubital-veins/catalog.json' with { type: 'json' };
import { cubitalVenousUltrasoundReferences } from '../content/cubital-venous-ultrasound.ts';

const baseline = '5f1a0c86d76089a35c711caa951ade1a162a1dbf';
const oldBodyContent = execFileSync('git', ['show', `${baseline}:app/body-content.ts`], { encoding: 'utf8' });
const entry = "export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {bodyLesson} from './app/body-content'; export {bodyReviewMaterial} from './lib/body-review-material'; export {parseBodyReviewResponse} from './lib/body-review-response'; export {cubitalVenousUltrasoundLesson} from './lib/cubital-venous-ultrasound'; import raw from './public/models/bodyparts3d/full-body/catalog.json'; export const catalog=raw;";
async function compile(before = false) {
  const plugins = before ? [{ name: 'pinned-before-cubital-ultrasound', setup(api) {
    api.onLoad({ filter: /[\\/]app[\\/]body-content\.ts$/, namespace: 'workspace-test' }, args => ({
      contents: oldBodyContent, loader: 'ts', resolveDir: dirname(args.path),
    }));
  } }] : [];
  const result = await build({ stdin: { contents: entry, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, write: false, platform: 'node', format: 'esm', plugins });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}

const current = await compile(), prior = await compile(true);
const catalog = current.bodyDisplayCatalog(current.catalog);
const oldCatalog = prior.bodyDisplayCatalog(prior.catalog);
assert.equal(catalog.structures.length, 1104);
assert.deepEqual(catalog, oldCatalog, 'Teaching must not change source or display geometry');
const selected = new Map(source.structures.map(s => [s.id, s]));
assert.equal(selected.size, 4);
assert.deepEqual(new Set(source.structures.map(s => s.fmaId)),
  new Set(['FMA22964', 'FMA22965', 'FMA22968', 'FMA22969']));
assert.deepEqual(source.structures.map(s => s.sources.map(p => p.file).join(',')),
  ['FJ2287', 'FJ2235', 'FJ2286', 'FJ2234']);
const tabs = ['anatomy', 'function', 'ct', 'mri', 'xray', 'ultrasound', 'pathology', 'clinical', 'quiz'];
let changed = 0, unchanged = 0, rejected = 0;
for (const s of catalog.structures) for (const tab of tabs) {
  const now = current.bodyLesson(s, tab), before = prior.bodyLesson(s, tab);
  if (selected.has(s.id) && tab === 'ultrasound') {
    assert.deepEqual(s, selected.get(s.id));
    assert.equal(before.readiness, 'pending');
    assert.equal(now.readiness, 'draft');
    assert.deepEqual(now, current.cubitalVenousUltrasoundLesson(s, tab));
    assert(now.citations.every(url => Object.values(cubitalVenousUltrasoundReferences).includes(url)));
    assert.match(now.note, /revision-bound radiologist review/);
    const saved = structuredClone(now);
    now.bullets.push('foreign'); now.citations.push('foreign');
    assert.deepEqual(current.cubitalVenousUltrasoundLesson(s, tab), saved, 'Lesson arrays must be detached');
    changed++;
  } else {
    assert.equal(current.cubitalVenousUltrasoundLesson(s, tab), undefined);
    assert.deepEqual(now, before, `Unrelated topic changed: ${s.id} ${tab}`);
    unchanged++;
  }
}
assert.equal(changed, 4);
assert.equal(unchanged, 9932);
for (const pin of source.structures) {
  assert.deepEqual(catalog.structures.find(s => s.id === pin.id), pin);
  for (const mutate of [
    s => { s.id += '-foreign'; }, s => { s.fmaId += '-foreign'; },
    s => { s.laterality = s.laterality === 'left' ? 'right' : 'left'; },
    s => { s.bundle += '-foreign'; }, s => { s.sources[0].file += 'M'; },
    s => { s.sources[0].sha256 = '0'.repeat(64); },
    s => { s.regions.pop(); }, s => { s.sourceTree = 'partof'; },
  ]) {
    const bad = structuredClone(pin); mutate(bad);
    assert.equal(current.cubitalVenousUltrasoundLesson(bad, 'ultrasound'), undefined);
    rejected++;
  }
  assert.equal(current.cubitalVenousUltrasoundLesson(pin, 'mri'), undefined);
  assert.equal(current.cubitalVenousUltrasoundLesson(pin, 'ct'), undefined);
  const review = await current.bodyReviewMaterial(pin.id);
  assert.equal(review.approval, false);
  assert.deepEqual(review.source.structure, pin);
  const shown = review.topics.find(t => t.tab === 'ultrasound');
  assert.equal(shown.readiness, 'draft');
  assert.equal(shown.body, current.bodyLesson(pin, 'ultrasound').body);
  assert(await current.parseBodyReviewResponse(review, pin.id));
  const stale = await prior.bodyReviewMaterial(pin.id);
  assert.notEqual(stale.fingerprints.teaching, review.fingerprints.teaching);
  assert.equal(await current.parseBodyReviewResponse(stale, pin.id), null);
  const altered = structuredClone(review);
  altered.topics.find(t => t.tab === 'ultrasound').body += ' foreign';
  assert.equal(await current.parseBodyReviewResponse(altered, pin.id), null);
}
console.log(JSON.stringify({ baseline, changed, unchanged, rejectedSourceMutations: rejected,
  reviewed: selected.size, geometryChanged: false, clinicalApproval: false }));
