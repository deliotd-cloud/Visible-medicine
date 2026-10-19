/* oxlint-disable react-hooks/rules-of-hooks -- controlled actual-component harness */
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import {build} from 'esbuild';

const require=createRequire(import.meta.url),React=require('react');
const ids=['left','right'],oldId='a'.repeat(64),newId='b'.repeat(64);
const bytes=id=>new TextEncoder().encode(`synthetic ${id}`);
const candidate=(id,mode)=>({id,decisionMode:mode,supersedes:mode==='personal-review'?oldId:undefined,
  selections:ids.map((structureId,i)=>({structureId,structureName:`Structure ${i}`,region:'synthetic',sourceHash:'1'.repeat(64),materialHash:'2'.repeat(64),teachingHash:'3'.repeat(64),...(mode==='personal-review'?{review:{checklistVersion:'v2',checklists:{},blockers:{},teachingTabs:[]}}:{})})),
  files:[{path:'worksheet.json',sha256:createHash('sha256').update(bytes(id)).digest('hex'),bytes:bytes(id).length}],atlasRevision:'4'.repeat(40),reviewRevision:'5'.repeat(64),rendererRevision:'6'.repeat(64)});
const old=candidate(oldId,'inspection-only'),now=candidate(newId,'personal-review');
const topic=(tab,body)=>({tab,readiness:'draft',title:`${tab} title`,body,citations:['https://example.org/reference']});
let variant='changed',slots=[],cursor=0,view,calls=[];
const material=(id,side)=>{
  const differing=variant==='changed'&&side==='current';
  return {structureId:id,source:{structure:{name:id,fmaId:'FMA1',region:'synthetic',laterality:'left',coverageNote:'Partial source',sources:[]},bundle:{id:'synthetic',sha256:'7'.repeat(64),bytes:10},credit:'Synthetic',licence:'Synthetic',sourceVersion:'1'},
    topics:variant==='mixed'
      ?side==='earlier'
        ?[topic('ct','Same CT'),topic('anatomy','Same anatomy'),topic('function','Removed function')]
        :[topic('pathology','Added pathology'),topic('anatomy','Same anatomy'),topic('ct','Same CT')]
      :[topic('anatomy','Same anatomy'),topic('function',differing?'Revised function':'Original function'),topic('ct','Same CT')],
    guidedTours:[],reasoning:null,limits:['Synthetic source only'],checklist:{geometry:['Inspect'],teaching:['Inspect'],imaging:['No imaging']}};
};
const shim={...React,useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}]},
  useEffect(fn,deps){const i=cursor++,prior=slots[i];if(!prior||!deps||deps.some((value,j)=>!Object.is(value,prior.deps?.[j]))){prior?.dispose?.();slots[i]={deps,dispose:fn()};}}};
const built=await build({entryPoints:['components/FrozenCandidateComparison.tsx'],bundle:true,write:false,platform:'node',format:'cjs',packages:'external',loader:{'.css':'empty'},jsx:'automatic',plugins:[{name:'synthetic-contracts',setup(api){
  api.onResolve({filter:/^\.\.\/lib\/(frozen-candidate-comparison|frozen-candidate-worksheet)$/},args=>({path:args.path,namespace:'synthetic'}));
  api.onLoad({filter:/.*/,namespace:'synthetic'},args=>({contents:args.path.endsWith('comparison')?
    `export const validateFrozenComparisonPair=async(current,previous)=>{if(current.supersedes!==previous.id)throw Error('pair');return{current,previous}};`:
    `export const decodeFrozenWorksheet=async(candidate,bytes)=>globalThis.__decode(candidate,bytes);`,loader:'js'}));
}}]});
const scope={exports:{}};
runInNewContext(built.outputFiles[0].text,{module:scope,exports:scope.exports,require:name=>name==='react'?shim:require(name),
  AbortController,crypto:webcrypto,TextEncoder,URL,
  fetch:(url,options)=>new Promise(resolve=>calls.push({url,options,resolve})),
  __decode:(descriptor,actual)=>{assert.equal(Buffer.from(actual).toString(),Buffer.from(bytes(descriptor.id)).toString());return{selections:ids.map(id=>({material:material(id,descriptor.id===oldId?'earlier':'current'),modelQuery:`kind=body&structure=${id}`}))};}
});
const expand=node=>React.isValidElement(node)&&typeof node.type==='function'?expand(node.type(node.props)):Array.isArray(node)?node.map(expand):React.isValidElement(node)?React.cloneElement(node,node.props,React.Children.map(node.props.children,expand)):node;
const walk=(node,predicate,out=[])=>{if(React.isValidElement(node)){if(predicate(node))out.push(node);React.Children.forEach(node.props.children,child=>walk(child,predicate,out));}return out;};
const words=node=>typeof node==='string'||typeof node==='number'?String(node):!node?'':Array.isArray(node)?node.map(words).join(''):words(node.props?.children);
const render=(current=now,previous=old)=>{cursor=0;view=expand(scope.exports.FrozenCandidateComparison({current,previous}));return view;};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const button=prefix=>walk(view,n=>n.type==='button'&&words(n).startsWith(prefix))[0];
const checkbox=()=>walk(view,n=>n.type==='input'&&n.props.type==='checkbox')[0];
const reply=(call,status=200)=>call.resolve({ok:status===200,status,headers:new Headers(),body:new ReadableStream({start(controller){controller.enqueue(bytes(call.url.includes(oldId)?oldId:newId));controller.close();}})});
const reset=(which='changed')=>{variant=which;slots=[];calls=[];render();};
const open=()=>{button('Compare changes').props.onClick();render();};
const finish=async(offset=0)=>{for(let i=0;i<10&&calls.length<offset+2;i++)await tick();assert.equal(calls.length,offset+2);calls.slice(offset).forEach(call=>reply(call));await tick();await tick();render();};
const sections=()=>walk(view,n=>n.type==='article');
const topicSummaries=article=>walk(article,n=>n.type==='summary').map(words).filter(x=>/^(anatomy|function|ct|pathology) ·/.test(x));

test('verified changes are summarized; identical topic keys and order align both columns; details collapse',async()=>{
  reset();assert.equal(calls.length,0);open();await finish();
  assert(words(view).includes('Changes in this structure'));
  assert(words(view).includes('Teaching topics: 1 of 3 changed (function)'));
  assert(words(view).includes('Source fingerprint: unchanged'));
  assert.equal(checkbox().props.checked,true);
  assert.deepEqual(sections().map(topicSummaries),[
    ['function · draft · function title · Changed'],['function · draft · function title · Changed']]);
  const details=walk(view,n=>n.type==='details'&&words(n.props.children).includes('Exact version details'))[0];
  assert(details);assert.equal(details.props.open,undefined);
  assert(words(details).includes('Worksheet SHA / bytes'));assert(words(view).includes('Synthetic source only'));
  assert(walk(view,n=>n.type==='a').some(link=>link.props.href.includes('/viewer/index.html?')));
  assert(calls.every(call=>call.options.credentials==='same-origin'&&call.options.cache==='no-store'));
  assert(calls.every(call=>call.options.method===undefined));
});

test('toggle reveals all topics in matching order; unchanged pair shows honest empty filter',async()=>{
  reset('changed');open();await finish();checkbox().props.onChange({target:{checked:false}});render();
  const expected=['anatomy · draft · anatomy title · Unchanged','function · draft · function title · Changed','ct · draft · ct title · Unchanged'];
  assert.deepEqual(sections().map(topicSummaries),[expected,expected]);
  reset('unchanged');open();await finish();assert(words(view).includes('Teaching topics: 0 of 3 changed'));
  assert.equal(topicSummaries(sections()[0]).length,0);
  assert(words(view).includes('Turn off the filter to inspect all saved topics'));
  checkbox().props.onChange({target:{checked:false}});render();
  assert.deepEqual(sections().map(topicSummaries),[expected.map(x=>x.replace('Changed','Unchanged')),expected.map(x=>x.replace('Changed','Unchanged'))]);
});

test('selection and pair replacement, close, denial and late responses hide stale material and reset filter',async()=>{
  reset();open();await finish();checkbox().props.onChange({target:{checked:false}});render();
  walk(view,n=>n.type==='select')[0].props.onChange({target:{value:ids[1]}});render();
  assert(!words(view).includes('Original function'));await finish(2);assert.equal(checkbox().props.checked,true);
  const replacement=structuredClone(now),prior=structuredClone(old);
  render(replacement,prior);assert(!words(view).includes('Original function'));
  render(replacement,prior);assert(!words(view).includes('Changes in this structure'));
  reset();open();await tick();button('Close comparison').props.onClick();render();calls.forEach(call=>reply(call));await tick();render();
  assert(!words(view).includes('Original function'));
  reset();open();await tick();calls.forEach(call=>reply(call,401));await tick();await tick();render();
  assert(words(view).includes('Saved comparison unavailable'));assert(!words(view).includes('Changes in this structure'));
  assert(calls.every(call=>call.options.method===undefined));
});

test('added and removed topics remain visible with explicit missing counterparts despite saved order changes',async()=>{
  reset('mixed');open();await finish();
  assert(words(view).includes('Teaching topics: 2 of 4 changed (function, pathology)'));
  const [earlier,current]=sections();
  assert.deepEqual(topicSummaries(earlier),['function · draft · function title · Changed']);
  assert.deepEqual(topicSummaries(current),['pathology · draft · pathology title · Changed']);
  assert(words(earlier).includes('pathology · Not present in this saved worksheet.'));
  assert(words(current).includes('function · Not present in this saved worksheet.'));
  const topicRows=article=>React.Children.toArray(walk(article,n=>n.type==='section'&&words(n).startsWith('Teaching topics'))[0].props.children).slice(1).map(node=>words(node).match(/^(anatomy|function|ct|pathology) ·/)[1]);
  assert.deepEqual(topicRows(earlier),['function','pathology']);
  assert.deepEqual(topicRows(current),['function','pathology']);
  checkbox().props.onChange({target:{checked:false}});render();
  const all=['ct','anatomy','function','pathology'];
  assert.deepEqual(topicRows(sections()[0]),all);
  assert.deepEqual(topicRows(sections()[1]),all);
  assert(calls.every(call=>call.options.method===undefined));
});
