import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';

test('all integrated learner modules and Clinical Review bind the tested guided keyboard fix', () => {
  const revision='bb4d1766b788d0236cc325eb11a6074d67fec0c7';
  const cameraHash='9d13fb2b2c498fff6fae7944b4f6ed95d4563dc9d0e1653eed0cb716aa6743a0';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  assert.equal(review.revision,revision);
  const camera=review.files.find((file:{path:string})=>file.path==='app/fitted-camera.tsx');
  assert.equal(camera.sourceSha256,cameraHash);
  assert.equal(sha(readFileSync('atlas-review/app/fitted-camera.tsx')),camera.importedSha256);
  const source=readFileSync('atlas-review/app/fitted-camera.tsx','utf8');
  const keyboardPrelude=source.match(/return bindCameraKeyboard\(gl\.domElement, \(\) => controls\.current, \(\) => \{([\s\S]*?)capture\(\);/);
  assert.ok(keyboardPrelude);
  assert.ok(keyboardPrelude[1].includes('transition.current = null;'));
  for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']) {
    const base=`public/atlas-runtime/${name}/`;
    const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
    assert.equal(manifest.sourceCommit,revision);
    assert.equal(manifest.patientDataIncluded,false);
    assert.equal(manifest.clinicalApproved,false);
    const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
    assert.deepEqual(inputs.filter((input:{path:string})=>input.path==='app/fitted-camera.tsx'),
      [{path:'app/fitted-camera.tsx',sha256:cameraHash}]);
    for(const file of manifest.files) {
      const bytes=readFileSync(base+file.path);
      assert.equal(bytes.length,file.bytes);assert.equal(sha(bytes),file.sha256);
    }
  }
});
