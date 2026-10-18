import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {headAtlasConceptOptions,headConceptById,headConceptFromAtlasQuery,HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {headLearningSequences} from '../lib/head-atlas-learning.ts';
import {headImageHref} from '../lib/head-atlas-navigation.ts';
import * as links from '../lib/head-atlas-links.ts';
import * as learning from '../lib/head-atlas-learning.ts';
import {atlasStudySuffix} from '../lib/atlas-study-transport.ts';
import * as lectureLinks from '../lib/lecture-related-links.ts';
import * as resourceStatus from '../components/LearningResourceStatus.ts';

const require=createRequire(import.meta.url),destinations:string[]=[];
const pickerSource=readFileSync(new URL('../components/HeadAtlasLearningPicker.tsx',import.meta.url),'utf8');
const pickerCode=ts.transpileModule(pickerSource,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const picker={exports:{} as {HeadAtlasLearningPicker:(props:{sequenceId?:string})=>React.ReactElement}};
new Function('require','module','exports',pickerCode)((id:string)=>id==='next/navigation'?{useRouter:()=>({push:(href:string)=>destinations.push(href)})}:id==='../lib/head-atlas-learning'?learning:id==='../lib/head-atlas-links'?links:require(id),picker,picker.exports);
const source=readFileSync(new URL('../components/HeadAtlasComparisonNavigation.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const mod={exports:{} as {HeadAtlasComparisonNavigation:(props:{conceptId:string|null;liveState?:'connecting'|'ready'|'practice'|'guided'|'unavailable';onRetry?:()=>void})=>React.ReactElement}};
new Function('require','module','exports',compiled)((id:string)=>id==='next/navigation'?{useRouter:()=>({push:(href:string)=>destinations.push(href)})}:id==='../lib/head-atlas-links'?links:id==='../lib/lecture-related-links'?lectureLinks:id==='./HeadAtlasLearningPicker'?picker.exports:id==='./LearningResourceStatus.ts'?resourceStatus:require(id),mod,mod.exports);
const render=(conceptId:string|null)=>renderToStaticMarkup(React.createElement(mod.exports.HeadAtlasComparisonNavigation,{conceptId}));
const renderLive=(conceptId:string|null,liveState:'connecting'|'ready'|'practice'|'guided'|'unavailable')=>renderToStaticMarkup(React.createElement(mod.exports.HeadAtlasComparisonNavigation,{conceptId,liveState}));
type Node={type:unknown;props:Record<string,any>};
function walk(value:unknown,accept:(node:Node)=>boolean):Node|undefined{
  if(Array.isArray(value)){for(const child of value){const found=walk(child,accept);if(found)return found;}return;}
  if(!value||typeof value!=='object'||!('props'in value))return;
  const node=value as Node;return accept(node)?node:walk(node.props.children,accept);
}
function submit(form:Node,value:string|null){
  let prevented=false;
  form.props.onSubmit({preventDefault(){prevented=true;},currentTarget:{elements:{namedItem(name:string){assert.equal(name,'head-comparison');return value===null?null:{value};}}}});
  assert.equal(prevented,true);
}

test('failed comparison offers an error-only retry and keeps keyboard focus in its persistent section',()=>{
  let retries=0,focus=0;
  for(const liveState of ['ready','connecting','practice','guided','unavailable'] as const){
    const tree=mod.exports.HeadAtlasComparisonNavigation({conceptId:'brainstem-pons',liveState,onRetry:()=>{retries++;}});
    const retry=walk(tree,node=>node.type==='button'&&node.props.children==='Retry comparison');
    if(liveState!=='unavailable'){assert.equal(retry,undefined);continue;}
    assert(retry);assert.equal(retry.props.type,'button');
    assert.equal((tree as Node).props.tabIndex,-1);
    retry.props.onClick({currentTarget:{closest:(selector:string)=>{assert.equal(selector,'section');return{focus:()=>{focus++;}};}}});
    assert.equal(retries,1);assert.equal(focus,1);
    const html=renderToStaticMarkup(tree);assert.match(html,/Retry comparison/);assert.match(html,/without reloading the model/);
    assert.match(html,/head-atlas-comparison-recovery/);assert.match(html,/If the model requests sign-in, sign in first/);
    assert.doesNotMatch(html,/<form|<select|Open in model/);
    assert(!html.includes('Compare Pons on CT'));assert(!html.includes('Compare Pons on MRI'));
  }
});

test('option list contains exactly forty-two source-bound concept IDs and fresh values',()=>{
  const options=headAtlasConceptOptions();
  const expected=[...headLearningSequences.flatMap(sequence=>sequence.concepts),
    ...['left','right'].flatMap(side=>['frontal','parietal','temporal','occipital'].map(lobe=>`cortex-${side}-${lobe}-lobe`)),
    ...['left','right'].map(side=>`limbic-${side}-hippocampus`),
    'limbic-left-amygdala','limbic-right-amygdala','commissure-corpus-callosum','endocrine-pituitary-gland',
    'cortex-left-insula','cortex-right-insula','orbit-left-globe','orbit-right-globe',
    'bone-left-parietal','bone-right-parietal','bone-left-nasal','bone-right-nasal','bone-occipital','bone-ethmoid',
    'bone-left-zygomatic','bone-right-zygomatic','bone-mandible'];
  assert.equal(options.length,42);
  assert.deepEqual(new Set(options.map(option=>option.conceptId)),new Set(expected));
  assert.equal(new Set(options.map(option=>option.conceptId)).size,42);
  for(const option of options){
    const link=headConceptById(option.conceptId);assert(link);
    assert.equal(option.label,link.label);
    assert(link.atlasHref);
    const atlas=new URL(link.atlasHref,'https://atlas.invalid');
    assert.equal(atlas.pathname,'/atlas/head-neck-3d');
    assert.equal(headConceptFromAtlasQuery(atlas.searchParams)?.conceptId,option.conceptId);
    assert.equal(link.headRevision,HEAD_LINK_REVISION);
  }
  for(const invalid of ['','unknown','deep-left-thalamus-extra','javascript:alert(1)','https://other.test/','deep-middle-caudate'])
    assert(!options.some(option=>option.conceptId===invalid));
  const prior=options[0].label;
  options[0].label='Mutated test copy';
  assert.equal(headAtlasConceptOptions()[0].label,prior,'callers cannot mutate the canonical source list');
  assert.notEqual(headAtlasConceptOptions()[0],options[0],'fresh option objects');
});

test('focused comparisons expose their exact scope in a collapsed disclosure',()=>{
  for(const option of headAtlasConceptOptions()){
    const tree=mod.exports.HeadAtlasComparisonNavigation({conceptId:option.conceptId});
    const disclosure=walk(tree,node=>node.type==='details'&&walk(node,item=>item.type==='summary')?.props.children==='Comparison limits');assert(disclosure);
    assert.equal(disclosure.props.open,undefined);
    assert.equal(walk(disclosure,node=>node.type==='summary')?.props.children,'Comparison limits');
    assert.equal(walk(disclosure,node=>node.type==='p')?.props.children,headConceptById(option.conceptId)!.scopeNote);
  }
  for(const side of ['left','right'])assert.match(render(`cortex-${side}-insula`),/CT mask and partial MRI mask/);
  assert.doesNotMatch(render(null),/Comparison limits/);
  assert.doesNotMatch(render('unknown'),/Comparison limits/);
});

test('MRI-only picker choices expose only their exact MRI comparison and an explicit CT gap',()=>{
  for(const id of ['limbic-left-amygdala','limbic-right-amygdala','commissure-corpus-callosum','endocrine-pituitary-gland']){
    const link=headConceptById(id);assert(link);
    assert.equal(link.ctHref,undefined);
    assert.equal(link.mriHref,`/atlas/mri-head?concept=${id}`);
    const html=render(id);
    assert.match(html,/No exact CT comparison mapped/);
    assert(html.includes(`href="${headImageHref('MRI',id,null,HEAD_LINK_REVISION)!.replaceAll('&','&amp;')}"`));
    assert(!html.includes('href="undefined"'));
    assert(!html.includes(`/atlas/ct-head?concept=${id}`));
    assert(!html.includes(`Compare ${link.label} on CT`));
    assert(html.includes(`${link.label} · MRI only`));
    assert.equal((html.match(/<nav aria-label="Compare focused anatomy">[\s\S]*?<\/nav>/g)??[]).length,1);
  }
});

test('CT-only comparisons show partial-mask limits and never offer a phantom MRI route',()=>{
  for(const id of ['bone-left-parietal','bone-right-parietal','bone-left-nasal','bone-right-nasal','bone-occipital','bone-ethmoid']){
    const link=headConceptById(id)!;const html=render(id);
    assert(html.includes(`${link.label} · CT only`));
    assert(html.includes(`href="${headImageHref('CT',id,null,HEAD_LINK_REVISION)!.replaceAll('&','&amp;')}"`));
    assert.match(html,/No exact MRI comparison mapped/);
    assert.match(html,/regional portion, not the whole bone/);
    assert(!html.includes(`/atlas/mri-head?concept=${id}`));
    assert(!html.includes('href="undefined"'));
    for(const state of ['practice','guided','connecting','unavailable'] as const){
      const blocked=renderLive(id,state);assert(!blocked.includes(link.ctHref!));
      assert(!blocked.includes(' · CT only'));
    }
  }
});

test('actual picker renders generic state and navigates only after valid submitted canonical ID',()=>{
  destinations.length=0;
  const tree=mod.exports.HeadAtlasComparisonNavigation({conceptId:null}),form=walk(tree,node=>node.type==='form');assert(form);
  const select=walk(form,node=>node.type==='select');assert(select);
  assert.equal(select.props.name,'head-comparison');assert.equal(select.props.defaultValue,'');
  assert.equal(typeof select.props.onChange,'function','dropdown draft alone does not navigate');
  const button=walk(form,node=>node.type==='button');assert.equal(button?.props.children,'Open in model');
  const html=render(null);
  assert.match(html,/Linked anatomy/);assert.match(html,/Choose linked anatomy/);
  assert.match(html,/<summary>Linked tours<\/summary>/);
  assert.match(html,/<select[^>]*name="head-linked-tour"[^>]*required/);
  assert.match(html,/Learn this structure/);assert.doesNotMatch(html,/Comparison focus/);assert.match(html,/unregistered subjects/);
  assert(!html.includes('Compare Pons on CT'));assert(!html.includes('Compare Pons on MRI'));
  for(const invalid of [null,'','unknown','javascript:alert(1)','/atlas/head-neck-3d?concept=brainstem-pons','https://other.test/','deep-right-caudate&patientId=private'])submit(form,invalid);
  assert.deepEqual(destinations,[]);
  for(const option of headAtlasConceptOptions()){
    submit(form,option.conceptId);
    assert.equal(destinations.pop(),headConceptById(option.conceptId)!.atlasHref);
  }
});

test('live chooser keeps focus and a learner draft, follows pristine selections, and clears after blocking',()=>{
  destinations.length=0;
  const choice=(conceptId:string|null,liveState:'ready'|'practice'|'guided'|'unavailable'|'connecting'='ready')=>{
    const tree=mod.exports.HeadAtlasComparisonNavigation({conceptId,liveState});
    return {tree,form:walk(tree,node=>node.type==='form'),select:walk(tree,node=>node.type==='select')};
  };
  const pons=choice('brainstem-pons');assert(pons.form&&pons.select);
  assert.equal((pons.form as Node&{key:string|null}).key,null,'live updates must not remount the chooser');
  const element={value:'',dataset:{} as Record<string,string>,focused:true};
  pons.select.props.ref(element);
  assert.equal(element.value,'brainstem-pons');
  const thalamus=choice('deep-left-thalamus');assert(thalamus.form&&thalamus.select);
  thalamus.select.props.ref(element);
  assert.equal(element.value,'deep-left-thalamus','pristine chooser follows the live model');
  const unmapped=choice(null);assert(unmapped.select);
  unmapped.select.props.ref(element);
  assert.equal(element.value,'','pristine chooser clears when the model selection has no mapped concept');
  thalamus.select.props.ref(element);
  assert.equal(element.value,'deep-left-thalamus');
  element.value='bone-occipital';thalamus.select.props.onChange({currentTarget:element});
  assert.deepEqual(destinations,[],'editing the chooser must not navigate');
  const putamen=choice('deep-right-putamen');assert(putamen.form&&putamen.select);
  putamen.select.props.ref(element);
  assert.equal(element.value,'bone-occipital','learner choice survives a later model selection');
  assert.equal(element.focused,true,'the same select element retains keyboard focus');
  assert(renderToStaticMarkup(putamen.tree).includes(headConceptById('deep-right-putamen')!.ctHref!),
    'CT/MRI links still follow the live model');
  submit(putamen.form,element.value);
  assert.equal(destinations.pop(),headConceptById('bone-occipital')!.atlasHref);
  for(const state of ['practice','guided','unavailable','connecting'] as const){
    const blocked=choice('deep-right-putamen',state);
    assert.equal(blocked.form,undefined,`${state} removes the chooser and its draft`);
  }
  const restored=choice('brainstem-medulla');assert(restored.select);
  const fresh={value:'',dataset:{} as Record<string,string>};
  restored.select.props.ref(fresh);
  assert.equal(fresh.value,'brainstem-medulla','a newly mounted chooser starts from the current model');
});

test('CT/MRI links bind committed concept, not unsubmitted dropdown or live iframe selection',()=>{
  destinations.length=0;
  const current=mod.exports.HeadAtlasComparisonNavigation({conceptId:'brainstem-pons'});
  const form=walk(current,node=>node.type==='form');assert(form);
  const select=walk(form,node=>node.type==='select');assert.equal(select?.props.defaultValue,'brainstem-pons');
  const before=renderToStaticMarkup(current),pons=headConceptById('brainstem-pons')!;
  assert.match(before,/Learn this structure/);
  assert(before.includes('Compare Pons on CT'));assert(before.includes('Compare Pons on MRI'));
  assert(before.includes(pons.ctHref!));assert(before.includes(pons.mriHref!));
  assert(/selecting inside the model does not change these links/i.test(before));
  submit(form,'deep-right-thalamus');
  assert.equal(destinations.pop(),headConceptById('deep-right-thalamus')!.atlasHref);
  assert.equal(renderToStaticMarkup(current),before,'submitted draft cannot rewrite links without a new committed prop');
  const changed=render('deep-right-thalamus'),right=headConceptById('deep-right-thalamus')!;
  assert(changed.includes(right.ctHref!));assert(changed.includes(right.mriHref!));
  assert(!changed.includes(pons.ctHref!));
  for(const invalid of ['unknown','deep-left-thalamus-extra','https://other.test/']){
    const html=render(invalid);assert(!html.includes('Compare Pons on CT'));assert(!html.includes('Compare Pons on MRI'));
  }
  assert(!/postMessage|localStorage|sessionStorage|indexedDB|MutationObserver|iframe\.contentWindow|fetch\(/.test(source));
});

test('live selection shows mapped links only when ready and suppresses answers during practice and guided learning',()=>{
  const pons=headConceptById('brainstem-pons')!;
  const ready=renderLive(pons.conceptId,'ready');
  assert(ready.includes(pons.ctHref!));assert(ready.includes(pons.mriHref!));
  assert.match(ready,/Links follow the selected structure/);
  const empty=renderLive(null,'ready');assert.doesNotMatch(empty,/Compare Pons on CT|Comparison focus/);
  for(const state of ['connecting','practice','guided','unavailable'] as const){
    destinations.length=0;
    const tree=mod.exports.HeadAtlasComparisonNavigation({conceptId:pons.conceptId,liveState:state});
    assert.equal(walk(tree,node=>node.type==='form'),undefined,'unusable anatomy controls are absent rather than disabled');
    assert.equal(walk(tree,node=>node.type==='select'),undefined);
    assert.deepEqual(destinations,[]);
    const html=renderLive(pons.conceptId,state);
    assert(!html.includes(pons.ctHref!)&&!html.includes(pons.mriHref!));
    assert(!html.includes('<summary>Linked tours</summary>'));
    assert(!html.includes('Comparison limits'));
    assert.doesNotMatch(html,/>Linked anatomy<|Open in model/);
    assert.match(html,/role="status"/);
  }
  assert.match(renderLive(pons.conceptId,'practice'),/hidden during practice/);
  assert.match(renderLive(pons.conceptId,'guided'),/Finish the in-model guided sequence/);
});

test('actual head wrapper mounts live selection only outside a valid guided tour',async()=>{
  const wrapper=readFileSync(new URL('../app/atlas/head-neck-3d/page.tsx',import.meta.url),'utf8');
  const code=ts.transpileModule(wrapper,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const page={exports:{} as {default:(props:{searchParams:Promise<Record<string,string>>})=>Promise<React.ReactElement>}};
  const imports:Record<string,unknown>={
    'next/link':({children,...props}:React.PropsWithChildren<Record<string,unknown>>)=>React.createElement('a',props,children),
    'next/navigation':{notFound:()=>{throw Error('not-found');}},
    '../../../components/AtlasWorkspaceNavigation':{AtlasWorkspaceNavigation:()=>null},
    '../../../components/HeadAtlasGuidedModel':{HeadAtlasGuidedModel:function HeadAtlasGuidedModel(){return null;}},
    '../../../components/HeadAtlasLearningLibrary':{HeadAtlasLearningLibrary:function HeadAtlasLearningLibrary(){return null;}},
    '../../../components/HeadAtlasReferenceTeaching':{HeadAtlasReferenceTeaching:function HeadAtlasReferenceTeaching(){return null;}},
    '../../../components/HeadAtlasLinkedModel':{HeadAtlasLinkedModel:function HeadAtlasLinkedModel(){return React.createElement('div',{'data-live-model':true});}},
    '../../../public/atlas-runtime/head-neck/manifest.json':require('../public/atlas-runtime/head-neck/manifest.json'),
    '../../../lib/atlas-study-transport':{atlasStudySuffix},
    '../../../lib/head-atlas-links':links,
    '../../../lib/head-atlas-import':{HEAD_MANIFEST_SHA256:links.HEAD_LINK_REVISION},
    '../../../lib/head-atlas-learning':learning,
    '../shoulder-3d/shoulder-module.css':{},'./head-learning.css':{},
    'react/jsx-runtime':require('react/jsx-runtime'),
  };
  new Function('require','module','exports',code)((id:string)=>{assert(Object.hasOwn(imports,id),id);return imports[id];},page,page.exports);
  const components=(tree:React.ReactElement)=>({linked:walk(tree,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasLinkedModel'),guided:walk(tree,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasGuidedModel')});
  const generic=await page.exports.default({searchParams:Promise.resolve({})});
  assert.equal(walk(generic,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasReferenceTeaching'),undefined);
  assert.equal(components(generic).linked?.props.sourceRevision,require('../public/atlas-runtime/head-neck/manifest.json').sourceCommit);
  assert.equal(components(generic).linked?.props.src,'/atlas-runtime/head-neck/index.html?region=head-neck');
  assert(walk(components(generic).linked?.props.coverage,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasLearningLibrary'));
  assert.equal(components(generic).guided,undefined);
  const pons=headConceptById('brainstem-pons')!;
  const plain=await page.exports.default({searchParams:Promise.resolve(Object.fromEntries(new URL(pons.atlasHref,'https://atlas.invalid').searchParams))});
  assert.equal(walk(plain,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasReferenceTeaching'),undefined);
  assert(components(plain).linked?.props.src.includes('partSource='));assert.equal(components(plain).guided,undefined);
  const hippocampus=headConceptById('limbic-right-hippocampus')!;
  const cerebral=await page.exports.default({searchParams:Promise.resolve(Object.fromEntries(new URL(hippocampus.atlasHref,'https://atlas.invalid').searchParams))});
  assert(components(cerebral).linked?.props.src.includes('partSource='));
  const tour=learning.headLearningLinks({sequenceId:'brainstem',conceptId:'brainstem-pons'})!;
  assert(tour.atlasHref);
  const guided=await page.exports.default({searchParams:Promise.resolve(Object.fromEntries(new URL(tour.atlasHref,'https://atlas.invalid').searchParams))});
  assert.equal(walk(guided,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasReferenceTeaching'),undefined,'teaching is gated inside the confirmed-selection host');
  assert.equal(components(guided).guided?.props.initialHref,tour.atlasHref);
  assert.equal(components(guided).guided?.props.sourceRevision,require('../public/atlas-runtime/head-neck/manifest.json').sourceCommit);
  assert(walk(components(guided).guided?.props.coverage,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasLearningLibrary'));
  assert.equal(components(guided).linked,undefined);assert(components(guided).guided);
  assert(!wrapper.includes('<a href={concept.ctHref}'),'duplicate old plain comparison anchor removed');
  const staleParams=Object.fromEntries(new URL(pons.atlasHref,'https://atlas.invalid').searchParams);staleParams.partSource='f'.repeat(64);
  const stale=await page.exports.default({searchParams:Promise.resolve(staleParams)});
  assert.equal(walk(stale,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasReferenceTeaching'),undefined,'stale nested source cannot borrow teaching from a matching name');
  assert(components(stale).linked,'stale query still opens the generic model without borrowing a concept');
});
