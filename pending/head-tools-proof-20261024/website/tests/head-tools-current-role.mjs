// Test-only explicit source roles: the original head-tools proof is historical.
// The production validator is unchanged and is used for BOTH delivery roles.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {sourceHunks} from './head-tools-wider-consumer-inverse.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex');
const actual=p=>readFileSync(new URL('../'+p,import.meta.url));
const base='tests/fixtures/head-tools-role-20261022/';
const pinPath='tests/fixtures/current-atlas-delivery.json';
const viewerPath='components/HeadAtlasViewer.tsx';
const oldPinBytes=actual(base+pinPath+'.raw');
assert.equal(sha(oldPinBytes),'a023587c2bfd645d92e809265b80c6fc24e4b17b6d973623eef110b7c25a340d');
const oldPin=JSON.parse(oldPinBytes);
// This epoch shipped 46 Review files. Execute its genuine closed validator;
// never relax the current validator's independent 54-file requirement.
const historicalRoot='F:/VisibleMedicine/staging/20261022-studio-details-focus-successor/website';
const historicalReceipt='F:/VisibleMedicine/staging/20261022-studio-focus-runtime-admission/APPLIED_SOURCE.json';
const historicalReceiptBytes=readFileSync(historicalReceipt);
assert.equal(sha(historicalReceiptBytes),'1fc7563d97f2d14682050059f177ee84d768d9eb072a062b309018acdf35da6a');
const historicalRows=JSON.parse(historicalReceiptBytes).sourceRows;
for(const path of ['tests/current-atlas-delivery.mjs','tests/atlas-source-repo.mjs']){
 const expected=historicalRows.find(r=>r.path===path);assert(expected,path);
 assert.equal(sha(readFileSync(historicalRoot+'/'+path)),expected.sha256,path);
}
const historicalValidator=await import('file:///'+historicalRoot+'/tests/current-atlas-delivery.mjs');
assert.equal(oldPin.viewerFiles,46);
const inherited=new Map([
 ['tests/fixtures/head-toolbar-before-compaction-20261022.tsx.raw','a14d1d851fff12960b35ffe71e282a0f2ec00e9a9077c74e72d3ed456ad25daa'],
 ['tests/fixtures/head-tools-prior-integration-inputs-20261022.json.raw','58b0fd76cdfd582e1485403d15723ea0171c4a362b4ee1b65d1a2e5e4140380e'],
 ['tests/fixtures/current-delivery-before-head-tools-20261022.json','422a105495609f03a1e20660716406c737e1a14337843ed61d084bf95c7c7bed'],
]);
export function readHistoricalHeadToolsRole(path){
 if(path===pinPath)return Buffer.from(oldPinBytes);
 if(path===viewerPath){const bytes=actual(base+path+'.raw');assert.equal(sha(bytes),'a9b7c4b3d8f4febab394e983ace55df020cbcc84dc33daa8b2af6e7abd90fd1b');return bytes;}
 if(Object.hasOwn(oldPin.documents,path)){const bytes=actual(base+path+'.raw');assert.equal(sha(bytes),oldPin.documents[path],path);return bytes;}
 assert(inherited.has(path),'Only explicitly authenticated historical paths');
 const bytes=actual(path);assert.equal(sha(bytes),inherited.get(path),path);return bytes;
}
export function validateHistoricalHeadToolsDelivery(options={}){
 assert(options&&typeof options==='object'&&!Array.isArray(options));
 for(const key of Object.keys(options))assert(['pin','read'].includes(key));
 return historicalValidator.validateCurrentAtlasDelivery({pin:structuredClone(oldPin),read:readHistoricalHeadToolsRole,...options});
}

export const currentHeadToolsReceipt='F:/VisibleMedicine/staging/20261023-linked-head-region-picker/SOURCE_BOUND.json';
export const currentHeadToolsReceiptSha256='6a6f601c32176a2ac8a3c2735178245487640434a17b157aed0d473fcec48183';
export function assertCurrentHeadToolsSource(path,bytes=actual(path)){
 const receiptBytes=readFileSync(currentHeadToolsReceipt);assert.equal(sha(receiptBytes),currentHeadToolsReceiptSha256);
 const receipt=JSON.parse(receiptBytes),row=receipt.sourceRows.find(r=>r.path===path);assert(row,path);
 assert.equal(sha(bytes),row.sha256,path);return {receipt,row,bytes};
}
const viewerHunkDigests=["7037ebaba484e9482d90748a09cd34bd1b6b1baff83e2e9a92cca503f4ef32dc","0270cfdefd4f0cf10745791569bb13e789f6f171ef151a0e5da7f7fc55d77d24","e2e7dd17e0eb9757f69454f336216ed6b68018b6ef25eb343166cca60a813a5c","069d09acd65b009b446f4ef6fb685ee16d61b4a0c60e161e6383f9b5e31a22d4","e5e29c6afe0bc62159f5b6d061a5fe2dd13ba1cd90395c8fb7202253bddf24f9","148e6ed8517e21c411dde824d63be87406ebc64d2adc2562086aeb9ddb24d500","93adbf0a7bb3572e080c5f1a593660989d36897165971ce164fff59720a4978c","afbfa34c1e5b08c3e73cf8d1080b482ab052a0b2593cc3f7f0e720e59f3ec468","1f48ed162486f3babed1e36700490376a88a428d5d786edfc50a57d15254eda6","6296815e78e6f0d82f7c87d9f952c67bfa4e5667e2f779ca716649d634bf55a2","10629e4e03acca2262adac122eddd046543978324e3d365e4f1e3479626edbad","d8ab5866a6f979c22be31ce094e76a370fec2d03d176b1c9af578e86c9171bb4","46a360ad5b07d21d7f9263da6aaba6800460ebaf29234f31cfa90e09344da88d","36347ef1521477a7443c93b3314a0db1eeed08179688220ac7635942e603e1d5","7cc95f03a6c38928e494dcb578995afd9c844bf19cd11a7dfe2d6b5213de050b","8637ad1bfd4cebdf7c5eb3e04dacd9745b05609300c0262f24e3f16581ab9088"];
export function restoreCurrentHeadToolsViewer(currentBytes,historicalBytes){
 assert.equal(sha(historicalBytes),'a9b7c4b3d8f4febab394e983ace55df020cbcc84dc33daa8b2af6e7abd90fd1b');
 assertCurrentHeadToolsSource(viewerPath,currentBytes);
 const before=historicalBytes.toString('utf8'),after=currentBytes.toString('utf8');
 assert.deepEqual(Buffer.from(before),historicalBytes);assert.deepEqual(Buffer.from(after),currentBytes);
 const hunks=sourceHunks(before,after);assert.deepEqual(hunks.map(h=>sha(JSON.stringify(h))),viewerHunkDigests);
 const reverse=after.split('\n');for(const h of hunks.toReversed()){assert.deepEqual(reverse.slice(h.newStart,h.newStart+h.added.length),h.added);reverse.splice(h.newStart,h.added.length,...h.removed);}assert.equal(reverse.join('\n'),before);
 const forward=before.split('\n');for(const h of hunks.toReversed()){assert.deepEqual(forward.slice(h.oldStart,h.oldStart+h.removed.length),h.removed);forward.splice(h.oldStart,h.removed.length,...h.added);}assert.equal(forward.join('\n'),after);
 return Buffer.from(reverse.join('\n'));
}
