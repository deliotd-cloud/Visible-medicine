import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {restorePracticeConfirmConsumer} from './head-practice-confirm-harness-inverse.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
const addedImport="import {headDisclosureKeyDown} from '../lib/head-disclosure-keyboard.ts';\n";
for(const[file,digest,branch]of[
 ['head-image-history.test.ts','86004f5e867fb7b9444d719b3cf3845cc32c5f7f1accce31fc5c3f1cd5ceda18',"    name==='../lib/head-disclosure-keyboard'?{headDisclosureKeyDown}:\n"],
 ['head-mask-picking-ui.test.ts','15c4b2c9fba1730223b75df9d06b6f2266b0ad4aa43b5e47b4743ad677785d24',"    if(name==='../lib/head-disclosure-keyboard')return {headDisclosureKeyDown};\n"],
 ['head-open-state.test.ts','cf5c2588abb422922bd3441a43f81e5f560b2089b9f9c9759f72bb2e36d8e86d',null],
 ['head-slice-keyboard.test.ts','e4686df44dd54cb4df67c4908f88bccfe51951ba83121f92c1de43e387c61705',"    if(name==='../lib/head-disclosure-keyboard')return {headDisclosureKeyDown};\n"],
 ['head-slice-zoom.test.ts','4a34fc8cd0bbd9190a755cca1bd748f26d67f0c39905b74b2823bb4bd94d5900',"      if(name==='../lib/head-disclosure-keyboard')return {headDisclosureKeyDown};\n"],
 ['head-view-history-client.test.mjs','666446dddb8609384a7f35a59e92cc077ed4fc473980a51abb0c0767fafa71cc',"    name==='../lib/head-disclosure-keyboard'?{headDisclosureKeyDown}:\n"],
])test('whole original harness assertions survive the exact real-helper dependency seam: '+file,()=>{
 const original=read('./fixtures/head-disclosure-harness/'+file+'.raw');assert.equal(sha(original),digest);let current=restorePracticeConfirmConsumer(file,read('./'+file)).toString();assert.equal(current.split(addedImport).length-1,1);current=current.replace(addedImport,'');
 if(file==='head-open-state.test.ts'){const now='`${count} listed annotations`',before='`${count} accepted annotations`';assert.equal(current.split(now).length,2);current=current.replace(now,before);}
 if(file==='head-image-history.test.ts'||file==='head-view-history-client.test.mjs'){
  const currentImport="import {headIndexKey,headIndexTabStop} from '../lib/head-index-keyboard.ts';",originalImport="import {headIndexKey} from '../lib/head-index-keyboard.ts';";
  const currentBranch="name==='../lib/head-index-keyboard'?{headIndexKey,headIndexTabStop}:",originalBranch="name==='../lib/head-index-keyboard'?{headIndexKey}:";
  for(const[from,to]of[[currentImport,originalImport],[currentBranch,originalBranch]]){assert.equal(current.split(from).length,2,from);current=current.replace(from,to);}
 }
 if(branch){assert.equal(current.split(branch).length-1,1);current=current.replace(branch,'');}else{const added="new Function('require','exports','headDisclosureKeyDown',compiled.outputText)(runtimeRequire,{},headDisclosureKeyDown)",before="new Function('require','exports',compiled.outputText)(runtimeRequire,{})";assert.equal(current.split(added).length-1,1);current=current.replace(added,before);}
 assert.equal(current,original.toString(),'Every original assertion/regex/count/body stays exact');
});
