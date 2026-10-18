import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {headLearningSequences,headLearningLinks,parseHeadLearningIntent,hasHeadLearningQuery} from '../lib/head-atlas-learning.ts';
import {HEAD_LINK_REVISION,headConceptFromAtlasQuery} from '../lib/head-atlas-links.ts';
import {atlasStudySuffix} from '../lib/atlas-study-transport.ts';

test('all twenty-five tour steps round-trip across CT/MRI and the exact existing Atlas source tuple',()=>{
  let count=0;
  for(const sequence of headLearningSequences)for(const conceptId of sequence.concepts){
    const position={sequenceId:sequence.id,conceptId},links=headLearningLinks(position);assert(links);count++;
    for(const [key,path] of [['ctHref','/atlas/ct-head'],['mriHref','/atlas/mri-head'],['atlasHref','/atlas/head-neck-3d']] as const){
      const href=links[key];assert(href);const url:URL=new URL(href,'https://example.invalid');
      assert.equal(url.pathname,path);assert.equal(url.searchParams.get('headRevision'),HEAD_LINK_REVISION);
      const surface=key==='atlasHref'?'atlas':'image';
      assert.deepEqual(parseHeadLearningIntent(url.searchParams,surface),position);
      assert.deepEqual(parseHeadLearningIntent(Object.fromEntries(url.searchParams),surface),position);
      if(key==='atlasHref')assert.equal(headConceptFromAtlasQuery(url.searchParams)?.conceptId,conceptId);
    }
  }
  assert.equal(count,25);
});
test('no arbitrary tour/concept or absent step can create a destination',()=>{
  for(const position of [{sequenceId:'other',conceptId:'brainstem-pons'},{sequenceId:'ventricles',conceptId:'brainstem-pons'},{sequenceId:'brainstem',conceptId:null},{sequenceId:'brainstem',conceptId:'javascript:alert'}])assert.equal(headLearningLinks(position),null);
});
test('partial, duplicate, stale, malformed and mismatched handoffs fail closed',()=>{
  const valid=new URL(headLearningLinks({sequenceId:'brainstem',conceptId:'brainstem-pons'})!.ctHref!,'https://example.invalid').searchParams;
  for(const key of ['concept','headTour','headStep','headRevision']){
    const duplicate=new URLSearchParams(valid);duplicate.append(key,duplicate.get(key)!);assert.equal(parseHeadLearningIntent(duplicate),null,key);
    const missing=new URLSearchParams(valid);missing.delete(key);assert.equal(parseHeadLearningIntent(missing),null,key);
    assert.equal(parseHeadLearningIntent({...Object.fromEntries(valid),[key]:[valid.get(key)!]}),null,key);
  }
  for(const [key,value] of [['headRevision','0'.repeat(64)],['headTour','ventricles'],['concept','brainstem-midbrain'],['headStep','01'],['headStep','-1'],['headStep','1.0'],['headStep','99'],['headStep','1e0'],['headStep',' 1']]){
    const bad=new URLSearchParams(valid);bad.set(key,value);assert.equal(parseHeadLearningIntent(bad),null,`${key}=${value}`);
  }
  assert.equal(hasHeadLearningQuery(new URLSearchParams('concept=brainstem-pons')),false);
  assert.equal(hasHeadLearningQuery(new URLSearchParams('headStep=')),true);
});
test('surface-specific query allowlists reject extra fields and incomplete or stale 3D source tuples',()=>{
  const links=headLearningLinks({sequenceId:'brainstem',conceptId:'brainstem-pons'});assert(links?.atlasHref);
  for(const [href,surface] of [[links.ctHref!,'image'],[links.atlasHref,'atlas']] as const){
    const valid=new URL(href,'https://example.invalid').searchParams;
    for(const field of ['patient','file','quizAnswer','headExtra','redirect']){
      const bad=new URLSearchParams(valid);bad.set(field,'not-relayed');
      assert.equal(parseHeadLearningIntent(bad,surface),null,field);
      assert.equal(parseHeadLearningIntent(Object.fromEntries(bad),surface),null,field);
    }
  }
  const image=new URL(links.ctHref!,'https://example.invalid').searchParams;
  image.set('source',HEAD_LINK_REVISION);assert.equal(parseHeadLearningIntent(image),null);
  const atlas=new URL(links.atlasHref,'https://example.invalid').searchParams;
  assert.equal(parseHeadLearningIntent(atlas),null);
  for(const field of ['study','source','partSource']){
    const bad=new URLSearchParams(atlas);bad.set(field,'stale');assert.equal(parseHeadLearningIntent(bad,'atlas'),null,field);
    const missing=new URLSearchParams(atlas);missing.delete(field);assert.equal(parseHeadLearningIntent(missing,'atlas'),null,field);
  }
});
test('handoff context stays wrapper-owned and does not reach the generated 3D module',()=>{
  const links=headLearningLinks({sequenceId:'brainstem',conceptId:'brainstem-pons'});assert(links?.atlasHref);
  const params=Object.fromEntries(new URL(links.atlasHref,'https://example.invalid').searchParams);
  const suffix=atlasStudySuffix({...params,patient:'never-forward',file:'never-forward',quizAnswer:'never-forward'});assert(suffix);
  assert(suffix.includes('partSource='));assert(!/headTour|headStep|headRevision|concept=|patient|file=|quizAnswer/.test(suffix));
  const wrapper=readFileSync(new URL('../app/atlas/head-neck-3d/page.tsx',import.meta.url),'utf8');
  assert(wrapper.includes('hasHeadLearningQuery(params)&&(!intent||!concept||intent.conceptId!==concept.conceptId)'));
  assert(wrapper.includes('!guidedHref?<HeadAtlasLinkedModel key={source} src={source} sourceRevision={regionalManifest.sourceCommit} coverage={coverage}/>'));
  assert(wrapper.includes('if(intent&&!guidedHref)notFound();'));
  assert(wrapper.includes('<HeadAtlasGuidedModel initialHref={guidedHref}'));
  const host=readFileSync(new URL('../components/HeadAtlasGuidedModel.tsx',import.meta.url),'utf8');
  assert(host.includes('position={destination.position}'));
  assert(host.includes('src={src}'));
  assert(!wrapper.includes('<a href={concept.ctHref}'),'plain comparison links are not duplicated outside the focus bar');
});
test('tour position lives outside the unmounted panel, and invalid intents cannot focus a fallback',()=>{
  const viewer=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
  const guided=readFileSync(new URL('../components/HeadAtlasGuidedLearning.tsx',import.meta.url),'utf8');
  assert(viewer.includes('position={learningPosition} onPositionChange={changeLearningPosition}'));
  assert(viewer.includes('if(navigation.invalid||!navigation.conceptId){setActiveId'));
  assert(viewer.includes('navigationNotice&&!quizActive'));
  assert(guided.includes('No other structure has been substituted.'));
  // Question style is panel-local; sequence and step must remain parent-owned.
  assert.deepEqual([...guided.matchAll(/const\s+\[([^\]]+)\]\s*=\s*useState\b/g)].map(match=>match[1]),['questionMode,setQuestionMode']);
  assert(guided.includes('const sequence=position.sequenceId;'));
  assert(guided.includes('steps.findIndex(item=>item.conceptId===position.conceptId)'));
  assert(!/localStorage|sessionStorage|indexedDB|fetch\(/.test(guided));
  assert(viewer.includes("rightPanel==='practice'||quizActive?<HeadAtlasPractice"));
});
