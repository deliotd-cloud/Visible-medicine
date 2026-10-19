import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import ts from 'typescript';
import * as links from '../lib/head-atlas-links.ts';
import * as learning from '../lib/head-atlas-learning.ts';
import {HEAD_INSULA_TEACHING_REVISION} from '../lib/head-insula-teaching.ts';
import {HEAD_MRI_LEARNING_REVISION,headMriLearningPacket} from '../lib/head-mri-learning.ts';
import {HEAD_INSULA_LEARNING_REVISION,headInsulaLearningPacket,headInsulaLearningSequences,verifiedHeadInsulaLearningRevision} from '../lib/head-insula-learning.ts';
import type {HeadEntry} from '../lib/head-atlas-import.ts';

const ids=['cortex-left-insula','cortex-right-insula'];
const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../lib/head-insula-learning.ts',import.meta.url),'utf8');
function isolated(options:{binding?:(id:string)=>ReturnType<typeof links.headConceptById>;teaching?:string|null}={}){
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{} as typeof import('../lib/head-insula-learning.ts')};
  new Function('require','module','exports',compiled)((name:string)=>name==='./head-atlas-links.ts'?{...links,headConceptById:options.binding??links.headConceptById}:name==='./head-insula-teaching.ts'?{HEAD_INSULA_TEACHING_REVISION,verifiedHeadInsulaTeachingRevision:async()=>options.teaching===undefined?HEAD_INSULA_TEACHING_REVISION:options.teaching}:require(name),mod,mod.exports);
  return mod.exports;
}

test('two-step draft has its own SHA and exact complete bindings; original packet identities remain intact',async()=>{
  assert.deepEqual(headInsulaLearningSequences,[{id:'insulae',label:'Paired insulae · coverage comparison',concepts:ids}]);
  const packet=headInsulaLearningPacket();
  assert.equal(packet.headRevision,links.HEAD_LINK_REVISION);
  assert.equal(packet.teachingRevision,HEAD_INSULA_TEACHING_REVISION);
  assert.equal(packet.status,'draft');
  for(const key of ['patientRegistration','clinicalApproval','publicationApproval'] as const)assert.equal(packet[key],false);
  assert.match(packet.scope,/unregistered|separate/i);
  assert.match(packet.scope,/partial|coverage/i);
  assert.equal(packet.sequences.length,1);
  assert.deepEqual(packet.sequences[0].concepts,ids);
  for(const [index,binding] of packet.sequences[0].bindings.entries()){
    assert.deepEqual(binding,links.headConceptById(ids[index]));
    assert(binding?.ctHref&&binding.mriHref&&binding.atlasHref);
  }
  assert.equal(createHash('sha256').update(JSON.stringify(packet)).digest('hex'),HEAD_INSULA_LEARNING_REVISION);
  assert.equal(await verifiedHeadInsulaLearningRevision(links.HEAD_LINK_REVISION),HEAD_INSULA_LEARNING_REVISION);
  assert.equal(await verifiedHeadInsulaLearningRevision('stale'),null);
  assert.equal(createHash('sha256').update(JSON.stringify(learning.headLearningPacket())).digest('hex'),learning.HEAD_LEARNING_REVISION);
  assert.equal(learning.HEAD_LEARNING_REVISION,'47bae289d0e9bf2bf83596cd9bdbdb93e7a968b57507a55e26700af445763052');
  assert.equal(createHash('sha256').update(JSON.stringify(headMriLearningPacket())).digest('hex'),HEAD_MRI_LEARNING_REVISION);
  assert.equal(HEAD_MRI_LEARNING_REVISION,'252282ae46e9485bc6fc43d2674c792083d75bb71828750c3e27ee42ad8bff47');
  assert.equal(learning.headLearningSequences.length,5);
  assert.deepEqual(learning.headLearningSequencesForModality('CT').map(item=>item.id),[...learning.headLearningSequences.map(item=>item.id),'insulae','globes','ct-parietal-occipital','ct-nasal-ethmoid','cerebellar-orientation','ct-facial-coverage']);
  assert.deepEqual(learning.headLearningSequencesForModality('MRI').map(item=>item.id),[...learning.headLearningSequences.map(item=>item.id),'mri-amygdalae','mri-midline-landmarks','insulae','globes','cerebellar-orientation']);
  assert.deepEqual(learning.headLearningSequencesForModality().map(item=>item.id),[
    ...learning.headLearningSequencesForModality('MRI').map(item=>item.id).filter(id=>id!=='cerebellar-orientation'),
    'ct-parietal-occipital','ct-nasal-ethmoid','cerebellar-orientation','ct-facial-coverage',
  ]);
});

test('both canonical slots round-trip exact CT, MRI and generic 3D destinations',()=>{
  for(const [index,conceptId] of ids.entries()){
    const position={sequenceId:'insulae',conceptId},binding=links.headConceptById(conceptId);assert(binding);
    const handoff=learning.headLearningLinks(position);assert(handoff?.atlasHref);
    for(const [href,surface] of [[handoff.ctHref,'image'],[handoff.mriHref,'image'],[handoff.atlasHref,'atlas']] as const){
      assert(href);const url=new URL(href,'https://example.invalid'),query=url.searchParams;
      assert.equal(query.get('headTour'),'insulae');assert.equal(query.get('headStep'),String(index));
      assert.equal(query.get('headRevision'),links.HEAD_LINK_REVISION);
      assert.deepEqual(learning.parseHeadLearningIntent(query,surface),position);
      assert.equal(url.pathname,new URL(surface==='atlas'?binding.atlasHref:href===handoff.ctHref?binding.ctHref!:binding.mriHref!,'https://example.invalid').pathname);
    }
    const atlas=new URL(handoff.atlasHref,'https://example.invalid').searchParams;
    const exact=new URL(binding.atlasHref,'https://example.invalid').searchParams;
    for(const [key,value] of exact)assert.equal(atlas.get(key),value,key);
    assert.equal(links.headConceptFromAtlasQuery(atlas)?.conceptId,conceptId);
    const nav=learning.headLearningNavigation(position);assert(nav);
    assert.equal(nav.index,index);assert.equal(nav.total,2);
    assert.equal(nav.previous?.href??null,index?learning.headLearningLinks({sequenceId:'insulae',conceptId:ids[0]})?.atlasHref:null);
    assert.equal(nav.next?.href??null,index===0?learning.headLearningLinks({sequenceId:'insulae',conceptId:ids[1]})?.atlasHref:null);
  }
});

test('stale, extra, duplicate, invalid and missing step metadata fail closed',()=>{
  for(const conceptId of ids){
    const position={sequenceId:'insulae',conceptId};
    for(const [href,surface] of [[learning.headLearningLinks(position)!.ctHref!,'image'],[learning.headLearningLinks(position)!.mriHref,'image'],[learning.headLearningLinks(position)!.atlasHref,'atlas']] as const){
      assert(href);const valid=new URL(href,'https://example.invalid').searchParams;
      for(const key of ['concept','headTour','headStep','headRevision']){
        const stale=new URLSearchParams(valid);stale.set(key,'stale');assert.equal(learning.parseHeadLearningIntent(stale,surface),null,key);
        const duplicate=new URLSearchParams(valid);duplicate.append(key,valid.get(key)!);assert.equal(learning.parseHeadLearningIntent(duplicate,surface),null,key);
        const missing=new URLSearchParams(valid);missing.delete(key);assert.equal(learning.parseHeadLearningIntent(missing,surface),null,key);
      }
      const extra=new URLSearchParams(valid);extra.set('patientId','private');assert.equal(learning.parseHeadLearningIntent(extra,surface),null);
      for(const invalid of ['-1','2','01','1e0','NaN']){const query=new URLSearchParams(valid);query.set('headStep',invalid);assert.equal(learning.parseHeadLearningIntent(query,surface),null);}
      if(surface==='atlas')for(const key of ['study','structure','side','source','part','partSource']){
        const stale=new URLSearchParams(valid);stale.set(key,'stale');assert.equal(learning.parseHeadLearningIntent(stale,'atlas'),null,key);
        const missing=new URLSearchParams(valid);missing.delete(key);assert.equal(learning.parseHeadLearningIntent(missing,'atlas'),null,key);
      }
    }
  }
});

test('CT masks and partial MRI masks keep missing canonical slots without substitution',()=>{
  for(const modality of ['CT','MRI'] as const){
    const entries:HeadEntry[]=ids.map((id,index)=>({id:`${modality==='CT'?'cth':'mrb'}.ctx.insula.${index?'right':'left'}`,label:`${index?'Right':'Left'} insula — regional mask`,family:'ctx',laterality:index?'right':'left',representation:modality==='CT'?'mask':'partial-mask',color:[1,0,0],opacity:{fill:.2,outline:1}}));
    const full=learning.headLearningSteps(entries,'insulae',modality,links.HEAD_LINK_REVISION);
    assert.deepEqual(full.map(step=>step.entry),entries);
    for(const missing of entries){const steps=learning.headLearningSteps(entries.filter(item=>item!==missing),'insulae',modality,links.HEAD_LINK_REVISION);
      assert.deepEqual(steps.map(step=>step.index),[0,1]);assert.deepEqual(steps.map(step=>step.conceptId),ids);
      assert.equal(steps[entries.indexOf(missing)].entry,null);
    }
    for(const altered of [{...entries[0],representation:modality==='CT'?'partial-mask':'mask'},{...entries[0],laterality:'right'},{...entries[0],label:'Wrong label'}]){
      assert.equal(learning.headLearningSteps([altered],'insulae',modality,links.HEAD_LINK_REVISION)[0].entry,null);
    }
    assert.deepEqual(learning.headLearningSteps(entries,'insulae',modality,'stale'),[]);
  }
});

test('verifier rejects changed teaching, binding and digest independently',async()=>{
  assert.equal(await isolated({teaching:null}).verifiedHeadInsulaLearningRevision(links.HEAD_LINK_REVISION),null);
  assert.equal(await isolated({teaching:'stale'}).verifiedHeadInsulaLearningRevision(links.HEAD_LINK_REVISION),null);
  for(const change of [
    (binding:NonNullable<ReturnType<typeof links.headConceptById>>)=>({...binding,ctHref:'/atlas/ct-head?concept=wrong'}),
    (binding:NonNullable<ReturnType<typeof links.headConceptById>>)=>({...binding,mriHref:'/atlas/mri-head?concept=wrong'}),
    (binding:NonNullable<ReturnType<typeof links.headConceptById>>)=>({...binding,atlasHref:binding.atlasHref.replace('partSource=','partSource=stale')}),
    (binding:NonNullable<ReturnType<typeof links.headConceptById>>)=>({...binding,scopeNote:binding.scopeNote+' changed'}),
  ]){
    const mod=isolated({binding:id=>{const binding=links.headConceptById(id);return binding&&id===ids[0]?change(binding):binding;}});
    assert.equal(await mod.verifiedHeadInsulaLearningRevision(links.HEAD_LINK_REVISION),null);
  }
});
