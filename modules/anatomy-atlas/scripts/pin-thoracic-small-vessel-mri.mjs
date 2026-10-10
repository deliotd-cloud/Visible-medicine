import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const parentCommit='84ed21b1ad446039ac4210d6a02e0bb0bfd553dd';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const old=path=>execFileSync('git',['show',`${parentCommit}:${path}`],{encoding:'utf8',maxBuffer:32e6});
const check=process.argv[2]==='--check';
assert((check||process.argv.length===2)&&process.argv.length<=3,'Only --check is accepted');
if(!check){
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),parentCommit);
  assert.equal(await readFile('app/body-content.ts','utf8'),old('app/body-content.ts'),'Pin before dispatcher integration');
}
for(const path of ['public/models/bodyparts3d/full-body/catalog.json','public/models/bodyparts3d/anterior-cardiac-vein/catalog.json'])
  assert.equal(await readFile(path,'utf8'),old(path),`${path} must match pin baseline`);
const api=await exactSourceHistoryApi(parentCommit,'display');
const catalog=api.bodyDisplayCatalog(JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json')));
const expected=new Map([
  ['FMA4149','esophageal-artery'],['FMA10704','variant-bronchial-artery'],
  ['FMA68109','bronchial-artery'],['FMA71537','esophageal-branches'],
  ['FMA76767','anterior-cardiac-vein'],
]);
const entries=[...expected].map(([fmaId,group])=>{
  const matching=catalog.structures.filter(s=>s.fmaId===fmaId);
  assert.equal(matching.length,1,`exact catalog identity for ${fmaId}`);
  const identity=matching[0],previous={mri:api.bodyLesson(identity,'mri')};
  assert.equal(identity.region,'thorax');assert.equal(previous.mri.readiness,'pending');
  return{identity,group,topics:['mri'],previous};
});
const bundleIds=new Set(entries.map(e=>e.identity.bundle));
const bundles=catalog.bundles.filter(b=>bundleIds.has(b.id));
assert.equal(bundles.length,bundleIds.size);
for(const b of bundles){
  const bytes=await readFile('public'+b.url.split('?')[0]);
  assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);
}
const allTopics=catalog.structures.map(s=>({id:s.id,topics:api.contentTabs.map(tab=>({tab,...api.bodyLesson(s,tab)}))}));
const pins={schemaVersion:1,parentCommit,sourceVersion:catalog.sourceVersion,
  coordinateSystem:catalog.coordinateSystem,bundles,entries,
  previousCatalogHash:hash(catalog),previousAllTopicsHash:hash(allTopics)};
if(check){
  const current=JSON.parse(await readFile('content/thoracic-small-vessel-mri-pins.json','utf8'));
  assert.deepEqual(current,pins,'Historical pins must reconstruct exactly');
}else await writeFile('content/thoracic-small-vessel-mri-pins.json',JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({checked:check,roots:entries.length,bundles:bundles.length,pinsHash:hash(pins)}));
