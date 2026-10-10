import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {contentContext} from './content-contract-tools.mjs';
import {build} from './workspace-test-build.mjs';
import pins from '../content/thoracic-small-vessel-mri-pins.json' with {type:'json'};
const mode=process.argv[2]??'--integrated';
assert(['--source-only','--integrated'].includes(mode)&&process.argv.length<=3);
const integrated=mode==='--integrated';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(pins.parentCommit,'84ed21b1ad446039ac4210d6a02e0bb0bfd553dd');
assert.equal(pins.entries.length,5);
assert.equal(new Set(pins.entries.map(e=>e.identity.id)).size,5);
assert.deepEqual(pins.entries.map(e=>e.identity.fmaId).sort(),['FMA4149','FMA10704','FMA68109','FMA71537','FMA76767'].sort());
const baseline=await exactSourceHistoryApi(pins.parentCommit,'display');
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json','utf8'));
const catalog=baseline.bodyDisplayCatalog(raw);
assert.equal(hash(catalog),pins.previousCatalogHash);
assert.deepEqual(catalog.coordinateSystem,pins.coordinateSystem);
assert.equal(catalog.sourceVersion,pins.sourceVersion);
for(const bundle of pins.bundles){
  assert.deepEqual(catalog.bundles.find(b=>b.id===bundle.id),bundle);
  const bytes=await readFile('public'+bundle.url.split('?')[0]);
  assert.equal(bytes.length,bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);
}
const previousTopics=catalog.structures.map(s=>({id:s.id,topics:baseline.contentTabs.map(tab=>({tab,...baseline.bodyLesson(s,tab)}))}));
assert.equal(hash(previousTopics),pins.previousAllTopicsHash);
const built=await build({stdin:{contents:"export {thoracicSmallVesselMriLesson} from './lib/thoracic-small-vessel-mri';export {thoracicSmallVesselMriGroups,thoracicSmallVesselMriReferences} from './content/thoracic-small-vessel-mri';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {thoracicSmallVesselMriLesson:lesson,thoracicSmallVesselMriGroups:groups,thoracicSmallVesselMriReferences:references}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
assert.deepEqual(Object.keys(groups).sort(),pins.entries.map(e=>e.group).sort());
const targets=new Map(pins.entries.map(e=>[e.identity.id,e]));
let current;
if(integrated){current=await contentContext();assert.equal(hash(current.api.bodyDisplayCatalog(current.catalog)),pins.previousCatalogHash);}
let changed=0,preserved=0,refused=0;
for(const structure of catalog.structures)for(const tab of baseline.contentTabs){
  const entry=targets.get(structure.id),before=baseline.bodyLesson(structure,tab),draft=lesson(structure,tab);
  if(entry&&tab==='mri'){
    assert.deepEqual(structure,entry.identity);
    assert.deepEqual(before,entry.previous.mri);
    assert.equal(before.readiness,'pending');assert.equal(draft.readiness,'draft');
    assert.equal(draft.title,structure.name+' · MRI orientation · draft');
    assert.equal(groups[entry.group].fmaId,structure.fmaId);
    assert.equal(groups[entry.group].laterality,structure.laterality);
    assert(draft.bullets.some(b=>b.includes('Return separation to zero')));
    assert.match(draft.note,/Independent anatomy\/radiology review pending/);
    assert.match(draft.note,/No patient images, spatial registration or approved imaging link/);
    assert.equal(new Set(draft.citations).size,draft.citations.length);
    assert(draft.citations.every(url=>Object.values(references).includes(url)&&new URL(url).protocol==='https:'));
    if(integrated)assert.deepEqual(current.api.bodyLesson(structure,tab),draft);
    changed++;
  }else{
    assert.equal(draft,undefined);
    if(integrated)assert.deepEqual(current.api.bodyLesson(structure,tab),before,structure.id+'|'+tab);
    preserved++;
  }
}
assert.equal(changed,5);assert.equal(changed+preserved,previousTopics.reduce((n,s)=>n+s.topics.length,0));
for(const {identity} of pins.entries){
  const original=structuredClone(lesson(identity,'mri'));
  lesson(identity,'mri').bullets.push('foreign');lesson(identity,'mri').citations.push('foreign');
  assert.deepEqual(lesson(identity,'mri'),original);
  for(const change of [
    s=>{s.id='foreign';},s=>{s.fmaId='FMA0';},s=>{s.name='Foreign';},
    s=>{s.laterality='left';},s=>{s.region='abdomen';},s=>{s.regions=['abdomen'];},
    s=>{s.system='organs';},s=>{s.category='organ';},s=>{s.sourceTree='foreign';},
    s=>{s.bundle='foreign';},s=>{s.nodeName='foreign';},
    s=>{s.bounds.min[0]+=0.01;},s=>{s.sources=[];},
    s=>{s.sources[0].sha256='0'.repeat(64);},s=>{s.validation.anatomicalReview=true;},
  ]){const altered=structuredClone(identity);change(altered);assert.equal(lesson(altered,'mri'),undefined);refused++;}
}
assert.match(groups['anterior-cardiac-vein'].pitfall,/anterior interventricular vein.*different vessel/i);
assert.match(groups['variant-bronchial-artery'].pitfall,/lower spatial resolution/i);
for(const key of ['esophageal-artery','esophageal-branches'])assert.match(groups[key].pitfall,/no .*MRI/i);
console.log(JSON.stringify({passed:true,mode,changed,preserved,sourceRefusals:refused,pinsHash:hash(pins),clinicalApproval:false}));
