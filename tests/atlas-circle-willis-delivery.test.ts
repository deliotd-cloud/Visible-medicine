import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

test('regional and whole-body export delivers source-bound Circle of Willis drafts without imaging or approval', () => {
  const root = 'public/atlas-runtime/head-neck/';
  const manifest = JSON.parse(readFileSync(root + 'manifest.json', 'utf8'));
  const inputs = JSON.parse(readFileSync(root + 'source-inputs.json', 'utf8')) as {path:string;sha256:string}[];
  assert.equal(manifest.sourceCommit, 'e6168496a8a59927164fc84c9297583d8ae01339');
  for (const [path, sha256] of Object.entries({
    'app/body-content.ts': 'ae95d816b98e20e2fb17b105f4e5a01af8e0d32ffcf745cbfb200450f85dc04f',
    'content/circle-willis-imaging-pins.json': '8891733101134e78fad8a36d1fd8b7387ea64b20ed2c2d36f3a20e978d6deece',
    'content/circle-willis-imaging.ts': 'd71c9cfe19ceb29934c91832cc3bd39d14a2dec405f4816e5eef4643d8eea2f1',
    'lib/circle-willis-imaging.ts': 'd4e7beb1ae7377777d6c9d93d16da8aac14384cd38e28a7de1cf7e2ecc803e2c',
  })) assert.equal(inputs.find(file => file.path === path)?.sha256, sha256, path);
  for (const region of ['head-neck', 'whole-body']) {
    const scope = manifest.regionalScopes.find((entry: any) => entry.region === region);
    for (const suffix of ['midline:vessel:anterior-communicating-artery',
      'right:vessel:right-anterior-cerebral-artery', 'left:vessel:left-anterior-cerebral-artery',
      'right:vessel:right-posterior-cerebral-artery', 'left:vessel:left-posterior-cerebral-artery',
      'right:vessel:right-posterior-communicating-artery', 'left:vessel:left-posterior-communicating-artery']) {
      assert(scope.regionalIds.includes('vm:anatomy:body:head-neck:' + suffix), region + ': ' + suffix);
    }
  }
  for (const flag of ['patientDataIncluded', 'clinicalApproved', 'standaloneReviewConnection', 'imagingConnection']) assert.equal(manifest[flag], false);
  for (const file of manifest.files) {
    const bytes = readFileSync(root + file.path);
    assert.equal(bytes.length, file.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, file.path);
  }
  // The protected review export is separately built/bound, including the compact-controls update.
  const review = JSON.parse(readFileSync('atlas-review/manifest.json', 'utf8'));
  assert.equal(review.websiteIntegrationSha256, '6eb869a266986db72c94fcac3d968b1336220940f431800b3b8f86c3908fe01a');
});
