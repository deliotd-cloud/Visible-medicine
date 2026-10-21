import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=name=>readFileSync(new URL('./'+name,import.meta.url));
function one(text,reviewed,original,label){
 assert.equal(text.split(reviewed).length,2,label+': one exact seam');
 return text.replace(reviewed,original);
}
const helper='closed56-live-preservation.mjs';
const guard='closed56-live-preservation.test.mjs';
function helperInverse(text){
 const start=' const beforeRoving=checked(read,';
 const end=' return replaceOnce(original,reviewBefore,reviewAfter);';
 assert.equal(text.split(start).length,2);
 assert.equal(text.split(end).length,2);
 const first=text.indexOf(start),last=text.indexOf(end);
 assert(first>0&&last>first);
 return text.slice(0,first)+
  " assert.equal(read(name).toString('utf8'),recorded,'Live body, negatives and appended proofs must match the reviewed current epoch exactly');\n"+
  text.slice(last);
}
function guardInverse(text){
 const start=' // Main composition: the companion now binds authentic old roots and also\n';
 const end=' // End main composition.\n';
 assert.equal(text.split(start).length,2);assert.equal(text.split(end).length,2);
 const first=text.indexOf(start),last=text.indexOf(end);assert(last>first);
 text=text.slice(0,first)+text.slice(last+end.length);
 text=one(text," ['later exact archive','fixtures/current-delivery-test-before-roving.mjs.raw',text=>text+'\\n'],\n",'',guard);
 for(const [reviewed,original]of [
  ["assert.equal(CURRENT_ATLAS_REVISION,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');",
   "assert.equal(CURRENT_ATLAS_REVISION,'bd5465ee3b94c66c3d5701e7749099d07e8f40d3');"],
  ["assert.equal(pin.sourceTree,'bfcfa898ace1d25083f21b681274c5bc816564d7');",
   "assert.equal(pin.sourceTree,'44ca83bf391164c09f43f4169d25dcacf4b2559d');"],
  ["text.replace('assert.equal(sourceFiles,1548);assert.equal(inputs,1696);','assert.equal(sourceFiles,1548);assert.equal(inputs,1695);')",
   "text.replace('assert.equal(sourceFiles,1543);','assert.equal(sourceFiles,1542);')"],
 ])text=one(text,reviewed,original,guard);
 return text;
}
for(const [name,before,proposal,invert,mutation]of [
 [helper,'573ca775702fdca31cb22a03640a61e8510714b71bd60499244fa249148ea9e7',
  '91db3ee295c49991dcd1943e97ddb0e40c5d943697e64854bc7dd34c0f2df242',helperInverse,
  "assert.equal(intermediate,f509,'Every original assertion must survive the four observed 46c-to-f509 seams')"],
 [guard,'f64cc09e90dbdfc11fd3b93022282aa259900baf24fc7365ee9685a2209f21af',
  '49bd6c57054d9e2788d41906b66415ddb5325c59c8a63f3321313a394ee935b7',guardInverse,
  "assert.throws(()=>readClosed56LiveCopy(liveName,{read:alter(path,change)}))"],
])test(name+' restores its complete pre-repair bytes',()=>{
 const bytes=read(name),text=bytes.toString('utf8');
 assert.equal(sha(bytes),proposal,'Exact reviewed candidate');
 assert.equal(sha(Buffer.from(invert(text))),before,'Whole original file restored by declared seams');
 assert(text.includes(mutation));
 const forged=text.replace(mutation,mutation+' /* forged */');
 assert.notEqual(forged,text);
 assert.notEqual(sha(Buffer.from(invert(forged))),before,'Mutation breaks whole-file inverse');
});
