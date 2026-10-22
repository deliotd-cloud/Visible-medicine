import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';

const bundled=await build({stdin:{contents:`
 export {buildRegionalMri3dCatalogue} from './lib/regional-mri-3d-catalogue';
 export {buildRegionalLearningCatalogue} from './lib/regional-mri-learning-catalogue';
 export {regionalLearningRevision,regionalLearningTopics} from './lib/regional-mri-learning';
 export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';
 export {bodyTeachingLoader} from './atlas-review/lib/body-teaching-loader';
 export {kneeDefinition} from './atlas-review/lib/um-limb-studies';
 export {specimenTeachingFor} from './atlas-review/lib/um-limb-teaching';
 export {default as raw} from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';
`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString('base64')}`) as any;
const source={revision:'1'.repeat(64),region:'knee'};
const clone=<T>(v:T):T=>structuredClone(v);
const mapping=async(base:any)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({version:1,atlasRevision:base.atlasRevision,entries:base.entries})))),n=>n.toString(16).padStart(2,'0')).join('');

test('every admitted target has a source-bound, digest-bound public teaching packet',async()=>{
 const base=await api.buildRegionalMri3dCatalogue(source),learning=base?.learning;
 assert(base);assert(learning);assert.equal(learning.atlasRevision,base.atlasRevision);assert.equal(learning.mappingRevision,base.mappingRevision);
 const targets=base.entries.flatMap((row:any)=>row.targets),keys=new Set(targets.map((t:any)=>t.id+'|'+t.relation));
 assert.equal(learning.entries.length,keys.size);assert.equal(new Set(learning.entries.map((e:any)=>e.target.id+'|'+e.target.relation)).size,keys.size);
 const catalog=api.bodyDisplayCatalog(api.raw);
 for(const entry of learning.entries){
  assert.deepEqual(entry.topics.map((s:any)=>s.id),api.regionalLearningTopics);
  const target=targets.find((t:any)=>t.id===entry.target.id&&t.relation===entry.target.relation);assert(target);
  assert.deepEqual(entry.target,Object.fromEntries(['id','kind','label','side','sourceHash','runtimeRevision','specimenRevision','relation'].map(k=>[k,target[k]])));
  const {revision,...content}=entry;assert.equal(revision,await api.regionalLearningRevision(base.atlasRevision,base.mappingRevision,content));
  if(target.kind==='specimen'){
   const surface=api.kneeDefinition.surfaces.find((s:any)=>s.id===target.id),lesson=api.specimenTeachingFor(api.kneeDefinition,surface);assert(lesson);
   assert.equal(entry.topics[0].body,lesson.anatomy);assert.equal(entry.topics[1].body,lesson.function);
   for(const topic of entry.topics.slice(2)){const original=lesson.extended?.topics[topic.id];assert.equal(topic.readiness,original?'draft':'pending');if(original)assert.equal(topic.body,original.body);}
   assert(entry.limitations.includes(api.kneeDefinition.limitations));
  }else{
   const structure=catalog.structures.find((s:any)=>s.id===target.id),reader=await api.bodyTeachingLoader.load(structure);assert(reader.accepts(structure));
   for(const topic of entry.topics){const original=reader.bodyLesson(structure,topic.id);if(original.readiness==='draft')assert.equal(topic.body,original.body);else assert.equal(topic.readiness,'pending');}
  }
 }
 const packet=JSON.stringify(learning);for(const forbidden of ['shape_kji','offset_kji','nodeName','bounds','center','anchor','sourceTree','patient','dicom','meshUrl','geometryMappingRevision'])assert(!packet.includes('"'+forbidden+'"'),forbidden);
 assert(!packet.includes('clinical-approved'));
});

test('recomputed mapping cannot borrow a foreign specimen runtime or omit its pin',async()=>{
 const base=await api.buildRegionalMri3dCatalogue(source);assert(base?.learning);
 for(const replacement of ['0'.repeat(40),undefined]){
  const changed=clone(base);
  for(const target of changed.entries.flatMap((row:any)=>row.targets).filter((t:any)=>t.kind==='specimen')){
   if(replacement){target.href=target.href.replace(target.runtimeRevision,replacement);target.runtimeRevision=replacement;}
   else delete target.runtimeRevision;
  }
  changed.mappingRevision=await mapping(changed);
  assert.equal(await api.buildRegionalLearningCatalogue(changed),null);
 }
});

test('altered mapping, links, side, source and canonical structure refuse projection',async()=>{
 const base=await api.buildRegionalMri3dCatalogue(source);assert(base?.learning);
 for(const change of [
  (b:any)=>{b.mappingRevision='0'.repeat(64)},
  (b:any)=>{b.entries[0].targets[0].side='right'},
  (b:any)=>{b.entries[0].targets[0].sourceHash='0'.repeat(64)},
  (b:any)=>{b.entries[0].targets[0].href+='#borrowed'},
  (b:any)=>{b.entries[0].targets[0].relation='same-structure'},
  (b:any)=>{b.entries.push(clone(b.entries[0]))},
 ]){const changed=clone(base);change(changed);if(changed.mappingRevision===base.mappingRevision)changed.mappingRevision=await mapping(changed);
  assert.equal(await api.buildRegionalLearningCatalogue(changed),null);}
 const catalog=api.bodyDisplayCatalog(api.raw),altered=clone(catalog),body=base.entries.flatMap((e:any)=>e.targets).find((t:any)=>t.kind==='body');
 altered.structures.find((s:any)=>s.id===body.id).name+=' changed';
 assert.equal(await api.buildRegionalLearningCatalogue(base,altered),null);
 const changedBundle=clone(catalog),structure=catalog.structures.find((s:any)=>s.id===body.id);
 changedBundle.bundles.find((b:any)=>b.id===structure.bundle).sha256='0'.repeat(64);
 assert.equal(await api.buildRegionalLearningCatalogue(base,changedBundle),null);
});

test('same target with separate relation retains separate revisions',async()=>{
 const base=await api.buildRegionalMri3dCatalogue(source);assert(base?.learning);
 const pairs=new Map<string,any[]>();for(const e of base.learning.entries){const a=pairs.get(e.target.id)??[];a.push(e);pairs.set(e.target.id,a);}
 const pair=[...pairs.values()].find(a=>new Set(a.map(e=>e.target.relation)).size>1);assert(pair);
 assert.equal(new Set(pair.map(e=>e.revision)).size,pair.length);
});
