import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { currentAtlasDeliveryRoot } from './current-atlas-delivery.mjs';
import { build } from 'esbuild';

test('eight shoulder CT drafts reach learner and protected review without images or approval', async () => {
  const review = JSON.parse(readFileSync('atlas-review/manifest.json', 'utf8'));
  const learner = JSON.parse(readFileSync('public/atlas-runtime/head-neck/manifest.json', 'utf8'));
  const inputs = JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json', 'utf8'));
  assert.equal(review.revision, '190a63238eadcf906abe89dcbb6a67c88afe70b9');
  assert.equal(learner.sourceCommit,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
  const sourceRoot=currentAtlasDeliveryRoot();
  const committed=(revision:string,path:string)=>execFileSync('git',['-C',sourceRoot,'show',revision+':'+path],
    {windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  for (const path of ['content/shoulder-arterial-ct-pins.json', 'content/shoulder-arterial-ct.ts', 'lib/shoulder-arterial-ct.ts']) {
    const file = review.files.find((f: any) => f.path === path); assert(file);
    assert.equal(inputs.find((f: any) => f.path === path)?.sha256, file.sourceSha256);
    assert.equal(createHash('sha256').update(readFileSync('atlas-review/' + path)).digest('hex'), file.importedSha256);
    const current=committed(review.revision,path);
    assert.deepEqual(current,committed('9fba9a1e24b6669aafd48e945d55fc0939d50ab2',path),path+' exact 9f source retained');
    assert.equal(file.sourceSha256,createHash('sha256').update(current).digest('hex'));
  }
  // Pin the current imported dispatch source explicitly alongside its audited review copy.
  assert.equal(createHash('sha256').update(committed('9fba9a1e24b6669aafd48e945d55fc0939d50ab2','app/body-content.ts')).digest('hex'),
    '92add5e49675680abd55f687c08e7d4bbcfcb0ab34e1e0f611cc3da74c3fef9f','original 9f dispatcher source');
  const currentDispatchSha=createHash('sha256').update(committed(review.revision,'app/body-content.ts')).digest('hex');
  assert.equal(currentDispatchSha,'3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2');
  assert.equal(inputs.find((f: any) => f.path === 'app/body-content.ts')?.sha256,currentDispatchSha);
  const dispatch = review.files.find((f: any) => f.path === 'app/body-content.ts');
  assert.equal(dispatch.sourceSha256, currentDispatchSha);
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
    assert((await api.parseBodyReviewResponse(packet, identity.id)));
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
