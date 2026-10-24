import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const historical='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const manifestHash='85230df1327b2913bf35cd7071d1a488f47ad7f0885b8640f25ba688895b5bca';
const inputsHash='70bc33c2ee27fdad088cce874c3f93980715241fdc901947547b089ec8fa37ce';
const checkpointHash='254fc6b66c9cafa4358914654d7880736f02a5578fa47627a7fd43f5c9ebc85e';
const exportRoot='F:/VisibleMedicine/staging/20261021-four-module-admission-v2/export/public/atlas-runtime/shoulder/';
const checkpointPath='F:/VisibleMedicine/recovery/checkpoints/20261021-four-modules-verified/checkpoint.json';
const manifestUrl=new URL('./fixtures/renal-epoch-preimage/shoulder-190a-manifest.json.raw',import.meta.url);
const inputsUrl=new URL('./fixtures/renal-epoch-preimage/shoulder-190a-source-inputs.json.raw',import.meta.url);

export function assertHistoricalShoulderSourceRole(checkedCurrent,{
 manifestBytes=readFileSync(manifestUrl),inputsBytes=readFileSync(inputsUrl),
 exportManifestBytes=readFileSync(exportRoot+'manifest.json'),
 exportInputsBytes=readFileSync(exportRoot+'source-inputs.json'),
 checkpointBytes=readFileSync(checkpointPath),
}={}){
 assert.equal(sha(checkpointBytes),checkpointHash,'Independent 190a checkpoint');
 const checkpoint=JSON.parse(checkpointBytes);
 const exported=checkpoint.exportedModules?.find(row=>row.kind==='shoulder');
 assert(exported,'Checkpoint shoulder export row');
 assert.equal(exported.sourceCommit,historical);
 assert.equal(exported.manifestSha256,manifestHash);
 assert.equal(exported.files,28);
 assert.equal(exported.patientDataIncluded,false);
 assert.equal(sha(manifestBytes),manifestHash,'Historical manifest fixture');
 assert.equal(sha(inputsBytes),inputsHash,'Historical source inventory fixture');
 assert.deepEqual(manifestBytes,exportManifestBytes,'Fixture equals independent earlier manifest export');
 assert.deepEqual(inputsBytes,exportInputsBytes,'Fixture equals independent earlier input export');
 const manifest=JSON.parse(manifestBytes),inputs=JSON.parse(inputsBytes);
 assert.equal(manifest.sourceCommit,historical);
 assert.equal(manifest.region,'shoulder-right');
 assert.equal(manifest.files.length,28);
 assert.equal(manifest.patientDataIncluded,false);
 assert.equal(manifest.clinicalApproved,false);
 assert.equal(inputs.length,1120);
 assert.equal(new Set(inputs.map(row=>row.path)).size,inputs.length);
 assert.equal(inputs.find(row=>row.path==='lib/regional-tours.ts'),undefined,
  'Historical shoulder runtime has no regional source input');
 assert.equal(checkedCurrent.source,'b79e110d2d28f18993263926ba35aa7a3f478b20');
 assert.equal(checkedCurrent.runtimeSources.shoulder,checkedCurrent.source,
  'Current shoulder runtime binds the exact current Atlas source');
 assert.equal(checkedCurrent.documents['public/atlas-runtime/shoulder/manifest.json'],
  'f7e5638b534ce80b6b3d959f7b23bf9a16d032325fe6b6b771b5a0ad3b2c9937');
 assert.equal(checkedCurrent.documents['public/atlas-runtime/shoulder/source-inputs.json'],
  '859bd86560e4edd467cce22c7a21f0a87ecb249e7f7c1fae3f0c97d626667936');
 return historical;
}
