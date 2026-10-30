/* oxlint-disable react-hooks/rules-of-hooks -- controlled actual-component commit harness */
import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {runInNewContext} from 'node:vm';import {test} from 'node:test';import {build} from 'esbuild';
const require=createRequire(import.meta.url),React=require('react');
let slots=[],cursor=0,calls=[],cleanup,view,oldActionRef,focus=[];
let nextId=0;
const document={activeElement:null},refreshNode={isConnected:true,focus(options){focus.push(options);document.activeElement=this;}},actionNode={isConnected:true};
const shim={...React,
 useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];},
 useRef(initial){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},
 useId(){const i=cursor++;if(!(i in slots))slots[i]=`inbox-harness-${++nextId}`;return slots[i];},
 useEffect(fn,deps){const i=cursor++,prior=slots[i];if(!prior||!deps||deps.some((v,n)=>!Object.is(v,prior.deps?.[n]))){prior?.dispose?.();const dispose=fn();slots[i]={deps,dispose};cleanup = () => { for (const slot of slots) slot?.dispose?.(); };}},
};
const built=await build({stdin:{contents:"export {ClinicalReviewInbox} from './components/ClinicalReviewInbox';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',packages:'external',alias:{'@':process.cwd()},loader:{'.css':'empty'}}),scope={exports:{}};
runInNewContext(built.outputFiles[0].text,{module:scope,exports:scope.exports,AbortController,Headers,Response,URL,structuredClone,document,window:{location:{reload(){throw Error('Unexpected navigation');}}},fetch(url,options){return new Promise(resolve=>calls.push({url,options,resolve}));},require:name=>name==='react'?shim:require(name)});
const walk=(n,p,out=[])=>{if(React.isValidElement(n)){if(p(n))out.push(n);React.Children.forEach(n.props.children,c=>walk(c,p,out));}return out;};
const words=n=>typeof n==='string'||typeof n==='number'?String(n):!n?'':Array.isArray(n)?n.map(words).join(''):words(n.props?.children);
const button=label=>walk(view,n=>n.type==='button'&&words(n)===label)[0];
function render(){cursor=0;view=scope.exports.ClinicalReviewInbox();const refresh=button('Refresh reviews');if(refresh?.props.ref)refresh.props.ref.current=refreshNode;oldActionRef?.(null);const action=walk(view,n=>n.type==='button'&&(words(n)==='Pause'||words(n).startsWith('Resume from page')))[0];oldActionRef=action?.props.ref;oldActionRef?.(actionNode);return view;}
const tick=()=>new Promise(resolve=>setImmediate(resolve)),sha=c=>c.repeat(64),context=sha('a'),revision=sha('b');
const item=i=>({key:'row-'+i,title:'Synthetic '+i,area:'structures',scopeLabel:'Body',href:'/workspace/atlas-review?selection=row-'+i,trackLabel:'Anatomy',revision:sha('c'),status:'not-started',capability:'decision'});
const batch=(page,token=context)=>({ok:true,status:200,headers:new Headers({'X-Clinical-Review-Context':token}),json:async()=>({schema:'vm-clinical-inbox-1',scope:'private-to-signed-in-account-and-institution',catalogRevision:revision,page,pageCount:2,selectionTotal:60,nextPage:page===1?2:null,items:Array.from({length:page===1?50:10},(_,i)=>item(i+(page===1?0:50))),approval:false})});
function finish(){cleanup?.();cleanup=null;oldActionRef?.(null);oldActionRef=null;document.activeElement=null;}
async function begin(){finish();slots=[];calls=[];focus=[];render();render();assert.equal(calls.length,1);calls[0].resolve(batch(1));await tick();render();assert.equal(calls.length,2);assert(button('Pause'));assert.equal(focus.length,0);}
function controlPosition(control){return walk(view,n=>n.props.className==='clinical-review-inbox-controls')[0].props.children.indexOf(control);}

test('Pause and Resume keep the same keyed button position and explicit generation-bound actions',async()=>{
 await begin();const pause=button('Pause'),position=controlPosition(pause),key=pause.key;
 pause.props.onClick();render();const resume=button('Resume from page 2');assert(resume);assert.equal(controlPosition(resume),position);assert.equal(resume.key,key);assert(key);
 assert.equal(calls[1].options.signal.aborted,true);pause.props.onClick();assert.equal(calls.length,2);
 resume.props.onClick();render();assert(button('Pause'));assert.equal(controlPosition(button('Pause')),position);assert.equal(button('Pause').key,key);assert.equal(calls.length,3);
 resume.props.onClick();assert.equal(calls.length,3,'retained previous control cannot start another scan');finish();
});

test('successful completion hands owned scan focus to existing Refresh exactly once without scrolling',async()=>{
 await begin();document.activeElement=actionNode;calls[1].resolve(batch(2));await tick();render();
 assert.equal(button('Pause'),undefined);assert(button('Refresh reviews'));assert.equal(document.activeElement,refreshNode);assert.equal(focus.length,1);assert.equal(focus[0].preventScroll,true);render();assert.equal(focus.length,1);finish();
});

test('background completion never takes focus from a different control',async()=>{
 await begin();const search={};document.activeElement=search;calls[1].resolve(batch(2));await tick();render();assert.equal(document.activeElement,search);assert.deepEqual(focus,[]);finish();
});

test('invalid access or source context removes rows without a completion focus handoff',async()=>{
 for(const response of [{ok:false,status:401,headers:new Headers()},batch(2,sha('d'))]){
  await begin();const old=button('Pause'),before=calls.length;document.activeElement=actionNode;calls[1].resolve(response);await tick();render();
  assert(words(view).includes('Scan invalidated'));assert(!button('Pause'));assert(!button('Refresh reviews'));assert.equal(walk(view,n=>n.type==='ol').length,0);assert.deepEqual(focus,[]);
  old.props.onClick();assert.equal(calls.length,before);finish();
 }
});

test('HTTP failure retains the same Resume node and retry cursor rather than resetting the scan',async()=>{
 await begin();const before=button('Pause'),position=controlPosition(before);calls[1].resolve({ok:false,status:503,headers:new Headers()});await tick();render();
 const resume=button('Resume from page 2');assert(resume);assert.equal(resume.key,before.key);assert.equal(controlPosition(resume),position);resume.props.onClick();render();assert.equal(calls[2].url,calls[1].url);assert.deepEqual(focus,[]);finish();
});

test('retained Refresh and scan callbacks are retired by generation changes and unmount',async()=>{
 await begin();const refresh=button('Refresh reviews'),pause=button('Pause');pause.props.onClick();render();refresh.props.onClick();assert.equal(calls.length,2);
 const currentRefresh=button('Refresh reviews'),resume=button('Resume from page 2');cleanup();cleanup=null;currentRefresh.props.onClick();resume.props.onClick();assert.equal(calls.length,2);oldActionRef?.(null);assert.deepEqual(focus,[]);finish();
});

test('one bounded pager follows its live summary and precedes the 24 review rows',async()=>{
 await begin();const all=walk(view,()=>true),summary=walk(view,n=>n.props.id==='clinical-review-inbox-results-summary')[0],list=walk(view,n=>n.type==='ol')[0],pagers=walk(view,n=>n.type==='nav'&&n.props['aria-label']==='Inbox rows');
 assert.equal(pagers.length,1);assert(all.indexOf(summary)<all.indexOf(pagers[0]));assert(all.indexOf(pagers[0])<all.indexOf(list));assert.equal(walk(list,n=>n.type==='li').length,24);
 assert.equal(button('Previous').props.disabled,true);assert.equal(button('Next').props['aria-controls'],list.props.id);assert.equal(button('Next').props['aria-label'],'Next page of review results');finish();
});
