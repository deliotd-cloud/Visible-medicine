import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {readClosed56LiveCopy} from './closed56-live-preservation.mjs';

const read=path=>readFileSync(new URL('./'+path,import.meta.url));
const sha=value=>createHash('sha256').update(value).digest('hex');
const liveName='current-atlas-delivery.test.mjs';
const alter=(path,change)=>name=>name===path?Buffer.from(change(read(name).toString('utf8'))):read(name);

test('closed56 whole original test is preserved except import and exact live-read seam',()=>{
 const original=read('fixtures/closed56-preservation-original.mjs.raw');
 assert.equal(sha(original),'f90bf7441a4fb5d4911dea056e587debd7c447110f6b4d55974bfbac6a838b30');
 let expected=original.toString();
 for(const [before,after]of [
  ["import {readFileSync} from 'node:fs';","import {readFileSync} from 'node:fs';\nimport {readClosed56LiveCopy} from './closed56-live-preservation.mjs';"],
  ["const live=readFileSync(new URL('./'+name,import.meta.url),'utf8');","const live=readClosed56LiveCopy(name);"],
 ]){assert.equal(expected.split(before).length,2);expected=expected.replace(before,after);}
 assert.equal(read('closed56-original-tests.test.mjs').toString(),expected);
 assert.notEqual(expected+'\n',expected);
});

test('exact live evolution projects only after both whole original transitions are proved',()=>{
 const original=read('fixtures/closed56-original-tests/'+liveName+'.txt').toString();
 const projected=readClosed56LiveCopy(liveName);
 assert.equal(projected,original.replace("assert.equal(pin.reviewIntegration,'b4db62ff56037c1ca251e32256afd470f6e155ca3f563d1d1db86b6ec9c6d916');","assert.equal(pin.reviewIntegration,sha(JSON.stringify(JSON.parse(read('atlas-review/integration-inputs.json')).inputs)));"));
 assert.notEqual(projected,read(liveName).toString(),'History projection must not be confused with actual current delivery');
 assert.equal(readClosed56LiveCopy('shoulder-us-renderer-migration.test.mjs'),read('shoulder-us-renderer-migration.test.mjs').toString());
});

for(const [label,path,change]of [
 ['original46c evidence','fixtures/closed56-original-tests/'+liveName+'.txt',text=>text+'\n'],
 ['intermediate f509 evidence','fixtures/current-atlas-delivery-f5097af8.txt',text=>text+'\n'],
 ['reviewed current evidence','fixtures/closed56-live-bd5465.mjs.raw',text=>text+'\n'],
 ['current commit',liveName,text=>text.replace("assert.equal(CURRENT_ATLAS_REVISION,'bd5465ee3b94c66c3d5701e7749099d07e8f40d3');","assert.equal(CURRENT_ATLAS_REVISION,'0000000000000000000000000000000000000000');")],
 ['current tree',liveName,text=>text.replace("assert.equal(pin.sourceTree,'44ca83bf391164c09f43f4169d25dcacf4b2559d');","assert.equal(pin.sourceTree,'0000000000000000000000000000000000000000');")],
 ['current observed count',liveName,text=>text.replace('assert.equal(sourceFiles,1543);','assert.equal(sourceFiles,1542);')],
 ['original model assertion',liveName,text=>text.replace('d.models.pop();','d.models.slice();')],
 ['original clinical refusal',liveName,text=>text.replace("['invented clinical approval',p=>{p.clinicalApproval=true;}]","['invented clinical approval',p=>{p.clinicalApproval=false;}]")],
 ['original emitted hash proof',liveName,text=>text.replace('assert.equal(sha(bytes),row.sha256,path);','assert.equal(sha(bytes),sha(bytes),path);')],
 ['later whole-original proof',liveName,text=>text.slice(0,text.indexOf("\ntest('complete f509 source and whole original contracts"))],
 ['unknown appended code',liveName,text=>text+'\nconst unknown=true;\n'],
])test('projection refuses changed '+label,()=>{
 assert.notEqual(change(read(path).toString()),read(path).toString(),'Mutation must exercise the actual source');
 assert.throws(()=>readClosed56LiveCopy(liveName,{read:alter(path,change)}));
});

test('projection refuses old or foreign paths rather than widening reader scope',()=>{
 assert.throws(()=>readClosed56LiveCopy('../current-atlas-delivery.test.mjs'));
 assert.throws(()=>readClosed56LiveCopy('fixtures/closed56-live-bd5465.mjs.raw'));
 assert.throws(()=>readClosed56LiveCopy(liveName,{read:name=>name===liveName?read('fixtures/current-atlas-delivery-f5097af8.txt'):read(name)}));
});
