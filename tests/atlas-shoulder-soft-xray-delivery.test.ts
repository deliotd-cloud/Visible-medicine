import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { structures } from '../atlas-review/app/anatomy-data.ts';

test('learner and protected review deliver the same six draft shoulder X-ray lessons', () => {
  const root = 'public/atlas-runtime/shoulder/';
  const manifest = JSON.parse(readFileSync(root+'manifest.json','utf8'));
  const review = JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  const inputs = JSON.parse(readFileSync(root+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  assert.equal(manifest.sourceCommit,'ed5215fcd3a8c4c113f8072b552f0a3cc1b5aa82');
  assert.equal(review.revision,manifest.sourceCommit);
  const path = 'lib/shoulder-soft-tissue-xray.ts';
  const actual = createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex');
  assert.equal(inputs.find(f=>f.path===path)?.sha256,actual);
  assert.equal(review.files.find((f:{path:string})=>f.path===path).importedSha256,actual);
  const targets = ['deltoid','supraspinatus','infraspinatus','subscapularis','biceps-long-head','teres-minor'];
  for (const suffix of targets) {
    const structure = structures.find(s=>s.id===`vm:anatomy:upper-limb:shoulder:right:muscle:${suffix}`)!;
    assert(structure);
    assert.equal(structure.sections.xray.readiness,'draft');
    assert.match(structure.sections.xray.title,/X-ray landmarks and limits/);
    assert.match(structure.sections.xray.note!,/radiologist sign-off pending/);
    assert.match(structure.sections.xray.note!,/access remain independent/);
    assert((structure.sections.xray.citations?.length??0)>=2);
  }
  assert.equal(structures.length,9);
  assert.equal(manifest.patientDataIncluded,false);
  assert.equal(manifest.clinicalApproved,false);
  assert.equal(manifest.standaloneReviewConnection,false);
  const revisions = JSON.parse(readFileSync('atlas-review/content/review-revisions.json','utf8'));
  for (const structure of structures) assert.equal(revisions.revisions[structure.id].imaging,null);
});
