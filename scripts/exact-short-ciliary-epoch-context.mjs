// Test-only reconstruction of the two complete short-ciliary source eras.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const gitOptions={cwd:root,encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},maxBuffer:16e6};
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const catalogBlob='2f4dc97cf918c3cff128dbb55092260430634eaa';
export const shortCiliaryEpochPins=Object.freeze({
 before:Object.freeze({commit:'3c1082f14475f7ad3b32315c3f7bed8f2db1c8d6',tree:'440f8df38818d725a863a347ef3db3546d3b2fad',parent:'055e0c1b6e4bc738097c2c59e6dc4c865e5b621f'}),
 after:Object.freeze({commit:'5d5021f46b69f191c7158b9b13fdf89f0ab313c9',tree:'6a574ab76b663b9d0d839d793006e66a40582954',parent:'3c1082f14475f7ad3b32315c3f7bed8f2db1c8d6'}),
});
const baselineHash='8031a86e4593373cc3ff12c04c2cfc4138692220c9c2d01eb6114b338f6567a8';
const transitionHash='0321886e5de0d75eff6a709008408ff91cc0cd38b546dc6902db3b4b2f10dfe8';
export const shortCiliaryHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const shortCiliarySnapshot=({api,display})=>({
 body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),
 shoulder:api.structures,recipes:api.dissectionProfiles,
});

// Exported pure guards let mutations be checked without a native build or Git checkout.
export function assertShortCiliaryEpochIdentity(epoch,identity,blob){
 assert(Object.hasOwn(shortCiliaryEpochPins,epoch),`Unknown short-ciliary epoch: ${String(epoch)}`);
 const pin=shortCiliaryEpochPins[epoch];
 assert.equal(identity,`${pin.commit} ${pin.tree} ${pin.parent}`,'Historical commit, tree or sole parent mismatch');
 assert.equal(blob,`100644 blob ${catalogBlob}\t${catalogPath}`,'Historical catalog blob mismatch');
 return pin.commit;
}
export function assertShortCiliaryExactTransition({before,after,baseline,transition}){
 assert.equal(shortCiliaryHash(baseline),baselineHash,'Altered historical baseline pins');
 assert.equal(shortCiliaryHash(transition),transitionHash,'Altered historical teaching transition');
 assert.equal(before.commit,shortCiliaryEpochPins.before.commit,'Wrong before epoch');
 assert.equal(after.commit,shortCiliaryEpochPins.after.commit,'Wrong after epoch');
 assert.equal(transition.parentCommit,before.commit,'Transition parent mismatch');
 assert.equal(transition.previousAllLessonsAndRecipesHash,baseline.currentAllLessonsAndRecipesHash,'Transition baseline mismatch');
 assert.equal(transition.catalogHash,baseline.currentCatalogHash,'Transition catalog mismatch');
 assert.deepEqual(before.catalog,after.catalog,'Catalog changed across teaching transition');
 assert.equal(shortCiliaryHash(before.display),baseline.currentCatalogHash,'Before source catalog mismatch');
 assert.equal(shortCiliaryHash(after.display),transition.catalogHash,'After source catalog mismatch');
 for(const context of [before,after]){
  const matches=context.display.structures.filter(s=>s.id===baseline.structure.id);
  assert.deepEqual(matches,[baseline.structure],'Short-ciliary identity changed');
 }
 const topics=Object.keys(transition.sections);
 assert.deepEqual(Object.keys(baseline.topics),['anatomy','function','ct','mri','xray','ultrasound','pathology','clinical','quiz'],'Short-ciliary baseline topic set changed');
 assert.deepEqual(topics,Object.keys(baseline.topics).filter(topic=>topic!=='anatomy'),'Short-ciliary authored topic set changed');
 assert.deepEqual(before.api.bodyLesson(baseline.structure,'anatomy'),baseline.topics.anatomy,'Before source anatomy changed');
 assert.deepEqual(after.api.bodyLesson(baseline.structure,'anatomy'),baseline.topics.anatomy,'After source anatomy changed');
 for(const topic of topics){
  assert.deepEqual(before.api.bodyLesson(baseline.structure,topic),baseline.topics[topic],`Before source lesson mismatch: ${topic}`);
  assert.equal(shortCiliaryHash(after.api.bodyLesson(baseline.structure,topic)),transition.sections[topic],`After source lesson mismatch: ${topic}`);
 }
 assert.equal(shortCiliaryHash(shortCiliarySnapshot(before)),baseline.currentAllLessonsAndRecipesHash,'Before exact full snapshot mismatch');
 assert.equal(shortCiliaryHash(shortCiliarySnapshot(after)),transition.currentAllLessonsAndRecipesHash,'After exact full snapshot mismatch');
 return {beforeCommit:before.commit,afterCommit:after.commit,sections:topics.length};
}

export async function exactShortCiliaryEpochContext(epoch){
 assert(Object.hasOwn(shortCiliaryEpochPins,epoch),`Unknown short-ciliary epoch: ${String(epoch)}`);
 const commit=shortCiliaryEpochPins[epoch].commit;
 const identity=execFileSync('git',['show','-s','--format=%H %T %P',commit],gitOptions).trim();
 const blob=execFileSync('git',['ls-tree',commit,catalogPath],gitOptions).trim();
 assertShortCiliaryEpochIdentity(epoch,identity,blob);
 const catalog=JSON.parse(execFileSync('git',['show',`${commit}:${catalogPath}`],gitOptions));
 const api=await exactSourceHistoryApi(commit,'display');
 return {api,catalog,display:api.bodyDisplayCatalog(catalog),commit};
}
