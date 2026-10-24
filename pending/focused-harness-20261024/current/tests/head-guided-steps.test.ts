import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {loadHeadBookmark} from './head-bookmark-ui-loader.ts';
import {separateComparisonAwareRequire} from './head-separate-comparison-test-source.ts';
import * as learning from '../lib/head-atlas-learning.ts';
import * as tour from '../lib/lecture-tour-context.ts';
import * as related from '../lib/lecture-related-links.ts';
import * as links from '../lib/head-atlas-links.ts';
import {headImageOnlyComparisonPacket} from '../lib/head-image-only-links.ts';
import type {HeadEntry,LoadedStudy} from '../lib/head-atlas-import.ts';
import {practiceEntries,type PracticeMode} from '../lib/head-atlas-practice.ts';

const require=separateComparisonAwareRequire(createRequire(import.meta.url)),pin=links.HEAD_LINK_REVISION;
const make=(part:string,label:string):HeadEntry=>({id:`cth.bst.${part}`,label:`${label} — regional mask`,family:'bst',laterality:'midline_or_unpaired',representation:'partial-mask',color:[1,0,0],opacity:{fill:.2,outline:1}});
const midbrain=make('midbrain','Midbrain'),pons=make('pons','Pons'),medulla=make('medulla_oblongata','Medulla oblongata');
const source=readFileSync(new URL('../components/HeadAtlasGuidedLearning.tsx',import.meta.url),'utf8');
test('compact tour question style stacks its label above the full-width selector',()=>{
 const css=readFileSync(new URL('../components/head-atlas.css',import.meta.url),'utf8');
 assert.match(css,/\.head-sequence-steps label\{display:grid;gap:6px\}/);
 assert.match(css,/\.head-practice select\{width:100%/);
});
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;

test('guided CT/MRI handoffs use same-tab client links with exact step and no prefetch',()=>{
 for(const modality of ['CT','MRI'] as const){
  const entry={...pons,id:modality==='CT'?pons.id:'mrb.bst.pons'};
  const f=fixture([entry],'brainstem-pons',pin,'brainstem',modality);
  const destinations=learning.headLearningLinks({sequenceId:'brainstem',conceptId:'brainstem-pons'})!;
  const href=modality==='CT'?destinations.mriHref:destinations.ctHref;
  const next=f.find(f.tree,node=>node.props.href===href)!;
  assert(next);assert.notEqual(next.type,'a','client routing retains the consenting provider');
  assert.equal(next.props.prefetch,false);assert.equal(next.props.target,undefined);
  assert.match(next.props.href,/headStep=1/);assert.match(next.props.href,/headRevision=/);
  const atlas=f.find(f.tree,node=>node.props.href===destinations.atlasHref)!;
  assert.equal(atlas.type,'a');assert.equal(atlas.props.target,'_blank');
  // The exact current copy starts a new sentence. Do not relax matching across
  // unknown source revisions or alter the historical lowercase witness.
  assert.equal(createHash('sha256').update(source).digest('hex'),'b5cd947f7bef048ffa8dcb0fb4b98b77ee2a54d83049822fed700b1f8be8ba95');
  assert.match(f.html,/Enable Folder sharing/);assert.match(f.html,/off by default/);
  const stale=fixture([entry],'brainstem-pons','stale','brainstem',modality);
  assert.equal(stale.find(stale.tree,node=>node.props.href===href),undefined);
 }
});
test('saved-step callback switches sequences by exact concept and leaves unavailable masks unselected',()=>{
 const ventricle:HeadEntry={id:'cth.vnt.third_ventricle',label:'Third ventricle — regional mask',family:'vnt',laterality:'midline_or_unpaired',representation:'mask',color:[1,0,0],opacity:{fill:.2,outline:1}};
 const f=fixture([pons,ventricle],'brainstem-pons',pin,'brainstem','CT');
 const bookmark=()=>f.find(f.tree,node=>typeof node.type==='function'&&node.type.name==='HeadLearningBookmark')!;
 const saved={sequenceId:'ventricles',conceptId:'ventricle-third'};
 assert.equal(bookmark().props.modality,'CT');assert.equal(bookmark().props.onOpenCurrent(saved),true);
 assert.deepEqual(f.positions,[saved]);assert.deepEqual(f.selected,[ventricle]);
 f.redraw();assert.equal(bookmark().props.onOpenCurrent({sequenceId:'brainstem',conceptId:'brainstem-midbrain'}),true);
 assert.deepEqual(f.positions.at(-1),{sequenceId:'brainstem',conceptId:'brainstem-midbrain'});
 assert.deepEqual(f.selected,[ventricle],'unavailable saved anatomy keeps its canonical step without substitution');
 f.redraw();assert.equal(bookmark().props.onOpenCurrent({sequenceId:'mri-amygdalae',conceptId:'limbic-left-amygdala'}),false);
 assert.equal(f.positions.length,2,'wrong-modality sequence is refused');
 const unopened=fixture(null,null,pin,'brainstem','CT');
 const unloadedBookmark=unopened.find(unopened.tree,node=>typeof node.type==='function'&&node.type.name==='HeadLearningBookmark')!;
 assert.equal(unloadedBookmark.props.onOpenCurrent({sequenceId:'brainstem',conceptId:'brainstem-pons'}),true);
 assert.deepEqual(unopened.positions,[{sequenceId:'brainstem',conceptId:'brainstem-pons'}]);
 assert.deepEqual(unopened.selected,[]);
});
type Node={type:unknown;props:Record<string,any>};
test('CT bone guided steps have exact 3D handoff, no MRI action and same-study practice',()=>{
 const entry:HeadEntry={id:'cth.skl.occipital_bone',label:'Occipital bone — regional mask',laterality:'midline_or_unpaired',representation:'partial-mask',family:'skl',color:[1,0,0],opacity:{fill:.2,outline:1},mask:{sha256:'bone-mask'} as HeadEntry['mask']};
 const f=fixture([entry],'bone-occipital',pin,'ct-parietal-occipital','CT');
 assert.match(f.html,/Step 3 \/ 3/);assert.match(f.html,/No exact MRI comparison mapped/);assert.doesNotMatch(f.html,/href="[^"]*mri-head|href="undefined"/);
 const handoff=learning.headLearningLinks({sequenceId:'ct-parietal-occipital',conceptId:'bone-occipital'})!;
 assert(f.find(f.tree,node=>node.props.href===handoff.atlasHref));
 f.button('Find this structure · quick check')!.props.onClick();assert.deepEqual(f.practised,[entry]);
 f.redraw();f.button('Practise available steps')!.props.onClick();assert.deepEqual(f.sets,[[entry]]);
 f.redraw();f.button('Previous')!.props.onClick();assert.deepEqual(f.positions,[{sequenceId:'ct-parietal-occipital',conceptId:'bone-right-parietal'}]);assert.deepEqual(f.selected,[],'unavailable preceding mask must not select a substitute');
});
type Props={study:LoadedStudy|null;modality:'CT'|'MRI';position:learning.HeadLearningPosition;onPositionChange:(position:learning.HeadLearningPosition)=>void;onSelect:(entry:HeadEntry)=>void;onPractice:(entry:HeadEntry)=>void;onPracticeSequence:(entries:HeadEntry[],mode:PracticeMode)=>void};
function fixture(entries:HeadEntry[]|null,conceptId:string|null='brainstem-pons',revision=pin,sequenceId='brainstem',modality:'CT'|'MRI'='CT'){
  const positions:learning.HeadLearningPosition[]=[],selected:HeadEntry[]=[],practised:HeadEntry[]=[],sets:HeadEntry[][]=[];
  let questionMode:PracticeMode='locate';const modes:PracticeMode[]=[];
  const refs:Array<{current:unknown}>=[];let refIndex=0;
  let pending:Array<()=>void|(()=>void)>=[],cleanups:Array<()=>void>=[];
  const module={exports:{} as {HeadAtlasGuidedLearning:(props:Props)=>Node}};
  new Function('require','module','exports',compiled)((name:string)=>name==='react'?{useEffect:()=>{},useLayoutEffect:(create:()=>void|(()=>void))=>pending.push(create),useRef:(initial:unknown)=>refs[refIndex++]??(refs[refIndex-1]={current:initial}),useState:()=>[questionMode,(value:PracticeMode)=>{questionMode=value;}]}:
    name==='../lib/head-atlas-import'?{HEAD_MANIFEST_SHA256:revision}:name==='../lib/head-atlas-links'?links:name==='../lib/head-atlas-learning'?learning:
    name==='../lib/lecture-tour-context'?tour:name==='../lib/lecture-related-links'?related:
    name==='../lib/head-atlas-practice'?{practiceEntries}:name==='../lib/head-atlas-focus'?{focusHeadLearningContent:()=>{}}:name==='./HeadAtlasTeaching'?{HeadAtlasTeaching:()=>null}:name==='./HeadAtlasConceptTeaching'?{HeadAtlasConceptTeaching:()=>null}:name==='./HeadLearningBookmark'?loadHeadBookmark():require(name),module,module.exports);
  const currentStudy=entries===null?null:{definition:{entries}} as LoadedStudy;
  const render=()=>{
    refIndex=0;pending=[];
    const next=module.exports.HeadAtlasGuidedLearning({study:currentStudy,modality,position:{sequenceId,conceptId},onPositionChange:value=>positions.push(value),onSelect:value=>selected.push(value),onPractice:value=>practised.push(value),onPracticeSequence:(value,mode)=>{sets.push(value);modes.push(mode);}});
    cleanups.forEach(cleanup=>cleanup());cleanups=[];
    for(const create of pending){const cleanup=create();if(cleanup)cleanups.push(cleanup);}
    return next;
  };
  let tree=render();
  function find(value:unknown,predicate:(node:Node)=>boolean):Node|undefined{
    if(Array.isArray(value)){for(const child of value){const result=find(child,predicate);if(result)return result;}return;}
    if(!value||typeof value!=='object'||!('props'in value))return;
    const node=value as Node;return predicate(node)?node:find(node.props.children,predicate);
  }
  const text=(value:any):string=>Array.isArray(value)?value.map(text).join(''):value?.props?text(value.props.children):typeof value==='string'||typeof value==='number'?String(value):'';
  const button=(label:string)=>find(tree,node=>node.type==='button'&&text(node.props.children)===label);
  return {get tree(){return tree;},get html(){return renderToStaticMarkup(tree as unknown as React.ReactNode);},redraw(){tree=render();},find,button,positions,selected,practised,sets,modes};
}

test('CT/MRI tour question style stays inside the disclosure and reaches the explicit start action',()=>{
 for(const modality of ['CT','MRI'] as const){
  const entry={...pons,id:modality==='CT'?pons.id:'mrb.bst.pons',mask:{sha256:'a'} as HeadEntry['mask']};
  const f=fixture([entry],'brainstem-pons',pin,'brainstem',modality);
  const disclosure=()=>f.find(f.tree,node=>node.type==='details'&&String(node.props.className).includes('head-sequence-steps'))!;
  const picker=()=>f.find(disclosure(),node=>node.type==='select')!;
  assert.equal(disclosure().props.open,undefined);assert.equal(picker().props.value,'locate');
  f.button('Practise available steps')!.props.onClick();assert.deepEqual(f.modes,['locate']);
  f.redraw();picker().props.onChange({target:{value:'label'}});f.redraw();assert.equal(picker().props.value,'label');
  assert.deepEqual(f.modes,['locate'],'changing preference must not start a set');
  f.button('Practise available steps')!.props.onClick();assert.deepEqual(f.modes,['locate','label']);
  assert.deepEqual(f.sets,[[entry],[entry]]);assert.deepEqual(f.positions,[]);assert.deepEqual(f.selected,[]);
  f.redraw();picker().props.onChange({target:{value:'foreign'}});f.redraw();assert.equal(picker().props.value,'label');
  picker().props.onChange({target:{value:'recall'}});f.redraw();assert.equal(picker().props.value,'recall');
  f.button('Practise available steps')!.props.onClick();assert.deepEqual(f.modes,['locate','label','recall']);
  assert.deepEqual(f.sets,[[entry],[entry],[entry]]);
  f.redraw();picker().props.onChange({target:{value:'locate'}});f.redraw();assert.equal(picker().props.value,'locate');
  const none=fixture([],'brainstem-pons',pin,'brainstem',modality);
  const group=none.find(none.tree,node=>node.type==='details'&&String(node.props.className).includes('head-sequence-steps'))!;
  assert.equal(none.find(group,node=>node.type==='select')!.props.disabled,true);
 }
});

test('sequence practice uses ordered eligible exact masks only and stays inside the collapsed steps disclosure',()=>{
 for(const modality of ['CT','MRI'] as const){
  const masked=(entry:HeadEntry,hash:string)=>({...entry,id:entry.id.replace(/^cth/,modality==='CT'?'cth':'mrb'),mask:{sha256:hash} as HeadEntry['mask']});
  const first=masked(midbrain,'a'),middle=masked(pons,'b'),last=masked(medulla,'c');
  const f=fixture([last,first,middle],'brainstem-pons',pin,'brainstem',modality);
  const button=f.button('Practise available steps');assert(button&&!button.props.disabled);
  button.props.onClick();assert.deepEqual(f.sets,[[first,middle,last]]);
  assert.deepEqual(f.positions,[]);assert.deepEqual(f.selected,[]);
  assert.match(f.html,/3 \/ 3 steps have distinct saved masks/);
  const disclosure=f.find(f.tree,node=>node.type==='details'&&String(node.props.className).includes('head-sequence-steps'));
  assert(disclosure&&!disclosure.props.open);
  assert(f.find(disclosure,node=>node===button));
  const alias={...last,source:{geometry_alias_of:middle.id}};
  const partial=fixture([first,alias],'brainstem-pons',pin,'brainstem',modality);
  partial.button('Practise available steps')!.props.onClick();assert.deepEqual(partial.sets,[[first]]);
  const none=fixture([{...first,mask:undefined},alias],'brainstem-pons',pin,'brainstem',modality);
  assert.equal(none.button('Practise available steps')!.props.disabled,true);
  none.button('Practise available steps')!.props.onClick();assert.deepEqual(none.sets,[]);
  assert.equal(fixture([first],null,'stale','brainstem',modality).button('Practise available steps'),undefined);
 }
 assert.equal(fixture(null).button('Practise available steps'),undefined);
});

test('canonical slots preserve missing first, middle and last entries without renumbering',()=>{
  const all=[midbrain,pons,medulla];
  for(const missing of all){
    const entries=all.filter(entry=>entry!==missing),steps=learning.headLearningSteps(entries,'brainstem','CT',pin);
    assert.deepEqual(steps.map(({index,conceptId})=>({index,conceptId})),learning.headLearningSequences[0].concepts.map((conceptId,index)=>({index,conceptId})));
    assert.equal(steps[all.indexOf(missing)].entry,null);
    assert.deepEqual(learning.headLearningEntries(entries,'brainstem','CT',pin),entries);
  }
  const f=fixture([pons,medulla]);assert.match(f.html,/Step 2 \/ 3/);
  assert.match(f.html,/Sequence steps · 2 \/ 3 available/);assert.match(f.html,/Midbrain · unavailable/);
  assert.match(f.html,/aria-current="step">Pons/);assert.doesNotMatch(f.html,/<details[^>]*\sopen(?:\s|=|>)/);
  const href=learning.headLearningLinks({sequenceId:'brainstem',conceptId:'brainstem-pons'})!.mriHref;
  assert(href);
  assert(f.html.includes(href.replaceAll('&','&amp;')));assert.match(href,/headStep=1/);
});

test('next visits the unavailable canonical slot without selecting, teaching or testing a substitute',()=>{
  const before=fixture([midbrain,medulla],'brainstem-midbrain');before.button('Next')!.props.onClick();
  assert.deepEqual(before.positions,[{sequenceId:'brainstem',conceptId:'brainstem-pons'}]);assert.deepEqual(before.selected,[]);
  const missing=fixture([midbrain,medulla]);assert.match(missing.html,/Step 2 \/ 3/);assert.match(missing.html,/<h3[^>]*>Pons<\/h3>/);
  assert.match(missing.html,/No other structure has been substituted/);
  assert.equal(missing.button('Show this step'),undefined);assert.equal(missing.button('Find this structure · quick check'),undefined);
  assert.doesNotMatch(missing.html,/Compare this step beside 3D|Learn this anatomy/);
  const mapped=learning.headLearningLinks({sequenceId:'brainstem',conceptId:'brainstem-pons'})!;
  assert(missing.html.includes(mapped.mriHref!.replaceAll('&','&amp;')));
  assert(missing.html.includes(mapped.atlasHref!.replaceAll('&','&amp;')));
  assert.match(missing.html,/Mask availability is checked in the destination study/);
  missing.button('Next')!.props.onClick();assert.deepEqual(missing.positions,[{sequenceId:'brainstem',conceptId:'brainstem-medulla'}]);assert.deepEqual(missing.selected,[medulla]);
});

test('CT/MRI ventricular gaps offer an exact later step while Next keeps its canonical destination',()=>{
 for(const modality of ['CT','MRI'] as const){
  const prefix=modality==='CT'?'cth':'mrb';
  const left:HeadEntry={id:`${prefix}.vnt.lateral_ventricle.left`,label:'Left lateral ventricle — regional mask',family:'vnt',laterality:'left',representation:'mask',color:[1,0,0],opacity:{fill:.2,outline:1}};
  const third:HeadEntry={...left,id:`${prefix}.vnt.third_ventricle`,label:'Third ventricle — regional mask',laterality:'midline_or_unpaired'};
  const current=fixture([third,left],'ventricle-left-lateral',pin,'ventricles',modality);
  assert.match(current.html,/Step 1 \/ 4/);
  assert.match(current.html,/Sequence steps · 2 \/ 4 available/);
  assert(current.button('Right lateral ventricle · unavailable'));
  assert(current.button('Fourth ventricle · unavailable'));
  const shortcut=current.button('Next available · step 3 · Third ventricle');
  assert(shortcut&&!shortcut.props.disabled);
  assert.match(current.html,/1 upcoming step has no matching mask in this study/);
  assert.deepEqual(current.positions,[]);assert.deepEqual(current.selected,[]);
  current.button('Next')!.props.onClick();
  assert.deepEqual(current.positions,[{sequenceId:'ventricles',conceptId:'ventricle-right-lateral'}]);
  assert.deepEqual(current.selected,[],'canonical Next must not select the later matched entry');
  const direct=fixture([third,left],'ventricle-left-lateral',pin,'ventricles',modality);
  direct.button('Next available · step 3 · Third ventricle')!.props.onClick();
  assert.deepEqual(direct.positions,[{sequenceId:'ventricles',conceptId:'ventricle-third'}]);
  assert.deepEqual(direct.selected,[third]);
  assert.deepEqual(direct.practised,[]);assert.deepEqual(direct.sets,[]);
 }
});

test('CT/MRI shortcut counts multiple missing canonical slots without renumbering or scoring',()=>{
 for(const modality of ['CT','MRI'] as const){
  const prefix=modality==='CT'?'cth':'mrb';
  const left:HeadEntry={id:`${prefix}.vnt.lateral_ventricle.left`,label:'Left lateral ventricle — regional mask',family:'vnt',laterality:'left',representation:'mask',color:[1,0,0],opacity:{fill:.2,outline:1}};
  const fourth:HeadEntry={...left,id:`${prefix}.vnt.fourth_ventricle`,label:'Fourth ventricle — regional mask',laterality:'midline_or_unpaired'};
  const steps=learning.headLearningSteps([fourth,left],'ventricles',modality,pin);
  assert.deepEqual(steps.map(({index,conceptId})=>({index,conceptId})),learning.headLearningSequences[1].concepts.map((conceptId,index)=>({index,conceptId})));
  assert.deepEqual(steps.map(item=>item.entry),[left,null,null,fourth]);
  const view=fixture([fourth,left],'ventricle-left-lateral',pin,'ventricles',modality);
  assert.match(view.html,/Step 1 \/ 4/);
  assert.match(view.html,/Sequence steps · 2 \/ 4 available/);
  assert(view.button('Right lateral ventricle · unavailable'));
  assert(view.button('Third ventricle · unavailable'));
  assert.match(view.html,/2 upcoming steps have no matching masks in this study/);
  const shortcut=view.button('Next available · step 4 · Fourth ventricle');assert(shortcut&&!shortcut.props.disabled);
  shortcut.props.onClick();
  assert.deepEqual(view.positions,[{sequenceId:'ventricles',conceptId:'ventricle-fourth'}]);
  assert.deepEqual(view.selected,[fourth]);
  assert.deepEqual(view.practised,[]);assert.deepEqual(view.sets,[]);
  const adjacent=fixture([fourth,left],'ventricle-left-lateral',pin,'ventricles',modality);
  adjacent.button('Next')!.props.onClick();
  assert.deepEqual(adjacent.positions,[{sequenceId:'ventricles',conceptId:'ventricle-right-lateral'}]);
  assert.deepEqual(adjacent.selected,[]);
 }
});

test('CT/MRI later-step shortcut stays hidden without an active valid gap and later exact match',()=>{
 for(const modality of ['CT','MRI'] as const){
  const prefix=modality==='CT'?'cth':'mrb';
  const left:HeadEntry={id:`${prefix}.vnt.lateral_ventricle.left`,label:'Left lateral ventricle — regional mask',family:'vnt',laterality:'left',representation:'mask',color:[1,0,0],opacity:{fill:.2,outline:1}};
  const right:HeadEntry={...left,id:`${prefix}.vnt.lateral_ventricle.right`,label:'Right lateral ventricle — regional mask',laterality:'right'};
  const third:HeadEntry={...left,id:`${prefix}.vnt.third_ventricle`,label:'Third ventricle — regional mask',laterality:'midline_or_unpaired'};
  const fourth:HeadEntry={...left,id:`${prefix}.vnt.fourth_ventricle`,label:'Fourth ventricle — regional mask',laterality:'midline_or_unpaired'};
  const cases=[
   fixture([left,fourth],null,pin,'ventricles',modality),
   fixture([left,fourth],'unknown-concept',pin,'ventricles',modality),
   fixture([left,third,fourth],'ventricle-right-lateral',pin,'ventricles',modality),
   fixture([left,right,third,fourth],'ventricle-left-lateral',pin,'ventricles',modality),
   fixture([left],'ventricle-left-lateral',pin,'ventricles',modality),
   fixture([left,fourth],'ventricle-fourth',pin,'ventricles',modality),
   fixture([left,fourth],'ventricle-left-lateral','stale','ventricles',modality),
   fixture(null,'ventricle-left-lateral',pin,'ventricles',modality),
  ];
  for(const view of cases){
   assert.doesNotMatch(view.html,/Next available · step/);
   assert.deepEqual(view.positions,[]);assert.deepEqual(view.selected,[]);
  }
  assert.doesNotMatch(cases[6].html,/Sequence steps/);
  assert.equal(cases[7].button('Start sequence'),undefined);
  const unavailable=fixture([left,fourth],'ventricle-right-lateral',pin,'ventricles',modality);
  assert.match(unavailable.html,/Step 2 \/ 4/);
  assert.match(unavailable.html,/1 upcoming step has no matching mask/);
  assert.match(unavailable.html,/No other structure has been substituted/);
  assert.equal(unavailable.button('Show this step'),undefined);
  unavailable.button('Next')!.props.onClick();
  assert.deepEqual(unavailable.positions,[{sequenceId:'ventricles',conceptId:'ventricle-third'}]);
  assert.deepEqual(unavailable.selected,[]);
  unavailable.redraw();unavailable.button('Next available · step 4 · Fourth ventricle')!.props.onClick();
  assert.deepEqual(unavailable.positions,[{sequenceId:'ventricles',conceptId:'ventricle-third'},{sequenceId:'ventricles',conceptId:'ventricle-fourth'}]);
  assert.deepEqual(unavailable.selected,[fourth]);
  assert.deepEqual(unavailable.practised,[]);assert.deepEqual(unavailable.sets,[]);
 }
});

test('outline picks exact same-study objects and keeps missing and valid positions explicit',()=>{
  // The positive quick check needs an eligible saved mask, as its enabled UI does.
  const pons={...make('pons','Pons'),mask:{sha256:'synthetic-outline-pons'} as HeadEntry['mask']};
  const f=fixture([midbrain,medulla]);f.button('Pons · unavailable')!.props.onClick();
  assert.deepEqual(f.positions,[{sequenceId:'brainstem',conceptId:'brainstem-pons'}]);assert.deepEqual(f.selected,[]);
  f.redraw();f.button('Medulla oblongata')!.props.onClick();assert.equal(f.selected[0],medulla);
  const valid=fixture([pons]);valid.button('Find this structure · quick check')!.props.onClick();assert.equal(valid.practised[0],pons);
});

test('altered labels, laterality and representation remain unavailable; stale revisions have no slots',()=>{
  for(const altered of [{...pons,label:'Wrong pons'},{...pons,laterality:'left'},{...pons,representation:'mask'}]){
    const steps=learning.headLearningSteps([altered],'brainstem','CT',pin);assert(steps.every(item=>item.entry===null));
    assert.doesNotMatch(fixture([altered]).html,/Compare in the 3D Atlas|Show this step|quick check/);
  }
  assert.deepEqual(learning.headLearningSteps([pons],'brainstem','CT','stale'),[]);
  assert.deepEqual(learning.headLearningSteps([pons],'unknown','CT',pin),[]);
  assert.doesNotMatch(fixture([pons],'brainstem-pons','stale').html,/Sequence steps|Compare in the 3D Atlas/);
});

test('empty and unopened studies never select a fallback and finish records no approval',()=>{
  const unopened=fixture(null);assert.match(unopened.html,/resume this tour step/);assert.equal(unopened.button('Start sequence'),undefined);
  const empty=fixture([],null);assert.equal(empty.button('Start sequence')!.props.disabled,true);empty.button('Start sequence')!.props.onClick();assert.deepEqual(empty.positions,[]);assert.deepEqual(empty.selected,[]);
  const last=fixture([],'brainstem-medulla');assert.match(last.html,/Step 3 \/ 3/);assert.equal(last.button('Next'),undefined);
  last.button('Finish sequence')!.props.onClick();assert.deepEqual(last.positions,[{sequenceId:'brainstem',conceptId:null}]);assert.deepEqual(last.selected,[]);
  assert.match(last.html,/Finishing records no score or clinical approval/);assert(!/localStorage|sessionStorage|indexedDB|fetch\(/.test(source));
});

test('CT/MRI zero-match tours explain disabled Start and ignore direct activation without hiding canonical steps',()=>{
 for(const modality of ['CT','MRI'] as const){
  const candidate={...pons,id:modality==='CT'?pons.id:'mrb.bst.pons',label:'Altered pons'};
  for(const entries of [[],[candidate]]){
   const view=fixture(entries,null,pin,'brainstem',modality);
   assert.equal(view.button('Start sequence')!.props.disabled,true);
   assert.match(view.html,/No matching masks are available/);
   assert.match(view.html,/Sequence steps · 0 \/ 3 available/);
   view.button('Start sequence')!.props.onClick();assert.deepEqual(view.positions,[]);assert.deepEqual(view.selected,[]);
  }
  const stale=fixture([candidate],null,'stale','brainstem',modality);
  assert.equal(stale.button('Start sequence')!.props.disabled,true);
  stale.button('Start sequence')!.props.onClick();assert.deepEqual(stale.positions,[]);assert.deepEqual(stale.selected,[]);
  assert.doesNotMatch(stale.html,/Sequence steps/);
 }
});

test('CT/MRI partial tours offer one explicit start at the first available canonical slot',()=>{
 for(const modality of ['CT','MRI'] as const){
  const entry={...pons,id:modality==='CT'?pons.id:'mrb.bst.pons'};
  const view=fixture([entry],null,pin,'brainstem',modality);
  const start=view.button('Start at step 2 · Pons');assert(start&&!start.props.disabled);
  assert.equal(view.button('Start sequence'),undefined);
  assert.equal((view.html.match(/<button[^>]*>Start at step 2 · Pons<\/button>/g)??[]).length,1);
  assert.match(view.html,/Earlier steps are unavailable in this study\. They remain in Sequence steps with their original numbering\./);
  assert.match(view.html,/Sequence steps · 1 \/ 3 available/);
  assert.match(view.html,/<li><button[^>]*>Midbrain · unavailable<\/button><\/li>/);
  assert.doesNotMatch(view.html,/No matching masks are available/);
  assert.deepEqual(view.positions,[]);assert.deepEqual(view.selected,[],'render must not select the later entry automatically');
  start.props.onClick();assert.deepEqual(view.positions,[{sequenceId:'brainstem',conceptId:'brainstem-pons'}]);assert.equal(view.selected[0],entry);
  const unavailable=fixture([entry],'brainstem-midbrain',pin,'brainstem',modality);
  assert.match(unavailable.html,/Step 1 \/ 3/);assert.equal(unavailable.button('Start at step 2 · Pons'),undefined);
  unavailable.button('Next')!.props.onClick();assert.deepEqual(unavailable.positions,[{sequenceId:'brainstem',conceptId:'brainstem-pons'}]);assert.equal(unavailable.selected[0],entry);
 }
});

test('CT/MRI reordered entries start at the first available sequence index, not the first study entry',()=>{
 for(const modality of ['CT','MRI'] as const){
  const prefix=modality==='CT'?'cth':'mrb';
  const later={...medulla,id:`${prefix}.bst.medulla_oblongata`},first={...pons,id:`${prefix}.bst.pons`};
  const view=fixture([later,first],null,pin,'brainstem',modality);
  const start=view.button('Start at step 2 · Pons');assert(start);
  assert.match(view.html,/Sequence steps · 2 \/ 3 available/);
  assert.deepEqual(view.positions,[]);assert.deepEqual(view.selected,[]);
  start.props.onClick();assert.deepEqual(view.positions,[{sequenceId:'brainstem',conceptId:'brainstem-pons'}]);assert.equal(view.selected[0],first);
 }
});

test('CT/MRI first available eight-step lobe keeps all earlier missing slots numbered',()=>{
 for(const modality of ['CT','MRI'] as const){
  const entry:HeadEntry={id:`${modality==='CT'?'cth':'mrb'}.ctx.temporal_lobe.left`,label:'Left temporal lobe — regional mask',family:'ctx',laterality:'left',representation:'mask',color:[1,0,0],opacity:{fill:.2,outline:1}};
  const view=fixture([entry],null,pin,'cerebral-lobes',modality);
  const start=view.button('Start at step 5 · Left temporal lobe');assert(start);
  assert.equal(view.button('Start sequence'),undefined);
  assert.match(view.html,/Sequence steps · 1 \/ 8 available/);
  for(const label of ['Left frontal lobe','Right frontal lobe','Left parietal lobe','Right parietal lobe'])assert(view.button(`${label} · unavailable`));
  assert.deepEqual(view.positions,[]);assert.deepEqual(view.selected,[]);
  start.props.onClick();assert.deepEqual(view.positions,[{sequenceId:'cerebral-lobes',conceptId:'cortex-left-temporal-lobe'}]);assert.equal(view.selected[0],entry);
 }
});

test('CT/MRI first-present start keeps its canonical label and exact same-study entry',()=>{
 for(const modality of ['CT','MRI'] as const){
  const entry={...midbrain,id:`${modality==='CT'?'cth':'mrb'}.bst.midbrain`};
  const view=fixture([entry],null,pin,'brainstem',modality);
  const start=view.button('Start sequence');assert(start&&!start.props.disabled);
  assert.equal(view.button('Start at step 1 · Midbrain'),undefined);
  assert.doesNotMatch(view.html,/Earlier steps are unavailable in this study/);
  assert.deepEqual(view.positions,[]);assert.deepEqual(view.selected,[]);
  start.props.onClick();assert.deepEqual(view.positions,[{sequenceId:'brainstem',conceptId:'brainstem-midbrain'}]);assert.equal(view.selected[0],entry);
 }
});

test('CT/MRI invalid earlier entry cannot replace a later valid start',()=>{
 for(const modality of ['CT','MRI'] as const){
  const prefix=modality==='CT'?'cth':'mrb';
  const invalid={...midbrain,id:`${prefix}.bst.midbrain`,label:'Altered midbrain'};
  const valid={...pons,id:`${prefix}.bst.pons`};
  const view=fixture([invalid,valid],null,pin,'brainstem',modality);
  const start=view.button('Start at step 2 · Pons');assert(start);
  assert(view.button('Midbrain · unavailable'));
  assert.deepEqual(view.positions,[]);assert.deepEqual(view.selected,[]);
  start.props.onClick();assert.deepEqual(view.positions,[{sequenceId:'brainstem',conceptId:'brainstem-pons'}]);assert.equal(view.selected[0],valid);
  assert.notEqual(view.selected[0],invalid);
  const stale=fixture([valid],null,'stale','brainstem',modality);
  const disabled=stale.button('Start sequence');assert(disabled&&disabled.props.disabled);
  assert.equal(stale.button('Start at step 2 · Pons'),undefined);
  disabled.props.onClick();assert.deepEqual(stale.positions,[]);assert.deepEqual(stale.selected,[]);
 }
});

test('actual cerebral guided panel keeps missing steps canonical and shows only its exact entry',()=>{
  const left:HeadEntry={id:'cth.ctx.frontal_lobe.left',label:'Left frontal lobe — regional mask',family:'ctx',laterality:'left',representation:'mask',color:[1,0,0],opacity:{fill:.2,outline:1}};
  const current=fixture([left],'cortex-left-frontal-lobe',pin,'cerebral-lobes');
  assert.match(current.html,/Step 1 \/ 8/);assert.match(current.html,/Left frontal lobe/);assert.match(current.html,/Sequence steps · 1 \/ 8 available/);
  current.button('Show this step')!.props.onClick();assert.equal(current.selected[0],left);
  current.redraw();current.button('Next')!.props.onClick();assert.deepEqual(current.positions,[{sequenceId:'cerebral-lobes',conceptId:'cortex-right-frontal-lobe'}]);assert.equal(current.selected.length,1);
  const missing=fixture([left],'cortex-right-frontal-lobe',pin,'cerebral-lobes');
  assert.match(missing.html,/Step 2 \/ 8/);assert.match(missing.html,/No other structure has been substituted/);
  assert.equal(missing.button('Show this step'),undefined);assert.equal(missing.button('Find this structure · quick check'),undefined);
  const mapped=learning.headLearningLinks({sequenceId:'cerebral-lobes',conceptId:'cortex-right-frontal-lobe'})!;
  assert(missing.html.includes(mapped.mriHref!.replaceAll('&','&amp;')));
  assert(missing.html.includes(mapped.atlasHref!.replaceAll('&','&amp;')));
  assert.doesNotMatch(missing.html,/Compare this step beside 3D/);
  assert.equal(current.button('Find this structure · quick check')!.props.disabled,true,'an anatomical label without a saved mask is not scored practice');
});

test('hippocampal endpoint and unopened cerebral tours record no completion or approval',()=>{
  const last=fixture([],'limbic-right-hippocampus',pin,'hippocampi');
  assert.match(last.html,/Step 2 \/ 2/);assert.equal(last.button('Next'),undefined);
  last.button('Finish sequence')!.props.onClick();assert.deepEqual(last.positions,[{sequenceId:'hippocampi',conceptId:null}]);assert.deepEqual(last.selected,[]);
  const unopened=fixture(null,'cortex-left-frontal-lobe',pin,'cerebral-lobes');assert.match(unopened.html,/resume this tour step/);assert.equal(unopened.button('Start sequence'),undefined);
});

test('MRI-only steps appear only in MRI, preserve missing slots and exclude scored quick checks',()=>{
  const amygdala:HeadEntry={id:'mrb.dgm.amygdala.left',label:'Left amygdala — regional mask',family:'dgm',laterality:'left',representation:'mask',color:[1,0,0],opacity:{fill:.2,outline:1}};
  const mri=fixture([amygdala],'limbic-left-amygdala',pin,'mri-amygdalae','MRI');
  assert.match(mri.html,/Step 1 \/ 2/);
  assert.match(mri.html,/Left amygdala/);
  assert.match(mri.html,/No exact CT comparison mapped/);
  assert.doesNotMatch(mri.html,/Continue this step on CT/);
  assert.match(mri.html,/excluded from scored practice/);
  assert.equal(mri.button('Find this structure · quick check')!.props.disabled,true);
  mri.button('Show this step')!.props.onClick();assert.equal(mri.selected[0],amygdala);
  mri.redraw();mri.button('Next')!.props.onClick();assert.deepEqual(mri.positions,[{sequenceId:'mri-amygdalae',conceptId:'limbic-right-amygdala'}]);
  const missing=fixture([amygdala],'limbic-right-amygdala',pin,'mri-amygdalae','MRI');
  assert.match(missing.html,/Step 2 \/ 2/);assert.match(missing.html,/No other structure has been substituted/);
  assert.equal(missing.button('Show this step'),undefined);
  const ct=fixture([amygdala],'limbic-left-amygdala',pin,'mri-amygdalae','CT');
  assert.doesNotMatch(ct.html,/<option value="mri-amygdalae"|Left amygdala|Right amygdala|Sequence steps|Compare in the 3D Atlas|Continue this step on|Find this structure · quick check/);
  assert.equal(ct.button('Show this step'),undefined);
  assert.equal(ct.button('Start sequence')?.props.disabled,true);
  assert.deepEqual(learning.headLearningSequencesForModality('CT').map(item=>item.id),[...learning.headLearningSequences.map(item=>item.id),'insulae','globes','ct-parietal-occipital','ct-nasal-ethmoid','cerebellar-orientation','ct-facial-coverage']);
});

test('cerebellar panel navigates exact native masks, offers practice and never invents a 3D destination',()=>{
 for(const modality of ['CT','MRI'] as const){
  const entries=headImageOnlyComparisonPacket().bindings.map((binding,index)=>({...binding[modality==='CT'?'ct':'mri'],family:'cer',color:[1,0,0],opacity:{fill:.2,outline:1},mask:{sha256:`synthetic-${index}`}} as HeadEntry));
  const first=fixture(entries,'cerebellum-left-hemisphere',pin,'cerebellar-orientation',modality);
  assert.match(first.html,/Step 1 \/ 3/);assert.match(first.html,/No exact 3D Atlas part is mapped/);
  assert.doesNotMatch(first.html,/href="[^"]*head-neck-3d/);
  const href=learning.headLearningLinks({sequenceId:'cerebellar-orientation',conceptId:'cerebellum-left-hemisphere'})![modality==='CT'?'mriHref':'ctHref'];
  const handoff=first.find(first.tree,node=>node.props.href===href);assert(handoff);assert.equal(handoff.props.prefetch,false);
  first.button('Next')!.props.onClick();assert.deepEqual(first.positions,[{sequenceId:'cerebellar-orientation',conceptId:'cerebellum-right-hemisphere'}]);assert.deepEqual(first.selected,[entries[1]]);
  first.redraw();first.button('Find this structure · quick check')!.props.onClick();assert.deepEqual(first.practised,[entries[0]]);
  first.redraw();first.button('Practise available steps')!.props.onClick();assert.deepEqual(first.sets,[entries]);
  const missing=fixture([entries[0],entries[2]],'cerebellum-right-hemisphere',pin,'cerebellar-orientation',modality);
  assert.match(missing.html,/Step 2 \/ 3/);assert.match(missing.html,/No other structure has been substituted/);
  assert.equal(missing.button('Show this step'),undefined);assert.equal(missing.button('Find this structure · quick check'),undefined);
  missing.button('Next')!.props.onClick();assert.deepEqual(missing.selected,[entries[2]]);
  const last=fixture(entries,'cerebellum-vermis',pin,'cerebellar-orientation',modality);
  last.button('Finish sequence')!.props.onClick();assert.deepEqual(last.positions,[{sequenceId:'cerebellar-orientation',conceptId:null}]);
 }
});

test('globe comparison uses exact side-specific CT and partial MRI steps without substituting unavailable anatomy',()=>{
  for(const modality of ['CT','MRI'] as const){
    const left:HeadEntry={id:`${modality==='CT'?'cth':'mrb'}.orb.globe.left`,label:'Left globe — regional mask',family:'orb',laterality:'left',representation:modality==='CT'?'mask':'partial-mask',color:[1,0,0],opacity:{fill:.2,outline:1}};
    const first=fixture([left],'orbit-left-globe',pin,'globes',modality);
    assert.match(first.html,/Step 1 \/ 2/);assert.match(first.html,/Sequence steps · 1 \/ 2 available/);
    first.button('Show this step')!.props.onClick();assert.equal(first.selected[0],left);
    first.redraw();first.button('Next')!.props.onClick();assert.deepEqual(first.positions,[{sequenceId:'globes',conceptId:'orbit-right-globe'}]);
    const second=fixture([left],'orbit-right-globe',pin,'globes',modality);
    assert.match(second.html,/Step 2 \/ 2/);assert.match(second.html,/No other structure has been substituted/);
    assert.equal(second.button('Show this step'),undefined);
    assert.equal(second.button('Find this structure · quick check'),undefined);
    second.button('Finish sequence')!.props.onClick();assert.deepEqual(second.positions,[{sequenceId:'globes',conceptId:null}]);
    assert.equal(first.button('Find this structure · quick check')!.props.disabled,true);
  }
});

test('insula comparison uses two exact CT or partial MRI steps and preserves unavailable slots',()=>{
  for(const modality of ['CT','MRI'] as const){
    const left:HeadEntry={id:`${modality==='CT'?'cth':'mrb'}.ctx.insula.left`,label:'Left insula — regional mask',family:'ctx',laterality:'left',representation:modality==='CT'?'mask':'partial-mask',color:[1,0,0],opacity:{fill:.2,outline:1}};
    const first=fixture([left],'cortex-left-insula',pin,'insulae',modality);
    assert.match(first.html,/Step 1 \/ 2/);assert.match(first.html,/Sequence steps · 1 \/ 2 available/);
    first.button('Show this step')!.props.onClick();assert.equal(first.selected[0],left);
    first.redraw();first.button('Next')!.props.onClick();assert.deepEqual(first.positions,[{sequenceId:'insulae',conceptId:'cortex-right-insula'}]);
    const second=fixture([left],'cortex-right-insula',pin,'insulae',modality);
    assert.match(second.html,/Step 2 \/ 2/);assert.match(second.html,/No other structure has been substituted/);
    assert.equal(second.button('Show this step'),undefined);
    assert.equal(second.button('Find this structure · quick check'),undefined);
    second.button('Finish sequence')!.props.onClick();assert.deepEqual(second.positions,[{sequenceId:'insulae',conceptId:null}]);
    assert.equal(first.button('Find this structure · quick check')!.props.disabled,true);
  }
});
