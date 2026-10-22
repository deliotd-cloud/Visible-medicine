import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const website=process.env.VM_WEBSITE_ROOT||fileURLToPath(new URL('../',import.meta.url));
const pickerPath=process.env.VM_PICKER_SOURCE||path.join(website,'components/HeadAtlasLearningPicker.tsx');
const require=createRequire(path.join(website,'package.json'));
const React=require('react');
const ts=require('typescript');
const destinations=[];
const concepts=[{conceptId:'midbrain',label:'Midbrain'},{conceptId:'pons',label:'Pons'}];
const sequence={id:'brainstem',label:'Brainstem orientation',concepts:concepts.map(item=>item.conceptId)};
const href=(id)=>`/atlas/head-neck-3d?headTour=brainstem&headConcept=${id}&headRevision=source-pinned`;
const learning={headLearningSequencesForModality:()=>[sequence],headLearningLinks:({sequenceId,conceptId})=>sequenceId==='brainstem'&&sequence.concepts.includes(conceptId)?{atlasHref:href(conceptId)}:null,
  headLearningNavigation:()=>({index:0,total:2,label:'Midbrain',sequenceLabel:sequence.label,current:{},next:{href:href('pons'),label:'Pons'},exitHref:'/atlas/head-neck-3d'})};
const headConceptById=id=>concepts.find(item=>item.conceptId===id)||null;
function load(source,imports){
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const mod={exports:{}};
  new Function('require','module','exports',code)(id=>imports[id]??require(id),mod,mod.exports);
  return mod.exports;
}
const picker=load(readFileSync(pickerPath,'utf8'),{
  'next/navigation':{useRouter:()=>({push:target=>destinations.push(target)})},
  '../lib/head-link-availability.ts':{headLinksCurrent:()=>true,HEAD_LINK_REVISION_NOTICE:'stale'},
  '../lib/head-atlas-learning':learning,
  '../lib/head-atlas-links':{headConceptById}
});
const parent=load(readFileSync(path.join(website,'components/HeadAtlasLearningNavigation.tsx'),'utf8'),{
  '../lib/head-atlas-learning':learning,
  '../lib/head-link-availability.ts':{headLinksCurrent:()=>true,HEAD_LINK_REVISION_NOTICE:'stale'},
  './HeadAtlasLearningPicker':picker,
  './HeadLearningBookmark':{HeadLearningBookmark:()=>null},
  '../lib/head-atlas-links':{HEAD_LINK_REVISION:'source-pinned'},
  '../lib/lecture-tour-context':{createLectureTourContext:()=>({kind:'unavailable'})},
  '../lib/lecture-related-links':{relatedLectureHref:()=>null}
});
function find(value,predicate){
  if(Array.isArray(value)){for(const child of value){const found=find(child,predicate);if(found)return found;}return null;}
  if(!value||typeof value!=='object'||!('props'in value))return null;
  return predicate(value)?value:find(value.props.children,predicate);
}
const pickerTree=(props={})=>picker.HeadAtlasLearningPicker({sequenceId:'brainstem',conceptId:'midbrain',...props});
function bubble({kind='step',anchorProps={},eventProps={},onNavigate=()=>false,open=true}={}){
  const calls=[];
  const child=kind==='contextual'?picker.HeadAtlasLearningPicker({conceptId:'pons'}):pickerTree();
  const outer=parent.HeadAtlasLearningNavigation({position:{sequenceId:'brainstem',conceptId:'midbrain'},onNavigate:target=>{calls.push('parent-navigate');return onNavigate(target,calls);}});
  const step=find(child,node=>node.type==='a'&&(kind==='contextual'?node.props.href===href('pons'):node.props['aria-current']==='step'));
  assert(step);assert.equal(step.props.onClick,undefined);
  const anchor={target:anchorProps.target||'',getAttribute:name=>name==='href'?step.props.href:null,
    hasAttribute:name=>!!anchorProps[name],closest:selector=>selector==='.head-linked-tour-steps'?section:null};
  const section={};
  class FakeElement{closest(selector){if(selector==='a')return kind==='step'||kind==='contextual'?anchor:kind==='outside'?outside:null;return null;}}
  const outside={...anchor,closest:()=>null};
  const prior=globalThis.Element;globalThis.Element=FakeElement;
  let prevented=false;
  const details={open,contains:item=>item===anchor,removeAttribute:name=>{assert.equal(name,'open');details.open=false;calls.push('close');},
    querySelector:name=>{assert.equal(name,'summary');return {focus:options=>{assert.deepEqual(options,{preventScroll:true});assert.equal(details.open,false);calls.push('focus-summary');}};}};
  const event={defaultPrevented:false,button:0,metaKey:false,ctrlKey:false,shiftKey:false,altKey:false,
    target:new FakeElement(),currentTarget:details,preventDefault:()=>{prevented=true;event.defaultPrevented=true;calls.push('prevent-default');},...eventProps};
  try{child.props.onClick(event);event.currentTarget={contains:item=>item===anchor||item===outside};outer.props.onClick(event);}
  finally{if(prior===undefined)delete globalThis.Element;else globalThis.Element=prior;}
  return {calls,prevented,details,anchor:step.props.href};
}

test('ordinary current-step and contextual-tour links close before parent guard; fallback stays native',()=>{
  const result=bubble();
  assert.deepEqual(result.calls,['close','focus-summary','parent-navigate']);
  assert.equal(result.prevented,false);
  assert.equal(result.details.open,false);
  assert.deepEqual(destinations,[]);
  const contextual=bubble({kind:'contextual'});
  assert.deepEqual(contextual.calls,['close','focus-summary','parent-navigate']);
  assert.equal(contextual.prevented,false);
});

test('blocked-like parent keeps summary; accepted parent moves focus afterward once',()=>{
  assert.deepEqual(bubble({onNavigate:(_href,calls)=>{calls.push('blocked');return true;}}).calls,
    ['close','focus-summary','parent-navigate','blocked','prevent-default']);
  const accepted=bubble({onNavigate:(_href,calls)=>{calls.push('focus-confirmed-heading');return true;}});
  assert.deepEqual(accepted.calls,['close','focus-summary','parent-navigate','focus-confirmed-heading','prevent-default']);
  assert.equal(accepted.prevented,true);
});

test('modified, middle, cancelled, target, download, outside and closed clicks do not dismiss',()=>{
  for(const props of [{metaKey:true},{ctrlKey:true},{shiftKey:true},{altKey:true},{button:1},{defaultPrevented:true}]){
    const result=bubble({eventProps:props});assert.equal(result.details.open,true);assert(!result.calls.includes('focus-summary'));
  }
  for(const anchorProps of [{target:'_blank'},{download:true},{'data-head-reload':true}]){
    const result=bubble({anchorProps});assert.equal(result.details.open,true);assert.deepEqual(result.calls,[]);
  }
  for(const kind of ['outside','summary','select','button']){
    const result=bubble({kind});assert.equal(result.details.open,true);assert(!result.calls.includes('focus-summary'));
    assert.deepEqual(result.calls,kind==='outside'?['parent-navigate']:[]);
  }
  assert.equal(bubble({open:false}).details.open,false);
});

test('existing Start submit and Escape behavior remains independent',()=>{
  const child=pickerTree({onNavigate:target=>{destinations.push(target);return true;}});
  const form=find(child,node=>node.type==='form');assert(form);
  const calls=[];
  const details={open:true,removeAttribute:()=>{details.open=false;calls.push('close');},querySelector:()=>({focus:()=>calls.push('focus')})};
  form.props.onSubmit({preventDefault:()=>calls.push('prevent'),currentTarget:{elements:{namedItem:()=>({value:'brainstem'})},closest:()=>details}});
  assert.deepEqual(calls,['prevent','close','focus']);assert.equal(destinations.pop(),href('midbrain'));
  details.open=true;child.props.onKeyDown({key:'Escape',currentTarget:details,preventDefault:()=>calls.push('escape-prevent'),stopPropagation:()=>calls.push('escape-stop')});
  assert.equal(details.open,false);assert.deepEqual(calls.slice(-3),['escape-prevent','escape-stop','focus']);
});
