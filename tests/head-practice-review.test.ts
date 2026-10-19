import assert from 'node:assert/strict';
import {headAnatomyCheckModule} from './head-anatomy-check-loader.ts';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {facialAwareRequire} from './head-facial-hook-loader.ts';
import {HEAD_LINK_REVISION,headAtlasConcept} from '../lib/head-atlas-links.ts';
import {headImageHref,parseHeadImageNavigation} from '../lib/head-atlas-navigation.ts';
import * as teaching from '../lib/head-atlas-teaching.ts';
import * as mriTeaching from '../lib/head-mri-only-teaching.ts';
import * as insulaTeaching from '../lib/head-insula-teaching.ts';
import * as orbitalTeaching from '../lib/head-orbital-teaching.ts';
import * as ctBoneTeaching from '../lib/head-ct-bone-teaching.ts';
import {headCerebellarTeachingForConcept} from '../lib/head-cerebellar-teaching.ts';
import {cerebellarClinicalForConcept} from '../lib/head-cerebellar-clinical.ts';
import {headImageConcept,headImageOnlyComparisonPacket} from '../lib/head-image-only-links.ts';
import type {HeadEntry} from '../lib/head-atlas-import.ts';
import type {HeadPracticeReviewItem} from '../lib/head-atlas-practice.ts';
import type {HeadLearningPosition} from '../lib/head-atlas-learning.ts';

const require=facialAwareRequire(createRequire(import.meta.url));
const teachingSource=readFileSync(new URL('../components/HeadAtlasTeaching.tsx',import.meta.url),'utf8');
const teachingCompilation=ts.transpileModule(teachingSource,{reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}});
assert.equal(teachingCompilation.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
const teachingLoaded={exports:{} as Record<string,unknown>};
new Function('require','module','exports',teachingCompilation.outputText)((name:string)=>name==='../lib/head-atlas-teaching'?teaching:name==='../lib/head-mri-only-teaching'?mriTeaching:name==='../lib/head-insula-teaching'?insulaTeaching:name==='../lib/head-orbital-teaching'?orbitalTeaching:name==='../lib/head-ct-bone-teaching'?ctBoneTeaching:name==='../lib/head-cerebellar-teaching'?require('../lib/head-cerebellar-teaching.ts'):name==='./HeadAnatomyCheck'?headAnatomyCheckModule:require(name),teachingLoaded,teachingLoaded.exports);
const source=readFileSync(new URL('../components/HeadAtlasPracticeReview.tsx',import.meta.url),'utf8');
const compilation=ts.transpileModule(source,{reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}});
assert.equal(compilation.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
type HookHost={values:unknown[];cursor:number};
let hookHost:HookHost|undefined;
const hooks={
  useState(initial:unknown){
    if(!hookHost)return [typeof initial==='function'?(initial as ()=>unknown)():initial,()=>{}];
    const host=hookHost,index=host.cursor++;
    if(index>=host.values.length)host.values.push(typeof initial==='function'?(initial as ()=>unknown)():initial);
    return [host.values[index],(next:unknown)=>{host.values[index]=typeof next==='function'?(next as (value:unknown)=>unknown)(host.values[index]):next;}];
  },
  useRef(initial:unknown){
    if(!hookHost)return {current:initial};
    const host=hookHost,index=host.cursor++;
    if(index>=host.values.length)host.values.push({current:initial});
    return host.values[index];
  },
};
const loaded={exports:{} as Record<string,unknown>};
new Function('require','module','exports',compilation.outputText)((name:string)=>{
  if(name==='react')return hooks;
  if(name==='../lib/head-atlas-display')return require('../lib/head-atlas-display.ts');
  if(name==='../lib/head-atlas-links')return require('../lib/head-atlas-links.ts');
  if(name==='../lib/head-atlas-navigation')return require('../lib/head-atlas-navigation.ts');
  if(name==='../lib/head-image-only-links')return require('../lib/head-image-only-links.ts');
  if(name==='../lib/head-practice-learning')return require('../lib/head-practice-learning.ts');
  if(name==='../lib/head-practice-review-filter')return require('../lib/head-practice-review-filter.ts');
  if(name==='../lib/head-study-set')return require('../lib/head-study-set.ts');
  if(name==='./HeadAtlasTeaching')return teachingLoaded.exports;
  return require(name);
},loaded,loaded.exports);
type Props={
  items:HeadPracticeReviewItem[];modality:'CT'|'MRI';revision:string;active:boolean;finished:boolean;label?:'Review original set'|'Review follow-up set';onReviewEntry?:(entry:HeadEntry)=>void;onReviewGuide?:(position:HeadLearningPosition,entry:HeadEntry)=>void;
};
const Review=loaded.exports.HeadAtlasPracticeReview as (props:Props)=>React.ReactElement|null;
const Feedback=loaded.exports.HeadAtlasPracticeFeedback as (props:{entry:HeadEntry|null;outcome:'correct'|'incorrect'|'revealed'|null;modality:'CT'|'MRI';revision:string;active:boolean;finished:boolean})=>React.ReactElement|null;

function entry(id:string,label:string,laterality='midline_or_unpaired',representation='partial-mask'):HeadEntry {
  return {id,label,family:'synthetic',laterality,representation,color:[1,0,0],opacity:{fill:.2,outline:.8}};
}
const pons=entry('cth.bst.pons','Pons — regional mask');
const left=entry('mrb.dgm.caudate_nucleus.left','Left caudate nucleus — regional mask','left','mask');
const unknown=entry('cth.synthetic.unknown','Synthetic unknown — regional mask');
const outcomes:HeadPracticeReviewItem[]=[
  {entry:pons,outcome:'correct'},
  {entry:unknown,outcome:'incorrect'},
  {entry:entry('cth.synthetic.revealed','Synthetic revealed — regional mask'),outcome:'revealed'},
  {entry:entry('cth.synthetic.unanswered','Synthetic unanswered — regional mask'),outcome:'unanswered'},
];
const base={items:outcomes,modality:'CT' as const,revision:HEAD_LINK_REVISION,active:false,finished:true};
const render=(changes:Partial<Props>={},onReviewEntry?:(entry:HeadEntry)=>void)=>renderToStaticMarkup(React.createElement(Review,{...base,...changes,onReviewEntry}));
const feedback=(changes:Partial<Parameters<typeof Feedback>[0]>={})=>renderToStaticMarkup(React.createElement(Feedback,{entry:pons,outcome:'incorrect',modality:'CT',revision:HEAD_LINK_REVISION,active:true,finished:false,...changes}));

test('cerebellar image-only feedback and completed review retain exact CT/MRI comparisons and native tour without inventing 3D',()=>{
  for(const binding of headImageOnlyComparisonPacket().bindings)for(const modality of ['CT','MRI'] as const){
    const native=binding[modality==='CT'?'ct':'mri'];
    const saved=entry(native.id,native.label,native.laterality,native.representation);
    const concept=headImageConcept(saved,modality)!;
    const otherHref=headImageHref(modality==='CT'?'MRI':'CT',concept.conceptId,null,HEAD_LINK_REVISION)!.replaceAll('&','&amp;');
    for(const outcome of ['correct','incorrect','revealed'] as const){
      for(const [index,html] of [feedback({entry:saved,modality,outcome}),render({items:[{entry:saved,outcome}],modality})].entries()){
        assert(html.includes(`href="${otherHref}"`),`${modality} ${binding.conceptId} ${outcome}`);
        assert.match(html,/No exact 3D part mapped/);
        assert(html.includes(concept.scopeNote));
        assert.doesNotMatch(html,/href="undefined"|Existing 3D Atlas|Compare in existing 3D|\/atlas\/head-neck-3d/);
        assert.match(html,/headTour=cerebellar-orientation/);
        const hasTeaching=index===0||outcome!=='correct';
        assert.equal(html.includes('class="head-teaching"'),hasTeaching);
        const teachingSources=headCerebellarTeachingForConcept(concept.conceptId,modality,HEAD_LINK_REVISION)!.sources;
        const clinicalSources=cerebellarClinicalForConcept(concept.conceptId,modality,HEAD_LINK_REVISION)!.sources;
        for(const cited of [...teachingSources,...clinicalSources])assert.equal(html.includes(`href="${cited.url.replaceAll('&','&amp;')}"`),hasTeaching,`source link ${cited.id}`);
        assert.equal((html.match(/<a\b/g)??[]).length,2+(hasTeaching?teachingSources.length+clinicalSources.length:0));
        assert.match(html,/target="_blank" rel="noopener noreferrer"/);
        assert.doesNotMatch(html,/<details[^>]*\sopen(?:\s|=|>)/);
      }
    }
    const unanswered=render({items:[{entry:saved,outcome:'unanswered'}],modality});
    assert(unanswered.includes(`href="${otherHref}"`));assert.match(unanswered,/Unanswered/);
    for(const changes of [{entry:{...saved,id:saved.id+'.copy'}},{entry:{...saved,label:saved.label+' changed'}},{entry:{...saved,laterality:'other'}},{entry:{...saved,representation:'point'}},{entry:saved,revision:'stale'},{entry:saved,modality:modality==='CT'?'MRI' as const:'CT' as const}]){
      assert.equal(feedback({modality,...changes}),'');
      const html=render({items:[{entry:changes.entry,outcome:'incorrect'}],modality,...('revision' in changes?{revision:changes.revision}:{}),...('modality' in changes?{modality:changes.modality}:{})});
      assert.match(html,/Incorrect first attempt/);assert.doesNotMatch(html,/<a\b|No exact 3D part mapped/);
    }
    for(const changes of [{outcome:null},{active:false},{finished:true}])assert.equal(feedback({entry:saved,modality,...changes}),'');
    for(const changes of [{active:true},{finished:false}])assert.equal(render({items:[{entry:saved,outcome:'incorrect'}],modality,...changes}),'');
  }
});

test('post-answer learning is collapsed for every feedback outcome and keeps comparisons in separate tabs',()=>{
  for(const outcome of ['correct','incorrect','revealed'] as const){
    const html=feedback({outcome}),concept=headAtlasConcept(pons,'CT')!;
    assert.match(html,/^<details class="head-practice-review head-practice-feedback-learning"><summary>Learn &amp; compare this structure/);
    assert.doesNotMatch(html,/<details[^>]*\sopen(?:\s|=|>)/);
    assert(html.includes(concept.atlasHref.replaceAll('&','&amp;')));
    assert(html.includes(headImageHref('MRI',concept.conceptId,null,HEAD_LINK_REVISION)!.replaceAll('&','&amp;')));
    assert.match(html,/MRI anatomy \(new tab\)/);
    assert.match(html,/separate, unregistered subjects/);
    assert.match(html,/first-attempt score stays unchanged/);
    assert.match(html,/Guided learning: Brainstem orientation \(new tab\)/);
    assert.match(html,/headTour=brainstem&amp;headStep=1&amp;headRevision=/);
    assert.match(html,/Learn this anatomy · Draft/);
    assert.match(html,/awaiting radiologist review/);
    for(const anchor of html.matchAll(/<a\b[^>]+>/g))assert.match(anchor[0],/target="_blank" rel="noopener noreferrer"/);
    assert.doesNotMatch(html,/<iframe/);
    assert.equal((html.match(/<button/g)??[]).length,1,'only the separate collapsed anatomy check has a button');
    assert.match(html,/<button type="submit" disabled="">Check answer<\/button>/);
  }
});

test('post-answer learning refuses pending, retired, unknown, stale and mismatched identities',()=>{
  for(const changes of [
    {outcome:null},{outcome:'unanswered' as never},{active:false},{finished:true},{entry:null},
    {revision:'stale'},{entry:unknown},{modality:'MRI' as const},
    {entry:{...pons,laterality:'left'}},{entry:{...pons,label:'Different structure'}},
    {entry:{...pons,representation:'point'}},
  ])assert.equal(feedback(changes),'',JSON.stringify(changes));
});

test('MRI-only feedback has 3D comparison and teaching without inventing a CT counterpart',()=>{
  const amygdala=entry('mrb.dgm.amygdala.left','Left amygdala — regional mask','left','mask');
  const html=feedback({entry:amygdala,modality:'MRI',outcome:'revealed'});
  assert.match(html,/Existing 3D Atlas \(new tab\)/);
  assert.match(html,/Learn this anatomy · Draft/);
  assert.doesNotMatch(html,/CT anatomy|\/atlas\/ct-head/);
});

test('insula and orbital feedback reuse their existing reviewed-source draft notes',()=>{
  for(const modality of ['CT','MRI'] as const)for(const side of ['left','right'])for(const [family,name] of [['ctx','insula'],['orb','globe']]){
    const label=`${side==='left'?'Left':'Right'} ${name} — regional mask`;
    const html=feedback({entry:entry(`${modality==='CT'?'cth':'mrb'}.${family}.${name}.${side}`,label,side,modality==='MRI'?'partial-mask':'mask'),modality});
    assert.match(html,/Learn this anatomy · Draft/);assert.match(html,/References &amp; review revision/);
    assert.match(html,/Existing 3D Atlas \(new tab\)/);
  }
});
function linkedEntry(conceptId:string,modality:'CT'|'MRI'):HeadEntry {
  const prefix=modality==='CT'?'cth':'mrb';
  if(conceptId.startsWith('brainstem-')){
    const name=conceptId.slice(10),part=name==='medulla'?'medulla_oblongata':name;
    return entry(`${prefix}.bst.${part}`,`${name==='medulla'?'Medulla oblongata':name[0].toUpperCase()+name.slice(1)} — regional mask`);
  }
  if(conceptId.startsWith('ventricle-')){
    const name=conceptId.slice(10),part=name==='left-lateral'?'lateral_ventricle.left':name==='right-lateral'?'lateral_ventricle.right':`${name}_ventricle`;
    const label=name==='left-lateral'?'Left lateral ventricle':name==='right-lateral'?'Right lateral ventricle':`${name[0].toUpperCase()+name.slice(1)} ventricle`;
    return entry(`${prefix}.vnt.${part}`,`${label} — regional mask`,name==='left-lateral'?'left':name==='right-lateral'?'right':'midline_or_unpaired','mask');
  }
  const [,side,...parts]=conceptId.split('-'),name=parts.join('-');
  const labelSide=side==='left'?'Left':'Right';
  if(conceptId.startsWith('deep-')){
    const title=name==='caudate'?'caudate nucleus':name.replaceAll('-',' ');
    return entry(`${prefix}.dgm.${name==='caudate'?'caudate_nucleus':name.replaceAll('-','_')}.${side}`,`${labelSide} ${title} — regional mask`,side,'mask');
  }
  if(conceptId.startsWith('cortex-')){
    const lobe=name.slice(0,-5);
    return entry(`${prefix}.ctx.${lobe}_lobe.${side}`,`${labelSide} ${lobe} lobe — regional mask`,side,'mask');
  }
  return entry(`${prefix}.dgm.hippocampus.${side}`,`${labelSide} hippocampus — regional mask`,side,'mask');
}

test('completed review is collapsed, ordered, and gives explicit first-attempt outcomes',()=>{
  const html=render();
  assert.match(html,/^<details class="head-practice-review"><summary>Review this set<\/summary>/);
  assert.doesNotMatch(html,/<details[^>]*\sopen(?:\s|=|>)/);
  for(const text of ['Pons — Correct first attempt','Synthetic unknown — Incorrect first attempt','Synthetic revealed — Answer revealed','Synthetic unanswered — Unanswered'])assert.match(html,new RegExp(text));
  const positions=['Pons — Correct','Synthetic unknown — Incorrect','Synthetic revealed — Answer','Synthetic unanswered — Unanswered'].map(text=>html.indexOf(text));
  assert.deepEqual([...positions].sort((a,b)=>a-b),positions);
  assert.match(html,/retries do not replace them/);
  assert.match(html,/part of a structure/);
  assert.match(html,/separate, unregistered subjects/);
  assert.match(html,/3 to revisit · 1 correct first attempts/);
  assert.match(html,/opening them does not change your score/);
  assert.doesNotMatch(html,/Review on this scan/);
});

test('original and follow-up reviews use separate collapsed labels and independent outcomes',()=>{
  const original=render({items:[{entry:pons,outcome:'incorrect'},{entry:unknown,outcome:'correct'}],label:'Review original set'});
  const followup=render({items:[{entry:pons,outcome:'correct'}],label:'Review follow-up set'});
  assert.match(original,/^<details class="head-practice-review"><summary>Review original set<\/summary>/);
  assert.match(followup,/^<details class="head-practice-review"><summary>Review follow-up set<\/summary>/);
  assert.match(original,/Pons — Incorrect first attempt/);
  assert.match(followup,/Pons — Correct first attempt/);
  assert.match(original,/Synthetic unknown — Correct first attempt/);
  assert.doesNotMatch(followup,/Synthetic unknown/);
  assert.equal(render({active:true,label:'Review original set'}),'');
  assert.equal(render({finished:false,label:'Review follow-up set'}),'');
});

test('pending, unfinished, and empty sets reveal no names or actions',()=>{
  for(const changes of [{active:true},{finished:false},{items:[]}]){
    const html=render(changes,()=>{});
    assert.equal(html,'');
  }
});

test('links are exact, source pinned, and safe for CT, MRI, 3D, and laterality',()=>{
  const ct=headAtlasConcept(pons,'CT')!;
  const ctHtml=render({items:[{entry:pons,outcome:'correct'}]});
  assert.ok(ctHtml.includes(`href="${ct.atlasHref.replaceAll('&','&amp;')}"`));
  assert.ok(ctHtml.includes(`href="${headImageHref('MRI',ct.conceptId,null,HEAD_LINK_REVISION)!.replaceAll('&','&amp;')}"`));
  assert.doesNotMatch(ctHtml,/href="\/atlas\/ct-head/);
  assert.equal((ctHtml.match(/target="_blank" rel="noopener noreferrer"/g)??[]).length,3);
  const mri=headAtlasConcept(left,'MRI')!;
  const mriHtml=render({items:[{entry:left,outcome:'incorrect'}],modality:'MRI'});
  assert.ok(mriHtml.includes(`href="${mri.atlasHref.replaceAll('&','&amp;')}"`));
  assert.ok(mriHtml.includes(`href="${headImageHref('CT',mri.conceptId,null,HEAD_LINK_REVISION)!.replaceAll('&','&amp;')}"`));
  assert.doesNotMatch(mriHtml,/href="\/atlas\/mri-head/);
  assert.equal((mriHtml.match(/<nav aria-label="Compare [^"]+">[\s\S]*?<\/nav>/g)??[]).length,1);
  assert.equal((mriHtml.match(/>Compare in existing 3D<|>Compare on CT</g)??[]).length,2);
  assert.ok(mriHtml.includes(teaching.HEAD_TEACHING_REVISION));
  assert.ok(mriHtml.includes('Learn this anatomy · Draft'));
  assert.ok(mriHtml.includes('MRI · reading the image'));
});

test('every scan link in feedback and completed review carries its exact revision and target',()=>{
  for(const modality of ['CT','MRI'] as const){
    for(const conceptId of ['brainstem-midbrain','brainstem-pons','brainstem-medulla','ventricle-left-lateral','ventricle-right-lateral','ventricle-third','ventricle-fourth','deep-left-caudate','deep-right-thalamus','cortex-left-frontal-lobe','cortex-right-temporal-lobe']){
      const saved=linkedEntry(conceptId,modality),other=modality==='CT'?'MRI':'CT';
      for(const html of [feedback({entry:saved,modality}),render({items:[{entry:saved,outcome:'incorrect'}],modality})]){
        const hrefs=[...html.matchAll(/href="(\/atlas\/(?:ct|mri)-head\?[^"]+)"/g)].map(match=>match[1].replaceAll('&amp;','&'));
        assert(hrefs.length>0,`${modality} ${conceptId} has a scan comparison`);
        for(const href of hrefs){
          const url=new URL(href,'http://example.test');
          assert.equal(url.searchParams.get('headRevision'),HEAD_LINK_REVISION);
          const targetModality=url.pathname==='/atlas/ct-head'?'CT':'MRI';
          const parsed=parseHeadImageNavigation(url.searchParams,HEAD_LINK_REVISION,targetModality);
          assert.equal(parsed.invalid,false);assert.equal(parsed.conceptId,conceptId);
          if(!parsed.position){assert.equal(targetModality,other);assert.deepEqual([...url.searchParams.keys()],['concept','headRevision']);}
        }
      }
    }
  }
});

test('stale revision and unmapped or altered source show outcomes without compare links',()=>{
  for(const changes of [
    {revision:'stale',items:[{entry:pons,outcome:'correct' as const}]},
    {items:[{entry:unknown,outcome:'incorrect' as const}]},
    {items:[{entry:{...pons,laterality:'right'},outcome:'revealed' as const}]},
  ]){
    const html=render(changes);
    assert.match(html,/Review this set/);
    assert.doesNotMatch(html,/<a\s|<nav\s/);
  }
});

test('all twenty-five exact CT and MRI concepts show draft teaching only for non-correct outcomes',()=>{
  assert.equal(teaching.headTeachingContent.notes.length,25);
  for(const modality of ['CT','MRI'] as const)for(const note of teaching.headTeachingContent.notes){
    const saved=linkedEntry(note.conceptId,modality),concept=headAtlasConcept(saved,modality);
    assert.ok(concept,`${modality} ${note.conceptId} fixture must match exact source identity`);
    for(const outcome of ['incorrect','revealed','unanswered'] as const){
      const html=render({items:[{entry:saved,outcome}],modality});
      const value=teaching.headTeachingForConcept(note.conceptId,modality);assert(value);
      assert.equal((html.match(/<details class="head-teaching">/g)??[]).length,1);
      assert(html.includes(value.note.anatomy.text));
      assert(html.includes(value.note.function.text));
      assert(html.includes(value.imaging.text));
      assert(html.includes(value.scope));
      assert(html.includes(teaching.HEAD_TEACHING_REVISION));
      assert.match(html,/awaiting radiologist review/);
      assert.equal((html.match(/<nav aria-label="Compare [^"]+">/g)??[]).length,1);
      assert.equal((html.match(/>Compare in existing 3D<|>Compare on (?:CT|MRI)</g)??[]).length,2);
      for(const reference of value.sources)assert(html.includes(`href="${reference.url}"`));
    }
    const correct=render({items:[{entry:saved,outcome:'correct'}],modality});
    assert.doesNotMatch(correct,/head-teaching|Learn this anatomy|References &amp; review revision/);
    assert.match(correct,/1 correct first attempts/);
    assert.match(correct,/0 to revisit/);
  }
});

test('completed MRI-only practice can disclose a draft note without exposing active answers',()=>{
  const saved=entry('mrb.dgm.amygdala.left','Left amygdala — regional mask','left','mask');
  const completed=render({items:[{entry:saved,outcome:'incorrect'}],modality:'MRI'});
  assert(completed.includes(mriTeaching.HEAD_MRI_ONLY_TEACHING_REVISION));
  assert(completed.includes(mriTeaching.headMriOnlyTeachingContent.notes[0].imaging.text));
  assert(!completed.includes('href="undefined"'));assert(!completed.includes('/atlas/ct-head?concept=limbic-left-amygdala'));
  assert.equal(render({items:[{entry:saved,outcome:'incorrect'}],modality:'MRI',active:true}),'');
  assert.equal(render({items:[{entry:saved,outcome:'incorrect'}],modality:'MRI',finished:false}),'');
  assert.equal(render({items:[{entry:saved,outcome:'incorrect'}],modality:'MRI',revision:'stale'}).includes('head-teaching'),false);
  assert.equal(render({items:[{entry:saved,outcome:'incorrect'}],modality:'CT'}).includes('head-teaching'),false);
});

test('teaching refuses stale, unknown, altered, and wrong-modality review entries without losing outcomes',()=>{
  for(const [saved,modality,revision] of [
    [pons,'CT','stale'],[unknown,'CT',HEAD_LINK_REVISION],
    [{...pons,label:'Wrong pons — regional mask'},'CT',HEAD_LINK_REVISION],
    [{...pons,laterality:'right'},'CT',HEAD_LINK_REVISION],
    [{...pons,representation:'mask'},'CT',HEAD_LINK_REVISION],
    [pons,'MRI',HEAD_LINK_REVISION],
    [{...linkedEntry('cortex-left-frontal-lobe','CT'),laterality:'right'},'CT',HEAD_LINK_REVISION],
    [{...linkedEntry('limbic-left-hippocampus','MRI'),id:'mrb.dgm.hippocampus.right'},'MRI',HEAD_LINK_REVISION],
  ] as Array<[HeadEntry,'CT'|'MRI',string]>){
    const html=render({items:[{entry:saved,outcome:'incorrect'}],modality,revision});
    assert.match(html,/Incorrect first attempt/);
    assert.doesNotMatch(html,/head-teaching|Learn this anatomy|References &amp; review revision|<nav aria-label="Compare/);
  }
  for(const changes of [{active:true},{finished:false},{items:[]}])assert.equal(render(changes),'');
});

test('the scan callback receives the exact current entry and adds no persistence',()=>{
  function findButton(node:unknown):React.ReactElement<{onClick:()=>void;'aria-label':string}>|undefined {
    if(!React.isValidElement(node))return;
    if(node.type==='button'&&(node.props as {'aria-label'?:string})['aria-label'])return node as React.ReactElement<{onClick:()=>void;'aria-label':string}>;
    return React.Children.toArray((node.props as {children?:React.ReactNode}).children).map(findButton).find(Boolean);
  }
  for(const [saved,outcome,modality] of [[pons,'correct','CT'],[linkedEntry('cortex-left-frontal-lobe','CT'),'incorrect','CT'],
    [linkedEntry('limbic-right-hippocampus','MRI'),'revealed','MRI'],[left,'unanswered','MRI']] as Array<[HeadEntry,HeadPracticeReviewItem['outcome'],'CT'|'MRI']>){
    let received:HeadEntry|undefined;
    const tree=Review({...base,items:[{entry:saved,outcome}],modality,onReviewEntry:value=>{received=value;}});
    const button=findButton(tree);assert.ok(button);
    assert.equal(button.props['aria-label'],`Review ${saved.label.replace(' — regional mask','')} on this scan`);
    button.props.onClick();
    assert.equal(received,saved);
  }
  assert.doesNotMatch(source+'\n'+teachingSource,/localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|postMessage/);
});

test('completed mapped review opens its exact guided step on this scan only when requested',()=>{
  function guideButton(node:unknown):React.ReactElement<{onClick:()=>void}>|undefined {
    if(!React.isValidElement(node))return;
    if(node.type==='button'&&React.Children.toArray((node.props as {children?:React.ReactNode}).children).join('').startsWith('Learn on this scan:'))return node as React.ReactElement<{onClick:()=>void}>;
    return React.Children.toArray((node.props as {children?:React.ReactNode}).children).map(guideButton).find(Boolean);
  }
  const calls:Array<{position:HeadLearningPosition;entry:HeadEntry}>=[];
  const callback:Props['onReviewGuide']=(position,entry)=>calls.push({position,entry});
  for(const outcome of ['correct','incorrect','revealed','unanswered'] as const){
    const props={...base,items:[{entry:pons,outcome}],onReviewGuide:callback};
    const button=guideButton(Review(props));assert(button);
    button.props.onClick();
    assert.deepEqual(calls.at(-1),{position:{sequenceId:'brainstem',conceptId:'brainstem-pons'},entry:pons});
    const html=render(props);
    assert.match(html,/Learn on this scan: Brainstem orientation/);
    assert.match(html,/Guided learning: Brainstem orientation \(new tab\)/);
    assert.match(html,/Compare in existing 3D/);
  }
  assert.equal(calls.length,4);
  for(const changes of [
    {active:true},{finished:false},{revision:'stale'},
    {items:[{entry:unknown,outcome:'incorrect' as const}]},
    {items:[{entry:{...pons,label:'Different structure'},outcome:'incorrect' as const}]},
  ]){
    assert.equal(guideButton(Review({...base,...changes,onReviewGuide:callback})),undefined);
    assert.doesNotMatch(render({...changes,onReviewGuide:callback}),/Learn on this scan:/);
  }
  assert.equal(guideButton(Review({...base,onReviewGuide:undefined})),undefined);
  assert.doesNotMatch(feedback(),/Learn on this scan:/);
});

test('completed review filters interact independently, preserve original numbering and reset on replacement',()=>{
  function all(node:unknown):React.ReactElement[] {
    if(!React.isValidElement(node))return [];
    return [node,...React.Children.toArray((node.props as {children?:React.ReactNode}).children).flatMap(all)];
  }
  function draw(host:HookHost,props:Props){
    host.cursor=0;hookHost=host;
    try{return Review(props);}finally{hookHost=undefined;}
  }
  function list(tree:unknown){return all(tree).filter(node=>node.type==='li');}
  function control(tree:unknown,type:string){const node=all(tree).find(value=>value.type===type);assert(node);return node as React.ReactElement<Record<string,unknown>>;}
  const original:HookHost={values:[],cursor:0},followup:HookHost={values:[],cursor:0};
  const originalProps={...base,label:'Review original set' as const,onReviewEntry:(value:HeadEntry)=>calls.push(value)};
  const calls:HeadEntry[]=[];
  let tree=draw(original,originalProps);
  assert.equal(list(tree).length,4);
  (control(tree,'input').props.onChange as (event:{currentTarget:{value:string}})=>void)({currentTarget:{value:'synthetic unknown'}});
  tree=draw(original,originalProps);
  assert.deepEqual(list(tree).map(node=>(node.props as {value:number}).value),[2]);
  const reviewButton=all(tree).find(node=>node.type==='button'&&(node.props as {children?:string}).children==='Review on this scan');assert(reviewButton);
  (reviewButton.props as {onClick:()=>void}).onClick();assert.equal(calls[0],unknown);
  (control(tree,'select').props.onChange as (event:{currentTarget:{value:string}})=>void)({currentTarget:{value:'correct'}});
  tree=draw(original,originalProps);assert.equal(list(tree).length,0);
  assert.equal(list(draw(followup,{...base,label:'Review follow-up set'})).length,4);
  const search=control(tree,'input');let focused=false;
  (search.props.ref as {current:{focus:()=>void}|null}).current={focus:()=>{focused=true;}};
  const clear=all(tree).find(node=>node.type==='button'&&(node.props as {children?:string}).children==='Clear filters');assert(clear);
  (clear.props as {onClick:()=>void}).onClick();assert(focused);
  tree=draw(original,originalProps);assert.equal(list(tree).length,4);
  (control(tree,'input').props.onChange as (event:{currentTarget:{value:string}})=>void)({currentTarget:{value:'pons'}});
  const replaced={...originalProps,items:[{entry:left,outcome:'revealed' as const}]};
  tree=draw(original,replaced);assert.deepEqual(list(tree).map(node=>(node.props as {value:number}).value),[1]);
  assert.equal(control(tree,'input').props.value,'');
  assert.equal(draw(original,{...replaced,active:true}),null);
  assert.equal(draw(original,{...replaced,finished:false}),null);
});
