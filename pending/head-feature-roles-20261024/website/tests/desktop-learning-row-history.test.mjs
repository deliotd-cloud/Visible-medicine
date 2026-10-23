import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateHistorical2381Delivery as validateCurrentAtlasDelivery,readDesktopHistoricalSource,assertActualHeadFeatureDelivery} from './head-feature-source-roles.mjs';
import {restorePreExpansionFrame} from './expansion-frame-adoption-inverse.mjs';
import {restoreHeadToolsBefore20261022} from './head-tools-epoch-20261022.mjs';
import {beforeSurfaceBinder} from './surface-binder-history-inverse.mjs';
const read=readDesktopHistoricalSource;
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
const framePath='components/AtlasRuntimeFrame.tsx';
const binderPath='scripts/bind-clinical-review.mjs';
const headViewerPath='components/HeadAtlasViewer.tsx';
const frozenHeadViewer=()=>Buffer.from(restoreHeadToolsBefore20261022(
 read('../'+headViewerPath),read('fixtures/head-toolbar-before-compaction-20261022.tsx.raw')));
const frozenHeadNeck=()=>{
 const live=read('../atlas-review/content/regional-teaching/head-neck.json');
 assert.equal(sha(live),'574d55fe8bfdfdc0b6af35c2e1497162320a42e4190962795639667d72e240fd','Exact later neck X-ray source');
 const source=JSON.parse(live),priorXray={readiness:'pending',title:'X-ray teaching pending',
  body:'A source-specific X-ray lesson has not yet been authored for this selection. The coloured 3D surface is not a radiograph.',
  note:'No X-ray image, detector geometry or registered correspondence is loaded. Separate imaging-atlas and lecture access will be checked independently.'};
 for(const [index,title] of [[0,'Hyoid bone'],[128,'Cricoid cartilage'],[233,'Epiglottis']]){
  assert.equal(source.entries[index].lessons.xray.title,`${title} · Lateral neck radiograph orientation · draft`);
  source.entries[index].lessons.xray=priorXray;
 }
 const restored=Buffer.from(JSON.stringify(source)+'\n');
 assert.equal(sha(restored),'e6a486cc4ab9745eae110615b340fa1797bb0e6e0b72195f083bec766543da25','Exact pre-neck-X-ray Review source');
 return restored;
};
const frozenImporter=()=>{
 const bytes=read('fixtures/head-surface-before-20261022/lib__head-atlas-import.ts.raw');
 assert.equal(sha(bytes),'9fcb349f19c69fee2a6221870a0db3de090c7cd2265b98f6a04d87c9d6098b57','Exact pre-surface importer');
 return bytes;
};
const frozenFrame=()=>{
 const live=read('../'+framePath),priorFrame=read('fixtures/atlas-runtime-expansion-before-20261022/AtlasRuntimeFrame.tsx.raw');
 assert.equal(sha(live),'7d4d9d36f5f8b7a88477355ba76b3adb4e93d080cff9356dfe5725f3fc6c76d8','Exact later same-tab frame');
 assert.equal(sha(priorFrame),'335b8b70b2ff60c3a951efb9eb18d98de8d230411c00896ff4a4123eff051261','Exact c4a/fa1 frame preimage');
 const restored=Buffer.from(restorePreExpansionFrame(live.toString('utf8')));
 assert.deepEqual(restored,priorFrame,'Whole current frame inverses to frozen binding source');
 return restored;
};
const frozenBinder=()=>{
 const live=read('../'+binderPath),priorBinder=read('fixtures/atlas-runtime-expansion-before-20261022/bind-clinical-review.mjs.raw');
 const preSurface=beforeSurfaceBinder(live.toString('utf8'),read('fixtures/head-surface-before-20261022/scripts__bind-clinical-review.mjs.raw').toString('utf8'));
 const addition="  'components/atlas-runtime-expansion.ts','components/atlas-runtime-frame.css',\n";
 assert.equal(sha(preSurface),'0339eedafdc65e60fb35efd7f59c839a57afa274966c405e4b373f8722f95d06','Exact later same-tab binder');
 assert.equal(sha(priorBinder),'d8ce02c58eba914cc3243714c59dd35cbc0c38f7ddab90df626b14fdf0c7ef8d','Exact c4a/fa1 binder preimage');
 assert.equal(preSurface.split(addition).length,2,'One authenticated binder addition');
 const restored=Buffer.from(preSurface.replace(addition,''));
 assert.deepEqual(restored,priorBinder,'Whole current binder inverses to frozen binding source');
 return restored;
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
 const historicalFrame=frozenFrame();
 const historicalBinder=frozenBinder();
 const before=JSON.parse(read(base+'integration-inputs.json.raw')),after=JSON.parse(read(prior+'documents/atlas-review/integration-inputs.json'));
 assert.equal(before.sha256,oldReview);assert.equal(after.sha256,newReview);
 assert.equal(before.inputs.length,1719);assert.equal(after.inputs.length,1719);
 assert.deepEqual(before.inputs.map(r=>r.path),after.inputs.map(r=>r.path));
 assert.equal(after.inputs.find(r=>r.path===framePath)?.sha256,sha(historicalFrame),'Frozen c4a frame binding');
 assert.equal(after.inputs.find(r=>r.path===binderPath)?.sha256,sha(historicalBinder),'Frozen c4a binder binding');
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
  const bytes=r.path===framePath?historicalFrame:r.path===binderPath?historicalBinder:r.path===headViewerPath?frozenHeadViewer():
   r.path==='atlas-review/content/regional-teaching/head-neck.json'?frozenHeadNeck():r.path==='lib/head-atlas-import.ts'?frozenImporter():read(replaced.has(r.path)?prior+'binding-inputs/'+r.path+'.raw':
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

test('actual delivery independently retains the current desktop and Review binding',()=>{
 const pin=assertActualHeadFeatureDelivery();
 assert.equal(pin.runtimeSources.shoulder,pin.source);
 assert.equal(pin.runtimeSources['lower-limb'],pin.source);
 assert.equal(pin.runtimeSources['female-pelvis'],pin.source);
});
