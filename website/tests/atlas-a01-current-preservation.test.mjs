import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {authenticatedArterialA01Source} from './arterial-a01-history-transport.mjs';
import {authenticatedCervicalA01Source} from './cervical-a01-history-transport.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const inverseBytes=readFileSync(new URL('./fixtures/atlas-727-originals/ROLE_INVERSE.json',import.meta.url));
assert.equal(sha(inverseBytes),'4a1fca2496868dcc011c4c3b2c16c9743a87d16d534f7a2768f663ab511e2a46','Exact reviewed inverse map');
const inverse=JSON.parse(inverseBytes);
const expected=['atlas-arterial-current-delivery.test.mjs','atlas-cervical-current-delivery.test.mjs'];
const roleReceiptPath='F:/VisibleMedicine/staging/20261025-cervical-role-website/SOURCE_CANDIDATE.json';
const roleReceiptSha='77d9a0e3ddbae2b32376e8c6205451d1deb8d2109378697d64e9ed59b6999270';
const roleWebsite='F:/VisibleMedicine/staging/20261025-cervical-role-website/website';
const nineDispatchSha='d6888ecd211a2927c7313caed1a3e094f9d385a290e2b4f539201786fe46d5cb';
const nineDispatchSuccessorSha='7d7ecafa8d4179b1acbb3649b770db785f808edc31fdfd658acedd1aa3f8e3c6';
const wrapperHashes={
 'atlas-arterial-current-delivery.test.mjs':'22541cd0939c6886671b3cacc91eb3022f02edbbe5afb1767313c1be2ad68631',
 'atlas-cervical-current-delivery.test.mjs':'5d413bacdec15f194ece9e5ee4adfa435ee655cfd59ecb930904125efaad7130',
};
function authenticatedOriginal(row){
 const active=readFileSync(new URL('./'+row.name,import.meta.url));
 assert.equal(sha(active),wrapperHashes[row.name],'Only the declared current dispatch wrapper');
 const dispatcher=readFileSync(new URL('./nine-history-dispatch.mjs',import.meta.url));
 assert.equal(sha(dispatcher),nineDispatchSuccessorSha,'Exact nine-root dispatcher successor');
 const before="VM_NOTICE_WAVE4_ATLAS:'F:/VisibleMedicine/atlas'";
 const after="VM_NOTICE_WAVE4_ATLAS:'F:/VisibleMedicine/staging/20261021-body-learning-source-candidate/atlas'";
 const current=dispatcher.toString('utf8');
 assert(Buffer.from(current,'utf8').equals(dispatcher),'Lossless dispatcher text');
 assert.equal(current.split(after).length,2,'One historical notice-role seam');
 assert.equal(sha(Buffer.from(current.replace(after,before),'utf8')),nineDispatchSha,
  'Complete prior nine-root dispatcher and assertions restored');
 const receiptBytes=readFileSync(roleReceiptPath);
 assert.equal(sha(receiptBytes),roleReceiptSha,'Exact 727 historical receipt');
 const receipt=JSON.parse(receiptBytes);
 assert.equal(receipt.website,roleWebsite,'Only the declared 727 website');
 const path='tests/'+row.name,rows=receipt.sourceRows.filter(item=>item.path===path);
 assert.equal(rows.length,1,'One historical whole-root source');
 assert.equal(rows[0].sha256,row.sourceSha256,'Historical receipt and inverse agree');
 const old=readFileSync(roleWebsite+'/'+path);
 assert.equal(old.length,rows[0].bytes,'Historical whole-root length');
 assert.equal(sha(old),rows[0].sha256,'Historical whole-root bytes');
 const frozen=readFileSync(new URL('./nine-history-original-'+row.name.replace(/\.test\.mjs$/,'.mjs'),import.meta.url));
 assert(old.equals(frozen),'Nine-root fixture equals authenticated historical whole source');
 return old;
}
test('both distinct a01 whole roots retain the complete unchanged 727 originals and exact inverse',()=>{
 assert.equal(inverse.schema,'vm-a01-role-exact-inverse/1');
 assert.deepEqual(inverse.rows.map(row=>row.name),expected);
 for(const row of inverse.rows){
  const old=authenticatedOriginal(row);
  const raw=readFileSync(new URL('./fixtures/atlas-727-originals/'+row.name+'.raw',import.meta.url));
  const candidate=readFileSync(new URL('./'+row.candidate,import.meta.url));
  assert(old.equals(raw),'Authenticated original and frozen raw are byte-exact: '+row.name);
  assert.equal(sha(raw),row.sourceSha256);
  let changed=candidate.toString('utf8');
  if(row.name==='atlas-arterial-current-delivery.test.mjs'){
   assert.equal(sha(candidate),'ed852936914dd8e7b5503a85dc07e40552e902d300866ffc32a95a759620561e',
    'Only the exact six-case historical-transport successor');
   const historical=authenticatedArterialA01Source();
   assert.equal(sha(historical),'e19493fd0a7445efa0f00cd292fed53fb55131bcddb09e8f6dccda5177a3d9df',
    'Complete a01 predecessor in its authenticated source context');
   const marker="import {assertCurrentArterialPrefix} from './arterial-delivery-roles.mjs';";
   assert.equal(historical.toString('utf8').split(marker).length,2,'One original a01 role boundary');
   assert(changed.startsWith(historical.toString('utf8').split(marker)[0]),
    'The five current product cases and setup retain byte-exact source before historical transport');
   changed=historical.toString('utf8');
  }
  if(row.name==='atlas-cervical-current-delivery.test.mjs'){
   assert.equal(sha(candidate),'954845c86d56afc041a4297a3eb661cd88973b66b76dfd75183162a137f83c08',
    'Exact historical-transport successor with three bounded child-environment guards');
   assert.deepEqual([...candidate.toString('utf8').matchAll(/^test\('([^']+)'/gm)].map(m=>m[1]),[
    'six source-pinned cervical X-ray drafts reach learner, Review and four intact runtimes',
    'supplied existing temporary directory resolves independently of drive',
    'invalid temporary paths are refused',
    'child environment uses one canonical temp and fixed source pins',
   ]);
   const historical=authenticatedCervicalA01Source();
   assert.equal(sha(historical),'5fe782b276f564ff09d64fddadb564c24c831174362cade7ef62f7849c565bee',
    'Complete cervical a01 predecessor in its authenticated source context');
   assert.deepEqual([...historical.toString('utf8').matchAll(/^test\('([^']+)'/gm)].map(m=>m[1]),
    ['six source-pinned cervical X-ray drafts reach learner, Review and four intact runtimes']);
   changed=historical.toString('utf8');
  }
  assert.equal(changed.split("'./a01-delivery-binding.mjs'").length-1,1,'Integration helper import');
  changed=changed.replace("'./a01-delivery-binding.mjs'","'../a01-delivery-binding.mjs'");
  assert.equal(sha(Buffer.from(changed)),row.semanticSha256,'Only relocation from proved semantic source');
  if(row.name.startsWith('atlas-arterial')){
   const marker="import {assertArterialRoleIdentity,assertCurrentArterialPrefix} from './arterial-delivery-roles.mjs';";
   const prefix=raw.toString('utf8').split(marker)[0];
   assert(changed.startsWith(prefix),'All original setup and first five cases remain byte-exact');
  }
  for(const {before,after} of [...row.changes].reverse()){
   assert.equal(changed.split(after).length-1,1,'One exact substitution to reverse');
   changed=changed.replace(after,before);
  }
  assert.equal(sha(Buffer.from(changed)),row.sourceSha256,'Full original restored');
  assert.equal((candidate.toString('utf8').match(/^test\('/gm)||[]).length,row.name.startsWith('atlas-arterial')?6:4,'All historical and child-environment cases retained');
 }
});
