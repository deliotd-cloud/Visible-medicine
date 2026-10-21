import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const original=readFileSync(new URL('./fixtures/salivary-cache-epoch-20261021/original.ts.raw',import.meta.url));
const priorHash='c4e18aeb9ce2056cb50fcef3a665de0356f91b88ff78992a928b7346f3ca2362';
const proposedHash='a6fea25a4dd1bde5c87d02cf993459a44c255a735e73ef9e0e7b20331309696a';

export function inverseSalivaryCacheEpoch(candidate){
 let text=Buffer.from(candidate).toString();
 const additionStart=text.indexOf('function assertLaterHeadNeckCache(');
 const additionEnd=text.indexOf('// The completed quiz rows are immutable.',additionStart);
 assert(additionStart>=0&&additionEnd>additionStart,'Unique later-cache epoch theorem');
 assert.equal(text.indexOf('function assertLaterHeadNeckCache(',additionStart+1),-1);
 text=text.slice(0,additionStart)+text.slice(additionEnd);
 const old=original.toString();
 const oldStart=old.indexOf('// The completed quiz rows are immutable;');
 const oldEnd=old.indexOf('async function importedApi(){',oldStart);
 const newStart=text.indexOf('// The completed quiz rows are immutable.');
 const newEnd=text.indexOf('async function importedApi(){',newStart);
 assert(oldStart>=0&&oldEnd>oldStart&&newStart>=0&&newEnd>newStart,
  'Unique original and proposed CT/cache helper regions');
 assert.equal(text.indexOf('// The completed quiz rows are immutable.',newStart+1),-1);
 return Buffer.from(text.slice(0,newStart)+old.slice(oldStart,oldEnd)+text.slice(newEnd));
}

export function restoreSalivaryPrior(candidate){
 assert.equal(sha(original),priorHash,'Exact historical typed/root/CT salivary source');
 assert.equal(sha(candidate),proposedHash,'Exact current source with later bounded cache epochs');
 const prior=inverseSalivaryCacheEpoch(candidate);
 assert.deepEqual(prior,original,'Whole historical salivary test reconstructed byte-for-byte');
 return prior;
}
