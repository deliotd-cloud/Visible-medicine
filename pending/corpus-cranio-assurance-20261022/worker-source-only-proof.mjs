import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const stage=fileURLToPath(new URL('.',import.meta.url));
const website='F:/VisibleMedicine/staging/20261022-head-practice-exit-candidate/website';
const atlas='F:/VisibleMedicine/staging/20261022-review-traversal-candidate/atlas';
const head='2381efe43b75f8a7fb768a069eecd7268c508dac';
const tree='db21ed3dee259c390878450b3495468996a3af85';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=(root,relative)=>readFileSync(path.join(root,relative));
const git=(...args)=>execFileSync('git',args,{cwd:atlas,encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
const rows=[
  {
    name:'corpus-xray-v2-current-delivery.test.mjs',
    pre:'28be69bc03dd3b78665ccf5947fb2fd33077654ed6a26bf03bad6bf9c3e6207e',
    changes:[
      ["const delivery=validateCurrentAtlasDelivery(),atlas=currentAtlasDeliveryRoot();assert.equal(delivery.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');",
       "const delivery=validateCurrentAtlasDelivery(),atlas=currentAtlasDeliveryRoot();assert.equal(delivery.source,'2381efe43b75f8a7fb768a069eecd7268c508dac');"],
    ],
  },
  {
    name:'craniofacial-ct-current-delivery.test.mjs',
    pre:'2de47b24e78247eb1aa1d60d5d8763a35a79e3f5cc3ab3e136fef6c726490ecc',
    changes:[
      ["const source='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',tree='e9165d7122361f809a267af1414b337b69097fe2';",
       "const source='2381efe43b75f8a7fb768a069eecd7268c508dac',tree='db21ed3dee259c390878450b3495468996a3af85';"],
      ['assert.equal(delivery.reviewSourceFiles,1558);','assert.equal(delivery.reviewSourceFiles,1562);'],
      ['assert.equal(inputs.inputs.length,1724);','assert.equal(inputs.inputs.length,1729);'],
    ],
  },
];

assert.equal(sha(read('F:/VisibleMedicine/staging/20261022-head-practice-exit-candidate','SOURCE_V2.json')),'d388db43518ff7ccd443a8e7977e7ac67b2f49a696eb294529992ba64fc4132d');
const receipt=JSON.parse(read('F:/VisibleMedicine/staging/20261022-head-practice-exit-candidate','SOURCE_V2.json'));
assert.equal(receipt.atlasHead,head);assert.equal(receipt.atlasTree,tree);
assert.equal(receipt.review,'1a48d6bc674a007b4e6be7ebdb777810ca0f2ee3e373d58b53d22a43ba9babfc');
assert.equal(git('rev-parse','HEAD'),head);assert.equal(git('rev-parse','HEAD^{tree}'),tree);
assert.equal(git('status','--porcelain'),'');
const pin=JSON.parse(read(website,'tests/fixtures/current-atlas-delivery.json'));
const review=JSON.parse(read(website,'atlas-review/manifest.json'));
const inputs=JSON.parse(read(website,'atlas-review/integration-inputs.json'));
assert.equal(pin.source,head);assert.equal(pin.sourceTree,tree);
assert.equal(pin.reviewSourceFiles,1562);assert.equal(review.files.length,1562);
assert.equal(pin.reviewIntegration,inputs.sha256);assert.equal(inputs.inputs.length,1729);
assert.equal(review.revision,head);assert.equal(inputs.sourceCommit,head);
assert.equal(pin.runtimeSources['head-neck'],head);
for(const name of ['shoulder','lower-limb','female-pelvis'])assert.equal(pin.runtimeSources[name],'190a63238eadcf906abe89dcbb6a67c88afe70b9');
const teaching=['content/corpus-spongiosum-xray-v2.pins.json','content/corpus-spongiosum-xray-v2.transition.json','content/corpus-spongiosum-xray-v2.ts','lib/corpus-spongiosum-xray-v2.ts','content/regional-teaching/pelvis.json'];
assert.equal(git('diff','--name-only','190a63238eadcf906abe89dcbb6a67c88afe70b9',head,'--',...teaching),'');

for(const row of rows){
  const relative='tests/'+row.name;
  const original=read(stage,'preimages/'+relative);
  assert.equal(sha(original),row.pre,relative+': authenticated preimage');
  assert.deepEqual(read(website,relative),original,relative+': frozen candidate source');
  let expected=original.toString('utf8');
  for(const [before,after] of row.changes){
    assert.equal(expected.split(before).length,2,relative+': one exact seam');
    expected=expected.replace(before,after);
  }
  const proposal=read(stage,'proposal/'+relative);
  assert.equal(proposal.toString('utf8'),expected,relative+': whole-source inverse permits only declared seams');
  let inverse=proposal.toString('utf8');
  for(const [before,after] of [...row.changes].reverse()){
    assert.equal(inverse.split(after).length,2,relative+': unique reverse seam');
    inverse=inverse.replace(after,before);
  }
  assert.equal(inverse,original.toString('utf8'),relative+': complete historical inverse');
  console.log(relative+' pre='+row.pre+' proposed='+sha(proposal)+' seams='+row.changes.length);
}
console.log('SOURCE_ONLY_PASS receipt/current binder/Git teaching/whole-source inverses; native tests not run');
