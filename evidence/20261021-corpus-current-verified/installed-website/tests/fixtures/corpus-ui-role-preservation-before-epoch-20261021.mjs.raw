import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL(p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const once=(s,before,after)=>{
 assert.equal(s.split(before).length,2,'One exact source seam: '+before);
 return s.replace(before,after);
};
const preserve=(name,rawName,rawHash,edits,appendix='')=>{
 const raw=read('./fixtures/'+rawName);assert.equal(sha(raw),rawHash,'Byte-authentic full predecessor '+name);
 const candidate=read('./'+name+'.test.mjs').toString();
 let expected=raw.toString();
 for(const [before,after]of edits)expected=once(expected,before,after);
 assert.equal(candidate,expected+appendix,'Complete predecessor and only declared current-role seams '+name);
 let inverse=candidate;
 if(appendix){assert(inverse.endsWith(appendix));inverse=inverse.slice(0,-appendix.length);}
 for(const [before,after]of edits.toReversed())inverse=once(inverse,after,before);
 assert.equal(sha(Buffer.from(inverse)),rawHash,'Byte-exact whole-file inverse '+name);
 assert.throws(()=>assert.equal(candidate+'\nconst unknown=true;\n',expected+appendix),'Unknown appended behavior refused '+name);
};

const corpusAppendix=`
test('whole bd corpus contract remains an exact archived source and refuses current admission',()=>{
 const bytes=readFileSync(new URL('./fixtures/tour-discovery-corpus-bd5465ee.mjs.raw',import.meta.url));assert.equal(sha(bytes),'90d7a670937e05a5a607c813e3a712e62b19a9d0ea608f64841f6d167e2858ef');
 const old=JSON.parse(readFileSync(new URL('./fixtures/current-atlas-delivery-before-head-disclosure-bd5465ee.json',import.meta.url)));
 assert.equal(old.source,'bd5465ee3b94c66c3d5701e7749099d07e8f40d3');assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));
 const current=readFileSync(new URL('./corpus-xray-v2-current-delivery.test.mjs',import.meta.url),'utf8');
 const appendix="\\ntest('whole bd corpus contract remains an exact archived source and refuses current admission'";
 const cut=current.indexOf(appendix);assert(cut>0&&current.lastIndexOf(appendix)===cut);
 const body=current.slice(0,cut).replace("assert.equal(delivery.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');","assert.equal(delivery.source,'bd5465ee3b94c66c3d5701e7749099d07e8f40d3');");
 assert.equal(body,bytes.toString(),'Every original learner, Review, refusal and source assertion survives the one current-source seam');
});
`;

test('whole corpus source retains every bd assertion and refuses unknown mutations',()=>{
 preserve('corpus-xray-v2-current-delivery','corpus-xray-v2-current-delivery.test.mjs.raw',
  '90d7a670937e05a5a607c813e3a712e62b19a9d0ea608f64841f6d167e2858ef',[
   ["assert.equal(delivery.source,'bd5465ee3b94c66c3d5701e7749099d07e8f40d3');","assert.equal(delivery.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');"],
  ],corpusAppendix);
 const current=read('./corpus-xray-v2-current-delivery.test.mjs').toString();
 assert(current.includes("const forged=wire(decision);forged.draft.checks.foreign=true;"));
 assert.notEqual(current.replace("const forged=wire(decision);forged.draft.checks.foreign=true;",''),current);
});

test('whole UI source advances exactly two observed Review count seams',()=>{
 preserve('ui-teaching-current-delivery','ui-teaching-current-delivery.test.mjs.raw',
  'afcfd94cb82c7289f525521f533839526cfdbad94d9686bf91251108c5cf5285',[
   ['assert.equal(delivery.reviewSourceFiles, 1550);','assert.equal(delivery.reviewSourceFiles, 1553);'],
   ['assert.equal(inputs.inputs.length, 1707);','assert.equal(inputs.inputs.length, 1710);'],
  ]);
 const current=read('./ui-teaching-current-delivery.test.mjs').toString();
 assert(current.includes('const forgedIdentity'));
 assert.throws(()=>assert.equal(current.replace('const forgedIdentity','const acceptedIdentity'),current));
});
