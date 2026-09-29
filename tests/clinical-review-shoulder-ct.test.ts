import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

test('eight shoulder CT drafts reach learner and protected review without images or approval', async () => {
  const review = JSON.parse(readFileSync('atlas-review/manifest.json', 'utf8'));
  const learner = JSON.parse(readFileSync('public/atlas-runtime/head-neck/manifest.json', 'utf8'));
  const inputs = JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json', 'utf8'));
  assert.equal(review.revision, 'c55db3aba23f5f260ef09955b470650a8485800a');
  assert.equal(learner.sourceCommit, review.revision);
  for (const path of ['content/shoulder-arterial-ct-pins.json', 'content/shoulder-arterial-ct.ts', 'lib/shoulder-arterial-ct.ts']) {
    const file = review.files.find((f: any) => f.path === path); assert(file);
    assert.equal(inputs.find((f: any) => f.path === path)?.sha256, file.sourceSha256);
    assert.equal(createHash('sha256').update(readFileSync('atlas-review/' + path)).digest('hex'), file.importedSha256);
  }
  // Existing dispatch source has checkout CRLF/LF mixing after a Windows patch;
  // the review importer reads Git's LF blob. Pin both audited forms explicitly.
  assert.equal(inputs.find((f: any) => f.path === 'app/body-content.ts')?.sha256,
    'a974be279f6dc96660d838fa0323f5ccbf48104d536fba688e141de3159dac71');
  const dispatch = review.files.find((f: any) => f.path === 'app/body-content.ts');
  assert.equal(dispatch.sourceSha256, 'e88cf0d8a38be93fb57426473878911c52ed9acb9e89ae2cf18f71496faa12b1');
  assert.equal(createHash('sha256').update(readFileSync('atlas-review/app/body-content.ts')).digest('hex'), dispatch.sourceSha256);
  for (const key of ['patientDataIncluded', 'clinicalApproved', 'imagingConnection', 'standaloneReviewConnection']) assert.equal(learner[key], false);
  const pins = JSON.parse(readFileSync('atlas-review/content/shoulder-arterial-ct-pins.json', 'utf8'));
  assert.equal(createHash('sha256').update(JSON.stringify(pins)).digest('hex'), 'bc3c2f3f12a010fa7303310f0932882ef7f22b3911255a18044db9c70c524812');
  const result = await build({ stdin: { contents: `
    export * from './atlas-review/lib/body-review-material';
    export * from './atlas-review/lib/body-review-response';
    export * from './atlas-review/lib/body-review-context';
    export * from './atlas-review/lib/shoulder-arterial-ct';
  `, resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
  const api = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
  assert.equal(pins.entries.length, 8);
  for (const { identity } of pins.entries) {
    for (const region of ['shoulder-arm', 'whole-body']) {
      assert(learner.regionalScopes.find((s: any) => s.region === region).regionalIds.includes(identity.id));
    }
    const packet = await api.bodyReviewMaterial(identity.id);
    assert(api.parseBodyReviewResponse(packet, identity.id));
    assert.equal(packet.approval, false);
    const { tab, ...lesson } = packet.topics.find((t: any) => t.tab === 'ct');
    assert.equal(tab, 'ct');
    assert.deepEqual(lesson, api.shoulderArterialCtLesson(identity, 'ct'));
    assert.equal(lesson.readiness, 'draft');
    assert.match(lesson.note, /radiologist review/);
    assert.match(lesson.note, /No patient images, registration or clinical approval/);
    assert.match(lesson.note, /access remain independent/);
    const context = await api.bodyReviewContext(identity.id);
    assert.equal(context.teachingHash, packet.fingerprints.teaching);
    assert.equal(context.revisions.imaging, null);
    assert.equal(api.shoulderArterialCtLesson({ ...identity, laterality: 'foreign' }, 'ct'), undefined);
    assert.equal(api.shoulderArterialCtLesson(identity, 'mri'), undefined);
  }
});
