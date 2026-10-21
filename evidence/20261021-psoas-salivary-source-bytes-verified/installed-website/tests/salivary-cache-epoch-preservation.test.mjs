import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const read=path=>readFileSync(new URL(path,import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const original=read('./fixtures/salivary-cache-epoch-20261021/original.ts.raw');
const proposed=read('./clinical-review-salivary-stylohyoid-quiz.test.ts');
const originalHash='c4e18aeb9ce2056cb50fcef3a665de0356f91b88ff78992a928b7346f3ca2362';
const proposedHash='a6fea25a4dd1bde5c87d02cf993459a44c255a735e73ef9e0e7b20331309696a';

function inverse(candidate){
 let text=candidate.toString();
 const additionStart=text.indexOf('function assertLaterHeadNeckCache(');
 const additionEnd=text.indexOf('// The completed quiz rows are immutable.',additionStart);
 assert(additionStart>=0&&additionEnd>additionStart,'Unique later-cache epoch theorem');
 text=text.slice(0,additionStart)+text.slice(additionEnd);
 const old=original.toString();
 const oldStart=old.indexOf('// The completed quiz rows are immutable;');
 const oldEnd=old.indexOf('async function importedApi(){',oldStart);
 const newStart=text.indexOf('// The completed quiz rows are immutable.');
 const newEnd=text.indexOf('async function importedApi(){',newStart);
 assert(oldStart>=0&&oldEnd>oldStart&&newStart>=0&&newEnd>newStart,
  'Unique original and proposed CT/cache helper regions');
 return text.slice(0,newStart)+old.slice(oldStart,oldEnd)+text.slice(newEnd);
}

test('salivary cache epochs retain the complete original source and both registered cases',()=>{
 assert.equal(sha(original),originalHash);
 assert.equal(sha(proposed),proposedHash);
 assert.deepEqual(Buffer.from(inverse(proposed)),original);
 assert.equal((proposed.toString().match(/^test\(/gm)||[]).length,2);
 assert.equal((original.toString().match(/^test\(/gm)||[]).length,2);
});

test('altering an epoch, an original assertion, or wrapping the cases fails preservation',()=>{
 const text=proposed.toString();
 for(const changed of [
  text.replace('3dcdf94a46db44202e72641be9fbcf1274ce5364','0'.repeat(40)),
  text.replace("assert.equal(git(['rev-parse','HEAD'])","assert.notEqual(git(['rev-parse','HEAD'])"),
  'if(false){\n'+text+'\n}',
 ]){
  assert.notEqual(changed,text);
  assert.notEqual(sha(Buffer.from(changed)),proposedHash);
 }
 for(const changed of [
  text.replace("assert.equal(git(['rev-parse','HEAD'])","assert.notEqual(git(['rev-parse','HEAD'])"),
  'if(false){\n'+text+'\n}',
 ])assert.notEqual(inverse(Buffer.from(changed)),original.toString());
});
