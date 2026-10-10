// Test-only replay of two recorded teaching transitions. No application import
// or catalog read is allowed to float with the working tree.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const gitOptions={cwd:root,encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},maxBuffer:16e6};
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const catalogBlob='2f4dc97cf918c3cff128dbb55092260430634eaa';
const epochPins=Object.freeze({
 'cranial-boundary-before':{commit:'a8a711c40fe20ebacf880e028354ab4e71cb8651',tree:'afdc9807880c89b92f2e5f8b33449c6e839b3a06',parent:'548656bfd321605db7e82fd8f431c19b7489307b'},
 'cranial-boundary-after':{commit:'8e26f15e2664d3b3aaa2cbff33d2ee28f2d113a0',tree:'4fa43c4a39060f68992989aa662e55b5810455c1',parent:'a8a711c40fe20ebacf880e028354ab4e71cb8651'},
 'costal-before':{commit:'8e26f15e2664d3b3aaa2cbff33d2ee28f2d113a0',tree:'4fa43c4a39060f68992989aa662e55b5810455c1',parent:'a8a711c40fe20ebacf880e028354ab4e71cb8651'},
 'costal-after':{commit:'841b3fdf77412943d23b8f5a38ab1e251d4657a5',tree:'200ce5367c4f176ba8ad9a2691b6830d2fd8f26b',parent:'8e26f15e2664d3b3aaa2cbff33d2ee28f2d113a0'},
});
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const snapshot=({api,display})=>({
 body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),
 shoulder:api.structures,recipes:api.dissectionProfiles,
});

export async function exactCranialEpochContext(epoch){
 assert(Object.hasOwn(epochPins,epoch),`Unknown cranial epoch: ${String(epoch)}`);
 const {commit,tree,parent}=epochPins[epoch];
 const identity=execFileSync('git',['show','-s','--format=%H %T %P',commit],gitOptions).trim();
 assert.equal(identity,`${commit} ${tree} ${parent}`,'Historical commit, tree or parent mismatch');
 assert.equal(execFileSync('git',['ls-tree',commit,catalogPath],gitOptions).trim(),
  `100644 blob ${catalogBlob}\t${catalogPath}`,'Historical catalog blob mismatch');
 const catalog=JSON.parse(execFileSync('git',['show',`${commit}:${catalogPath}`],gitOptions));
 const api=await exactSourceHistoryApi(commit,'display-content');
 const display=api.bodyDisplayCatalog(catalog);
 return {api,catalog,display,commit};
}

const transitionPins=Object.freeze({
 'cranial-boundary':{before:'cranial-boundary-before',after:'cranial-boundary-after',
  pinsHash:'17c346a550a98c169becc90dfccbb407578ca854e23e8c09931b518f7daf7925',
  transitionHash:'1174caef7325ebe20b930e11f807dfce3c933355f2f47372576d03dd76b18d98'},
 costal:{before:'costal-before',after:'costal-after',
  pinsHash:'20fc459efdfdf66d0d4965c270b042b65b8c84683df1da71a5c0dc1ab2b4f0fb',
  transitionHash:'3b6a569265570f4e1dc9d7cfc483ae2c6e092d0b5da89dce370c62276ebd924c'},
});

/** Verify copied pin data and both complete source-era contexts. */
export function validateExactCranialTransition(kind,{before,after,pins,transition}){
 assert(Object.hasOwn(transitionPins,kind),`Unknown cranial transition: ${String(kind)}`);
 const fixed=transitionPins[kind];
 assert.equal(before.commit,epochPins[fixed.before].commit,'Wrong before epoch');
 assert.equal(after.commit,epochPins[fixed.after].commit,'Wrong after epoch');
 assert.equal(hash(pins),fixed.pinsHash,'Altered historical pins');
 assert.equal(hash(transition),fixed.transitionHash,'Altered historical transition');
 assert.equal(pins.sourceCommit,before.commit,'Source commit mismatch');
 assert.equal(transition.parentCommit,before.commit,'Transition parent mismatch');
 assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash,'Transition baseline mismatch');
 assert.deepEqual(before.catalog,after.catalog,'Catalog changed across teaching transition');
 for(const context of [before,after]){
  for(const key of ['sourceVersion','license','coordinateSystem'])assert.deepEqual(context.display[key],pins[key],`Source identity mismatch: ${key}`);
  for(const bundle of pins.bundles)assert.deepEqual(context.display.bundles.find(v=>v.id===bundle.id),bundle,'Source bundle mismatch');
 }
 assert.equal(transition.entries.length,pins.entries.length,'Target count mismatch');
 let sections=0;
 for(const [i,entry] of pins.entries.entries()){
  const identity=entry.identity,target=transition.entries[i];
  assert.equal(target.id,identity.id,'Target identity mismatch');
  for(const context of [before,after]){
   const matches=context.display.structures.filter(s=>s.id===identity.id);
   assert.equal(matches.length,1,'Source identity missing or duplicated');
   assert.deepEqual(matches[0],identity,'Source identity changed');
  }
  assert.deepEqual(Object.keys(target.sections),entry.topics,'Target topics mismatch');
  for(const topic of entry.topics){
   assert.deepEqual(before.api.bodyLesson(identity,topic),entry.previous[topic],`Before target mismatch: ${identity.id} ${topic}`);
   assert.equal(hash(after.api.bodyLesson(identity,topic)),target.sections[topic],`After target mismatch: ${identity.id} ${topic}`);
   sections++;
  }
 }
 assert.equal(hash(snapshot(before)),pins.previousAllLessonsAndRecipesHash,'Before full teaching or recipes mismatch');
 assert.equal(hash(snapshot(after)),transition.currentAllLessonsAndRecipesHash,'After full teaching or recipes mismatch');
 return {kind,beforeCommit:before.commit,afterCommit:after.commit,targets:pins.entries.length,sections};
}
