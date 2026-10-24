import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifestUrl=new URL('./fixtures/renal-epoch-preimage/shoulder-190a-manifest.json.raw',import.meta.url);
const inputsUrl=new URL('./fixtures/renal-epoch-preimage/shoulder-190a-source-inputs.json.raw',import.meta.url);

export function assertHistoricalShoulderSourceRole(checkedCurrent){
 const manifestBytes=readFileSync(manifestUrl),inputsBytes=readFileSync(inputsUrl);
 assert.equal(sha(manifestBytes),'85230df1327b2913bf35cd7071d1a488f47ad7f0885b8640f25ba688895b5bca');
 assert.equal(sha(inputsBytes),'70bc33c2ee27fdad088cce874c3f93980715241fdc901947547b089ec8fa37ce');
 const manifest=JSON.parse(manifestBytes),inputs=JSON.parse(inputsBytes);
 const historical='190a63238eadcf906abe89dcbb6a67c88afe70b9';
 assert.equal(manifest.sourceCommit,historical,'Exact historical shoulder runtime source');
 assert.equal(inputs.find(row=>row.path==='lib/regional-tours.ts'),undefined,
  'Historical shoulder runtime has no regional source input');
 assert.equal(checkedCurrent.source,'5e75b9ce7e46fed291748108edd7565c97dee101');
 assert.equal(checkedCurrent.runtimeSources.shoulder,checkedCurrent.source,
  'Current shoulder runtime binds the exact current Atlas source');
 return historical;
}
