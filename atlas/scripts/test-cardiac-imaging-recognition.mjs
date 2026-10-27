import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { build } from './workspace-test-build.mjs';
import pins from '../content/cardiac-imaging-recognition-pins.json' with { type: 'json' };

const root = new URL('../', import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/, '');
const baseline = '7181b153132b55a682ddbe6558f5dca181643bf0';
assert.equal(pins.parentHead, baseline);
const old = path => execFileSync('git', ['--no-replace-objects', 'show', `${baseline}:${path}`],
  { cwd: root, maxBuffer: 32e6, windowsHide: true }).toString('utf8');
const sha = body => createHash('sha256').update(body).digest('hex');
const plain = value => JSON.parse(JSON.stringify(value));
async function load(previous) {
  const built = await build({
    stdin: { contents: "export {nestedConcepts,nestedTeachingReferences} from './content/nested-teaching';", resolveDir: root, loader: 'ts' },
    bundle: true, write: false, platform: 'node', format: 'esm',
    plugins: previous ? [{ name: 'exact-parent-cardiac-teaching', setup(api) {
      api.onLoad({ filter: /cardiac-teaching\.ts$/ }, args => ({
        contents: old('content/cardiac-teaching.ts'), loader: 'ts', resolveDir: dirname(args.path),
      }));
    } }] : [],
  });
  return import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
}
const [now, before] = await Promise.all([load(false), load(true)]);
assert.equal(now.nestedConcepts.length, before.nestedConcepts.length);
const refs = plain(now.nestedTeachingReferences);
const priorRefs = plain(before.nestedTeachingReferences);
assert.deepEqual(refs.cardiacRightHeart2025, {
  title: 'Mukherjee et al. / ASE · Right heart assessment (2025), Tables 2–3 and focused views',
  url: 'https://www.asecho.org/wp-content/uploads/2026/08/ASE-Right-Heart-Guidelines-May-2025.pdf',
  scopedToConcept: true,
});
delete refs.cardiacRightHeart2025;
assert.deepEqual(refs, priorRefs, 'all older references exact');
assert.deepEqual(Object.keys(pins.sections).sort(), [
  'left-atrium/mri', 'left-ventricle/mri', 'right-atrium/mri',
  'right-atrium/ultrasound', 'right-ventricle/mri', 'right-ventricle/ultrasound',
]);
const oldById = new Map(before.nestedConcepts.map(c => [c.id, c]));
let changed = 0, mriWords = 0, usWords = 0;
for (const concept of now.nestedConcepts) {
  const prior = oldById.get(concept.id);
  assert(prior, `known concept ${concept.id}`);
  const projected = plain(concept);
  for (const modality of ['mri', 'ultrasound']) {
    const key = `${concept.id.replace(/^cardiac-/, '')}/${modality}`;
    const pin = pins.sections[key];
    if (!pin) continue;
    const current = concept.imaging[modality], previous = prior.imaging[modality];
    assert.deepEqual(plain(previous), pin.before, `${key} parent section pinned`);
    assert.deepEqual(plain(current), pin.after, `${key} authored section pinned`);
    assert.equal(sha(current.body), pin.afterBodySha256);
    assert.equal(sha(previous.body), pin.beforeBodySha256);
    assert.equal(current.readiness, 'draft');
    assert.equal(previous.readiness, 'draft');
    assert(current.references.every(id => Object.hasOwn(now.nestedTeachingReferences, id)), `${key} refs resolve`);
    if (modality === 'mri') {
      assert.deepEqual(current.references, ['cardiacMR']);
      mriWords += current.body.split(/\s+/u).length;
    } else {
      assert.deepEqual(current.references, ['cardiacEcho', 'cardiacRightHeart2025']);
      usWords += current.body.split(/\s+/u).length;
    }
    projected.imaging[modality] = plain(previous);
    changed++;
  }
  assert.deepEqual(projected, plain(prior), `${concept.id}: all other anatomy, clinical, pathology and imaging exact`);
}
assert.equal(changed, 6);
assert(mriWords <= 180, `MRI word budget ${mriWords}`);
assert(usWords <= 180, `US word budget ${usWords}`);
for (const path of ['content/nested-teaching.ts', 'lib/nested-review-material.ts',
  'content/nested-review-bindings.json', 'public/models/bodyparts3d/full-body/catalog.json'])
  assert.deepEqual(readFileSync(new URL(`../${path}`, import.meta.url)), Buffer.from(old(path)), `${path} unchanged`);
console.log(JSON.stringify({ baseline, changed, mriWords, usWords, draft: true, approval: false }));
