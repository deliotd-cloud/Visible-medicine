// Pure exact-byte current→frozen adapter for six Batch-C consumers.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha=b=>createHash('sha256').update(b).digest('hex');
const old='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const importBefore="import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';";
const importAfter="import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';";
const sourceBefore="assert.equal(current.source,'"+old+"');";
const sourceAfter="assert.equal(current.source,CURRENT_ATLAS_REVISION);\n  assert.equal(current.runtimeSources.shoulder,'"+old+"');";
const limbNew='cffd85f99710eab36bf0df7d71f8dd86ded3cf8634a960028e94cf1c517ce8f6';
const limbV5='fa3ff34ae74397b4f84835e0a5f5364493136114f004c26ce9d7a41acdd9d9a7';
const medianNew='4e2a4a78f39f8aa4f9f1dc69304f963541c5a60e77d7d2b97d7bb45cfad894a0';
const medianV5='211e92a61e4e9b7298163c20b90b04b333e9ea741654dfbada106c9537864b1f';
function restoreV5LimbNerve(bytes){
 assert.equal(sha(bytes),limbNew,'Exact new limb-nerve source');
 let text=Buffer.from(bytes).toString('utf8');
 assert.deepEqual(Buffer.from(text),bytes,'Lossless new limb-nerve UTF-8');
 assert(!text.includes('\r'),'LF new limb-nerve source');
 const removeBetween=(start,end)=>{
  assert.equal(text.split(start).length,2,'Unique new limb-nerve start');
  assert.equal(text.split(end).length,2,'Unique new limb-nerve end');
  const first=text.indexOf(start),last=text.indexOf(end,first);
  assert(last>first,'Ordered new limb-nerve source seam');
  text=text.slice(0,first)+text.slice(last);
 };
 const undo=(after,before)=>{
  assert.equal(text.split(after).length,2,'Unique new limb-nerve source seam');
  text=text.replace(after,before);
 };
 removeBetween('const once=(source:string,before:string,after:string)=>{','type File={path:string;sha256:string;sourceSha256?:string;importedSha256?:string};');
 undo('const historicalSource=committed(revision,entry),runtimeSource=committed(current.runtimeSources[name],entry),inputs=learnerInputs.get(name)!;',
  'const source=committed(revision,entry),inputs=learnerInputs.get(name)!;');
 undo('    assert.equal(inputs.filter(f=>f.path===entry).length,1,`${name}: one entrypoint input`);\n','');
 undo('assert.equal(inputs.find(f=>f.path===entry)?.sha256,sha(runtimeSource),`${name}: current runtime entrypoint input`);',
  'assert.equal(inputs.find(f=>f.path===entry)?.sha256,sha(source),`${name}: entrypoint input`);');
 undo('assert.match(norm(runtimeSource),pattern,`${name}: learner scope`);',
  'assert.match(norm(source),pattern,`${name}: learner scope`);');
 undo('assert.equal(norm(historicalSource),bodyChannelEntrypoint(precedingEntrypoint,name),`${name}: exact additional root-body channel only`);',
  'assert.equal(norm(source),bodyChannelEntrypoint(precedingEntrypoint,name),`${name}: exact additional root-body channel only`);');
 removeBetween("    if(name==='head-neck'){",'  }\n  for(const path of sourcePaths){');
 const restored=Buffer.from(text);
 assert.equal(sha(restored),limbV5,'Full new→V5 limb-nerve source inverse');
 return restored;
}
function restoreV5Median(bytes){
 assert.equal(sha(bytes),medianNew,'Exact new median-cubital source');
 let text=Buffer.from(bytes).toString('utf8');
 assert.deepEqual(Buffer.from(text),bytes,'Lossless new median-cubital UTF-8');
 assert(!text.includes('\r'),'LF new median-cubital source');
 const start='const currentHeadEntrypoint=(historical:string)=>{';
 const end='type File={path:string;sha256:string;sourceSha256?:string;importedSha256?:string};';
 assert.equal(text.split(start).length,2,'One median current-head helper');
 assert.equal(text.split(end).length,2,'One median type boundary');
 const a=text.indexOf(start),b=text.indexOf(end,a);assert(b>a);
 text=text.slice(0,a)+text.slice(b);
 const undo=(after,before)=>{
  assert.equal(text.split(after).length,2,'Unique new median source seam');
  text=text.replace(after,before);
 };
 undo('const historicalSource=committed(revision,path),runtimeSource=committed(current.runtimeSources[name],path);',
  'const source=committed(revision,path);');
 undo('sha(runtimeSource),`${name}: current runtime entrypoint`','sha(source),`${name}: entrypoint`');
 undo('assert.match(norm(runtimeSource),pattern,`${name}: learner scope`);',
  'assert.match(norm(source),pattern,`${name}: learner scope`);');
 undo('assert.equal(norm(historicalSource),bodyChannelEntrypoint(precedingEntrypoint,name),`${name}: exact additional root-body channel only`);',
  'assert.equal(norm(source),bodyChannelEntrypoint(precedingEntrypoint,name),`${name}: exact additional root-body channel only`);');
 undo("    if(name==='head-neck')assert.equal(norm(runtimeSource),currentHeadEntrypoint(norm(historicalSource)),\n      'Current head entrypoint adds only the exact learning-selection channel');\n    else assert.deepEqual(runtimeSource,historicalSource,`${name}: independent runtime preserves historical entrypoint`);\n",'');
 const restored=Buffer.from(text);
 assert.equal(sha(restored),medianV5,'Full new→V5 median-cubital inverse');
 return restored;
}
const cases={
 'clinical-review-limb-nerve-quiz.test.ts':{
  current:'fa3ff34ae74397b4f84835e0a5f5364493136114f004c26ce9d7a41acdd9d9a7',
  prior:'74a100863fb33a27b94e7e56847c225fab618b500bfeb5f0d37971faff5781d9',
  seams:[[importAfter,importBefore],[sourceAfter,sourceBefore],
   ['manifest.sourceCommit,current.runtimeSources[name]','manifest.sourceCommit,current.source']],
 },
 'clinical-review-longus-colli-quiz.test.ts':{
  current:'d43126d271fa2c7a957e9e9000b60b4c13e99a77afdd71d92b18e083c8399612',
  prior:'68589eca6ad26c87d2e46f57f55769b75f3e3ce0919fe5cc49ac50ae7fa32dd8',
  seams:[[importAfter,importBefore],
   ["assert.equal(current.source,CURRENT_ATLAS_REVISION);\n assert.equal(current.runtimeSources.shoulder,'"+old+"');",sourceBefore],
   ['manifest.sourceCommit,current.runtimeSources[module]','manifest.sourceCommit,current.source']],
 },
 'clinical-review-median-cubital-xray.test.ts':{
  current:'211e92a61e4e9b7298163c20b90b04b333e9ea741654dfbada106c9537864b1f',
  prior:'886db4ebcf56a04764fb9e416aaffd61c72f9487d5d18ddc63f66b0ed6e848a4',
  seams:[[importAfter,importBefore],[sourceAfter,sourceBefore],
   ['manifest.sourceCommit,current.runtimeSources[name]','manifest.sourceCommit,current.source'],
   ["      assert.equal(sha(currentSource),'26320b064b5648f4f5b6ca8c123806a02dedefb761b894935707559d530882fc');\n      assert.equal(sha(committed(current.runtimeSources.shoulder,path)),\n        '3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2',\n        'Earlier shoulder family keeps the prior exact teaching source');",
    "      assert.equal(sha(currentSource),'3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2');"],
  ],
 },
 'clinical-review-mesenteric-vessel-teaching.test.ts':{
  current:'32a0194ad4c377346eccca8a4e4ce00e097d6b4f31c5cf3bf278db48701c8277',
  prior:'b677b62a8c142b7e0a07ed8d225e1ba040f1e675bc3402a77d71b0883ed140b4',
  seams:[
   ["import {execFileSync} from 'node:child_process';\n",''],
   ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';",
    "import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';"],
   ["assert.equal(current.source,CURRENT_ATLAS_REVISION);\n assert.equal(current.runtimeSources.shoulder,'"+old+"');",sourceBefore],
   ['learner.sourceCommit,current.runtimeSources[name]','learner.sourceCommit,review.revision'],
   ["   if(name==='shoulder'&&path==='app/body-content.ts'){\n    const familySource=execFileSync('git',['--no-replace-objects','show',`${current.runtimeSources[name]}:${path}`],\n     {cwd:currentAtlasDeliveryRoot(),windowsHide:true,maxBuffer:32e6});\n    learnerSourceSha=rawSha(familySource);\n    assert.equal(learnerSourceSha,'3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2');\n    assert.notEqual(learnerSourceSha,record.sourceSha256,'Shoulder retains its exact earlier family teaching source');\n   }\n",''],
  ],
 },
 'clinical-review-iliac-venous-xray.test.ts':{
  current:'2263dcdb09bcf8aa42a608db8c31075aa19b47e4101f500c9df5f07a677b8a74',
  prior:'a55f6c33ee41cccc7720482124104b529bcdfa9336ee5760ff35ec49ce34be68',
  seams:[
   ["current.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'","current.source,'"+old+"'"],
   ['runtime.sourceCommit,current.runtimeSources[runtimeNames[index]]','runtime.sourceCommit,current.source'],
  ],
 },
 'clinical-review-intracranial-arterial-xray.test.ts':{
  current:'df6c0e5b9fc90ed57d60b580c0f03360daeea3997b24c286db6d036434949c35',
  prior:'582b55d1960288b58f00cac0c2bf4b5be88df0dbe851a2e270e7522b3f9a91c8',
  seams:[
   ["current.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'","current.source,'"+old+"'"],
   ['for(const [index,runtime] of runtimes.entries()){','for(const runtime of runtimes){'],
   ['runtime.sourceCommit,current.runtimeSources[runtimeNames[index]]','runtime.sourceCommit,current.source'],
  ],
 },
};
export const batchCRoleNames=Object.freeze(Object.keys(cases));
export function restorePriorBatchCRole(name,currentBytes,{readPrior=readFileSync}={}){
 if(name==='clinical-review-limb-nerve-quiz.test.ts'&&sha(currentBytes)===limbNew)
  currentBytes=restoreV5LimbNerve(currentBytes);
 if(name==='clinical-review-median-cubital-xray.test.ts'&&sha(currentBytes)===medianNew)
  currentBytes=restoreV5Median(currentBytes);
 const item=cases[name];assert(item,'Only six declared Batch-C role transitions admitted');
 assert.equal(sha(currentBytes),item.current,'Exact current source bytes: '+name);
 const prior=readPrior(new URL('./fixtures/batch-c-role-prior/'+name+'.raw',import.meta.url));
 assert.equal(sha(prior),item.prior,'Exact full frozen prior fixture: '+name);
 let text=Buffer.from(currentBytes).toString('utf8');
 assert.deepEqual(Buffer.from(text),currentBytes,'Lossless current UTF-8: '+name);
 assert(!text.includes('\r'),'LF current source: '+name);
 for(const [after,before] of item.seams){
  assert.equal(text.split(after).length,2,'Unique exact Batch-C role seam: '+name);
  text=text.replace(after,before);
 }
 const restored=Buffer.from(text);
 assert.deepEqual(restored,prior,'Complete current→frozen source inverse: '+name);
 return restored;
}
