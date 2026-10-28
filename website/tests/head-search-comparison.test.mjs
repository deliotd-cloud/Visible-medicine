import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import * as learning from '../lib/head-atlas-learning.ts';
import * as mri from '../lib/head-mri-learning.ts';
import * as insula from '../lib/head-insula-learning.ts';
import * as orbital from '../lib/head-orbital-learning.ts';
import * as bone from '../lib/head-ct-bone-learning.ts';
import * as cerebellar from '../lib/head-cerebellar-learning.ts';
import * as facial from '../lib/head-ct-facial-learning.ts';
import * as concepts from '../lib/head-image-only-links.ts';
import * as availability from '../lib/head-link-availability.ts';
import * as guidedComparison from '../lib/head-guided-comparison.ts';

const require=createRequire(import.meta.url);
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const {transformSync}=require('esbuild');
const source=readFileSync(new URL('../components/HeadAtlasLearningLibrary.tsx',import.meta.url),'utf8');
const compiled=transformSync(source,{loader:'tsx',format:'cjs',jsx:'automatic'}).code;
const sequences=[
  learning.headLearningSequences,mri.headMriLearningSequences,insula.headInsulaLearningSequences,
  orbital.headOrbitalLearningSequences,bone.headCtBoneLearningSequences,
  cerebellar.headCerebellarLearningSequences,facial.headCtFacialLearningSequences,
].flat();

function harness({query='',view='all',linksFor=learning.headLearningLinks,comparisonFor=guidedComparison.headGuidedComparisonForStep,current=true}={}){
  const state=[],refs=[];let hook=0;
  const reactMock={...React,
    useState(initial){const slot=hook++;if(!(slot in state))state[slot]=initial;return [state[slot],value=>{state[slot]=value;}];},
    useRef(initial){const slot=hook++;if(!refs[slot])refs[slot]={current:initial};return refs[slot];},
  };
  const imports={
    react:reactMock,'react/jsx-runtime':require('react/jsx-runtime'),
    './HeadLearningBookmark':{HeadLearningBookmark:()=>null},
    '../lib/head-image-only-links.ts':concepts,
    '../lib/head-cerebellar-learning.ts':cerebellar,
    '../lib/head-atlas-learning':{...learning,headLearningLinks:linksFor},
    '../lib/head-link-availability.ts':{...availability,headLinksCurrent:()=>current},
    '../lib/head-guided-comparison.ts':{...guidedComparison,headGuidedComparisonForStep:comparisonFor},
    '../lib/head-mri-learning':mri,
    '../lib/head-insula-learning':insula,
    '../lib/head-orbital-learning':orbital,
    '../lib/head-ct-bone-learning':bone,
    '../lib/head-ct-facial-learning.ts':facial,
  };
  const mod={exports:{}};
  new Function('require','module','exports',compiled)(id=>{
    if(!(id in imports))throw new Error(`Unexpected dependency ${id}`);
    return imports[id];
  },mod,mod.exports);
  return () => {hook=0;return renderToStaticMarkup(mod.exports.HeadAtlasLearningLibrary({compact:true,initialQuery:query,initialView:view}));};
}
function hrefs(html){return [...html.matchAll(/<a href="([^"]+)"/g)].map(([,href])=>href.replaceAll('&amp;','&'));}
function visibleStepNavs(html){
  // The first View steps details starts after every visible matching/contributing row in its tour.
  return [...html.matchAll(/<nav aria-label="(Open (?:matching|contributing) step \d+: [^"]+)">([\s\S]*?)<\/nav>/g)]
    .map(([,label,body])=>({label,body,hrefs:hrefs(body),comparison:[...body.matchAll(/<a href="([^"]+)" aria-label="Compare views for ([^"]+)">Compare views<\/a>/g)]
      .map(([,href,aria])=>({href:href.replaceAll('&amp;','&'),aria:'Compare views for '+aria}))}));
}
function selectedHrefs(links,view){return [
  ...((view==='all'||view==='3D')&&links?.atlasHref?[links.atlasHref]:[]),
  ...((view==='all'||view==='CT')&&links?.ctHref?[links.ctHref]:[]),
  ...((view==='all'||view==='MRI')&&links?.mriHref?[links.mriHref]:[]),
];}
function visiblePart(html){return html.replace(/<details class="head-linked-step-preview">[\s\S]*?<\/details>/g,'');}

test('pons search exposes the canonical comparison in the matching step before View steps opens',()=>{
  const sequence=sequences.find(item=>item.id==='brainstem');
  const id='brainstem-pons',index=sequence.concepts.indexOf(id);
  const concept=concepts.headImageConceptById(id);
  const expected=guidedComparison.headGuidedComparisonForStep(sequence.id,id);
  assert(concept&&expected&&index>0);
  const html=harness({query:'pons'})();
  assert.match(html,/<details class="head-linked-step-preview">/);
  const rows=visibleStepNavs(html);
  const row=rows.find(item=>item.label===`Open matching step ${index+1}: ${concept.label}`);
  assert(row,'pons matching step is shown outside the closed details');
  assert.deepEqual(row.hrefs,[...selectedHrefs(learning.headLearningLinks({sequenceId:sequence.id,conceptId:id}),'all'),expected.activityHref]);
  assert.deepEqual(row.comparison,[{href:expected.activityHref,aria:`Compare views for ${concept.label} at step ${index+1}`}]);
  assert(visiblePart(html).includes(`href="${expected.activityHref.replaceAll('&','&amp;')}"`));
});

test('every real concept search uses its exact tour, step and resolver target in the visible matching row',()=>{
  assert.equal(sequences.length,13);
  for(const sequence of sequences)for(const [index,id] of sequence.concepts.entries()){
    const concept=concepts.headImageConceptById(id);
    const links=learning.headLearningLinks({sequenceId:sequence.id,conceptId:id});
    const expected=guidedComparison.headGuidedComparisonForStep(sequence.id,id);
    assert(concept&&links,`${sequence.id}/${id} has a real source mapping`);
    const rows=visibleStepNavs(harness({query:concept.label})());
    const row=rows.find(item=>item.label===`Open matching step ${index+1}: ${concept.label}` &&
      selectedHrefs(links,'all').every(href=>item.hrefs.includes(href)));
    assert(row,`${sequence.id}/${id} matching row is visible`);
    assert.deepEqual(row.hrefs,[...selectedHrefs(links,'all'),...(expected?[expected.activityHref]:[])],`${sequence.id}/${id} exact destinations`);
    assert.deepEqual(row.comparison,expected?[{href:expected.activityHref,aria:`Compare views for ${concept.label} at step ${index+1}`}]:[],`${sequence.id}/${id} canonical comparison`);
  }
});

test('all and each selected view retain only mapped modality links plus the same canonical comparison',()=>{
  const sequence=sequences.find(item=>item.id==='brainstem'),id='brainstem-pons';
  const concept=concepts.headImageConceptById(id),links=learning.headLearningLinks({sequenceId:sequence.id,conceptId:id});
  const activity=guidedComparison.headGuidedComparisonForStep(sequence.id,id);
  assert(concept&&links&&activity);
  for(const view of ['all','3D','CT','MRI']){
    const row=visibleStepNavs(harness({query:'pons',view})()).find(item=>item.label===`Open matching step 2: ${concept.label}`);
    assert(row,`${view} matching row`);
    assert.deepEqual(row.hrefs,[...selectedHrefs(links,view),activity.activityHref],view);
  }
});

test('split search terms identify contributing steps honestly and use each step canonical comparison',()=>{
  const sequence=sequences.find(item=>item.id==='brainstem');
  const html=harness({query:'pons medulla'})();
  assert.match(html,/Search terms span the tour title or different steps; no single step label matches every term/);
  const rows=visibleStepNavs(html);
  for(const id of ['brainstem-pons','brainstem-medulla']){
    const index=sequence.concepts.indexOf(id),concept=concepts.headImageConceptById(id);
    const activity=guidedComparison.headGuidedComparisonForStep(sequence.id,id);
    assert(concept&&activity);
    const row=rows.find(item=>item.label===`Open contributing step ${index+1}: ${concept.label}`);
    assert(row,`${id} contributes a term`);
    assert.deepEqual(row.hrefs,[...selectedHrefs(learning.headLearningLinks({sequenceId:sequence.id,conceptId:id}),'all'),activity.activityHref]);
    assert(visiblePart(html).includes(`contributes: ${id==='brainstem-pons'?'pons':'medulla'}`));
  }
  assert.equal(rows.filter(row=>row.label.startsWith('Open contributing step')).length,2);
});

test('missing selected-view mapping, missing step mapping and null resolver result fail closed',()=>{
  const sequence=sequences.find(item=>item.id==='brainstem'),id='brainstem-pons';
  const missingCt=position=>{
    const links=learning.headLearningLinks(position);
    return position.sequenceId===sequence.id&&position.conceptId===id&&links?{...links,ctHref:undefined}:links;
  };
  const unavailableView=harness({query:'pons',view:'CT',linksFor:missingCt})();
  assert.match(unavailableView,/Exact comparison unavailable in the selected view/);
  assert.equal(visibleStepNavs(unavailableView).length,0);
  assert.doesNotMatch(visiblePart(unavailableView),/>Compare views<\/a>/);
  const missingStep=harness({query:'pons',linksFor:position=>position.sequenceId===sequence.id&&position.conceptId===id?null:learning.headLearningLinks(position)})();
  assert.match(missingStep,/Exact comparison unavailable in the selected view/);
  assert.equal(visibleStepNavs(missingStep).length,0);
  assert.doesNotMatch(visiblePart(missingStep),/>Compare views<\/a>/);
  const nullComparison=harness({query:'pons',comparisonFor:(tour,concept)=>tour===sequence.id&&concept===id?null:guidedComparison.headGuidedComparisonForStep(tour,concept)})();
  const row=visibleStepNavs(nullComparison).find(item=>item.label.startsWith('Open matching step 2:'));
  assert(row);
  assert.deepEqual(row.hrefs,selectedHrefs(learning.headLearningLinks({sequenceId:sequence.id,conceptId:id}),'all'));
  assert.deepEqual(row.comparison,[]);
});

test('stale revision and empty search render no comparison handoff',()=>{
  const stale=harness({query:'pons',current:false})();
  assert.match(stale,/temporarily unavailable/);
  assert.doesNotMatch(stale,/<a href=|<nav|<details/);
  const empty=harness({query:'unmapped-impossible-structure'})();
  assert.match(empty,/No linked tours match/);
  assert.deepEqual(visibleStepNavs(empty),[]);
  assert.doesNotMatch(empty,/>Compare views<\/a>/);
});

test('unfiltered tours do not expose comparison links outside their closed step details',()=>{
  const html=harness()();
  assert.deepEqual(visibleStepNavs(html),[]);
  assert.doesNotMatch(visiblePart(html),/>Compare views<\/a>/);
  assert.match(html,/<details class="head-linked-step-preview">/);
});
