// Source-only independent review; no page transpilation, real account or browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const root='F:/VisibleMedicine/staging/20261024-studio-terminal-failure-audit';
const website='F:/VisibleMedicine/staging/20261024-pancreatic-us-website/website';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=path=>fs.readFileSync(path);
const original=read(website+'/tests/studio-membership-pages.test.mjs');
assert.equal(sha(original),'5b419287fa6016c3a072f397e67c10ef62a641f8cca8cbd2bfe0c9c4a0c6d720');
const proposed=read(root+'/candidate/tests/studio-membership-pages.test.mjs');
assert.equal(sha(proposed),'687a9a848f51422e68e9a01036cf7314ea9c7fa345bd49fb38cf0d67526d8abc');
const helper=root+'/candidate/tests/studio-membership-source.mjs';
assert.equal(sha(read(helper)),'90ef0f9eb28850ebede5cb9e395eadaa6bf3c0b6d9f8694b83edc33ed7e02a1d');
function removeLine(text,line){const options=[line+'\n',line+'\r\n'].filter(item=>text.includes(item));assert.equal(options.length,1);assert.equal(text.split(options[0]).length,2);return text.replace(options[0],'');}
function inverse(bytes){
 let text=bytes.toString();assert.deepEqual(Buffer.from(text),bytes);
 text=removeLine(text,"import {loadPinnedReviewQueue,readPinnedStudioSource} from './studio-membership-source.mjs';");
 text=removeLine(text,"const sourceRoot=new URL('../',import.meta.url),reviewQueue=loadPinnedReviewQueue(sourceRoot,ts);");
 const loadLine=value=>value.split(/\r?\n/).filter(line=>line.startsWith('function load('));
 const before=loadLine(original.toString()),after=loadLine(text);assert.equal(before.length,1);assert.equal(after.length,1);
 assert.equal(after[0],loadLine(proposed.toString())[0],'complete declared loader, not an arbitrary function');
 text=text.replace(after[0],before[0]);assert.deepEqual(Buffer.from(text),original);return text;
}
test('membership full-file inverse and both original assertion bodies survive byte-exactly',()=>{
 assert.deepEqual(read(root+'/before/studio-membership-pages.test.mjs.raw'),original);inverse(proposed);
 const suffix=bytes=>bytes.subarray(bytes.indexOf('test('));assert.deepEqual(suffix(proposed),suffix(original));
 assert.equal((proposed.toString().match(/^test\(/mg)||[]).length,2);
 for(const value of [proposed.toString()+'\n',proposed.toString().replace('assert.deepEqual(', 'assert.notDeepEqual('),proposed.toString().replace("throw new Error(`Unexpected Studio page import: ${id}`)","return require(id)")])assert.throws(()=>inverse(Buffer.from(value)));
});
test('real pure queue helper rejects unbound source and unexpected runtime imports',async()=>{
 const {loadPinnedReviewQueue,readPinnedStudioSource}=await import(pathToFileURL(helper));
 const sourceRoot=pathToFileURL(website+'/');
 assert.throws(()=>readPinnedStudioSource(sourceRoot,'lib/foreign.ts'),/Unbound Studio/);
 const fake={ModuleKind:{CommonJS:1},ScriptTarget:{ES2022:1},transpileModule(){return {outputText:"require('undeclared')"};}};
 assert.throws(()=>loadPinnedReviewQueue(sourceRoot,fake),/Unexpected executable review-queue import/);
 const real=readPinnedStudioSource(sourceRoot,'lib/studio-review-queue.ts');assert.ok(!/^import\s(?!type\b)/m.test(real));
});
