import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import ts from 'typescript';
import * as links from '../lib/head-atlas-links.ts';
import * as learning from '../lib/head-atlas-learning.ts';
import {HEAD_ORBITAL_TEACHING_REVISION,headOrbitalTeachingPacket} from '../lib/head-orbital-teaching.ts';
import {HEAD_ORBITAL_COMPARISON_REVISION,headOrbitalComparisonPacket} from '../lib/head-orbital-comparison-review.ts';
import {HEAD_ORBITAL_LEARNING_REVISION,headOrbitalLearningPacket,headOrbitalLearningSequences,verifiedHeadOrbitalLearningRevision} from '../lib/head-orbital-learning.ts';
import type {HeadEntry} from '../lib/head-atlas-import.ts';

const ids=['orbit-left-globe','orbit-right-globe'];
const sha=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../lib/head-orbital-learning.ts',import.meta.url),'utf8');
function isolated(options:{binding?:(id:string)=>ReturnType<typeof links.headConceptById>;teaching?:string|null}={}){
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{} as typeof import('../lib/head-orbital-learning.ts')};
  new Function('require','module','exports',compiled)((name:string)=>name==='./head-atlas-links.ts'?{...links,headConceptById:options.binding??links.headConceptById}:name==='./head-orbital-teaching.ts'?{HEAD_ORBITAL_TEACHING_REVISION,verifiedHeadOrbitalTeachingRevision:async()=>options.teaching===undefined?HEAD_ORBITAL_TEACHING_REVISION:options.teaching}:require(name),mod,mod.exports);
  return mod.exports;
}

test('orbital draft has an independent digest, exact bilateral bindings and unchanged source identities',async()=>{
  assert.deepEqual(headOrbitalLearningSequences,[{id:'globes',label:'Paired globes · coverage comparison',concepts:ids}]);
  const packet=headOrbitalLearningPacket();
  assert.equal(packet.schema,'vm-head-orbital-learning-1');
  assert.equal(packet.headRevision,links.HEAD_LINK_REVISION);
  assert.equal(packet.teachingRevision,HEAD_ORBITAL_TEACHING_REVISION);
  assert.equal(packet.status,'draft');
  for(const key of ['patientRegistration','clinicalApproval','publicationApproval'] as const)assert.equal(packet[key],false);
  assert.match(packet.scope,/partial|regional portions/i);
  assert.match(packet.scope,/separate, unregistered subjects/i);
  assert.match(packet.scope,/eye layers and the optic nerve are not matched/i);
  assert.match(packet.scope,/No visual function, diagnosis, patient registration, score, progress, completion or approval/i);
  assert.deepEqual(packet.sequences[0].concepts,ids);
  for(const [index,binding] of packet.sequences[0].bindings.entries()){
    assert.deepEqual(binding,links.headConceptById(ids[index]));
    assert(binding?.ctHref&&binding.mriHref&&binding.atlasHref);
  }
  assert.equal(sha(packet),HEAD_ORBITAL_LEARNING_REVISION);
  assert.equal(await verifiedHeadOrbitalLearningRevision(links.HEAD_LINK_REVISION),HEAD_ORBITAL_LEARNING_REVISION);
  assert.equal(await verifiedHeadOrbitalLearningRevision('stale'),null);
  assert.equal(sha(headOrbitalTeachingPacket()),HEAD_ORBITAL_TEACHING_REVISION);
  assert.equal(sha(headOrbitalComparisonPacket()),HEAD_ORBITAL_COMPARISON_REVISION);
});

test('both globe slots use exact CT, partial MRI and generic 3D destinations',()=>{
  for(const [index,conceptId] of ids.entries()){
    const position={sequenceId:'globes',conceptId},binding=links.headConceptById(conceptId);assert(binding);
    const handoff=learning.headLearningLinks(position);assert(handoff?.atlasHref);
    for(const [href,surface] of [[handoff.ctHref,'image'],[handoff.mriHref,'image'],[handoff.atlasHref,'atlas']] as const){
      assert(href);const url=new URL(href,'https://example.invalid'),query=url.searchParams;
      assert.equal(query.get('headTour'),'globes');assert.equal(query.get('headStep'),String(index));
      assert.equal(query.get('headRevision'),links.HEAD_LINK_REVISION);
      assert.deepEqual(learning.parseHeadLearningIntent(query,surface),position);
      assert.equal(url.pathname,new URL(surface==='atlas'?binding.atlasHref:href===handoff.ctHref?binding.ctHref!:binding.mriHref!,'https://example.invalid').pathname);
    }
    const exact=new URL(binding.atlasHref,'https://example.invalid').searchParams;
    const atlas=new URL(handoff.atlasHref,'https://example.invalid').searchParams;
    for(const [key,value] of exact)assert.equal(atlas.get(key),value,key);
    const nav=learning.headLearningNavigation(position);assert(nav);
    assert.equal(nav.index,index);assert.equal(nav.total,2);
  }
  for(const modality of ['CT','MRI'] as const){
    const entries:HeadEntry[]=ids.map((_,index)=>({id:`${modality==='CT'?'cth':'mrb'}.orb.globe.${index?'right':'left'}`,label:`${index?'Right':'Left'} globe — regional mask`,family:'orb',laterality:index?'right':'left',representation:modality==='CT'?'mask':'partial-mask',color:[1,0,0],opacity:{fill:.2,outline:1}}));
    assert.deepEqual(learning.headLearningSteps(entries,'globes',modality,links.HEAD_LINK_REVISION).map(step=>step.entry),entries);
    for(const missing of entries)assert.equal(learning.headLearningSteps(entries.filter(entry=>entry!==missing),'globes',modality,links.HEAD_LINK_REVISION)[entries.indexOf(missing)].entry,null);
    assert.deepEqual(learning.headLearningSteps(entries,'globes',modality,'stale'),[]);
    assert(learning.headLearningSequencesForModality(modality).some(sequence=>sequence.id==='globes'));
  }
  assert(learning.headLearningSequencesForModality().some(sequence=>sequence.id==='globes'));
});

test('verifier rejects wrong teaching dependency and any altered binding',async()=>{
  for(const teaching of [null,'stale'])assert.equal(await isolated({teaching}).verifiedHeadOrbitalLearningRevision(links.HEAD_LINK_REVISION),null);
  assert.equal(await isolated({binding:()=>null}).verifiedHeadOrbitalLearningRevision(links.HEAD_LINK_REVISION),null);
  for(const change of [
    (binding:NonNullable<ReturnType<typeof links.headConceptById>>)=>({...binding,ctHref:'/atlas/ct-head?concept=wrong'}),
    (binding:NonNullable<ReturnType<typeof links.headConceptById>>)=>({...binding,mriHref:'/atlas/mri-head?concept=wrong'}),
    (binding:NonNullable<ReturnType<typeof links.headConceptById>>)=>({...binding,atlasHref:binding.atlasHref.replace('structure=','structure=wrong')}),
    (binding:NonNullable<ReturnType<typeof links.headConceptById>>)=>({...binding,scopeNote:binding.scopeNote+' changed'}),
  ]){
    const mod=isolated({binding:id=>{const binding=links.headConceptById(id);return binding&&id===ids[0]?change(binding):binding;}});
    assert.equal(await mod.verifiedHeadOrbitalLearningRevision(links.HEAD_LINK_REVISION),null);
  }
});
