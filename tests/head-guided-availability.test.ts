import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import type {HeadEntry,LoadedStudy,Modality} from '../lib/head-atlas-import.ts';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {headImageOnlyComparisonPacket} from '../lib/head-image-only-links.ts';
import * as learning from '../lib/head-atlas-learning.ts';
import * as tour from '../lib/lecture-tour-context.ts';
import * as related from '../lib/lecture-related-links.ts';
import {practiceEntries} from '../lib/head-atlas-practice.ts';
import type {HeadLearningPosition} from '../lib/head-atlas-learning.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasGuidedLearning.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Node={type:unknown;props:Record<string,any>};
const pons=(modality:Modality):HeadEntry=>({id:`${modality==='CT'?'cth':'mrb'}.bst.pons`,label:'Pons — regional mask',family:'bst',laterality:'midline_or_unpaired',representation:'partial-mask',color:[1,0,0],opacity:{fill:.2,outline:1}});
const leftCerebellum=(modality:Modality):HeadEntry=>({...headImageOnlyComparisonPacket().bindings[0][modality==='CT'?'ct':'mri'],family:'cer',color:[1,0,0],opacity:{fill:.2,outline:1}});

function load(revision=HEAD_LINK_REVISION){
  const mod={exports:{} as {HeadAtlasGuidedLearning:(props:any)=>Node}};
  const refs:Array<{current:unknown}>=[];let index=0;
  let pending:Array<()=>void|(()=>void)>=[],cleanups:Array<()=>void>=[];
  new Function('require','module','exports',code)((id:string)=>
    id==='react'?{useEffect:()=>{},useLayoutEffect:(create:()=>void|(()=>void))=>pending.push(create),useRef:(initial:unknown)=>refs[index++]??(refs[index-1]={current:initial}),useState:(initial:unknown)=>[initial,()=>{}]}:
    id==='../lib/head-atlas-import'?{HEAD_MANIFEST_SHA256:revision}:
    id==='../lib/head-atlas-learning'?learning:
    id==='../lib/lecture-tour-context'?tour:
    id==='../lib/lecture-related-links'?related:
    id==='../lib/head-atlas-practice'?{practiceEntries}:
    id==='./HeadAtlasTeaching'?{HeadAtlasTeaching:()=>null}:
    id==='./HeadAtlasConceptTeaching'?{HeadAtlasConceptTeaching:()=>null}:
    id==='./HeadLearningBookmark'?{HeadLearningBookmark:()=>null}:
    id==='../lib/head-atlas-focus'?{focusHeadLearningContent:()=>{}}:require(id),mod,mod.exports);
  return (props:any)=>{
    index=0;pending=[];const tree=mod.exports.HeadAtlasGuidedLearning(props);
    cleanups.forEach(cleanup=>cleanup());cleanups=[];
    for(const create of pending){const cleanup=create();if(cleanup)cleanups.push(cleanup);}
    return tree;
  };
}

function render(entries:HeadEntry[]|null,modality:Modality,component=load(),position:HeadLearningPosition={sequenceId:'brainstem',conceptId:null},onCompare?:(entry:HeadEntry)=>void){
  const positions:HeadLearningPosition[]=[],selected:HeadEntry[]=[];
  const tree=component({study:entries===null?null:{definition:{entries}} as LoadedStudy,modality,position,
    onPositionChange:(next:HeadLearningPosition)=>positions.push(next),onSelect:(entry:HeadEntry)=>selected.push(entry),onPractice:()=>{},onCompare});
  const find=(value:unknown,predicate:(node:Node)=>boolean):Node|undefined=>{
    if(Array.isArray(value)){for(const child of value){const found=find(child,predicate);if(found)return found;}return;}
    if(!value||typeof value!=='object'||!('props' in value))return;
    const node=value as Node;return predicate(node)?node:find(node.props.children,predicate);
  };
  const select=find(tree,node=>node.type==='select');
  const options=(Array.isArray(select?.props.children)?select.props.children:[select?.props.children]) as Node[];
  const label=(option:Node)=>String((Array.isArray(option.props.children)?option.props.children:[option.props.children]).join(''));
  return {html:renderToStaticMarkup(tree as unknown as React.ReactNode),select,options,labels:options.map(label),positions,selected};
}

test('loaded CT and MRI studies show exact per-tour availability without changing sequence values or selection',()=>{
  for(const modality of ['CT','MRI'] as const){
    const entries=[pons(modality),leftCerebellum(modality)];
    const view=render(entries,modality);
    assert.deepEqual(view.options.map(option=>option.props.value),learning.headLearningSequencesForModality(modality).map(item=>item.id));
    assert(view.labels.includes('Brainstem orientation · 1 / 3 available'));
    assert(view.labels.includes('Ventricular spaces · 0 / 4 available'));
    assert(view.labels.includes('Cerebellar orientation · CT/MRI only · 1 / 3 available'));
    assert.equal(view.select?.props.disabled,false);
    view.select?.props.onChange({target:{value:'ventricles'}});
    assert.deepEqual(view.positions,[{sequenceId:'ventricles',conceptId:null}]);
    assert.deepEqual(view.selected,[]);
    assert.match(view.html,/Sequence steps · 1 \/ 3 available/);
  }
});

test('unopened, replaced, empty and stale studies never claim availability from old props',()=>{
  const component=load();
  const unopened=render(null,'CT',component);
  assert.equal(unopened.select?.props.disabled,true);
  assert(unopened.labels.includes('Brainstem orientation'));
  assert(unopened.labels.every(label=>!label.includes('available')));
  const first=render([pons('CT')],'CT',component);
  assert(first.labels.includes('Brainstem orientation · 1 / 3 available'));
  const replaced=render([],'CT',component);
  assert(replaced.labels.includes('Brainstem orientation · 0 / 3 available'));
  assert(replaced.labels.includes('Ventricular spaces · 0 / 4 available'));
  const stale=render([pons('CT')],'CT',load('stale'));
  assert(stale.labels.every(label=>!label.includes('available')));
  assert.doesNotMatch(stale.html,/Sequence steps/);
});

test('ambiguous image-only identity and altered source metadata do not count as available',()=>{
  const cerebellum=leftCerebellum('CT');
  const duplicate=render([cerebellum,{...cerebellum}],'CT');
  assert(duplicate.labels.includes('Cerebellar orientation · CT/MRI only · 0 / 3 available'));
  const altered=render([{...pons('CT'),label:'Different pons'}],'CT');
  assert(altered.labels.includes('Brainstem orientation · 0 / 3 available'));
});

const escapedHref=(href:string)=>`href="${href.replaceAll('&','&amp;')}"`;

test('missing CT and MRI tour masks still offer exact cross-modality and full 3D step links',()=>{
  const position={sequenceId:'brainstem',conceptId:'brainstem-pons'};
  const links=learning.headLearningLinks(position);
  assert(links?.ctHref&&links.mriHref&&links.atlasHref);
  for(const modality of ['CT','MRI'] as const){
    const view=render([],modality,load(),position,()=>{});
    assert.match(view.html,/Step 2 \/ 3/);
    assert.match(view.html,/This step is unavailable in the loaded study/);
    assert.match(view.html,/Mask availability is checked in the destination study/);
    assert(view.html.includes(escapedHref(modality==='CT'?links.mriHref:links.ctHref)));
    assert(view.html.includes(escapedHref(links.atlasHref)));
    assert.match(view.html,/Open this step in the 3D Atlas/);
    assert.doesNotMatch(view.html,/Compare this step beside 3D|Show this step|Find this structure · quick check/);
    assert.deepEqual(view.selected,[]);
  }
});

test('missing image-only and MRI-only steps keep their canonical modality limits',()=>{
  const cerebellum={sequenceId:'cerebellar-orientation',conceptId:'cerebellum-left-hemisphere'};
  const cerebellarLinks=learning.headLearningLinks(cerebellum);
  assert(cerebellarLinks?.ctHref&&cerebellarLinks.mriHref);
  assert.equal(cerebellarLinks.atlasHref,undefined);
  const imageOnly=render([],'CT',load(),cerebellum,()=>{});
  assert(imageOnly.html.includes(escapedHref(cerebellarLinks.mriHref)));
  assert.doesNotMatch(imageOnly.html,/Open this step in the 3D Atlas|Compare this step beside 3D/);

  const amygdala={sequenceId:'mri-amygdalae',conceptId:'limbic-left-amygdala'};
  const mriLinks=learning.headLearningLinks(amygdala);
  assert(mriLinks?.mriHref&&mriLinks.atlasHref);
  assert.equal(mriLinks.ctHref,undefined);
  const mriOnly=render([],'MRI',load(),amygdala,()=>{});
  assert(mriOnly.html.includes(escapedHref(mriLinks.atlasHref)));
  assert.match(mriOnly.html,/No exact CT comparison mapped/);
  assert.doesNotMatch(mriOnly.html,/Continue this step on CT|Compare this step beside 3D/);
});

test('no study, stale revision, unknown sequence and unsupported modality expose no step handoffs',()=>{
  const ponsPosition={sequenceId:'brainstem',conceptId:'brainstem-pons'};
  const unsupported={sequenceId:'mri-amygdalae',conceptId:'limbic-left-amygdala'};
  const invalid=[
    render(null,'CT',load(),ponsPosition),
    render([],'CT',load('stale'),ponsPosition),
    render([],'CT',load(),{sequenceId:'unknown',conceptId:'brainstem-pons'}),
    render([],'CT',load(),unsupported),
  ];
  for(const view of invalid){
    assert.doesNotMatch(view.html,/Continue this step on (CT|MRI)|Open this step in the 3D Atlas|Compare this step beside 3D/);
    assert.doesNotMatch(view.html,/href="\/atlas\/(?:ct-head|mri-head|head-neck-3d)/);
  }
});
