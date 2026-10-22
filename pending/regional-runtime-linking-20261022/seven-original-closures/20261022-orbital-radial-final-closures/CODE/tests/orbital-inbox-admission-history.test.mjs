import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const originalPath=new URL('./fixtures/orbital-inbox-source-before-current-admission.txt',import.meta.url);
const activePath=new URL('./clinical-review-inbox-source-update.test.ts',import.meta.url);
const originalSha256='4cbdbfd69d43a4f12e407dcd27ccc2794751822259d12ba976cad074553ae2f9';
const staleLiveSource='408759d57644b05402e98a937e7cf6338b5509cf';

// This exact source transformation is the admission contract. Historical source
// epochs, all worksheet assertions, DB read/write checks and account isolation
// remain byte-for-byte as captured. The frozen test is evidence of the old test
// body, not a claim that it ran against an unavailable original website epoch.
const changes=[
 [
  "import type {InboxItem} from '../lib/clinical-review-inbox-contract.ts';\n",
  "import type {InboxItem} from '../lib/clinical-review-inbox-contract.ts';\nimport {checkedAtlasSourceRepo} from './atlas-source-repo.mjs';\nimport {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n",
 ],
 ["const atlas='F:/VisibleMedicine/atlas';",'const atlas=checkedAtlasSourceRepo(CURRENT_ATLAS_REVISION);'],
 ["const current='408759d57644b05402e98a937e7cf6338b5509cf';\n",''],
 [
  " const manifest=json('atlas-review/manifest.json');assert.equal(manifest.revision,current);",
  " const liveDelivery=validateCurrentAtlasDelivery();assert.equal(liveDelivery.source,CURRENT_ATLAS_REVISION);\n const manifest=json('atlas-review/manifest.json');assert.equal(manifest.revision,CURRENT_ATLAS_REVISION);",
 ],
 [
  ' const sourceHead=execFileSync(\'git\',[\'rev-parse\',\'HEAD\'],{cwd:atlas,encoding:\'utf8\',windowsHide:true}).trim();assert.equal(sourceHead,current);',
  ' const sourceHead=execFileSync(\'git\',[\'rev-parse\',\'HEAD\'],{cwd:atlas,encoding:\'utf8\',windowsHide:true}).trim();assert.equal(sourceHead,CURRENT_ATLAS_REVISION);',
 ],
 [
  "  assert.equal(row.href,'/workspace/atlas-review/body?structure='+encodeURIComponent(id),id);",
  "  assert.equal(row.href,'/workspace/atlas-review/body?structure='+encodeURIComponent(id)+'&t=teaching',id);",
 ],
];

test('orbital inbox retains exact original source except enumerated live-admission expressions',()=>{
 const originalBytes=readFileSync(originalPath);
 assert.equal(createHash('sha256').update(originalBytes).digest('hex'),originalSha256);
 let expected=originalBytes.toString('utf8');
 for(const [before,after] of changes){
  assert.equal(expected.split(before).length,2,'Transformation anchor must occur exactly once');
  expected=expected.replace(before,after);
 }
 assert.equal(readFileSync(activePath,'utf8'),expected);
});

test('the prior live source pin is refused by current delivery admission',()=>{
 const admitted=validateCurrentAtlasDelivery();
 assert.equal(admitted.source,CURRENT_ATLAS_REVISION);
 assert.notEqual(staleLiveSource,CURRENT_ATLAS_REVISION);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...admitted,source:staleLiveSource}}));
});
