// One exact presentation-copy assertion update; no case-insensitive weakening.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex'),read=file=>fs.readFileSync(file);
const root='F:/VisibleMedicine/staging/20261024-guided-current-copy-proposal';
const website='F:/VisibleMedicine/staging/20261024-pancreatic-us-website/website';
const before=read('F:/VisibleMedicine/staging/20261024-head-guided-harness-proposal/candidate/tests/head-guided-steps.test.ts');
const after=read(root+'/candidate/tests/head-guided-steps.test.ts');
assert.equal(sha(before),'c39a6845ded3b9ebcc12609c9ea2d75891178a54003224b5056272757c19073e');
const current=read(website+'/components/HeadAtlasGuidedLearning.tsx');
const currentSha='b5cd947f7bef048ffa8dcb0fb4b98b77ee2a54d83049822fed700b1f8be8ba95';
function inverse(bytes){
 let text=bytes.toString();const line="import {createHash} from 'node:crypto';";
 const endings=[line+'\r\n',line+'\n'].filter(value=>text.includes(value));assert.equal(endings.length,1);text=text.replace(endings[0],'');
 const start='  // The exact current copy starts a new sentence.',end="  const stale=fixture([entry],'brainstem-pons','stale','brainstem',modality);";
 assert.equal(text.split(start).length,2);assert.equal(text.split(end).length,2);
 const a=text.indexOf(start),b=text.indexOf(end,a),old=before.toString(),oldStart=old.indexOf('  assert.match(f.html,/enable Folder sharing/);'),oldEnd=old.indexOf(end,oldStart);
 assert.ok(oldStart>0&&oldEnd>oldStart&&b>a);
 const expected=after.toString().slice(after.toString().indexOf(start),after.toString().indexOf(end));
 assert.equal(text.slice(a,b),expected,'one complete declared copy/source-guard seam');
 text=text.slice(0,a)+old.slice(oldStart,oldEnd)+text.slice(b);assert.deepEqual(Buffer.from(text),before);return text;
}
test('all26 cases survive one exact copy-epoch assertion seam and the two prior import seams',()=>{
 const text=inverse(after);assert.equal((after.toString().match(/^test\(/mg)||[]).length,26);
 let original=text;const line="import {separateComparisonAwareRequire} from './head-separate-comparison-test-source.ts';";
 const endings=[line+'\r\n',line+'\n'].filter(value=>original.includes(value));assert.equal(endings.length,1);original=original.replace(endings[0],'').replace('const require=separateComparisonAwareRequire(createRequire(import.meta.url)),pin=links.HEAD_LINK_REVISION;','const require=createRequire(import.meta.url),pin=links.HEAD_LINK_REVISION;');
 assert.deepEqual(Buffer.from(original),read(website+'/tests/head-guided-steps.test.ts'));
 for(const changed of [after.toString()+'\n',after.toString().replace('/Enable Folder sharing/','/enable Folder sharing/i'),after.toString().replace('assert.equal(createHash(', 'assert.notEqual(createHash(')])assert.throws(()=>inverse(Buffer.from(changed)));
});
test('historical lowercase and current capitalized copies are tied to authentic separate source receipts',()=>{
 const oldReceipt=read('F:/VisibleMedicine/staging/20261022-studio-details-focus-successor/SOURCE.json');assert.equal(sha(oldReceipt),'ac4654d3c76ba13b449be34be5502f372ebf13f286c60e100d5933e221e41965');
 const old=read('F:/VisibleMedicine/staging/20261022-studio-details-focus-successor/website/components/HeadAtlasGuidedLearning.tsx');
 const row=JSON.parse(oldReceipt).sourceRows.find(row=>row.path==='components/HeadAtlasGuidedLearning.tsx');
 assert.equal(sha(old),row.sha256);assert.equal(sha(old),'51a539b828457037ee4d6fde9fb0a8b2c5ca358cd04e945d0cbad869e780d342');
 assert.match(old.toString(),/enable Folder sharing/);assert.equal(sha(current),currentSha);assert.match(current.toString(),/Enable Folder sharing/);
});
test('current exact source guard refuses the old role or any mutated current source',()=>{
 const guard=value=>assert.equal(sha(value),currentSha);guard(current);
 assert.throws(()=>guard(Buffer.concat([current,Buffer.from('\n')])));
 assert.throws(()=>guard(Buffer.from(current.toString().replace('Enable Folder sharing','enable Folder sharing'))));
 assert.ok(after.toString().includes("assert.match(f.html,/Enable Folder sharing/);assert.match(f.html,/off by default/);"));
});
