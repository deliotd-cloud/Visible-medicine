import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {facialAwareRequire} from './head-facial-hook-loader.ts';
import * as links from '../lib/head-atlas-links.ts';
import * as teaching from '../lib/head-mri-only-teaching.ts';
import * as questions from '../lib/head-mri-anatomy-checks.ts';
import {HEAD_ANATOMY_CHECK_REVISION,headAnatomyCheckContent} from '../lib/head-anatomy-checks.ts';
import {headImageHref} from '../lib/head-atlas-navigation.ts';
import {headReviewImageLinkModule} from './head-review-image-link-loader.ts';

const require=facialAwareRequire(createRequire(import.meta.url));
const ids=['limbic-left-amygdala','limbic-right-amygdala','commissure-corpus-callosum','endocrine-pituitary-gland'];
const content=questions.headMriAnatomyCheckContent;
const sha=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const escaped=(value:string)=>value.replaceAll('&','&amp;').replaceAll("'",'&#x27;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const render=(Component:React.ComponentType<any>,props:Record<string,unknown>)=>renderToStaticMarkup(React.createElement(Component,props));
function compile(path:string,imports:Record<string,unknown>={}){
  const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{
    compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  }).outputText;
  const mod={exports:{} as Record<string,any>};
  new Function('require','module','exports',code)((name:string)=>imports[name]??(
    name==='./HeadAnatomyCheck'?compile('../components/HeadAnatomyCheck.tsx'):
    name==='./HeadReviewImageLink'?headReviewImageLinkModule:
    path.startsWith('../lib/')&&name.startsWith('./head-')?require('../lib/'+name.slice(2).replace(/\.ts$/,'')+'.ts'):
    name.startsWith('../lib/')?require(name.endsWith('.ts')?name:name+'.ts'):require(name)
  ),mod,mod.exports);
  return mod.exports;
}
type Node={type:any;key:string|null;props:Record<string,any>};
function nodes(tree:any,predicate:(node:Node)=>boolean):Node[]{
  if(Array.isArray(tree))return tree.flatMap(child=>nodes(child,predicate));
  if(!tree||typeof tree!=='object'||!('props' in tree))return [];
  const node=tree as Node;
  return [...(predicate(node)?[node]:[]),...nodes(node.props.children,predicate)];
}
/** Run the actual compiled question with state slots and keyed remounts. */
function harness(conceptId=ids[0],revision=links.HEAD_LINK_REVISION,surface:'CT'|'MRI'|'3D'='MRI'){
  let slots:any[]=[],cursor=0,key:string|null=null,tree:any;
  const hooks={
    useId(){return `mri-check-${cursor++}`;},
    useState(initial:any){const index=cursor++;if(!(index in slots))slots[index]=initial;return [slots[index],(value:any)=>{slots[index]=typeof value==='function'?value(slots[index]):value;}];},
    useRef(initial:any){const index=cursor++;if(!(index in slots))slots[index]={current:initial};return slots[index];},
  };
  const Component=compile('../components/HeadAnatomyCheck.tsx',{react:hooks}).HeadAnatomyCheck;
  function draw(){
    const outer=Component({conceptId,revision,surface});
    if(!outer){tree=null;key=null;slots=[];return tree;}
    if(outer.key!==key){slots=[];key=outer.key;}
    cursor=0;tree=outer.type(outer.props);return tree;
  }
  const one=(predicate:(node:Node)=>boolean)=>{const found=nodes(draw(),predicate);assert.equal(found.length,1);return found[0];};
  return {
    draw,get html(){const current=draw();return current?renderToStaticMarkup(current):'';},get key(){draw();return key;},
    radio(value:string){return one(node=>node.type==='input'&&node.props.type==='radio'&&node.props.value===value);},
    button(){return one(node=>node.type==='button'&&node.props.children==='Check answer');},
    form(){return one(node=>node.type==='form');},
    inject(value:string){draw();slots[1]=value;},
    submit(){let prevented=0;one(node=>node.type==='form').props.onSubmit({preventDefault(){prevented++;}});assert.equal(prevented,1);},
    change(next:{conceptId?:string;revision?:string;surface?:'CT'|'MRI'|'3D'}){conceptId=next.conceptId??conceptId;revision=next.revision??revision;surface=next.surface??surface;draw();},
  };
}

test('four independent MRI anatomy questions bind complete existing teaching and exact source metadata',async()=>{
  const packet=questions.headMriAnatomyCheckPacket();
  assert.equal(sha(packet),questions.HEAD_MRI_ANATOMY_CHECK_REVISION);
  assert.equal(await questions.verifiedHeadMriAnatomyCheckRevision(links.HEAD_LINK_REVISION),questions.HEAD_MRI_ANATOMY_CHECK_REVISION);
  assert.equal(await questions.verifiedHeadMriAnatomyCheckRevision('stale'),null);
  assert.equal(content.headRevision,links.HEAD_LINK_REVISION);
  assert.equal(content.teachingRevision,teaching.HEAD_MRI_ONLY_TEACHING_REVISION);
  assert.equal(content.status,'draft');
  for(const key of ['clinicalApproval','publicationApproval','patientRegistration'] as const)assert.equal(content[key],false);
  assert.notEqual(questions.HEAD_MRI_ANATOMY_CHECK_REVISION,HEAD_ANATOMY_CHECK_REVISION);
  assert.notEqual(questions.HEAD_MRI_ANATOMY_CHECK_REVISION,teaching.HEAD_MRI_ONLY_TEACHING_REVISION);
  assert.equal(headAnatomyCheckContent.questions.length,25);
  assert.deepEqual(content.questions.map(question=>question.conceptId),ids);
  for(const [index,question] of content.questions.entries()){
    const note=teaching.headMriOnlyTeachingContent.notes[index],binding=links.headConceptById(question.conceptId)!;
    assert.equal(question.explanation,note[question.fact].text);
    assert.deepEqual(question.sources,note[question.fact].sources);
    assert.deepEqual(packet.bindings[index],binding);
    assert.equal(binding.headRevision,links.HEAD_LINK_REVISION);
    assert(!Object.hasOwn(binding,'ctHref'));assert(binding.mriHref&&binding.atlasHref);
    assert.equal(question.options.length,3);
    assert.equal(new Set(question.options.map(option=>option.id)).size,3);
    assert.equal(new Set(question.options.map(option=>option.label)).size,3);
    assert.equal(question.options.filter(option=>option.id===question.correctOptionId).length,1);
    for(const surface of ['MRI','3D'] as const){
      const check=questions.headMriAnatomyCheckForConcept(question.conceptId,links.HEAD_LINK_REVISION,surface)!;
      assert(check);assert.equal(check.question,question);assert.deepEqual(check.binding,binding);
      assert.deepEqual(check.sources,teaching.headMriOnlyTeachingContent.sources.filter(source=>(question.sources as readonly string[]).includes(source.id)));
      assert.equal(check.revision,questions.HEAD_MRI_ANATOMY_CHECK_REVISION);assert.equal(check.scope,content.scope);
    }
  }
  // Equality with the full source packet also covers unused teaching facts,
  // imaging cautions, task, source date/reuse and both exact target identities.
  assert.deepEqual(packet.teachingPacket,teaching.headMriOnlyTeachingPacket());
  assert.equal(packet.teachingRevision,teaching.HEAD_MRI_ONLY_TEACHING_REVISION);
  assert.equal(sha(teaching.headMriOnlyTeachingPacket()),teaching.HEAD_MRI_ONLY_TEACHING_REVISION);
});

test('verification refuses head availability, missing/foreign/altered/CT targets and changes anywhere in the full teaching packet',async()=>{
  const isolated=(lookup:typeof links.headConceptById=links.headConceptById,current=true)=>{
    const source=compile('../lib/head-mri-only-teaching.ts',{'./head-atlas-links.ts':{...links,headConceptById:lookup}}) as typeof teaching;
    const draft=compile('../lib/head-mri-anatomy-checks.ts',{
      './head-atlas-links.ts':{...links,headConceptById:lookup},
      './head-link-availability.ts':{headLinksCurrent:()=>current},
      './head-mri-only-teaching.ts':source,
    }) as typeof questions;
    return {source,draft};
  };
  assert.equal(await isolated(undefined,false).draft.verifiedHeadMriAnatomyCheckRevision(links.HEAD_LINK_REVISION),null);
  assert.equal(await isolated(()=>null).draft.verifiedHeadMriAnatomyCheckRevision(links.HEAD_LINK_REVISION),null);
  const changed=(transform:(binding:NonNullable<ReturnType<typeof links.headConceptById>>)=>ReturnType<typeof links.headConceptById>)=>isolated(id=>{
    const binding=links.headConceptById(id);return binding&&id===ids[0]?transform(binding):binding;
  }).draft;
  for(const transform of [
    ()=>links.headConceptById(ids[1]),
    (binding:NonNullable<ReturnType<typeof links.headConceptById>>)=>({...binding,headRevision:'stale'}),
    (binding:NonNullable<ReturnType<typeof links.headConceptById>>)=>({...binding,ctHref:'/atlas/ct-head?foreign=1'}),
  ])assert.equal(await changed(transform).verifiedHeadMriAnatomyCheckRevision(links.HEAD_LINK_REVISION),null);
  for(const field of ['mriHref','atlasHref'] as const)for(const value of ['','/wrong-target']){
    assert.equal(await changed(binding=>({...binding,[field]:value})).verifiedHeadMriAnatomyCheckRevision(links.HEAD_LINK_REVISION),null,`${field}: ${value}`);
  }
  const mutations:Array<(source:any,draft:any)=>void>=[
    source=>{source.headMriOnlyTeachingContent.notes[0].anatomy.text+=' changed unused fact';},
    source=>{source.headMriOnlyTeachingContent.notes[0].function.text+=' changed explanation';},
    source=>{source.headMriOnlyTeachingContent.notes[1].imaging.text+=' changed imaging caution';},
    source=>{source.headMriOnlyTeachingContent.notes[2].task+=' changed exercise';},
    source=>{source.headMriOnlyTeachingContent.notes[3].scope+=' changed scope';},
    source=>{source.headMriOnlyTeachingContent.sources[0].title+=' changed title';},
    source=>{source.headMriOnlyTeachingContent.sources[0].url='https://example.invalid/changed';},
    source=>{source.headMriOnlyTeachingContent.sources[1].accessed='2000-01-01';},
    source=>{source.headMriOnlyTeachingContent.sources[2].reuse+=' changed rights';},
    (_source,draft)=>{draft.headMriAnatomyCheckContent.questions[0].prompt+=' changed prompt';},
    (_source,draft)=>{draft.headMriAnatomyCheckContent.questions[1].correctOptionId='option-forged';},
    (_source,draft)=>{draft.headMriAnatomyCheckContent.questions[2].options[0].label+=' changed option';},
    (_source,draft)=>{draft.headMriAnatomyCheckContent.reviewChecks.push('changed review requirement');},
  ];
  for(const mutate of mutations){
    const {source,draft}=isolated();mutate(source,draft);
    assert.notEqual(sha(draft.headMriAnatomyCheckPacket()),questions.HEAD_MRI_ANATOMY_CHECK_REVISION);
    assert.equal(await draft.verifiedHeadMriAnatomyCheckRevision(links.HEAD_LINK_REVISION),null);
  }
});

test('MRI checks refuse CT, unknown concepts, stale head and wrong independent question revisions',()=>{
  for(const id of ids){
    assert.equal(questions.headMriAnatomyCheckForConcept(id,links.HEAD_LINK_REVISION,'CT'),null);
    assert.equal(questions.headMriAnatomyCheckForConcept(id,'stale','MRI'),null);
    assert.equal(questions.headMriAnatomyCheckForConcept(id,links.HEAD_LINK_REVISION,'MRI','stale'),null);
    assert.equal(questions.headMriAnatomyCheckForConcept(id,links.HEAD_LINK_REVISION,'MRI',HEAD_ANATOMY_CHECK_REVISION),null);
    assert.equal(questions.headMriAnatomyCheckForConcept(id,links.HEAD_LINK_REVISION,'US' as 'MRI'),null);
  }
  for(const id of ['unknown','brainstem-pons','deep-left-thalamus'])assert.equal(questions.headMriAnatomyCheckForConcept(id,links.HEAD_LINK_REVISION,'MRI'),null);
});

test('empty and forged choices stay unanswered; first correct or incorrect choice latches through double submit',()=>{
  for(const firstCorrect of [true,false]){
    const h=harness(),question=content.questions[0];
    assert.equal(h.button().props.disabled,true);h.submit();assert.doesNotMatch(h.html,/Correct\.|Not quite\./);
    h.inject('forged-option');h.submit();assert.doesNotMatch(h.html,/Correct\.|Not quite\./);
    const first=firstCorrect?question.correctOptionId:question.options.find(option=>option.id!==question.correctOptionId)!.id;
    h.radio(first).props.onChange();assert.equal(h.button().props.disabled,false);
    const captured=h.form();captured.props.onSubmit({preventDefault(){}});captured.props.onSubmit({preventDefault(){}});
    h.radio(question.options.find(option=>option.id!==first)!.id).props.onChange();
    assert.match(h.html,firstCorrect?/Correct\./:/Not quite\./);
    assert(h.html.includes(escaped(question.explanation)));assert.equal(h.radio(first).props.checked,true);
    assert.equal(h.button().props.disabled,true);
    assert.equal(nodes(h.draw(),node=>node.type==='fieldset')[0].props.disabled,true);
    assert.match(h.html,/role="status" aria-live="polite" aria-atomic="true"/);
    if(firstCorrect)assert(!h.html.includes('Correct answer:'));
    else assert(h.html.includes(escaped(question.options.find(option=>option.id===question.correctOptionId)!.label)));
  }
});

test('concept, exact question packet, source and surface identities cannot inherit an answer',()=>{
  const h=harness(),correct=content.questions[0].correctOptionId;
  assert(h.key?.includes(questions.HEAD_MRI_ANATOMY_CHECK_REVISION));
  h.radio(correct).props.onChange();h.submit();assert.match(h.html,/Correct\./);
  const firstKey=h.key;h.change({surface:'3D'});assert.notEqual(h.key,firstKey);
  assert.equal(h.button().props.disabled,true);assert.doesNotMatch(h.html,/Correct\.|Not quite\./);
  h.radio(correct).props.onChange();h.submit();h.change({conceptId:ids[1]});
  assert.equal(h.button().props.disabled,true);assert.doesNotMatch(h.html,/Correct\.|Not quite\./);
  h.change({revision:'stale'});assert.equal(h.html,'');
  h.change({revision:links.HEAD_LINK_REVISION});assert.equal(h.button().props.disabled,true);
  h.change({surface:'CT'});assert.equal(h.html,'');
  h.change({surface:'MRI'});assert.equal(h.button().props.disabled,true);
});

test('actual native MRI and existing 3D children expose four folded practice questions without native MRI guidance in 3D',()=>{
  const Native=compile('../components/HeadAtlasTeaching.tsx').HeadAtlasTeaching;
  const Reference=compile('../components/HeadAtlasReferenceTeaching.tsx').HeadAtlasReferenceTeaching;
  for(const [index,question] of content.questions.entries()){
    const note=teaching.headMriOnlyTeachingContent.notes[index];
    for(const [Component,props] of [[Native,{modality:'MRI'}],[Reference,{}]] as const){
      const html=render(Component,{conceptId:question.conceptId,revision:links.HEAD_LINK_REVISION,...props});
      assert(html.includes(escaped(question.prompt)));assert(html.includes(questions.HEAD_MRI_ANATOMY_CHECK_REVISION));
      assert.equal([...html.matchAll(/type="radio"/g)].length,3);
      assert(!html.includes('checked=""'));assert(!html.includes('<details open'));assert(!html.includes('Correct answer:'));
      assert.match(html,/no exam score or saved completion/);
      if(Component===Reference){assert(!html.includes(escaped(note.imaging.text)));assert(!html.includes(escaped(note.task)));}
      else assert(html.includes(escaped(note.imaging.text)));
    }
    assert.equal(render(Native,{conceptId:question.conceptId,revision:links.HEAD_LINK_REVISION,modality:'CT'}),'');
    assert.equal(render(Native,{conceptId:question.conceptId,revision:'stale',modality:'MRI'}),'');
    assert.equal(render(Reference,{conceptId:question.conceptId,revision:'stale'}),'');
  }
  const source=readFileSync(new URL('../components/HeadAnatomyCheck.tsx',import.meta.url),'utf8');
  assert.doesNotMatch(source,/localStorage|sessionStorage|fetch\s*\(|indexedDB|HeadTeachingReviewNotes|\/api\//);
});

test('actual independent review renders four answer keys with exact safe MRI and 3D links, refusing invalid revisions',()=>{
  const Review=compile('../components/HeadMriAnatomyChecksReview.tsx').HeadMriAnatomyChecksReview;
  const html=render(Review,{revision:links.HEAD_LINK_REVISION,questionRevision:questions.HEAD_MRI_ANATOMY_CHECK_REVISION});
  assert(html.includes('id="head-mri-anatomy-check-review"'));
  assert.equal([...html.matchAll(/ · Correct answer<\/li>/g)].length,4);
  assert.doesNotMatch(html,/Inspect question CT target|<form\b|<button\b|<input\b/);
  for(const id of ids){
    const binding=links.headConceptById(id)!;
    assert(html.includes(`id="head-mri-anatomy-check-${id}"`));
    const mriHref=headImageHref('MRI',id,null,links.HEAD_LINK_REVISION);
    assert(mriHref);assert(mriHref.startsWith('/atlas/mri-head?'));
    assert(html.includes(`href="${escaped(mriHref)}"`));
    assert(html.includes(`href="${escaped(binding.atlasHref!)}"`));
  }
  for(const source of teaching.headMriOnlyTeachingContent.sources)assert(html.includes(`href="${escaped(source.url)}" target="_blank" rel="noopener noreferrer"`));
  assert.match(html,/Saving corrections records no sign-off, exam answer or score/);
  for(const props of [{revision:'stale',questionRevision:questions.HEAD_MRI_ANATOMY_CHECK_REVISION},{revision:links.HEAD_LINK_REVISION,questionRevision:'stale'},{revision:links.HEAD_LINK_REVISION,questionRevision:null}]){
    const refused=render(Review,props);assert.match(refused,/role="alert"/);
    assert.doesNotMatch(refused,/Correct answer|<a\b|<form\b|<input\b|<button\b/);
  }
});

test('actual authorized page exposes the four picker entries and separate review only after independent verification',async()=>{
  const page=(authorized:boolean,verified:boolean)=>{
    const calls:string[]=[],empty=new Proxy({}, {get:()=>async()=>null});
    const mod=compile('../app/workspace/atlas-review/head-learning/page.tsx',new Proxy({
      '@/lib/clinical-review-server':{authorizeClinicalReview:async()=>{calls.push('authorize');if(!authorized)throw Error('private denial');}},
      '@/lib/head-atlas-import':{HEAD_MANIFEST_SHA256:links.HEAD_LINK_REVISION},
      '@/lib/head-teaching-review-contract':{headTeachingDraftContext:async()=>({packetId:'fixture'})},
      '@/lib/head-mri-anatomy-checks':{
        headMriAnatomyCheckContent:content,
        verifiedHeadMriAnatomyCheckRevision:async(revision:string)=>{calls.push('mri-anatomy');assert.equal(revision,links.HEAD_LINK_REVISION);return verified?questions.HEAD_MRI_ANATOMY_CHECK_REVISION:null;},
      },
      '@/components/HeadAtlasTeachingReview':{HeadAtlasTeachingReview:()=>null},
      '@/components/HeadMriAnatomyChecksReview':{HeadMriAnatomyChecksReview:()=>null},
    } as Record<string,unknown>,{get:(target,name:string)=>target[name]??(name.startsWith('@/')?empty:undefined)}));
    return {run:mod.default as ()=>Promise<React.ReactElement<any>>,calls};
  };
  const denied=page(false,true),denial=await denied.run();assert.deepEqual(denied.calls,['authorize']);
  assert.match(renderToStaticMarkup(denial),/authorized administrator account/);
  const absent=page(true,false),unverified=await absent.run();assert.deepEqual(absent.calls,['authorize','mri-anatomy']);
  assert.equal(unverified.props.mriKnowledgeReview,undefined);
  assert(!unverified.props.additionalTargets.some((target:{id:string})=>target.id.startsWith('head-mri-anatomy-check-')));
  const present=page(true,true),verified=await present.run();assert.deepEqual(present.calls,['authorize','mri-anatomy']);
  assert.deepEqual(verified.props.additionalTargets.filter((target:{id:string})=>target.id.startsWith('head-mri-anatomy-check-')).map((target:{id:string})=>target.id),[
    'head-mri-anatomy-check-review',...ids.map(id=>'head-mri-anatomy-check-'+id),
  ]);
  assert.equal(verified.props.mriKnowledgeReview.props.questionRevision,questions.HEAD_MRI_ANATOMY_CHECK_REVISION);
  const Shell=compile('../components/HeadAtlasTeachingReview.tsx',{'./HeadTeachingReviewNavigator':{HeadTeachingReviewNavigator:()=>null}}).HeadAtlasTeachingReview;
  const Review=compile('../components/HeadMriAnatomyChecksReview.tsx').HeadMriAnatomyChecksReview;
  const review=React.createElement(Review,{revision:links.HEAD_LINK_REVISION,questionRevision:questions.HEAD_MRI_ANATOMY_CHECK_REVISION});
  const html=render(Shell,{revision:links.HEAD_LINK_REVISION,mriKnowledgeReview:review});
  assert.match(html,/href="#head-mri-anatomy-check-review"/);assert.match(html,/id="head-mri-anatomy-check-review"/);
  assert.equal([...html.matchAll(/ · Correct answer<\/li>/g)].length,4);
  assert(!render(Shell,{revision:'stale',mriKnowledgeReview:review}).includes('Correct answer'));
});
