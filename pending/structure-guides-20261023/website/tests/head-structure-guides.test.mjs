import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {buildSync} from 'esbuild';

const require=createRequire(import.meta.url);
const moduleSource=`
  export {headStructureGuides} from './lib/head-structure-guides.ts';
  export {HEAD_LINK_REVISION,headAtlasConceptOptions} from './lib/head-atlas-links.ts';
  export {headLearningNavigation,headLearningSequencesForModality,parseHeadLearningIntent} from './lib/head-atlas-learning.ts';
  export {headImageConceptById,headImageOnlyComparisonPacket} from './lib/head-image-only-links.ts';
  export {headLinksCurrent} from './lib/head-link-availability.ts';
`;
const compiled=buildSync({stdin:{contents:moduleSource,resolveDir:fileURLToPath(new URL('..',import.meta.url)),sourcefile:'head-structure-guides-entry.ts',loader:'ts'},bundle:true,platform:'node',format:'cjs',target:'node22',write:false}).outputFiles[0].text;
const actual={exports:{}};
new Function('require','module','exports',compiled)(require,actual,actual.exports);
const {HEAD_LINK_REVISION,headAtlasConceptOptions,headImageConceptById,headImageOnlyComparisonPacket,headLearningNavigation,headLearningSequencesForModality,parseHeadLearningIntent,headLinksCurrent,headStructureGuides}=actual.exports;
const surfaces=[['3d',undefined,'atlasHref','atlas'],['ct','CT','ctHref','image'],['mri','MRI','mriHref','image']];
const sequences=headLearningSequencesForModality();
const registered=new Set([...headAtlasConceptOptions().map(item=>item.conceptId),...headImageOnlyComparisonPacket().bindings.map(item=>item.conceptId)]);

test('every registered concept discovers only exact admitted canonical tour steps',()=>{
  assert.equal(headLinksCurrent(),true);
  for(const conceptId of registered){
    assert(headImageConceptById(conceptId));
    const got=headStructureGuides(conceptId,HEAD_LINK_REVISION);
    const expected=[];
    for(const sequence of sequences){
      const index=sequence.concepts.indexOf(conceptId);
      if(index<0)continue;
      const position={sequenceId:sequence.id,conceptId};
      const views=[];
      for(const [key,modality,hrefKey] of surfaces){
        if(!headLearningSequencesForModality(modality).some(item=>item.id===sequence.id))continue;
        const nav=headLearningNavigation(position,modality);
        const href=nav?.current[hrefKey];
        if(href)views.push({key,href});
      }
      if(views.length)expected.push({id:sequence.id,label:sequence.label,step:index+1,total:sequence.concepts.length,views});
    }
    assert.deepEqual(got.map(({id,label,step,total,views})=>({id,label,step,total,views:views.map(({key,href})=>({key,href}))})),expected,conceptId);
    assert.equal(new Set(got.map(item=>item.id)).size,got.length,conceptId);
    for(const guide of got){
      assert.deepEqual(Object.keys(guide).sort(),['id','label','step','total','views']);
      assert(guide.step>=1&&guide.step<=guide.total);
      for(const view of guide.views){
        assert.deepEqual(Object.keys(view).sort(),['href','key','label']);
        const surface=surfaces.find(([key])=>key===view.key);
        assert(surface);
        const [,, ,parserSurface]=surface;
        const url=new URL(view.href,'https://example.invalid');
        assert.equal(url.origin,'https://example.invalid');
        assert.equal(url.searchParams.get('headTour'),guide.id);
        assert.equal(url.searchParams.get('headStep'),String(guide.step-1));
        assert.equal(url.searchParams.get('headRevision'),HEAD_LINK_REVISION);
        assert.equal(url.searchParams.get('concept'),conceptId);
        assert.deepEqual(parseHeadLearningIntent(url.searchParams,parserSurface),{sequenceId:guide.id,conceptId});
        assert.equal(url.searchParams.has('score'),false);
        assert.equal(url.searchParams.has('progress'),false);
        assert.equal(url.searchParams.has('autoplay'),false);
      }
    }
  }
});

test('MRI-only, CT-only, and image-only tours never gain inferred surfaces',()=>{
  for(const id of ['limbic-left-amygdala','commissure-corpus-callosum']){
    const guide=headStructureGuides(id,HEAD_LINK_REVISION).find(item=>item.id.startsWith('mri-'));
    assert(guide);
    assert.deepEqual(guide.views.map(view=>view.key),['3d','mri']);
  }
  for(const id of ['bone-left-parietal','bone-right-nasal']){
    const guides=headStructureGuides(id,HEAD_LINK_REVISION).filter(item=>item.id.startsWith('ct-'));
    assert(guides.length);
    for(const guide of guides)assert.equal(guide.views.some(view=>view.key==='mri'),false);
  }
  for(const {conceptId} of headImageOnlyComparisonPacket().bindings){
    const guides=headStructureGuides(conceptId,HEAD_LINK_REVISION);
    assert(guides.length);
    for(const guide of guides)assert.deepEqual(guide.views.map(view=>view.key),['ct','mri']);
  }
});

test('invalid inputs fail closed and repeated calls return independent records without registry mutation',()=>{
  const conceptId='brainstem-pons';
  const before=JSON.stringify({sequences:headLearningSequencesForModality(),concept:headImageConceptById(conceptId)});
  for(const id of ['unknown','',null,undefined,{},'brainstem-pons?headTour=brainstem'])assert.deepEqual(headStructureGuides(id,HEAD_LINK_REVISION),[]);
  for(const revision of ['stale','',null,undefined,{},HEAD_LINK_REVISION.toUpperCase()])assert.deepEqual(headStructureGuides(conceptId,revision),[]);
  const first=headStructureGuides(conceptId,HEAD_LINK_REVISION);
  const second=headStructureGuides(conceptId,HEAD_LINK_REVISION);
  assert.deepEqual(first,second);
  assert.notStrictEqual(first,second);
  assert.notStrictEqual(first[0],second[0]);
  assert.notStrictEqual(first[0].views,second[0].views);
  assert.notStrictEqual(first[0].views[0],second[0].views[0]);
  first[0].label='changed';first[0].views[0].href='/changed';first.push(first[0]);
  assert.deepEqual(headStructureGuides(conceptId,HEAD_LINK_REVISION),second);
  assert.equal(JSON.stringify({sequences:headLearningSequencesForModality(),concept:headImageConceptById(conceptId)}),before);
});
