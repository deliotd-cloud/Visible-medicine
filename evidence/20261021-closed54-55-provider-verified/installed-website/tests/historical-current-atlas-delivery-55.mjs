// Closed website55 delivery from verified source-only backup 148cf564.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './fixtures/closed56-validator/tests/current-atlas-delivery.mjs';
import {readClosed54Or55BoundSource} from './closed54-55-bound-source.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fixture=new URL('./fixtures/',import.meta.url);
const site=new URL('../',import.meta.url);
const fixed=(name,digest)=>{
 const bytes=readFileSync(new URL(name,fixture));
 assert.equal(sha(bytes),digest,name+' closed55 fixture');
 return bytes;
};
const pinBytes=fixed('current-atlas-delivery-55.json','f15fdf3f9959504ae83e08b777def63b8157dbf954d3721dae54cc9301186e23');
export const revision55=JSON.parse(pinBytes);
assert.equal(revision55.source,'46c43ed8cf121aa046ef5bbaf6c7e67c08ae50cd');
assert.equal(revision55.reviewIntegration,'4f0846e90efe86c86ddbfb5817cbd8b82baaf1b05c3d6eead91caa85a320013d');
assert.equal(revision55.reviewSourceFiles,1531);
const documents=new Set(Object.keys(revision55.documents));
assert.equal(documents.size,12);
const inputs=JSON.parse(fixed('closed55-documents/atlas-review/integration-inputs.json',revision55.documents['atlas-review/integration-inputs.json']));
assert.equal(inputs.sourceCommit,revision55.source);
assert.equal(inputs.sha256,revision55.reviewIntegration);
assert.equal(sha(JSON.stringify(inputs.inputs)),revision55.reviewIntegration);
assert.equal(inputs.inputs.length,1661);
const oldInputs=new Map(inputs.inputs.map(row=>{
 assert.match(row.path,/^[A-Za-z0-9_./-]+$/);
 assert(!row.path.split('/').some(part=>!part||part==='.'||part==='..'));
 assert.match(row.sha256,/^[a-f0-9]{64}$/);
 assert.notEqual(row.sha256,'0'.repeat(64));
 return[row.path,row.sha256];
}));
assert.equal(oldInputs.size,1661);
const review=JSON.parse(fixed('closed55-documents/atlas-review/manifest.json',revision55.documents['atlas-review/manifest.json']));
assert.equal(review.revision,revision55.source);
assert.equal(review.websiteIntegrationSha256,revision55.reviewIntegration);
assert.equal(review.files.length,1531);
const imported=new Map(review.files.map(row=>['atlas-review/'+row.path,row.importedSha256]));
assert.equal(imported.size,1531);
const frozenBytes=fixed('closed55-frozen-changed-text.json','02c0eed3b39c0b8c56f5deca1bc1d5d2bdb8d874ce06a138d6fd30495f45b7aa');
const frozenFixture=JSON.parse(frozenBytes);
assert.equal(frozenFixture.schema,'vm-closed55-changed-text-1');
assert.equal(frozenFixture.source,revision55.source);
assert.equal(frozenFixture.backupCommit,'148cf5647eed565cce74173f6caeccaa339d076f');
assert.deepEqual(frozenFixture.files.map(row=>row.path),[
 'app/workspace/atlas-review/model/page.tsx',
 'app/workspace/atlas-review/model/embedded/page.tsx',
 'atlas-review/content/body-renderer-revision.json',
 'atlas-review/content/review-revisions.json',
]);
const frozen=new Map(frozenFixture.files.map(row=>{
 const bytes=Buffer.from(row.text,'utf8');
 assert.equal(bytes.length,row.bytes,row.path+' old bytes');
 assert.equal(sha(bytes),row.sha256,row.path+' old hash');
 assert.equal(row.sha256,oldInputs.get(row.path)??imported.get(row.path),row.path+' old binding');
 return[row.path,bytes];
}));
const fixedLive=new Map([['tests/fixtures/head-manual-recovery-transition-53-to-54.txt','9f534e855322486783da10fd70ed33a6726ad87646a907364b0cc4a7e193fbb9']]);
const frozenSpecial=new Map([
 ['docs/completion-checklist.json',['completion-checklist-55.json','9f4d614ed6920bff3395b53fed444ce5074aaafc13a0f565b4d4947c68f39bf2']],
 ['tests/current-atlas-delivery.test.mjs',['current-atlas-delivery-test-55.txt','8eee814461c64c903514be3717a8ba88858b1fe63c1448d037d5d1ce879a511f']],
 ['tests/head-manual-recovery-current-transition.test.mjs',['head-manual-recovery-transition-54-to-55.txt','686f68964936c62483e483b013c6ed0bdf105a29908e821989174e8395a841fe']],
]);

export function readRevision55(path,{readLive=p=>readClosed54Or55BoundSource(55,p)}={}){
 assert(typeof path==='string'&&/^[A-Za-z0-9_./-]+$/.test(path)&&!path.split('/').some(part=>!part||part==='.'||part==='..'));
 if(documents.has(path))return fixed('closed55-documents/'+path,revision55.documents[path]);
 if(path==='components/head-atlas.css'){
  const bytes=fixed('closed56-overrides/components/head-atlas.css','214fbad37e04a7ecd371c073ffb13c36cbcb5eccb208201a314bc6f0d0fdfb15');
  assert.equal(sha(bytes),oldInputs.get(path),path+' unchanged across closed55/56');
  return bytes;
 }
 if(path==='components/HeadAtlasViewer.tsx'){
  const bytes=fixed('closed56-inputs/components/HeadAtlasViewer.raw','06b4c293f5931f5cd0e36471de46718c6bbf26ea3500ec24c57c4de15e476841');
  assert.equal(sha(bytes),oldInputs.get(path),path+' closed55 binding');
  return bytes;
 }
 if(frozenSpecial.has(path))return fixed(...frozenSpecial.get(path));
 if(frozen.has(path))return Buffer.from(frozen.get(path));
 const expected=oldInputs.get(path)??imported.get(path)??fixedLive.get(path);
 assert(expected,'Closed55 path not bound: '+path);
 const bytes=readLive(path);
 assert(Buffer.isBuffer(bytes),'Closed55 live reader must return raw bytes');
 assert.equal(sha(bytes),expected,path+' unchanged closed55 input');
 return bytes;
}

export function validateRevision55Delivery({pin=revision55}={}){
 return validateCurrentAtlasDelivery({pin,read:readRevision55});
}

export function readRevision55Register(){
 const register=JSON.parse(readRevision55('docs/completion-checklist.json'));
 assert.equal(register.revision,55);
 return register;
}
