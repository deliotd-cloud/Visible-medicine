import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import * as learning from '../lib/head-atlas-learning.ts';
import {headConceptById,headConceptFromAtlasQuery,HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';

const require=createRequire(import.meta.url),destinations:string[]=[];
const source=readFileSync(new URL('../components/HeadAtlasLearningPicker.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
type PickerProps={sequenceId?:string;conceptId?:string|null;onNavigate?:(href:string)=>boolean};
const mod={exports:{} as {HeadAtlasLearningPicker:(props:PickerProps)=>React.ReactElement}};
new Function('require','module','exports',compiled)((id:string)=>id==='next/navigation'?{useRouter:()=>({push:(href:string)=>destinations.push(href)})}:id==='../lib/head-atlas-learning'?learning:id==='../lib/head-atlas-links'?{headConceptById}:require(id),mod,mod.exports);
type Node={type:unknown;props:Record<string,any>};
function walk(value:unknown,accept:(node:Node)=>boolean):Node|undefined{
  if(Array.isArray(value)){for(const child of value){const found=walk(child,accept);if(found)return found;}return;}
  if(!value||typeof value!=='object'||!('props'in value))return;
  const node=value as Node;return accept(node)?node:walk(node.props.children,accept);
}
const tree=(sequenceId?:string,conceptId?:string|null,onNavigate?:PickerProps['onNavigate'])=>mod.exports.HeadAtlasLearningPicker({sequenceId,conceptId,onNavigate});
const render=(sequenceId?:string,conceptId?:string|null)=>renderToStaticMarkup(React.createElement(mod.exports.HeadAtlasLearningPicker,{sequenceId,conceptId}));
function formFor(sequenceId?:string,onNavigate?:PickerProps['onNavigate']){const form=walk(tree(sequenceId,undefined,onNavigate),node=>node.type==='form');assert(form);return form;}
function submit(form:Node,value:string|null,calls:string[]=[]){
  let prevented=false;
  const details={open:true,removeAttribute(name:string){assert.equal(name,'open');this.open=false;calls.push('close');},querySelector(name:string){assert.equal(name,'summary');return {focus(options?:FocusOptions){assert.deepEqual(options,{preventScroll:true});assert.equal(details.open,false,'focus must follow disclosure closure');calls.push('focus-summary');}};}};
  form.props.onSubmit({preventDefault(){prevented=true;},currentTarget:{closest(name:string){assert.equal(name,'details');return details;},elements:{namedItem(name:string){assert.equal(name,'head-linked-tour');return value===null?null:{value};}}}});
  assert.equal(prevented,true);
  return details;
}

test('native collapsed picker has twelve exact labelled sequences and a valid preselection only',()=>{
  const sequences=learning.headLearningSequencesForModality().filter(sequence=>learning.headLearningLinks({sequenceId:sequence.id,conceptId:sequence.concepts[0]})?.atlasHref);
  assert.equal(sequences.length,12);
  assert.equal(learning.headLearningSequencesForModality('CT').length,11);
  assert.equal(learning.headLearningSequencesForModality('MRI').length,10);
  const picker=tree(),details=walk(picker,node=>node.type==='details');assert(details);
  assert.equal(details.props.open,undefined);
  assert.equal(walk(details,node=>node.type==='summary')?.props.children,'Linked tours');
  const form=walk(details,node=>node.type==='form');assert(form);
  const select=walk(form,node=>node.type==='select');assert(select);
  assert.equal(select.props.name,'head-linked-tour');assert.equal(select.props.required,true);
  assert.equal(select.props.defaultValue,'');assert.equal(select.props.onChange,undefined);
  assert.equal(walk(form,node=>node.type==='button')?.props.children,'Start at step 1');
  const options:Node[]=[];
  function collect(value:unknown){if(Array.isArray(value)){value.forEach(collect);return;}if(!value||typeof value!=='object'||!('props'in value))return;const node=value as Node;if(node.type==='option')options.push(node);collect(node.props.children);}
  collect(select);
  assert.equal(options.length,13);
  assert.equal(options[0].props.value,'');assert.equal(options[0].props.disabled,true);
  assert.deepEqual(options.slice(1).map(option=>option.props.value),sequences.map(sequence=>sequence.id));
  const html=render();
  for(const sequence of sequences){assert(html.includes(sequence.label),sequence.id);assert.match(html,new RegExp(`${sequence.concepts.length} steps?`));}
  assert.match(html,/Draft/i);assert.match(html,/unregistered/i);
  for(const sequence of sequences)assert.equal(walk(tree(sequence.id),node=>node.type==='select')?.props.defaultValue,sequence.id);
  for(const invalid of ['unknown','','javascript:alert(1)','MRI'])assert.equal(walk(tree(invalid),node=>node.type==='select')?.props.defaultValue,'');
  assert(!/localStorage|sessionStorage|indexedDB|fetch\(|postMessage|contentWindow/.test(source));
});

test('submit each allowed tour only at its canonical first source-pinned 3D step',()=>{
  destinations.length=0;
  const form=formFor();
  for(const sequence of learning.headLearningSequencesForModality().filter(sequence=>learning.headLearningLinks({sequenceId:sequence.id,conceptId:sequence.concepts[0]})?.atlasHref)){
    submit(form,sequence.id);
    const href=destinations.pop();
    assert.equal(href,learning.headLearningLinks({sequenceId:sequence.id,conceptId:sequence.concepts[0]})?.atlasHref);
    assert(href);
    const url=new URL(href,'https://atlas.invalid');
    assert.equal(url.origin,'https://atlas.invalid');assert.equal(url.pathname,'/atlas/head-neck-3d');
    assert.equal(url.searchParams.get('headRevision'),HEAD_LINK_REVISION);
    assert.deepEqual(learning.parseHeadLearningIntent(url.searchParams,'atlas'),{sequenceId:sequence.id,conceptId:sequence.concepts[0]});
    assert.equal(headConceptFromAtlasQuery(url.searchParams)?.conceptId,sequence.concepts[0]);
    assert.equal(headConceptById(sequence.concepts[0])?.headRevision,HEAD_LINK_REVISION);
  }
  assert.deepEqual(destinations,[]);
});

test('unknown, absent and injected selections do not navigate; changing selection alone does nothing',()=>{
  destinations.length=0;
  const form=formFor('brainstem');
  for(const invalid of [null,'','unknown','javascript:alert(1)','/atlas/head-neck-3d?headTour=brainstem','brainstem&patientId=private','https://other.test/']){
    const calls:string[]=[];
    assert.equal(submit(form,invalid,calls).open,true,'invalid selection keeps the disclosure open');
    assert.deepEqual(calls,[],'invalid selection does not move focus');
  }
  assert.deepEqual(destinations,[]);
  const select=walk(form,node=>node.type==='select');assert.equal(select?.props.onChange,undefined);
  assert.equal(select?.props.defaultValue,'brainstem');assert.deepEqual(destinations,[]);
});

test('handled blocked-like launch restores visible summary focus before the callback',()=>{
  destinations.length=0;
  const calls:string[]=[];
  const href=learning.headLearningLinks({sequenceId:'brainstem',conceptId:'brainstem-midbrain'})?.atlasHref;
  const form=formFor('brainstem',target=>{calls.push('navigate');assert.equal(target,href);assert.deepEqual(calls,['close','focus-summary','navigate']);return true;});
  assert.equal(submit(form,'brainstem',calls).open,false);
  assert.deepEqual(calls,['close','focus-summary','navigate']);
  assert.deepEqual(destinations,[],'handled blocked navigation does not invoke router fallback');
});

test('accepted synchronous navigation can transfer focus to the confirmed heading',()=>{
  destinations.length=0;
  const calls:string[]=[];
  const form=formFor('brainstem',()=>{assert.deepEqual(calls,['close','focus-summary']);calls.push('focus-confirmed-heading');return true;});
  submit(form,'brainstem',calls);
  assert.deepEqual(calls,['close','focus-summary','focus-confirmed-heading'],'picker must not overwrite destination focus');
  assert.deepEqual(destinations,[]);
});

test('unhandled or absent navigation focuses summary before router fallback',()=>{
  const href=learning.headLearningLinks({sequenceId:'brainstem',conceptId:'brainstem-midbrain'})?.atlasHref;
  for(const withCallback of [true,false]){
    destinations.length=0;
    const calls:string[]=[];
    const form=formFor('brainstem',withCallback?target=>{assert.equal(target,href);assert.deepEqual(calls,['close','focus-summary']);calls.push('navigate');return false;}:undefined);
    submit(form,'brainstem',calls);
    assert.deepEqual(calls,withCallback?['close','focus-summary','navigate']:['close','focus-summary']);
    assert.deepEqual(destinations,[href]);
  }
});

test('Escape closes the disclosure and restores focus to its summary',()=>{
  const details=walk(tree('brainstem'),node=>node.type==='details');assert(details);
  assert.equal(typeof details.props.onKeyDown,'function');
  const calls:string[]=[];
  const summary={isConnected:true,focus(){calls.push('focus');}};
  const parent={isConnected:true,open:true,querySelector(name:string){assert.equal(name,':scope > summary');return summary;}};
  const event={key:'Escape',preventDefault(){calls.push('prevent');},stopPropagation(){calls.push('stop');},currentTarget:parent,target:{closest(name:string){assert.equal(name,'details');return parent;}}};
  details.props.onKeyDown(event);
  assert(calls.includes('prevent'));assert(calls.includes('stop'));
  assert.equal(parent.open,false);assert(calls.includes('focus'));
  calls.length=0;details.props.onKeyDown({...event,key:'Enter'});assert.deepEqual(calls,[]);
});

test('every valid tour position exposes ordered source-pinned steps with one current marker',()=>{
  for(const sequence of learning.headLearningSequencesForModality().filter(sequence=>learning.headLearningLinks({sequenceId:sequence.id,conceptId:sequence.concepts[0]})?.atlasHref))for(const conceptId of sequence.concepts){
    const node=tree(sequence.id,conceptId),html=render(sequence.id,conceptId);
    const section=walk(node,item=>item.type==='section');assert(section);
    assert.equal(section.props['aria-label'],'Current tour steps');
    const ol=walk(section,item=>item.type==='ol');assert(ol);
    const anchors=(ol.props.children as Node[]).map(li=>li.props.children as Node);
    assert.equal(anchors.length,sequence.concepts.length);
    assert.equal(anchors.filter(a=>a.props['aria-current']==='step').length,1);
    anchors.forEach((a,index)=>{
      const expected=sequence.concepts[index];
      assert.equal(a.type,'a');assert.equal(a.props.onClick,undefined,'ordinary links preserve browser history and keyboard behavior');
      assert.equal(a.props['aria-current'],expected===conceptId?'step':undefined);
      const url=new URL(a.props.href,'https://atlas.invalid');
      assert.equal(url.pathname,'/atlas/head-neck-3d');
      assert.deepEqual(learning.parseHeadLearningIntent(url.searchParams,'atlas'),{sequenceId:sequence.id,conceptId:expected});
      assert.equal(headConceptFromAtlasQuery(url.searchParams)?.conceptId,expected);
      assert.equal(url.searchParams.get('headRevision'),HEAD_LINK_REVISION);
    });
    assert.match(html,/without recording a score or completion/);
    assert.equal(walk(node,item=>item.type==='details')?.props.open,undefined);
  }
});

test('step list is omitted without an exact position and rejects cross-tour/injected concepts',()=>{
  for(const [sequenceId,conceptId] of [[undefined,undefined],['brainstem',null],['unknown','brainstem-pons'],['brainstem','ventricle-third'],['brainstem','javascript:alert(1)']] as const){
    assert.equal(walk(tree(sequenceId,conceptId),node=>node.type==='section'),undefined);
    assert.doesNotMatch(render(sequenceId,conceptId),/Current tour steps|aria-current/);
  }
});

test('selected anatomy offers every matching tour at its exact canonical step, without completion',()=>{
  const sequences=learning.headLearningSequencesForModality().filter(sequence=>learning.headLearningLinks({sequenceId:sequence.id,conceptId:sequence.concepts[0]})?.atlasHref);
  for(const conceptId of new Set(sequences.flatMap(sequence=>sequence.concepts))){
    const node=tree(undefined,conceptId),html=render(undefined,conceptId);
    const section=walk(node,item=>item.type==='section'&&item.props['aria-label']==='Tours through selected anatomy');assert(section);
    const form=walk(node,item=>item.type==='form');assert(form);
    assert.equal(walk(form,item=>item===section),section,'context stays inside the bounded dropdown, not the toolbar layout');
    const list=walk(section,item=>item.type==='ol');assert(list);
    const anchors=(list.props.children as Node[]).map(li=>li.props.children as Node);
    const expected=sequences.filter(sequence=>sequence.concepts.includes(conceptId));
    assert.equal(anchors.length,expected.length);
    anchors.forEach((anchor,index)=>{
      const sequence=expected[index],url=new URL(anchor.props.href,'https://atlas.invalid');
      assert.equal(anchor.type,'a');assert.equal(anchor.props.onClick,undefined);
      assert.equal(url.pathname,'/atlas/head-neck-3d');
      assert.equal(url.searchParams.get('headStep'),String(sequence.concepts.indexOf(conceptId)));
      assert.equal(url.searchParams.get('headRevision'),HEAD_LINK_REVISION);
      assert.deepEqual(learning.parseHeadLearningIntent(url.searchParams,'atlas'),{sequenceId:sequence.id,conceptId});
      assert.equal(headConceptFromAtlasQuery(url.searchParams)?.conceptId,conceptId);
    });
    assert.match(html,/Earlier steps remain available; nothing is marked complete/);
    assert.equal(walk(node,item=>item.type==='details')?.props.open,undefined);
    assert.equal(walk(node,item=>item.type==='select')?.props.defaultValue,'','the full library does not silently preselect a tour');
  }
  assert.match(render(undefined,'brainstem-pons'),/Brainstem orientation · start at step 2 of 3/);
});

test('related tours never substitute unknown anatomy or duplicate active tour navigation',()=>{
  for(const conceptId of [null,undefined,'unknown','Pons','javascript:alert(1)','brainstem-pons&patientId=private']){
    assert.doesNotMatch(render(undefined,conceptId),/Tours through selected anatomy|Learn .* in context/);
  }
  for(const sequence of learning.headLearningSequencesForModality().filter(sequence=>learning.headLearningLinks({sequenceId:sequence.id,conceptId:sequence.concepts[0]})?.atlasHref))for(const conceptId of sequence.concepts){
    assert.doesNotMatch(render(sequence.id,conceptId),/Tours through selected anatomy/);
    assert.match(render(sequence.id,conceptId),/Current tour steps/);
  }
});
