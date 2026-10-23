import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {admitCurrentPanPresentation,CURRENT_PAN_PRESENTATION_SHA256} from './head-pan-current-admission.mjs';

const base=new URL('../',import.meta.url),history='tests/fixtures/head-pan-binding-before/';
const read=path=>readFileSync(new URL(path,base));
const json=path=>JSON.parse(read(path));
const old=path=>JSON.parse(read(history+path+'.raw'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const component='components/HeadAtlasViewer.tsx';
const beforeComponent='tests/fixtures/head-pan-before/HeadAtlasViewer.tsx.raw';
const once=(value,from,to)=>{assert.equal(value.split(from).length,2,'Exact unique source role');return value.replace(from,to);};

function checkInputs(receipt,readInput=read){
  const before=old('atlas-review/integration-inputs.json');
  assert.equal(before.inputs.length,1735);
  assert.equal(before.inputs.find(row=>row.path===component).sha256,sha(read(beforeComponent)));
  const expected=before.inputs.map(row=>row.path===component?{...row,sha256:CURRENT_PAN_PRESENTATION_SHA256}:row);
  assert.equal(receipt.sourceCommit,before.sourceCommit);
  assert.equal(receipt.inputs.length,1735);
  assert.deepEqual(receipt.inputs,expected);
  assert.equal(receipt.sha256,sha(JSON.stringify(expected)));
  for(const row of receipt.inputs)assert.equal(sha(readInput(row.path)),row.sha256,row.path);
  assert.equal(admitCurrentPanPresentation(readInput(component)),CURRENT_PAN_PRESENTATION_SHA256);
  return receipt.sha256;
}

test('the captured old component is refused and only the current byte presentation is admitted',()=>{
  assert.equal(sha(read(beforeComponent)),'97b93a4b7af313042a6a54e8f9983b42c3eb8beb8b30222e4ee2d5d9f4812d73');
  assert.equal(admitCurrentPanPresentation(read(component)),CURRENT_PAN_PRESENTATION_SHA256);
  assert.throws(()=>admitCurrentPanPresentation(read(beforeComponent)),/Unreviewed pan presentation/);
  assert.throws(()=>admitCurrentPanPresentation(read(component).toString()),/file bytes/);
  assert.throws(()=>admitCurrentPanPresentation(Buffer.concat([read(component),Buffer.from('\n')])),/Unreviewed pan presentation/);
});

test('all 1735 source inputs have one exact component hash delta and no source change',()=>{
  const before=old('atlas-review/integration-inputs.json');
  assert.notEqual(checkInputs(json('atlas-review/integration-inputs.json')),before.sha256);
  assert.equal(sha(read('scripts/bind-clinical-review.mjs')),before.inputs.find(row=>row.path==='scripts/bind-clinical-review.mjs').sha256);
  assert.equal(sha(read('lib/head-window-drag.ts')),before.inputs.find(row=>row.path==='lib/head-window-drag.ts').sha256);
});

test('body and shoulder revision formulae use the new website hash and old source revisions',()=>{
  const integration=checkInputs(json('atlas-review/integration-inputs.json'));
  const body=old('atlas-review/content/body-renderer-revision.json');
  assert.deepEqual(json('atlas-review/content/body-renderer-revision.json'),{
    ...body,websiteIntegrationSha256:integration,
    sha256:sha(JSON.stringify({source:body.sourceRendererSha256,website:integration})),
  });
  const shoulder=old('atlas-review/content/review-revisions.json'),expected=structuredClone(shoulder);
  expected.websiteIntegrationSha256=integration;
  for(const [id,tracks] of Object.entries(shoulder.sourceRevisions))for(const track of ['geometry','teaching']){
    expected.revisions[id][track]=tracks[track]===null?null:sha(JSON.stringify({source:tracks[track],website:integration}));
  }
  assert.deepEqual(json('atlas-review/content/review-revisions.json'),expected);
});

test('Review manifest changes only the website binding and imported revision hashes',()=>{
  const integration=checkInputs(json('atlas-review/integration-inputs.json'));
  const expected=old('atlas-review/manifest.json');
  assert.equal(expected.files.length,1567);
  expected.websiteIntegrationSha256=integration;
  for(const row of expected.files)if(['content/body-renderer-revision.json','content/review-revisions.json'].includes(row.path)){
    row.importedSha256=sha(read('atlas-review/'+row.path));
  }
  const actual=json('atlas-review/manifest.json');
  assert.deepEqual(actual,expected);
  assert.equal(actual.revision,old('atlas-review/manifest.json').revision);
});

test('complete current delivery admits the new pin while the exact predecessor is refused',()=>{
  const before=old('tests/fixtures/current-atlas-delivery.json'),pin=validateCurrentAtlasDelivery();
  assert.equal(pin.source,before.source);
  assert.equal(pin.sourceTree,before.sourceTree);
  assert.deepEqual(pin.runtimeSources,before.runtimeSources);
  assert.equal(pin.reviewSourceFiles,1567);
  assert.equal(pin.reviewIntegration,checkInputs(json('atlas-review/integration-inputs.json')));
  assert.notEqual(pin.reviewIntegration,before.reviewIntegration);
  assert.throws(()=>validateCurrentAtlasDelivery({pin:before}),/Current delivery changed/);
  assert.deepEqual(Object.keys(pin).sort(),Object.keys(before).sort());
  for(const [path,digest] of Object.entries(before.documents))if(!['atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-review-viewer/manifest.json'].includes(path)){
    assert.equal(pin.documents[path],digest,path);
    assert.equal(sha(read(path)),digest,path);
  }
  for(const path of ['atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-review-viewer/manifest.json']){
    assert.equal(pin.documents[path],sha(read(path)),path);
    assert.notEqual(pin.documents[path],before.documents[path],path);
  }
  assert(!Object.hasOwn(pin,'clinicalApproval'));assert(!Object.hasOwn(pin,'userAuthorized'));
});

test('original 41-case contract, validator, and adapted test suites retain whole-file inverses',()=>{
  assert.deepEqual(read('tests/current-atlas-delivery.test.mjs'),read(history+'tests/current-atlas-delivery.test.mjs.raw'));
  assert.equal(sha(read('tests/current-atlas-delivery.mjs')),'52551fd5ec16154a78b94f78e0cdfbfee6a1bea629f70714f3dd5f93ccb81bb5');
  let transition=read('tests/current-ui-delivery-transition.test.mjs').toString();
  transition=once(transition,sha(read('tests/fixtures/current-atlas-delivery.json')),sha(read(history+'tests/fixtures/current-atlas-delivery.json.raw')));
  assert.equal(transition,read(history+'tests/current-ui-delivery-transition.test.mjs.raw').toString());
  let drag=read('tests/window-drag-review-binding.test.mjs').toString();
  drag=once(drag,"import {admitCurrentPanPresentation} from './head-pan-current-admission.mjs';\n",'');
  drag=once(drag,"sha256:sha(readInput(r.path))}:r.path==='components/HeadAtlasViewer.tsx'?{...r,sha256:admitCurrentPanPresentation(readInput(r.path))}:r).concat","sha256:sha(readInput(r.path))}:r).concat");
  drag=once(drag,'contrast helper/binder transition and exact pan presentation explain every current Review input','one exact new helper and one exact binder edit explain every new Review input');
  assert.equal(drag,read(history+'tests/window-drag-review-binding.test.mjs.raw').toString());
});

test('recomputed receipts cannot admit missing, foreign, repinned, or tampered component inputs',()=>{
  const actual=json('atlas-review/integration-inputs.json');
  for(const mutate of [
    receipt=>{receipt.inputs=receipt.inputs.filter(row=>row.path!==component);},
    receipt=>{receipt.inputs.push({path:'foreign.ts',sha256:'0'.repeat(64)});},
    receipt=>{receipt.inputs.find(row=>row.path===component).sha256='0'.repeat(64);},
  ]){
    const bad=structuredClone(actual);mutate(bad);bad.sha256=sha(JSON.stringify(bad.inputs));
    assert.throws(()=>checkInputs(bad));
  }
  assert.throws(()=>checkInputs(actual,path=>path===component?read(beforeComponent):read(path)));
  assert.throws(()=>checkInputs(actual,path=>path===component?Buffer.concat([read(path),Buffer.from('\n// changed')]):read(path)));
});

test('built viewer retains exact package notices, privacy flag, and every declared file hash',()=>{
  const viewer=json('public/atlas-review-viewer/manifest.json'),before=old('public/atlas-review-viewer/manifest.json');
  assert.equal(viewer.sourceCommit,before.sourceCommit);
  assert.equal(viewer.websiteIntegrationSha256,checkInputs(json('atlas-review/integration-inputs.json')));
  assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);
  assert.deepEqual(viewer.packages,before.packages);assert.equal(viewer.packages.length,22);
  assert.equal(viewer.files.length,46);
  const notices=before.files.find(row=>row.path==='THIRD_PARTY_NOTICES.txt');
  assert.deepEqual(viewer.files.find(row=>row.path==='THIRD_PARTY_NOTICES.txt'),notices);
  for(const row of viewer.files)assert.equal(sha(read('public/atlas-review-viewer/'+row.path)),row.sha256,row.path);
});
