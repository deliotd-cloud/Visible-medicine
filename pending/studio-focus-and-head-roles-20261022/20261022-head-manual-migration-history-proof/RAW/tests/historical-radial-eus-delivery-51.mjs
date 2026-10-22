// Closed delivery51 adapter; history never admits a later source as current.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery as validateHistoricalAtlasDelivery} from './fixtures/closed56-validator/tests/current-atlas-delivery.mjs';
import {readRevision52} from './historical-native-head-history-delivery-52.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),site=new URL('../',import.meta.url),archive=new URL('./fixtures/radial-eus-51/',import.meta.url),bytes=readFileSync(new URL('epoch.json',archive));
assert.equal(sha(bytes),'c3cfa9129bd487abfa0ef4d023453cd2fb09928625657b357bf1c2473ec0cf15');
export const revision51=JSON.parse(bytes);
assert.equal(revision51.schema,'vm-closed-delivery-epoch-1');assert.equal(revision51.source,'c5a09df8939dfaeaf76119ba5507c552721c3a30');assert.equal(revision51.review,'a579079a911086426577e20d111350dfd054d6b6fcaecdf069458282007dd5aa');assert.equal(revision51.files.length,25);
const records=new Map(revision51.files.map(row=>[row.path,row]));assert.equal(records.size,25);
export function readRevision51(path){assert(typeof path==='string'&&/^[A-Za-z0-9_./-]+$/.test(path)&&!path.split('/').some(p=>!p||p==='.'||p==='..'));const row=records.get(path);if(!row&&['components/HeadAtlasViewer.tsx','scripts/bind-clinical-review.mjs','components/HeadAtlasComparisonNavigation.tsx','components/HeadAtlasLinkedModel.tsx'].includes(path))return readRevision52(path);if(!row)return readFileSync(new URL(path,site));assert.equal(row.storagePath,path+'.raw');const b=readFileSync(new URL(row.storagePath,archive));assert.equal(b.length,row.bytes);assert.equal(sha(b),row.sha256,path+' frozen51');return b;}
assert.equal(sha(readFileSync(new URL('./fixtures/closed56-validator/tests/current-atlas-delivery.mjs',import.meta.url))),'dfcce9763cba89e6d94f6e7e75ceb59f79ca73ac0d6056552bbe00139e804d62','Frozen schema1 validator changed');
export function validateRevision51Delivery(options={}){assert(Object.keys(options).every(key=>key==='pin'),'Historical51 read scope is fixed');return validateHistoricalAtlasDelivery({pin:options.pin??JSON.parse(readRevision51('tests/fixtures/current-atlas-delivery.json')),read:readRevision51});}
