// Closed website54 evidence; never admit live bytes without the old binding hash.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './fixtures/closed56-validator/tests/current-atlas-delivery.mjs';
import {readRevision55} from './historical-current-atlas-delivery-55.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fixture=new URL('./fixtures/',import.meta.url);
const site=new URL('../',import.meta.url);
const pinBytes=readFileSync(new URL('current-atlas-delivery-6ba0dd43.json',fixture));
assert.equal(sha(pinBytes),'dc317ee27d8e297255d77b3ad418da6066d73fd5b066074c52b88ed5473bc92b');
export const revision54=JSON.parse(pinBytes);
assert.equal(revision54.source,'6ba0dd43c0512ce8d5b0dae7150ae605f176c2fb');
assert.equal(revision54.reviewIntegration,'af91db5ca835c33841628a71b52e6aa0f18ef258260e4866529731ed86a68373');
const documents=new Set(Object.keys(revision54.documents));
assert.equal(documents.size,12);
const inputs=JSON.parse(readFileSync(new URL('closed54-documents/atlas-review/integration-inputs.json',fixture)));
assert.equal(inputs.sourceCommit,revision54.source);
assert.equal(inputs.sha256,revision54.reviewIntegration);
assert.equal(inputs.inputs.length,1658);
const oldInputs=new Map(inputs.inputs.map(row=>{
 assert.match(row.path,/^[A-Za-z0-9_./-]+$/);
 assert(!row.path.split('/').some(part=>!part||part==='.'||part==='..'));
 assert.match(row.sha256,/^[a-f0-9]{64}$/);
 assert.notEqual(row.sha256,'0'.repeat(64));
 return[row.path,row.sha256];
}));
assert.equal(oldInputs.size,1658);
const frozenBytes=readFileSync(new URL('closed54-frozen-changed-text.json',fixture));
assert.equal(sha(frozenBytes),'71485a177578c5980b968f62aae28ae9b462819c4c7ce4db70ffe8fa951dad98');
const frozenFixture=JSON.parse(frozenBytes);
assert.equal(frozenFixture.schema,'vm-closed54-frozen-changed-text-1');
assert.equal(frozenFixture.source,revision54.source);
assert.equal(frozenFixture.backupCommit,'28edf5e8');
assert.equal(frozenFixture.files.length,7);
const frozen=new Map(frozenFixture.files.map(row=>{
 const bytes=Buffer.from(row.text,'utf8');
 assert.equal(bytes.length,row.bytes,row.path+' frozen length');
 assert.equal(sha(bytes),row.sha256,row.path+' frozen hash');
 if(oldInputs.has(row.path))assert.equal(row.sha256,oldInputs.get(row.path),row.path+' closed54 input');
 else assert.equal(row.path,'tests/current-atlas-delivery.test.mjs');
 return[row.path,bytes];
}));
assert.equal(frozen.size,7);
assert.equal(sha(frozen.get('tests/current-atlas-delivery.test.mjs')),'ff81268dff6e06ebfddec7e10a21346bf03584c14c470e9b8a2ba8ab937e7d17');

export function readRevision54(path,{readLive=p=>readFileSync(new URL(p,site))}={}){
 assert(typeof path==='string'&&/^[A-Za-z0-9_./-]+$/.test(path)&&!path.split('/').some(part=>!part||part==='.'||part==='..'));
 if(documents.has(path)){
  const bytes=readFileSync(new URL('closed54-documents/'+path,fixture));
  assert.equal(sha(bytes),revision54.documents[path],path+' closed54 document');
  return bytes;
 }
 if(path==='docs/completion-checklist.json'){
  const bytes=readFileSync(new URL('completion-checklist-54.json',fixture));
  assert.equal(sha(bytes),'b5efbbe06b29bf66636b1b73d001ef3b025d197320f06a14edb7be2a910c6a4c');
  return bytes;
 }
 if(frozen.has(path))return Buffer.from(frozen.get(path));
 if(['app/workspace/atlas-review/model/page.tsx','app/workspace/atlas-review/model/embedded/page.tsx','components/head-atlas.css','components/HeadAtlasViewer.tsx'].includes(path)){
  const bytes=readRevision55(path);
  assert.equal(sha(bytes),oldInputs.get(path),path+' unchanged across closed54/55');
  return bytes;
 }
 assert(oldInputs.has(path),'Closed54 input scope: '+path);
 const bytes=readLive(path);
 assert(Buffer.isBuffer(bytes),'Closed54 live reader must return raw bytes');
 assert.equal(sha(bytes),oldInputs.get(path),path+' closed54 unchanged input');
 return bytes;
}

export function validateRevision54Delivery({pin=revision54}={}){
 return validateCurrentAtlasDelivery({pin,read:readRevision54});
}

export function readRevision54Register(){
 const bytes=readRevision54('docs/completion-checklist.json');
 const register=JSON.parse(bytes);
 assert.equal(register.revision,54);
 return register;
}
