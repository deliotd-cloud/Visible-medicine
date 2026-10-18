// Closed historical delivery49 only; never a current-source or approval adapter.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const site=new URL('../',import.meta.url),archive=new URL('./fixtures/deep-plantar-49/',import.meta.url);
const bytes=readFileSync(new URL('epoch.json',archive));
assert.equal(sha(bytes),'771577eb493ade5db48383b17ced1a8b38e30449f8223f9e5926ff40b103b128');
export const revision49=JSON.parse(bytes);
assert.equal(revision49.schema,'vm-closed-delivery-epoch-1');
assert.equal(revision49.source,'7b3e678ae4b8059aadb84459048ebd05f7abe7b9');
assert.equal(revision49.review,'6ab73d99218734e11175a95d6564bb9321abf303592d052ed7e665a9fc38eb9d');
const records=new Map(revision49.files.map(row=>[row.path,row]));assert.equal(records.size,revision49.files.length);
export function readRevision49(path){
 assert(typeof path==='string'&&/^[A-Za-z0-9_./-]+$/.test(path)&&!path.split('/').some(p=>!p||p==='.'||p==='..'));
 const record=records.get(path);
 if(!record)return readFileSync(new URL(path,site)); // Existing older frozen fixtures retain their own exact guards.
 assert.equal(record.storagePath,path+'.raw');
 const bytes=readFileSync(new URL(record.storagePath,archive));assert.equal(bytes.length,record.bytes);assert.equal(sha(bytes),record.sha256,path+' frozen49 bytes');return bytes;
}
export function validateRevision49Delivery(options={}){
 assert(Object.keys(options).every(key=>key==='pin'),'Historical49 read scope is fixed');
 return validateCurrentAtlasDelivery({pin:options.pin??JSON.parse(readRevision49('tests/fixtures/current-atlas-delivery.json')),read:readRevision49});
}
