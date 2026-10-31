import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const sourceRoot=process.env.VM_WEBSITE_ROOT;
const sourceBase=sourceRoot?pathToFileURL(join(sourceRoot,'tests')+'/'):new URL('./',import.meta.url);
const {validateCurrentAtlasDelivery}=await import(new URL('./current-atlas-delivery.mjs',sourceBase));

const read=path=>readFileSync(new URL(path,sourceBase));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const frozen='fixtures/body-learning-current-admission/';
const formerCurrent='fixtures/drawable-epoch-preimage/';
const oldPin=read(frozen+'current-atlas-delivery-190.json.raw');
const oldHelper=read(frozen+'current-atlas-delivery-190.mjs.raw');
const oldTest=read(frozen+'current-atlas-delivery-190.test.mjs.raw');
const oldRoute=read(frozen+'atlas-delivery-route-190.test.mjs.raw');
const old='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const current='0dfce15890cafc0a2b8e309193531daa29a672ed';
const one=(text,before,after)=>{
  assert.equal(text.split(before).length,2,'exactly one declared transition: '+before.slice(0,90));
  return text.replace(before,after);
};

test('four prior190 inputs are immutable and cannot admit the subsequent 0df epoch',()=>{
  for(const [bytes,digest] of [
    [oldPin,'a3cc2b4f72a2eae0d66cd25b1693c38e5c6cd49250f275dc18ef80d4283c9e21'],
    [oldHelper,'dfcce9763cba89e6d94f6e7e75ceb59f79ca73ac0d6056552bbe00139e804d62'],
    [oldTest,'8695689615b454aea30feb3095645b00503b1ecf0e3bcc392a7c76da2747e751'],
    [oldRoute,'2e6e776dc93fe3a69d5d95b640e59a02b36becd4f20cef58e9044ad7b34f2d20'],
  ])assert.equal(sha(bytes),digest);
  const previous=JSON.parse(oldPin),admitted=JSON.parse(read(formerCurrent+'current-atlas-delivery.json.raw'));
  assert.equal(previous.schema,'vm-current-atlas-test-delivery-1');assert.equal(previous.source,old);
  assert.equal(admitted.schema,'vm-current-atlas-test-delivery-2');assert.equal(admitted.source,current);
  assert.throws(()=>validateCurrentAtlasDelivery({pin:previous}));
  assert.equal(admitted.runtimeSources['head-neck'],current);
  for(const family of ['shoulder','lower-limb','female-pelvis'])assert.equal(admitted.runtimeSources[family],old);
  assert.deepEqual(Object.keys(admitted.documents),Object.keys(previous.documents),'all twelve document roles preserved');
  const changed=Object.keys(admitted.documents).filter(path=>admitted.documents[path]!==previous.documents[path]);
  assert.deepEqual(changed,['atlas-review/manifest.json','atlas-review/integration-inputs.json',
    'public/atlas-review-viewer/manifest.json','lib/atlas-model-inventory.json',
    'public/atlas-runtime/head-neck/manifest.json','public/atlas-runtime/head-neck/source-inputs.json']);
  const historicalValidator=read(formerCurrent+'current-atlas-delivery.mjs.raw');
  assert.equal(sha(historicalValidator),'52551fd5ec16154a78b94f78e0cdfbfee6a1bea629f70714f3dd5f93ccb81bb5');
  assert(historicalValidator.includes(Buffer.from('assert.equal(pin.viewerFiles,46);assert.equal(pin.viewerPackages,22);')),
    'Historical 0df validator retains its exact viewer-count gate');
  assert.equal(admitted.viewerFiles,46);assert.equal(admitted.viewerPackages,22);
  for(const [path,digest] of Object.entries(admitted.documents))
    assert.equal(sha(read(formerCurrent+'documents/'+path)),digest,path+': exact historical document');
  const viewer=JSON.parse(read(formerCurrent+'documents/public/atlas-review-viewer/manifest.json'));
  assert.equal(viewer.files.length,46);assert.equal(viewer.packages.length,22);
  assert.throws(()=>validateCurrentAtlasDelivery({pin:admitted}),'Former 0df pin cannot admit fa1 delivery');
});

test('test-only helper has an exact whole-source inverse outside declared epoch seams',()=>{
  const before=oldHelper.toString(),after=read('current-atlas-delivery.mjs').toString();
  const seams=[
    ["assert.equal(pin.schema,'vm-current-atlas-test-delivery-1');",
     "assert.equal(pin.schema,'vm-current-atlas-test-delivery-2');"],
    ["['schema','source','sourceTree','reviewIntegration','reviewSourceFiles','viewerFiles','viewerPackages','documents'].sort()",
     "['schema','source','sourceTree','runtimeSources','reviewIntegration','reviewSourceFiles','viewerFiles','viewerPackages','documents'].sort()"],
    [" assert(Number.isSafeInteger(pin.reviewSourceFiles)&&pin.reviewSourceFiles>0);",
     " assert(pin.runtimeSources&&typeof pin.runtimeSources==='object'&&!Array.isArray(pin.runtimeSources));\n assert.deepEqual(Object.keys(pin.runtimeSources).sort(),[...modules].sort());\n for(const name of modules)assert.match(pin.runtimeSources[name],/^[a-f0-9]{40}$/,'Exact runtime source: '+name);\n assert.equal(pin.runtimeSources['head-neck'],pin.source,'Review and regional root runtime share the current source');\n assert(Number.isSafeInteger(pin.reviewSourceFiles)&&pin.reviewSourceFiles>0);"],
    ["assert.equal(manifest.sourceCommit,pin.source);assert.equal(manifest.patientDataIncluded,false);",
     "assert.equal(manifest.sourceCommit,pin.runtimeSources[name]);assert.equal(manifest.patientDataIncluded,false);"],
    ["assert.equal(entry.sourceCommit,pin.source);assert.equal(entry.manifestSha256",
     "assert.equal(entry.sourceCommit,pin.runtimeSources[name]);assert.equal(entry.manifestSha256"],
    ['assert.equal(pin.viewerFiles,46);assert.equal(pin.viewerPackages,22);',
     'assert.equal(pin.viewerFiles,54);assert.equal(pin.viewerPackages,24);'],
    ['export function currentAtlasDeliveryRoot(){\n const pin=validateCurrentAtlasDelivery(),root=checkedAtlasSourceRepo(pin.source);',
     'export function currentAtlasDeliveryRoot({pin:requestedPin}={}){\n const pin=validateCurrentAtlasDelivery(requestedPin===undefined?{}:{pin:requestedPin}),root=checkedAtlasSourceRepo(pin.source);'],
  ];
  let expected=before;
  for(const [from,to]of seams)expected=one(expected,from,to);
  assert.equal(after,expected,'every other helper statement remains exact');
  let inverse=after;
  for(const [from,to]of seams.toReversed())inverse=one(inverse,to,from);
  assert.equal(inverse,before);
  assert.throws(()=>assert.equal(after.replace('assert.equal(pin.viewerFiles,54);',
    'assert.equal(pin.viewerFiles,46);'),expected),
   'Current viewer count cannot masquerade as the historical epoch');
});

test('current test keeps all prior historical and refusal assertions outside declared seams',()=>{
  const before=oldTest.toString(),after=read('current-atlas-delivery.test.mjs').toString();
  for(const phrase of [
    "test('closed55 current pin remains immutable historical evidence'",
    "test('closed 6ba delivery pin remains immutable historical evidence'",
    "test('previous complete bc925 delivery and its contract stay exact but cannot admit the new source'",
    "['invented clinical approval',p=>{p.clinicalApproval=true;}]",
    "['personal records','public/atlas-review-viewer/manifest.json'",
    "['model substitution','lib/atlas-model-inventory.json'",
  ])assert(before.includes(phrase)&&after.includes(phrase),phrase);
  assert.equal((after.match(/assert\.throws\(\(\)=>validateCurrentAtlasDelivery/g)||[]).length>=
    (before.match(/assert\.throws\(\(\)=>validateCurrentAtlasDelivery/g)||[]).length,true);
});

test('route test retains stale/current/forged private GET and HEAD cases',()=>{
  const before=oldRoute.toString(),after=read('atlas-delivery-route.test.mjs').toString();
  for(const phrase of [
    "test('exact stale policy refuses GET and HEAD before administrator authorization'",
    "test('current route reaches private administrator review with exact inventory digest for GET and HEAD'",
    "test('one-field forged inventory refuses GET and HEAD before authorization'",
    "for(const method of ['GET','HEAD'])",
    "assert(mismatch>=0&&downstream>mismatch",
  ])assert(before.includes(phrase)&&after.includes(phrase),phrase);
});
