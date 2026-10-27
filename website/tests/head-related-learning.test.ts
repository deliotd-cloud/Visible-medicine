import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {headRelatedLearning} from '../lib/head-related-learning.ts';
import {headGuidedComparisonForStep} from '../lib/head-guided-comparison.ts';
import {headLearningLinks,parseHeadLearningIntent} from '../lib/head-atlas-learning.ts';
import {HEAD_LINK_REVISION as revision} from '../lib/head-atlas-links.ts';
import {headImageConcept} from '../lib/head-image-only-links.ts';
import {relatedLectureHref} from '../lib/lecture-related-links.ts';
import type {HeadEntry,Modality} from '../lib/head-atlas-import.ts';

const make=(modality:Modality,part:string,label:string):HeadEntry=>({id:`${modality==='CT'?'cth':'mrb'}.bst.${part}`,label:`${label} — regional mask`,family:'bst',laterality:'midline_or_unpaired',representation:'partial-mask',color:[1,0,0],opacity:{fill:.2,outline:1}});
test('a selected middle step opens at its canonical position, with exact cross-modality handoff',()=>{
  for(const modality of ['CT','MRI'] as const){
    const pons=make(modality,'pons','Pons');
    const tours=headRelatedLearning([pons],pons,modality,revision);
    assert.deepEqual(tours,[{position:{sequenceId:'brainstem',conceptId:'brainstem-pons'},label:'Brainstem orientation',step:2,total:3,available:1}]);
    const links=headLearningLinks(tours[0].position)!;
    for(const href of [links.ctHref!,links.mriHref!]){
      assert.deepEqual(parseHeadLearningIntent(new URL(href,'https://example.invalid').searchParams),tours[0].position);
    }
    const entries=[make(modality,'medulla_oblongata','Medulla oblongata'),pons,make(modality,'midbrain','Midbrain')];
    assert.equal(headRelatedLearning(entries,pons,modality,revision)[0].available,3);
    assert.equal(headRelatedLearning(entries,pons,modality,revision)[0].step,2);
  }
});
test('stale revisions, another-study objects, wrong modality and unsupported identity never suggest a tour',()=>{
  const pons=make('CT','pons','Pons');
  assert.deepEqual(headRelatedLearning([pons],pons,'CT','stale'),[]);
  assert.deepEqual(headRelatedLearning([pons],{...pons},'CT',revision),[]);
  assert.deepEqual(headRelatedLearning([pons],pons,'MRI',revision),[]);
  for(const patch of [{id:'unknown'},{label:'Wrong anatomy'},{laterality:'left'},{representation:'point'}]){
    const changed={...pons,...patch};assert.deepEqual(headRelatedLearning([changed],changed,'CT',revision),[]);
  }
});
test('CT-only bone tours are not offered as MRI tours',()=>{
  const bone:HeadEntry={...make('CT','pons','Pons'),id:'cth.skl.occipital_bone',label:'Occipital bone — regional mask',family:'skl'};
  assert.equal(headRelatedLearning([bone],bone,'CT',revision)[0].position.sequenceId,'ct-parietal-occipital');
  assert.deepEqual(headRelatedLearning([bone],bone,'MRI',revision),[]);
});

type Node={type:unknown;props:Record<string,any>};
function find(value:any,type:string):Node|undefined{
  if(Array.isArray(value)){for(const item of value){const result=find(item,type);if(result)return result;}return;}
  if(!value?.props)return;
  return value.type===type?value:find(value.props.children,type);
}
function findAll(value:any,type:string):Node[]{
  if(Array.isArray(value))return value.flatMap(item=>findAll(item,type));
  if(!value?.props)return [];
  return [...(value.type===type?[value]:[]),...findAll(value.props.children,type)];
}
const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasRelatedLearning.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const dependencies:Record<string,unknown>={
  '../lib/head-related-learning':{headRelatedLearning},
  '../lib/head-guided-comparison.ts':{headGuidedComparisonForStep},
  '../lib/head-atlas-links':{HEAD_LINK_REVISION:revision},
  '../lib/head-image-only-links':{headImageConcept},
  '../lib/lecture-related-links':{relatedLectureHref},
};
function componentWith(overrides:Record<string,unknown>={}){
  const mod={exports:{} as {HeadAtlasRelatedLearning:(props:any)=>React.ReactElement|null}};
  const bound={...dependencies,...overrides};
  new Function('require','module','exports',compiled)((id:string)=>id in bound?bound[id]:require(id),mod,mod.exports);
  return mod.exports.HeadAtlasRelatedLearning;
}
const Related=componentWith();
test('related tours stay collapsed and start only on explicit click, using the selected step',()=>{
  const pons=make('CT','pons','Pons'),started:unknown[]=[];
  const props={entries:[pons],entry:pons,modality:'CT',revision,onStart:(position:unknown)=>started.push(position)};
  const tree=Related(props)!;
  assert.equal(find(tree,'details')?.props.open,undefined);
  assert.deepEqual(started,[]);
  const html=renderToStaticMarkup(tree);
  assert.match(html,/Learn this in context · 1 tour/);
  assert.match(html,/step 2 of 3/);assert.match(html,/1 of 3 steps available/);
  assert.match(html,/nothing is marked complete/);
  find(tree,'button')!.props.onClick();
  assert.deepEqual(started,[{sequenceId:'brainstem',conceptId:'brainstem-pons'}]);
  assert.equal(Related({...props,revision:'stale'}),null);
  assert.equal(Related({...props,entries:[]}),null);
});
test('CT and MRI Pons expose the exact comparison for their selected tour step without starting it',()=>{
  const expected=headGuidedComparisonForStep('brainstem','brainstem-pons');assert(expected);
  assert.equal(expected.activityHref,`/atlas/guided-learning/compare?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision=${revision}`);
  for(const modality of ['CT','MRI'] as const){
    const pons=make(modality,'pons','Pons'),started:unknown[]=[];
    const tree=Related({entries:[pons],entry:pons,modality,revision,onStart:(position:unknown)=>started.push(position)})!;
    const links=findAll(tree,'a').filter(node=>node.props.children==='Compare views (new tab)');
    assert.equal(links.length,1);
    assert.equal(links[0].props.href,expected.activityHref);
    assert.equal(links[0].props.target,'_blank');
    assert.equal(links[0].props.rel,'noopener noreferrer');
    assert.equal(links[0].props.onClick,undefined);
    assert.match(links[0].props['aria-label'],/Brainstem orientation, step 2 of 3 \(new tab\)/);
    assert.equal(findAll(tree,'button').length,1);
    assert.deepEqual(started,[]);
  }
});
test('each matching tour resolves its own position and unavailable comparisons are omitted',()=>{
  const pons=make('CT','pons','Pons'),calls:string[]=[];
  const tours=[
    {position:{sequenceId:'brainstem',conceptId:'brainstem-pons'},label:'Brainstem orientation',step:2,total:3,available:1},
    {position:{sequenceId:'second-tour',conceptId:'brainstem-pons'},label:'Second tour',step:4,total:5,available:1},
    {position:{sequenceId:'unavailable-tour',conceptId:'brainstem-pons'},label:'Unavailable tour',step:1,total:2,available:1},
  ];
  const Custom=componentWith({
    '../lib/head-related-learning':{headRelatedLearning:()=>tours},
    '../lib/head-guided-comparison.ts':{headGuidedComparisonForStep:(sequenceId:string,conceptId:string)=>{
      calls.push(`${sequenceId}/${conceptId}`);
      return sequenceId==='unavailable-tour'?null:{activityHref:`/atlas/guided-learning/compare?tour=${sequenceId}`};
    }},
  });
  const tree=Custom({entries:[pons],entry:pons,modality:'CT',revision,onStart:()=>assert.fail('rendering a link must not start a tour')})!;
  assert.deepEqual(calls,['brainstem/brainstem-pons','second-tour/brainstem-pons','unavailable-tour/brainstem-pons']);
  assert.equal(findAll(tree,'button').length,3);
  const links=findAll(tree,'a').filter(node=>node.props.children==='Compare views (new tab)');
  assert.equal(links.length,2);
  assert.equal(links[0].props.href,'/atlas/guided-learning/compare?tour=brainstem');
  assert.equal(links[1].props.href,'/atlas/guided-learning/compare?tour=second-tour');
  assert.match(links[1].props['aria-label'],/Second tour, step 4 of 5/);
});
test('invalid entry identity, source membership, modality and revision expose no comparison',()=>{
  const pons=make('CT','pons','Pons');
  const base={entries:[pons],entry:pons,modality:'CT',revision,onStart:()=>{}};
  for(const props of [
    {...base,entries:[]},
    {...base,entry:{...pons}},
    {...base,modality:'MRI'},
    {...base,revision:'stale'},
    {...base,entry:{...pons,label:'Wrong anatomy'},entries:[{...pons,label:'Wrong anatomy'}]},
    {...base,entry:{...pons,id:'unknown'},entries:[{...pons,id:'unknown'}]},
  ]){
    const tree=Related(props);
    assert.equal(Boolean(tree&&findAll(tree,'a').some(node=>node.props.children==='Compare views (new tab)')),false);
  }
});
