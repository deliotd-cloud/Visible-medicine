import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import ts from 'typescript';
import * as learning from '../lib/head-atlas-learning.ts';
import * as cerebellar from '../lib/head-cerebellar-learning.ts';
import * as teaching from '../lib/head-cerebellar-teaching.ts';
import * as image from '../lib/head-image-only-links.ts';
import * as links from '../lib/head-atlas-links.ts';
import * as bookmark from '../lib/head-learning-bookmark.ts';
import * as mriLearning from '../lib/head-mri-learning.ts';
import * as ctBoneLearning from '../lib/head-ct-bone-learning.ts';
import {headRelatedLearning} from '../lib/head-related-learning.ts';
import {headPracticeGuides} from '../lib/head-practice-learning.ts';
import type {HeadEntry} from '../lib/head-atlas-import.ts';

const require=createRequire(import.meta.url);
const ids=['cerebellum-left-hemisphere','cerebellum-right-hemisphere','cerebellum-vermis'];
const sequence=cerebellar.headCerebellarLearningSequences[0];
const placements=image.headImageOnlyComparisonPacket().bindings.flatMap(binding=>
  (['CT','MRI'] as const).map(modality=>({
    modality,
    entry:{...binding[modality.toLowerCase() as 'ct'|'mri'],family:'cer',color:[1,0,0],opacity:{fill:.2,outline:1}} as HeadEntry,
  })));

function isolated(sourceEdit:(source:string)=>string=source=>source,imports:Record<string,unknown>={}){
  const source=sourceEdit(readFileSync(new URL('../lib/head-cerebellar-learning.ts',import.meta.url),'utf8'));
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{} as typeof cerebellar};
  new Function('require','module','exports',code)((name:string)=>({
    './head-atlas-links.ts':links,
    './head-image-only-links.ts':image,
    './head-cerebellar-teaching.ts':teaching,
    ...imports,
  } as Record<string,unknown>)[name]??require(name),mod,mod.exports);
  return mod.exports;
}

test('independent three-step draft packet binds only current image concepts and keeps older packet identities',async()=>{
  assert.deepEqual(cerebellar.headCerebellarLearningSequences,[{
    id:'cerebellar-orientation',label:'Cerebellar orientation · CT/MRI only',concepts:ids,
  }]);
  const packet=cerebellar.headCerebellarLearningPacket();
  assert.equal(packet.headRevision,links.HEAD_LINK_REVISION);
  assert.equal(packet.teachingRevision,teaching.HEAD_CEREBELLAR_TEACHING_REVISION);
  assert.equal(packet.status,'draft');
  for(const flag of ['patientRegistration','clinicalApproval','publicationApproval'] as const)assert.equal(packet[flag],false);
  assert.match(packet.scope,/unregistered|separate/i);
  assert.match(packet.scope,/partial/i);
  assert.match(packet.scope,/3D/);
  assert.deepEqual(packet.sequences[0].concepts,ids);
  for(const [index,binding] of packet.sequences[0].bindings.entries()){
    assert.deepEqual(binding,image.headImageConceptById(ids[index]));
    assert(binding?.ctHref&&binding.mriHref);
    assert.equal(binding.atlasHref,undefined);
  }
  assert.equal(createHash('sha256').update(JSON.stringify(packet)).digest('hex'),cerebellar.HEAD_CEREBELLAR_LEARNING_REVISION);
  assert.equal(await cerebellar.verifiedHeadCerebellarLearningRevision(links.HEAD_LINK_REVISION),cerebellar.HEAD_CEREBELLAR_LEARNING_REVISION);
  assert.equal(await cerebellar.verifiedHeadCerebellarLearningRevision('stale'),null);
  assert.equal(createHash('sha256').update(JSON.stringify(learning.headLearningPacket())).digest('hex'),learning.HEAD_LEARNING_REVISION);
  assert.equal(createHash('sha256').update(JSON.stringify(mriLearning.headMriLearningPacket())).digest('hex'),mriLearning.HEAD_MRI_LEARNING_REVISION);
  assert.equal(createHash('sha256').update(JSON.stringify(ctBoneLearning.headCtBoneLearningPacket())).digest('hex'),ctBoneLearning.HEAD_CT_BONE_LEARNING_REVISION);
});

test('six native placements retain canonical slots, exact identities and missing or ambiguous entries',()=>{
  for(const modality of ['CT','MRI'] as const){
    const entries=placements.filter(item=>item.modality===modality).map(item=>item.entry);
    const steps=learning.headLearningSteps(entries,sequence.id,modality,links.HEAD_LINK_REVISION);
    assert.deepEqual(steps.map(step=>step.conceptId),ids);
    assert.deepEqual(steps.map(step=>step.index),[0,1,2]);
    assert.deepEqual(steps.map(step=>step.entry),entries);
    for(const missing of entries){
      const absent=learning.headLearningSteps(entries.filter(entry=>entry!==missing),sequence.id,modality,links.HEAD_LINK_REVISION);
      assert.equal(absent[entries.indexOf(missing)].entry,null);
      assert.deepEqual(absent.map(step=>step.index),[0,1,2]);
      const ambiguous=learning.headLearningSteps([...entries,{...missing}],sequence.id,modality,links.HEAD_LINK_REVISION);
      assert.equal(ambiguous[entries.indexOf(missing)].entry,null);
      const altered=learning.headLearningSteps(entries.map(entry=>entry===missing?{...entry,laterality:'wrong'}:entry),sequence.id,modality,links.HEAD_LINK_REVISION);
      assert.equal(altered[entries.indexOf(missing)].entry,null);
    }
    assert.deepEqual(learning.headLearningSteps(entries,sequence.id,modality,'stale'),[]);
  }
});

test('native tour URLs are canonical, minimal, revision-bound and never infer a 3D Atlas step',()=>{
  for(const [index,conceptId] of ids.entries()){
    const position={sequenceId:sequence.id,conceptId},dest=learning.headLearningLinks(position);assert(dest);
    assert.equal(dest.atlasHref,undefined);
    for(const [href,path] of [[dest.ctHref,'/atlas/ct-head'],[dest.mriHref,'/atlas/mri-head']] as const){
      assert(href);
      const url=new URL(href,'https://example.invalid');
      assert.equal(url.pathname,path);
      assert.deepEqual(Object.fromEntries(url.searchParams),{
        concept:conceptId,headTour:sequence.id,headStep:String(index),headRevision:links.HEAD_LINK_REVISION,
      });
      assert.deepEqual(learning.parseHeadLearningIntent(url.searchParams,'image'),position);
      assert.equal(learning.parseHeadLearningIntent(url.searchParams,'atlas'),null);
      for(const key of ['headTour','headStep','headRevision','concept']){
        const stale=new URLSearchParams(url.searchParams);stale.set(key,'stale');
        assert.equal(learning.parseHeadLearningIntent(stale,'image'),null,key);
        const duplicate=new URLSearchParams(url.searchParams);duplicate.append(key,url.searchParams.get(key)!);
        assert.equal(learning.parseHeadLearningIntent(duplicate,'image'),null,key);
      }
      for(const privateKey of ['study','source','structure','side','patient','scan','path','answer']){
        const injected=new URLSearchParams(url.searchParams);injected.set(privateKey,'private');
        assert.equal(learning.parseHeadLearningIntent(injected,'image'),null,privateKey);
      }
    }
    assert.equal(learning.headLearningNavigation(position),null);
    for(const modality of ['CT','MRI'] as const){
      const nav=learning.headLearningNavigation(position,modality);assert(nav);
      const current:NonNullable<ReturnType<typeof learning.headLearningLinks>>['ctHref']=modality==='CT'?dest.ctHref:dest.mriHref;
      assert.equal(nav.index,index);assert.equal(nav.total,3);
      assert.equal(nav.current[modality==='CT'?'ctHref':'mriHref'],current);
      assert.equal(nav.previous?.href??null,index?learning.headLearningLinks({sequenceId:sequence.id,conceptId:ids[index-1]})?.[modality==='CT'?'ctHref':'mriHref']:null);
      assert.equal(nav.next?.href??null,index<2?learning.headLearningLinks({sequenceId:sequence.id,conceptId:ids[index+1]})?.[modality==='CT'?'ctHref':'mriHref']:null);
      assert.equal(nav.exitHref,`/atlas/${modality.toLowerCase()}-head?concept=${conceptId}`);
    }
  }
});

test('native bookmark round-trips with its own revision and refuses cross-revision data',()=>{
  for(const conceptId of ids){
    const position={sequenceId:sequence.id,conceptId};
    const saved=bookmark.createHeadLearningBookmark(position);assert(saved);
    assert.equal(saved.sequenceRevision,cerebellar.HEAD_CEREBELLAR_LEARNING_REVISION);
    assert.deepEqual(bookmark.parseHeadLearningBookmark(JSON.stringify(saved)),saved);
    assert.deepEqual(bookmark.resolveHeadLearningBookmark(saved),learning.headLearningNavigation(position,'CT'));
    for(const patch of [
      {sequenceRevision:learning.HEAD_LEARNING_REVISION},
      {sequenceRevision:mriLearning.HEAD_MRI_LEARNING_REVISION},
      {headRevision:'stale'},
      {conceptId:'brainstem-pons'},
      {atlasHref:'/atlas/head-neck-3d'},
    ]){
      assert.equal(bookmark.parseHeadLearningBookmark(JSON.stringify({...saved,...patch})),null);
      assert.equal(bookmark.resolveHeadLearningBookmark({...saved,...patch} as typeof saved),null);
    }
  }
});

test('related and post-answer practice guides use exact native tour positions and CT/MRI destinations',()=>{
  for(const {modality,entry} of placements){
    const concept=image.headImageConcept(entry,modality);assert(concept);
    const position={sequenceId:sequence.id,conceptId:concept.conceptId};
    const expected=learning.headLearningLinks(position)?.[modality==='CT'?'ctHref':'mriHref'];assert(expected);
    const related=headRelatedLearning([entry],entry,modality,links.HEAD_LINK_REVISION);
    assert.deepEqual(related.map(item=>item.position),[position]);
    assert.equal(related[0].step,ids.indexOf(concept.conceptId)+1);
    assert.equal(related[0].total,3);assert.equal(related[0].available,1);
    const guides=headPracticeGuides(entry,modality,links.HEAD_LINK_REVISION);
    assert.deepEqual(guides.map(item=>item.position),[position]);
    assert.equal(guides[0].href,expected);
    assert.deepEqual(headRelatedLearning([entry],entry,modality,'stale'),[]);
    assert.deepEqual(headRelatedLearning([entry],{...entry},modality,links.HEAD_LINK_REVISION),[]);
    assert.deepEqual(headPracticeGuides(entry,modality,'stale'),[]);
  }
});

test('independent verifier refuses altered packet text, invented 3D mapping and stale teaching',async()=>{
  assert.equal(await isolated(source=>source.replace('CT/MRI only','changed tour')).verifiedHeadCerebellarLearningRevision(links.HEAD_LINK_REVISION),null);
  const changedBinding=isolated(undefined,{'./head-image-only-links.ts':{...image,headImageConceptById:(id:string)=>{
    const binding=image.headImageConceptById(id);
    return binding&&id===ids[0]?{...binding,scopeNote:binding.scopeNote+' changed'}:binding;
  }}});
  assert.equal(await changedBinding.verifiedHeadCerebellarLearningRevision(links.HEAD_LINK_REVISION),null);
  const invented=isolated(undefined,{'./head-image-only-links.ts':{...image,headImageConceptById:(id:string)=>{
    const binding=image.headImageConceptById(id);
    return binding&&ids.includes(id)?{...binding,atlasHref:'/atlas/head-neck-3d?concept='+id}:binding;
  }}});
  assert.equal(await invented.verifiedHeadCerebellarLearningRevision(links.HEAD_LINK_REVISION),null);
  const changedTeaching=isolated(undefined,{'./head-cerebellar-teaching.ts':{
    ...teaching,HEAD_CEREBELLAR_TEACHING_REVISION:'changed',
    verifiedHeadCerebellarTeachingRevision:async()=>teaching.HEAD_CEREBELLAR_TEACHING_REVISION,
  }});
  assert.equal(await changedTeaching.verifiedHeadCerebellarLearningRevision(links.HEAD_LINK_REVISION),null);
  const stale=isolated(undefined,{'./head-cerebellar-teaching.ts':{...teaching,verifiedHeadCerebellarTeachingRevision:async()=>null}});
  assert.equal(await stale.verifiedHeadCerebellarLearningRevision(links.HEAD_LINK_REVISION),null);
});
