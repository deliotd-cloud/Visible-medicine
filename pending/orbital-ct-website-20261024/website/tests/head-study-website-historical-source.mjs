// Fixed head-study Website operand for exact old display/composition theorems.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

export const headStudyWebsiteRoot='F:/VisibleMedicine/staging/20261024-head-study-set-website/website';
export const headStudyReceiptPath='F:/VisibleMedicine/staging/20261024-head-study-set-website/SOURCE_BOUND.json';
export const headStudyReceiptSha256='37ea31d0ab36e57311e11dcdb9c01a93770220cbf8c40d439fa35b08aff9c968';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

export function validateHeadStudyReceiptBytes(raw){
 assert.equal(sha(raw),headStudyReceiptSha256,'head-study receipt changed');
 const receipt=JSON.parse(raw);
 assert.equal(receipt.website,headStudyWebsiteRoot,'head-study Website root changed');
 assert.equal(receipt.atlasHead,'b79e110d2d28f18993263926ba35aa7a3f478b20');
 assert.equal(receipt.atlasTree,'0dd97cc55ef9aff3493b91752309d1d661c0b0c8');
 assert(Array.isArray(receipt.sourceRows),'head-study source rows missing');
 assert.equal(new Set(receipt.sourceRows.map(row=>row.path)).size,receipt.sourceRows.length,'duplicate head-study source row');
 return receipt;
}

export function validateHeadStudySourceBytes(path,raw,receiptBytes){
 const receipt=validateHeadStudyReceiptBytes(receiptBytes);
 const row=receipt.sourceRows.find(item=>item.path===path);
 assert(row,'unregistered head-study source: '+path);
 assert.equal(raw.length,row.bytes,path+': historical byte count');
 assert.equal(sha(raw),row.sha256,path+': historical source drift');
 return raw;
}

export function readHeadStudySource(path){
 const receiptBytes=readFileSync(headStudyReceiptPath);
 const receipt=validateHeadStudyReceiptBytes(receiptBytes);
 assert(receipt.sourceRows.some(row=>row.path===path),'unregistered head-study source: '+path);
 return validateHeadStudySourceBytes(path,readFileSync(resolve(headStudyWebsiteRoot,path)),receiptBytes);
}
