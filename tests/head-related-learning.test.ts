import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {headRelatedLearning} from '../lib/head-related-learning.ts';
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
const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasRelatedLearning.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{} as {HeadAtlasRelatedLearning:(props:any)=>React.ReactElement|null}};
const dependencies:Record<string,unknown>={
  '../lib/head-related-learning':{headRelatedLearning},
  '../lib/head-atlas-links':{HEAD_LINK_REVISION:revision},
  '../lib/head-image-only-links':{headImageConcept},
  '../lib/lecture-related-links':{relatedLectureHref},
};
new Function('require','module','exports',compiled)((id:string)=>id in dependencies?dependencies[id]:require(id),mod,mod.exports);
test('related tours stay collapsed and start only on explicit click, using the selected step',()=>{
  const pons=make('CT','pons','Pons'),started:unknown[]=[];
  const props={entries:[pons],entry:pons,modality:'CT',revision,onStart:(position:unknown)=>started.push(position)};
  const tree=mod.exports.HeadAtlasRelatedLearning(props)!;
  assert.equal(find(tree,'details')?.props.open,undefined);
  assert.deepEqual(started,[]);
  const html=renderToStaticMarkup(tree);
  assert.match(html,/Learn this in context · 1 tour/);
  assert.match(html,/step 2 of 3/);assert.match(html,/1 of 3 steps available/);
  assert.match(html,/nothing is marked complete/);
  find(tree,'button')!.props.onClick();
  assert.deepEqual(started,[{sequenceId:'brainstem',conceptId:'brainstem-pons'}]);
  assert.equal(mod.exports.HeadAtlasRelatedLearning({...props,revision:'stale'}),null);
  assert.equal(mod.exports.HeadAtlasRelatedLearning({...props,entries:[]}),null);
});
