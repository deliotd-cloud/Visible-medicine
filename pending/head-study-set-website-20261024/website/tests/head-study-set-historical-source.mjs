// Fixed historical operand for the native-slice theorems. Never derive this
// root from the Website currently executing the tests.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

export const historicalStage='F:/VisibleMedicine/staging/20261024-native-slice-website';
export const historicalReceiptPath=historicalStage+'/SOURCE_BOUND.json';
export const historicalReceiptSha256='53a006afac76eb558c769c83c6e36a594e3965de99b602e796a9ef48636089b6';
export const historicalWebsiteRoot=historicalStage+'/website';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

export function validateHistoricalReceiptBytes(raw){
 assert.equal(sha(raw),historicalReceiptSha256,'historical receipt changed');
 const receipt=JSON.parse(raw);
 assert.equal(receipt.website,historicalWebsiteRoot,'historical Website root changed');
 assert(Array.isArray(receipt.sourceRows),'historical source rows missing');
 assert.equal(new Set(receipt.sourceRows.map(row=>row.path)).size,receipt.sourceRows.length,'duplicate historical source row');
 return receipt;
}

export function validateHistoricalSourceBytes(path,raw,receiptBytes){
 const receipt=validateHistoricalReceiptBytes(receiptBytes);
 const row=receipt.sourceRows.find(item=>item.path===path);
 assert(row,'unregistered historical source: '+path);
 assert.equal(raw.length,row.bytes,path+': historical byte count');
 assert.equal(sha(raw),row.sha256,path+': historical source drift');
 return raw;
}

export function readHistoricalSource(path){
 const receiptBytes=readFileSync(historicalReceiptPath);
 const receipt=validateHistoricalReceiptBytes(receiptBytes);
 assert(receipt.sourceRows.some(row=>row.path===path),'unregistered historical source: '+path);
 return validateHistoricalSourceBytes(path,readFileSync(resolve(historicalWebsiteRoot,path)),receiptBytes);
}
