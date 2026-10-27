import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateChecklist} from '../scripts/refresh-completion-checklist.mjs';
import {validateRevision49Delivery as validateCurrentAtlasDelivery,readRevision49} from './historical-deep-plantar-delivery-49.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const root=new URL('../',import.meta.url);
const read=path=>readRevision49(path);
const frozen=(path,digest)=>{
 const bytes=read(path);
 assert.equal(sha(bytes),digest,path+' original bytes');
 return bytes;
};
const oldReview='ff04c4435115d236dd00d635897f732fd9cd8e5ff0335a959e1d0fa966761871';
const newReview='6ab73d99218734e11175a95d6564bb9321abf303592d052ed7e665a9fc38eb9d';
const oldTest=frozen('tests/fixtures/current-atlas-delivery-before-head-client.test.mjs.raw','acd39bedc55e358dc577418600d781d408a7d1c25038d1bf57b63bfa274e2064');
const oldPin=JSON.parse(frozen('tests/fixtures/current-atlas-delivery-48-before-head-client.json','68c4008ad83a0bbb5be53db16d715453ee9b71a9ed6e4f5a27c3fd32bd99a539'));
const oldInputs=JSON.parse(frozen('tests/fixtures/integration-inputs-48-before-head-client.json','747debf661f679d52c165035969a16b00bc126eda77fb5e2d1bd47322d5ba241'));
const oldRegister=validateChecklist(JSON.parse(frozen('tests/fixtures/completion-checklist-48-before-head-client.json','43f95364c4063151cbf9266c8e94e24fdc76f9b309f2603780bb085ca4d06117')));

test('current admission changes exactly the one Review literal in the complete old test',()=>{
 const before=`assert.equal(pin.reviewIntegration,'${oldReview}');`;
 const after=`assert.equal(pin.reviewIntegration,'${newReview}');`;
 const old=oldTest.toString('utf8'),now=read('tests/current-atlas-delivery.test.mjs').toString('utf8');
 assert.equal(old.split(before).length,2);
 assert.equal(now.split(after).length,2);
 assert.deepEqual(Buffer.from(now.replace(after,before),'utf8'),oldTest);
});

test('revision49 retains all 71 items, eight optional items and historical register entries',()=>{
 const now=validateChecklist(JSON.parse(read('docs/completion-checklist.json')));
 const pin=validateCurrentAtlasDelivery();
 assert.equal(oldRegister.revision,48);
 assert.equal(now.revision,49);
 assert.equal(oldRegister.items.length,71);
 assert.equal(now.items.length,71);
 assert.equal(now.items.filter(item=>item.scope==='optional').length,8);
 assert.deepEqual(now.items,oldRegister.items,'All statuses, owners, scope, acceptance and evidence survive');
 assert.deepEqual(now.statusDefinitions,oldRegister.statusDefinitions);
 assert.deepEqual(now.rules,oldRegister.rules);
 assert.deepEqual(now.roots,oldRegister.roots);
 assert.deepEqual(now.pendingAtlasSource,oldRegister.pendingAtlasSource);
 assert.deepEqual(now.changeLog.slice(1),oldRegister.changeLog);
 assert.equal(now.changeLog[0].revision,49);
 const {reviewIntegration:oldBinding,...oldBaseline}=oldRegister.baseline;
 const {reviewIntegration:newBinding,...newBaseline}=now.baseline;
 assert.deepEqual(newBaseline,oldBaseline,'No source, approval, scope or inventory baseline migration');
 assert.equal(oldBinding,oldReview);
 assert.equal(newBinding,newReview);
 assert.equal(newBinding,pin.reviewIntegration);
 assert.equal(now.baseline.privateClinicalDecisionCounts,null);
 assert.equal(now.baseline.publicReleaseApproval,null);
});

test('revision49 pin documents actual files and leaves unrelated source documents exact',()=>{
 const pin=validateCurrentAtlasDelivery();
 assert.equal(pin.reviewIntegration,newReview);
 assert.equal(pin.source,oldPin.source);
 assert.equal(pin.sourceTree,oldPin.sourceTree);
 assert.equal(pin.reviewSourceFiles,oldPin.reviewSourceFiles);
 assert.equal(pin.viewerFiles,oldPin.viewerFiles);
 assert.equal(pin.viewerPackages,oldPin.viewerPackages);
 assert.deepEqual(Object.keys(pin.documents).sort(),Object.keys(oldPin.documents).sort());
 const changed=new Set(['atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-review-viewer/manifest.json']);
 for(const [path,hash] of Object.entries(oldPin.documents)){
  if(!changed.has(path))assert.equal(pin.documents[path],hash,path+' unchanged');
 }
 for(const [path,hash] of Object.entries(pin.documents))assert.equal(sha(read(path)),hash,path+' actual bytes');
 assert.equal(JSON.parse(read('atlas-review/manifest.json')).websiteIntegrationSha256,newReview);
 assert.equal(JSON.parse(read('public/atlas-review-viewer/manifest.json')).websiteIntegrationSha256,newReview);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:oldPin}),/Current delivery changed:/,'Revision48 cannot admit revision49');
});

test('normal Review49 changes only the two stated hashes among the same 1,649 paths',()=>{
 const now=JSON.parse(read('atlas-review/integration-inputs.json'));
 assert.equal(oldInputs.sha256,oldReview);
 assert.equal(now.sha256,newReview);
 assert.equal(now.sourceCommit,oldInputs.sourceCommit);
 assert.equal(now.inputs.length,1649);
 assert.equal(oldInputs.inputs.length,1649);
 assert.deepEqual(now.inputs.map(row=>row.path),oldInputs.inputs.map(row=>row.path));
 const changed=now.inputs.flatMap((row,i)=>row.sha256===oldInputs.inputs[i].sha256?[]:[row.path]);
 assert.deepEqual(changed,['lib/head-atlas-import.ts','lib/head-load-progress.ts']);
 for(const path of changed){
  const old=oldInputs.inputs.find(row=>row.path===path);
  const current=now.inputs.find(row=>row.path===path);
  assert.notEqual(current.sha256,old.sha256,path+' changed');
  assert.equal(sha(read(path)),current.sha256,path+' actual source');
 }
 assert.equal(sha(Buffer.from(JSON.stringify(now.inputs))),newReview);
});

test('old historical proof changes only its declared live-to-frozen seams',()=>{
 const raw=frozen('tests/fixtures/completion-checklist-current-transition-before-head-client.test.mjs.raw','949e02d86188ec669c4829e621f8765ce420e495ec6735135be7e9d8b595ce5c');
 const old=raw.toString('utf8');
 const edits=[
  ["const current=validateChecklist(JSON.parse(readFileSync(new URL('../docs/completion-checklist.json',import.meta.url))));",
   "const current=validateChecklist(fixture('completion-checklist-48-before-head-client.json','43f95364c4063151cbf9266c8e94e24fdc76f9b309f2603780bb085ca4d06117'));\nconst revision48Pin=fixture('current-atlas-delivery-48-before-head-client.json','68c4008ad83a0bbb5be53db16d715453ee9b71a9ed6e4f5a27c3fd32bd99a539');\nconst revision48Inputs=fixture('integration-inputs-48-before-head-client.json','747debf661f679d52c165035969a16b00bc126eda77fb5e2d1bd47322d5ba241');"],
  [' const pin=validateCurrentAtlasDelivery();',' const pin=revision48Pin;'],
  [" const next=JSON.parse(readFileSync(new URL('../atlas-review/integration-inputs.json',import.meta.url)));",' const next=revision48Inputs;'],
 ];
 let expected=old;
 for(const [before,after] of edits){
  assert(expected.includes(before),before);
  expected=expected.replaceAll(before,after);
 }
 assert.equal(sha(Buffer.from(expected)),'0fa8e77bf740b1717d0b3fc991b87ef4a755c4246dd40058412193bbdde10a5d','Exact reconstructed head-client historical proof');
 const historical=expected;
 const oldImport="import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';";
 const currentImports="import {validateCurrentAtlasDelivery as validateStrictCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\nimport {validateHistoricalAtlasDelivery as validateCurrentAtlasDelivery} from './historical-atlas-delivery-register47.mjs';";
 assert.equal(expected.split(oldImport).length,2,'One exact later validator import seam');
 expected=expected.replace(oldImport,currentImports);
 assert.equal(expected.split(currentImports).length,2);
 assert.equal(expected.replace(currentImports,oldImport),historical,'Exact later validator import inverse');
 const schema2Append="\ntest('current schema-2 admission refuses the exact closed revision47 schema-1 packet',()=>{\n assert.equal(priorPin.schema,'vm-current-atlas-test-delivery-1');\n assert.throws(()=>validateStrictCurrentAtlasDelivery({pin:priorPin}),{\n  code:'ERR_ASSERTION',actual:'vm-current-atlas-test-delivery-1',expected:'vm-current-atlas-test-delivery-2',\n });\n});\n";
 assert(expected.endsWith('});\n')&&!expected.includes('current schema-2 admission refuses the exact closed revision47 schema-1 packet'));
 expected+=schema2Append;
 assert.equal(expected.slice(0,-schema2Append.length).replace(currentImports,oldImport),historical,'Exact later schema-2 append inverse');
 assert.equal(sha(Buffer.from(expected)),'46d16b7db39a8c489652bf4b1e6de973a06d067e302993273e98e6f525d1765a','Authenticated current proof bytes');
 assert.deepEqual(read('tests/completion-checklist-current-transition.test.mjs'),Buffer.from(expected));
 const original=frozen('tests/fixtures/head-stream-current-pin-preservation-before-head-client.test.mjs.raw','ac99ad82f9aefed480968a1d0c17fb5454abe05328bc6235bdf116279fd5fafe').toString('utf8');
 const replacement=original.replace("new URL('./current-atlas-delivery.test.mjs',import.meta.url)","new URL('./fixtures/current-atlas-delivery-ff04-before-head-client.test.mjs.raw',import.meta.url)");
 assert.notEqual(replacement,original);
 assert.deepEqual(read('tests/head-stream-current-pin-preservation.test.mjs'),Buffer.from(replacement));
 assert.deepEqual(frozen('tests/fixtures/current-atlas-delivery-ff04-before-head-client.test.mjs.raw','acd39bedc55e358dc577418600d781d408a7d1c25038d1bf57b63bfa274e2064'),oldTest);
});

test('byte policy and its checkout proof only extend the prior exact paths',()=>{
 const priorPolicy=frozen('tests/fixtures/gitattributes-before-head-client.raw','4eb22ce584239a0bb289d8cbae5cb587c3720a3e4e9133450233a3c0234a6e27');
 const policy=read('.gitattributes');
 assert(policy.subarray(0,priorPolicy.length).equals(priorPolicy),'Original Git byte policy is exact prefix');
 const old=frozen('tests/fixtures/exact-test-fixture-eol-before-head-client.test.mjs.raw','9a9bc0449b7df52b5174f1cd5724205225096bf3f90b2217c9fc7ac7a77f1022').toString('utf8');
 const now=read('tests/exact-test-fixture-eol.test.mjs').toString('utf8');
 const snapshots=`  'tests/fixtures/completion-checklist-48-before-head-client.json',\n  'tests/fixtures/current-atlas-delivery-48-before-head-client.json',\n  'tests/fixtures/integration-inputs-48-before-head-client.json',\n  'tests/fixtures/current-atlas-delivery-before-head-client.test.mjs.raw',\n  'tests/fixtures/current-atlas-delivery-ff04-before-head-client.test.mjs.raw',\n  'tests/fixtures/head-stream-current-pin-preservation-before-head-client.test.mjs.raw',\n  'tests/fixtures/completion-checklist-current-transition-before-head-client.test.mjs.raw',\n  'tests/fixtures/exact-test-fixture-eol-before-head-client.test.mjs.raw',\n  'tests/fixtures/gitattributes-before-head-client.raw',\n`;
 const exact="  'tests/head-client-current-transition.test.mjs',\n  'lib/head-load-progress.ts',\n  'lib/head-atlas-import.ts',\n  'vite.config.ts',\n  'tests/head-client-diagnostics.test.ts',\n  'tests/head-client-loader-trace.test.ts',\n";
 assert.deepEqual(now.replace(snapshots,'').replace(exact,''),old,'No existing checkout assertion changed');
});
