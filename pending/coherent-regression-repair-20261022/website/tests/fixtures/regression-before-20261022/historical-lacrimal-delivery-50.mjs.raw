// Closed delivery50 test adapter. It never admits a later Atlas source.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {readRevision51} from './historical-radial-eus-delivery-51.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const site=new URL('../',import.meta.url),archive=new URL('./fixtures/lacrimal-50/',import.meta.url);
const epochBytes=readFileSync(new URL('epoch.json',archive));
assert.equal(sha(epochBytes),'ac4812377365830dfe842137e64f5d60cb69d3076dc3b7a2fde01cb629d947c6');
export const revision50=JSON.parse(epochBytes);
assert.equal(revision50.schema,'vm-closed-delivery-epoch-1');
assert.equal(revision50.source,'70260f13b1878272c6b0797dd72395ed10bc4f29');
assert.equal(revision50.review,'5c0b739fa617913952bc42dc5a828f5115b4690b5fb118a6e00d8054bd256d39');
assert.equal(revision50.files.length,31);
const records=new Map(revision50.files.map(row=>[row.path,row]));
assert.equal(records.size,revision50.files.length);
export function readRevision50(path){
 assert(typeof path==='string'&&/^[A-Za-z0-9_./-]+$/.test(path)&&!path.split('/').some(p=>!p||p==='.'||p==='..'));
 const row=records.get(path);
 if(!row&&['atlas-review/content/regional-teaching/abdomen.json','components/HeadAtlasViewer.tsx','scripts/bind-clinical-review.mjs','components/HeadAtlasComparisonNavigation.tsx','components/HeadAtlasLinkedModel.tsx'].includes(path))return readRevision51(path);
 if(!row)return readFileSync(new URL(path,site));
 assert.equal(row.storagePath,path+'.raw');
 const bytes=readFileSync(new URL(row.storagePath,archive));
 assert.equal(bytes.length,row.bytes);assert.equal(sha(bytes),row.sha256,path+' frozen50 bytes');return bytes;
}
export function validateRevision50Delivery(options={}){
 assert(Object.keys(options).every(key=>key==='pin'),'Historical50 read scope is fixed');
 return validateCurrentAtlasDelivery({pin:options.pin??JSON.parse(readRevision50('tests/fixtures/current-atlas-delivery.json')),read:readRevision50});
}
