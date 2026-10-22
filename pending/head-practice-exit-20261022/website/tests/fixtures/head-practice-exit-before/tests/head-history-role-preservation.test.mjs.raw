import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {restoreHeadToolsWiderConsumer} from './head-tools-wider-consumer-inverse.mjs';
import {restoreMigrationLaterRole} from './head-manual-migration-later-inverse.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=name=>readFileSync(new URL(name,import.meta.url));
const once=(text,from,to)=>{assert.equal(text.split(from).length,2,from);return text.replace(from,to);};
const rows=[
 ['head-disclosure-harness-preservation','94d12084491042a5b75b9fe0d36659f51d00060d0e61d5a701f99e05566ec6fc'],
 ['head-image-history-anchor-harness','68993149a955247fa018931ccdd3c868d38a537c74c85a49d14c82adbdc85317'],
 ['head-native-history-current-transition','c3edec82dd906b0204742f77e4946d3f5a312f5e007d4edde829a7d6dce84a0c'],
 ['head-manual-recovery-migration','b3ac57101707f35eacb1a7b405641440e909bfacdf05fce71185190125b0e6b3'],
];
const appendix={
 disclosure:` if(file==='head-image-history.test.ts'||file==='head-view-history-client.test.mjs'){
  const currentImport="import {headIndexKey,headIndexTabStop} from '../lib/head-index-keyboard.ts';",originalImport="import {headIndexKey} from '../lib/head-index-keyboard.ts';";
  const currentBranch="name==='../lib/head-index-keyboard'?{headIndexKey,headIndexTabStop}:",originalBranch="name==='../lib/head-index-keyboard'?{headIndexKey}:";
  for(const[from,to]of[[currentImport,originalImport],[currentBranch,originalBranch]]){assert.equal(current.split(from).length,2,from);current=current.replace(from,to);}
 }
`,
 anchor:` const indexSeams=[["import {headIndexKey} from '../lib/head-index-keyboard.ts';","import {headIndexKey,headIndexTabStop} from '../lib/head-index-keyboard.ts';"],["name==='../lib/head-index-keyboard'?{headIndexKey}:","name==='../lib/head-index-keyboard'?{headIndexKey,headIndexTabStop}:"]];
 for(const[from,to]of indexSeams){assert.equal(expected.split(from).length,2,from);expected=expected.replace(from,to);}
`,
 live:`test('actual current190 delivery remains independently bound without treating closed53 as current',()=>{
 const live=validateLiveAtlasDelivery();assert.equal(live.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');assert.equal(live.sourceTree,'c314f1cbfa394caed4c6874864fda7dea0a3286c');assert.equal(live.reviewIntegration,'34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f');assert.equal(live.reviewSourceFiles,1553);
 assert.throws(()=>validateLiveAtlasDelivery({pin:validateRevision53Delivery()}));
 const helper=readFileSync(new URL('../lib/head-view-history.ts',import.meta.url),'utf8');assert.doesNotMatch(helper,/localStorage|sessionStorage|indexedDB|fetch\\(/);assert.match(helper,/export function createHeadViewHistory\\(limit=64/);assert.match(helper,/freshExternalState/);assert.match(helper,/HEAD_VIEW_EXTERNAL_HISTORY_KEY/);
});
`,
 currentLive:`test('actual current6d7 delivery retains independent 190a runtimes without treating closed53 as current',()=>{
 const live=validateLiveAtlasDelivery();assert.equal(live.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');assert.equal(live.sourceTree,'e9165d7122361f809a267af1414b337b69097fe2');assert.equal(live.reviewIntegration,'525f8fbe122bf6bdc15d8b89f572e49e3ac0ce09cd411b8009f67454d938a163');assert.equal(live.reviewSourceFiles,1558);
 assert.equal(live.runtimeSources['head-neck'],live.source);for(const module of ['shoulder','lower-limb','female-pelvis'])assert.equal(live.runtimeSources[module],'190a63238eadcf906abe89dcbb6a67c88afe70b9',module+' retained runtime source');
 assert.throws(()=>validateLiveAtlasDelivery({pin:validateRevision53Delivery()}));
 const helper=readFileSync(new URL('../lib/head-view-history.ts',import.meta.url),'utf8');assert.doesNotMatch(helper,/localStorage|sessionStorage|indexedDB|fetch\\(/);assert.match(helper,/export function createHeadViewHistory\\(limit=64/);assert.match(helper,/freshExternalState/);assert.match(helper,/HEAD_VIEW_EXTERNAL_HISTORY_KEY/);
});
`,
};
function reverse(name,text){
 if(name===rows[3][0])text=restoreMigrationLaterRole(name+'.test.mjs',Buffer.from(text),read('./fixtures/live-learning-consumer-loader/head-manual-recovery-migration.test.mjs.raw')).toString();
 if(name===rows[0][0]){text=once(text," if(file==='head-open-state.test.ts'){const now='`${count} listed annotations`',before='`${count} accepted annotations`';assert.equal(current.split(now).length,2);current=current.replace(now,before);}\n",'');return once(text,appendix.disclosure,'');}
 if(name===rows[1][0])return once(text,appendix.anchor,'');
 if(name===rows[2][0]){
  text=once(text,appendix.currentLive,appendix.live);
  text=once(text,"import {validateCurrentAtlasDelivery as validateLiveAtlasDelivery} from './current-atlas-delivery.mjs';\n",'');
  text=once(text,appendix.live,'');
  text=once(text,"const radialPost52=readFileSync(new URL('./fixtures/head-native-radial-eus-post52.mjs.raw',import.meta.url));assert.equal(sha(radialPost52),'04362adbf0d1ef51063e3943fc60b8d9693d7613a29349af2183ab1440670847');assert.deepEqual(radialPost52,Buffer.from(radial),'All original52 assertions remain');","assert.deepEqual(read('tests/radial-eus-current-transition.test.mjs'),Buffer.from(radial),'All original52 assertions remain');");
  return text;
 }
 const added=`  const nativePost53=read('tests/fixtures/head-native-history-current-transition-before-role-20261021.mjs.raw');
  assert.equal(sha(nativePost53),'c3edec82dd906b0204742f77e4946d3f5a312f5e007d4edde829a7d6dce84a0c');
  assert.deepEqual(nativePost53,Buffer.from(native));`;
 return once(text,added,"  assert.deepEqual(read('tests/head-native-history-current-transition.test.mjs'),Buffer.from(native));");
}
test('four source readers retain exact whole originals through enumerated role seams',()=>{
 for(const[name,digest]of rows){
  const original=read(`./fixtures/${name}-before-role-20261021.mjs.raw`),live=read(`./${name}.test.mjs`),current=name===rows[2][0]?restoreHeadToolsWiderConsumer(name+'.test.mjs',live):live;
  assert.equal(sha(original),digest,name);assert.deepEqual(Buffer.from(reverse(name,current.toString())),original,name);
 }
});
test('whole-file inverse rejects undeclared non-seam mutations',()=>{
 for(const[name]of rows){const current=read(`./${name}.test.mjs`).toString();
  const historical=name===rows[2][0]?restoreHeadToolsWiderConsumer(name+'.test.mjs',Buffer.from(current)).toString():current;
  if(name===rows[2][0])assert.throws(()=>restoreHeadToolsWiderConsumer(name+'.test.mjs',Buffer.from(current+'\n// forged mutation')),name);
  if(name===rows[3][0])assert.throws(()=>reverse(name,historical+'\n// forged mutation'),name);
  else assert.notDeepEqual(Buffer.from(reverse(name,historical+'\n// forged mutation')),read(`./fixtures/${name}-before-role-20261021.mjs.raw`),name);
 }
});
