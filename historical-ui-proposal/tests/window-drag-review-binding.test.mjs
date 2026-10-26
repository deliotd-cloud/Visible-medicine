import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {admitCurrentPanPresentation} from './head-pan-current-admission.mjs';
const base=new URL('../',import.meta.url),history='tests/fixtures/window-drag-binding-before/';
const read=p=>readFileSync(new URL(p,base)),json=p=>JSON.parse(read(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const old=p=>json(history+p+'.raw');
const once=(text,from,to)=>{assert.equal(text.split(from).length,2,'Unique observed role');return text.replace(from,to);};
export const normalizeContrastBindingCount="  const currentCount='assert.equal(sourceFiles,1567);assert.equal(inputs,1735);assert(artifacts>100);',priorCount=currentCount.replace('1735','1734');\n  assert.equal(text.split(currentCount).length,2,'Exact contrast-binding count role');text=text.replace(currentCount,priorCount);\n";
function checkInputs(receipt,readInput=read){
 const before=old('atlas-review/integration-inputs.json');assert.equal(before.inputs.length,1734);
 const expected=before.inputs.map(r=>r.path==='scripts/bind-clinical-review.mjs'?{...r,sha256:sha(readInput(r.path))}:r.path==='components/HeadAtlasViewer.tsx'?{...r,sha256:admitCurrentPanPresentation(readInput(r.path))}:r).concat([{path:'lib/head-window-drag.ts',sha256:sha(readInput('lib/head-window-drag.ts'))}]).sort((a,b)=>a.path.localeCompare(b.path));
 assert.equal(receipt.inputs.length,1735);assert.deepEqual(receipt.inputs,expected);assert.equal(receipt.sha256,sha(JSON.stringify(expected)));assert.equal(receipt.sourceCommit,before.sourceCommit);
 for(const row of receipt.inputs)assert.equal(sha(readInput(row.path)),row.sha256,row.path);
 return receipt.sha256;
}

test('contrast helper/binder transition and exact pan presentation explain every current Review input',()=>{
 const hash=checkInputs(json('atlas-review/integration-inputs.json'));assert.notEqual(hash,old('atlas-review/integration-inputs.json').sha256);
 const binder=read('scripts/bind-clinical-review.mjs').toString();assert.equal(once(binder,"  'lib/head-window-drag.ts',\n",''),read(history+'scripts/bind-clinical-review.mjs.raw').toString());
 assert.equal(sha(read('lib/head-window-drag.ts')),'02f1ccfe8b5f6fc5cfcec9ffacdbdc511b5fa079b63a60bb9fdd32b08c55effa');
});

test('renderer and shoulder revisions change by the exact presentation hash without migrating source revisions',()=>{
 const hash=checkInputs(json('atlas-review/integration-inputs.json'));
 const body=old('atlas-review/content/body-renderer-revision.json'),shoulder=old('atlas-review/content/review-revisions.json');
 const nextBody={...body,websiteIntegrationSha256:hash,sha256:sha(JSON.stringify({source:body.sourceRendererSha256,website:hash}))};
 assert.deepEqual(json('atlas-review/content/body-renderer-revision.json'),nextBody);assert.notEqual(nextBody.sha256,body.sha256);
 const nextShoulder=structuredClone(shoulder);nextShoulder.websiteIntegrationSha256=hash;
 for(const[id,tracks]of Object.entries(shoulder.sourceRevisions))for(const track of ['geometry','teaching'])nextShoulder.revisions[id][track]=tracks[track]===null?null:sha(JSON.stringify({source:tracks[track],website:hash}));
 assert.deepEqual(json('atlas-review/content/review-revisions.json'),nextShoulder);
 const manifest=old('atlas-review/manifest.json');manifest.websiteIntegrationSha256=hash;
 for(const row of manifest.files)if(['content/body-renderer-revision.json','content/review-revisions.json'].includes(row.path))row.importedSha256=sha(read('atlas-review/'+row.path));
 assert.deepEqual(json('atlas-review/manifest.json'),manifest);
});

test('the prior same-source complete delivery cannot admit the changed presentation',()=>{
 const pin=validateCurrentAtlasDelivery(),before=old('tests/fixtures/current-atlas-delivery.json');
 assert.equal(pin.source,before.source);assert.equal(pin.sourceTree,before.sourceTree);assert.deepEqual(pin.runtimeSources,before.runtimeSources);assert.equal(pin.reviewSourceFiles,1567);
 assert.notEqual(pin.reviewIntegration,before.reviewIntegration);assert.throws(()=>validateCurrentAtlasDelivery({pin:before}),/Current delivery changed/);
 assert.deepEqual(Object.keys(pin).sort(),Object.keys(before).sort());assert(!Object.hasOwn(pin,'clinicalApproval'));assert(!Object.hasOwn(pin,'userAuthorized'));
});

test('all earlier tests and the actual validator retain whole-file inverses',()=>{
 const current=read('tests/current-atlas-delivery.test.mjs').toString();assert.equal(once(current,'assert.equal(sourceFiles,1567);assert.equal(inputs,1735);assert(artifacts>100);','assert.equal(sourceFiles,1567);assert.equal(inputs,1734);assert(artifacts>100);'),read(history+'tests/current-atlas-delivery.test.mjs.raw').toString());
 const historicalTransition=read('tests/fixtures/historical-current-ui-9e14/current-ui-delivery-transition.test.mjs.raw');assert.equal(sha(historicalTransition),'d7d18ae9b36cd593475998420137b7611695aba5a12053abe12fb0c18c27b696');
 let transition=historicalTransition.toString();transition=once(transition,normalizeContrastBindingCount,'');transition=once(transition,'e94dcf1c490f37b9cba6723fb9ef3a0ab0b872a2e3a18d29a6b1d37b8f24a9cf',sha(read(history+'tests/fixtures/current-atlas-delivery.json.raw')));assert.equal(transition,read(history+'tests/current-ui-delivery-transition.test.mjs.raw').toString());
 assert.equal(sha(read('tests/current-atlas-delivery.mjs')),'52551fd5ec16154a78b94f78e0cdfbfee6a1bea629f70714f3dd5f93ccb81bb5');
});

test('missing, foreign, repinned or changed helper inputs cannot pass the exact transition',()=>{
 const actual=json('atlas-review/integration-inputs.json');
 for(const mutate of [r=>r.inputs.pop(),r=>r.inputs.push({path:'foreign.ts',sha256:'0'.repeat(64)}),r=>{r.inputs.find(x=>x.path==='lib/head-window-drag.ts').sha256='0'.repeat(64);}]){
  const bad=structuredClone(actual);mutate(bad);bad.sha256=sha(JSON.stringify(bad.inputs));assert.throws(()=>checkInputs(bad));
 }
 assert.throws(()=>checkInputs(actual,p=>p==='lib/head-window-drag.ts'?Buffer.concat([read(p),Buffer.from('\n// tampered\n')]):read(p)));
});

test('production Review artifacts retain their package set, notices and no-personal-record boundary',()=>{
 const viewer=json('public/atlas-review-viewer/manifest.json'),before=old('public/atlas-review-viewer/manifest.json');
 assert.equal(viewer.sourceCommit,before.sourceCommit);assert.equal(viewer.websiteIntegrationSha256,checkInputs(json('atlas-review/integration-inputs.json')));assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);assert.deepEqual(viewer.packages,before.packages);assert.equal(viewer.packages.length,22);assert.equal(viewer.files.length,46);
 for(const row of viewer.files)assert.equal(sha(read('public/atlas-review-viewer/'+row.path)),row.sha256,row.path);
 assert(viewer.files.some(row=>row.path==='THIRD_PARTY_NOTICES.txt'));
});
