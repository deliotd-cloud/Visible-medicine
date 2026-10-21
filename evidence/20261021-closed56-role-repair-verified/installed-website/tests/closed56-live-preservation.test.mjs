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
 // Main composition: the companion now binds authentic old roots and also
 // proves the complete inverse; every other original companion byte is retained.
 for(const [before,after] of [
  ["import {readRevision56,revision56}","import {readRevision56,revision56,oldWebsiteRoot}"],
  ["\"const root=process.env.VM_WEBSITE_ROOT??fileURLToPath(new URL('../',import.meta.url));\"","\"const root=oldWebsiteRoot;\""],
  [" assert.equal(candidate,exact);\n"," assert.equal(candidate,exact);\n let inverse=candidate;\n for(const [before,after] of edits.toReversed()){assert.equal(inverse.split(after).length,2,after);inverse=inverse.replace(after,before);}\n assert.equal(inverse,original.toString('utf8'),'Complete old56 source inverse');\n"],
 ]){assert.equal(expected.split(before).length,2);expected=expected.replace(before,after);}
 // End main composition.
 assert.equal(read('closed56-original-tests.test.mjs').toString(),expected);
 assert.notEqual(expected+'\n',expected);
});

test('exact archived evolution projects only after both whole original transitions are proved',()=>{
 const original=read('fixtures/closed56-original-tests/'+liveName+'.txt').toString();
 const projected=readClosed56LiveCopy(liveName);
 assert.equal(projected,original.replace("assert.equal(pin.reviewIntegration,'b4db62ff56037c1ca251e32256afd470f6e155ca3f563d1d1db86b6ec9c6d916');","assert.equal(pin.reviewIntegration,sha(JSON.stringify(JSON.parse(read('atlas-review/integration-inputs.json')).inputs)));"));
 assert.notEqual(projected,read(liveName).toString(),'History projection must not be confused with actual current delivery');
 const shoulder=read('fixtures/closed56-original-tests/shoulder-us-renderer-migration.test.mjs.txt').toString();
 assert.equal(readClosed56LiveCopy('shoulder-us-renderer-migration.test.mjs'),shoulder.replace("assert.equal(pin.reviewIntegration,'b4db62ff56037c1ca251e32256afd470f6e155ca3f563d1d1db86b6ec9c6d916');","assert.equal(pin.reviewIntegration,sha(JSON.stringify(JSON.parse(readFileSync('atlas-review/integration-inputs.json')).inputs)));"));
});

for(const [label,path,change]of [
 ['original46c evidence','fixtures/closed56-original-tests/'+liveName+'.txt',text=>text+'\n'],
 ['intermediate f509 evidence','fixtures/current-atlas-delivery-f5097af8.txt',text=>text+'\n'],
 ['reviewed current evidence','fixtures/closed56-live-bd5465.mjs.raw',text=>text+'\n'],
 ['later exact archive','fixtures/current-delivery-test-before-roving.mjs.raw',text=>text+'\n'],
 ['historical introduction commit','fixtures/current-delivery-test-before-roving.mjs.raw',text=>text.replace("assert.equal(CURRENT_ATLAS_REVISION,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');","assert.equal(CURRENT_ATLAS_REVISION,'0000000000000000000000000000000000000000');")],
 ['historical introduction tree','fixtures/current-delivery-test-before-roving.mjs.raw',text=>text.replace("assert.equal(pin.sourceTree,'bfcfa898ace1d25083f21b681274c5bc816564d7');","assert.equal(pin.sourceTree,'0000000000000000000000000000000000000000');")],
 ['historical observed count','fixtures/current-delivery-test-before-roving.mjs.raw',text=>text.replace('assert.equal(sourceFiles,1548);assert.equal(inputs,1695);','assert.equal(sourceFiles,1548);assert.equal(inputs,1694);')],
 ['original model assertion','fixtures/current-delivery-test-before-roving.mjs.raw',text=>text.replace('d.models.pop();','d.models.slice();')],
 ['original clinical refusal','fixtures/current-delivery-test-before-roving.mjs.raw',text=>text.replace("['invented clinical approval',p=>{p.clinicalApproval=true;}]","['invented clinical approval',p=>{p.clinicalApproval=false;}]")],
 ['original emitted hash proof','fixtures/current-delivery-test-before-roving.mjs.raw',text=>text.replace('assert.equal(sha(bytes),row.sha256,path);','assert.equal(sha(bytes),sha(bytes),path);')],
 ['later whole-original proof','fixtures/current-delivery-test-before-roving.mjs.raw',text=>text.slice(0,text.indexOf("\ntest('complete f509 source and whole original contracts"))],
 ['unknown appended code','fixtures/current-delivery-test-before-roving.mjs.raw',text=>text+'\nconst unknown=true;\n'],
])test('projection refuses changed '+label,()=>{
 assert.notEqual(change(read(path).toString()),read(path).toString(),'Mutation must exercise the actual source');
 assert.throws(()=>readClosed56LiveCopy(liveName,{read:alter(path,change)}));
});

test('projection refuses old or foreign paths rather than widening reader scope',()=>{
 assert.throws(()=>readClosed56LiveCopy('../current-atlas-delivery.test.mjs'));
 assert.throws(()=>readClosed56LiveCopy('fixtures/closed56-live-bd5465.mjs.raw'));
 assert.throws(()=>readClosed56LiveCopy(liveName,{read:name=>name==='fixtures/current-delivery-test-before-roving.mjs.raw'?read('fixtures/current-atlas-delivery-f5097af8.txt'):read(name)}));
});
