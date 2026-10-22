import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const base='fixtures/desktop-learning-row/';
const prior='fixtures/drawable-epoch-preimage/';
const oldReview='d5dbb01222de26c1ffcb8adcc754f53b4e87a787d19e9ab5ba3498cfcc8963c9';
const newReview='c4a5647ec3e0047013747d1810b87939a1b8472cb5e334659f5f64ae961d5db3';
const oldBinding='1ff0122debc54ff429998ac9bfc669a0d2ced1563a9c3101024c655db6e9b930';
const newBinding='d83a055839e76d8024fd209fb4f5918487c07e0c598e831f3ee48cb8e0cd5151';
const pins={
 'current-atlas-delivery.json.raw':'72f6809a3e5754b77c7c7a5ed53d2c3d9d1c58b52e1fa14165b20b767de78b8a',
 'clinical-review-desktop-layout.test.mjs.raw':'f85234c45be43ed018de4b1773a1c71e6b3f8dbe4af540e4bc918d6dc7db2e32',
 'body-learning-layout-history-preservation.test.mjs.raw':'835632a7ff5ec67499c971ab1f6ca73828c02e2fdef925754ff8af5c9963fbcc',
 'integration-inputs.json.raw':oldBinding,
};
test('previous live delivery and complete layout/history assertions remain immutable',()=>{
 for(const [p,h]of Object.entries(pins))assert.equal(sha(read(base+p)),h,p);
 for(const p of ['clinical-review-desktop-layout.test.mjs','body-learning-layout-history-preservation.test.mjs']){
  const before=read(base+p+'.raw').toString(),after=read(prior+p+'.raw').toString();
  assert.equal(before.split(oldReview).length,2);assert.equal(before.split(oldBinding).length,2);
  assert.equal(after,before.replace(oldReview,newReview).replace(oldBinding,newBinding));
  assert.equal(after.replace(newReview,oldReview).replace(newBinding,oldBinding),before);
 }
});
test('only the two teaching-presentation inputs changed in the frozen c4a epoch',()=>{
 const before=JSON.parse(read(base+'integration-inputs.json.raw')),after=JSON.parse(read(prior+'documents/atlas-review/integration-inputs.json'));
 assert.equal(before.sha256,oldReview);assert.equal(after.sha256,newReview);
 assert.equal(before.inputs.length,1719);assert.equal(after.inputs.length,1719);
 assert.deepEqual(before.inputs.map(r=>r.path),after.inputs.map(r=>r.path));
 const changed=after.inputs.filter((r,i)=>r.sha256!==before.inputs[i].sha256).map(r=>r.path);
 assert.deepEqual(changed,['components/atlas-body-learning.css','components/AtlasBodyLearning.tsx']);
 const current=JSON.parse(read('fixtures/colic-fa1-preimage/documents/atlas-review/integration-inputs.json.raw'));
 assert.deepEqual(current.inputs.map(r=>r.path),after.inputs.map(r=>r.path));
 const replaced=new Set(['atlas-review/app/body-explorer.css','docs/anatomy-coverage/index.json',
  'lib/anatomy-coverage-view.ts','scripts/import-clinical-review.mjs']);
 const colicReplaced=new Set(['atlas-review/app/body-content.ts',
  'atlas-review/content/body-review-display-pins.json',
  'atlas-review/content/regional-teaching/abdomen.json']);
 for(const r of after.inputs){
  const bytes=read(replaced.has(r.path)?prior+'binding-inputs/'+r.path+'.raw':
   colicReplaced.has(r.path)?'fixtures/colic-fa1-preimage/binding-inputs/'+r.path+'.raw':'../'+r.path);
  assert.equal(sha(bytes),r.sha256,r.path);
 }
});
test('old source remains the same but its former presentation cannot admit the new Review',()=>{
 const before=JSON.parse(read(base+'current-atlas-delivery.json.raw')),after=JSON.parse(read(prior+'current-atlas-delivery.json.raw'));
 assert.throws(()=>validateCurrentAtlasDelivery({pin:before}));
 assert.deepEqual(validateCurrentAtlasDelivery({pin:after,read:p=>read(prior+'documents/'+p)}),after);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:after}),'Former c4a pin is not current fa1');
 const expected=structuredClone(before);expected.reviewIntegration=newReview;
 for(const p of ['atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-review-viewer/manifest.json'])expected.documents[p]=sha(read(prior+'documents/'+p));
 assert.deepEqual(after,expected,'no runtime, model, source, access or package epoch is silently repinned');
});
