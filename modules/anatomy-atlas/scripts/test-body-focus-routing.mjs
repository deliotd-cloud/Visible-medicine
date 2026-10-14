import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {build} from './workspace-test-build.mjs';

const bundled=await build({stdin:{contents:"export * from './lib/body-selection-channel'; export {sourceCanonical} from './lib/body-source-additions';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const protocol=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
function argument(name,index){
 const source=readFileSync('app/body-explorer.tsx','utf8'),tree=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let found;
 function visit(n){if(ts.isCallExpression(n)&&n.expression.getText(tree)===name){assert(!found);found=n.arguments[index];}ts.forEachChild(n,visit);}visit(tree);assert(found);
 return found.getText(tree);
}
const callback=ts.transpileModule('const fn='+argument('useBodyRootSelection',1)+';',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText+'\nreturn fn;';
const stateExpression=argument('useBodyRootSelection',0);
const source='a'.repeat(64),candidate={id:'vm:anatomy:body:leg:left:muscle:left-popliteus',regions:['leg'],laterality:'left',bundle:'muscles',system:'muscles'};
const target={kind:'root',id:candidate.id,source,laterality:'left'};
const stateSource=readFileSync('app/body-selection-channel.tsx','utf8');
const mod={exports:{}},effects=[],listeners=new Map();
const hooks={createContext:()=>({Provider:'provider'}),useContext:()=>null,useMemo:fn=>fn(),useRef:v=>({current:v}),useLayoutEffect:fn=>effects.push(fn)};
const runtime={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
const code=ts.transpileModule(stateSource,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const imports={react:hooks,'react/jsx-runtime':runtime,'../lib/body-selection-channel':protocol,'../lib/body-source-additions':protocol};
new Function('require','module','exports',code)(id=>{assert(Object.hasOwn(imports,id),id);return imports[id];},mod,mod.exports);
function root(overrides={}){
 const calls=[],scope={document:{hidden:false},initialRegion:'leg',exam:false,workspace:{mode:'explore'},guidedLearning:false,inlineStudy:false,displayReady:true,catalog:{structures:[candidate],bundles:[{id:'muscles',sha256:source}]},regionStructures:[candidate],selected:candidate,loaded:['muscles'],failed:[],resolved:{visible:[candidate]},systems:{muscles:true},applySelection:(...args)=>calls.push(args),bodyRootSelection:mod.exports.bodyRootSelection,...overrides};
 return{run:new Function(...Object.keys(scope),callback)(...Object.values(scope)),state:()=>new Function(...Object.keys(scope),'return ('+stateExpression+');')(...Object.values(scope)),calls};
}

test('actual leg/thigh root focus uses unique source identity without changing camera or dissection',()=>{
 for(const initialRegion of ['leg','thigh']){const h=root({initialRegion});assert(h.run(target));assert.deepEqual(h.calls,[[candidate.id,false]]);}
});

test('actual root focus refuses scope, lifecycle, study, source, visibility and ambiguity gates',()=>{
 for(const change of [{document:{hidden:true}},{initialRegion:'head-neck'},{initialRegion:'thorax'},{exam:true},{workspace:{mode:'practice'}},{guidedLearning:true},{inlineStudy:true},{displayReady:false},{catalog:null},{regionStructures:[]},{regionStructures:[candidate,candidate]},{loaded:[]},{failed:['muscles']},{resolved:{visible:[]}},{systems:{muscles:false}},{catalog:{bundles:[{id:'muscles',sha256:'b'.repeat(64)}]}},{catalog:{bundles:[{id:'muscles',sha256:source},{id:'muscles',sha256:source}]}}]){const h=root(change);assert.equal(h.run(target),false,JSON.stringify(change));assert.deepEqual(h.calls,[]);}
 for(const t of [{...target,source:'b'.repeat(64)},{...target,laterality:'right'},{...target,kind:'nested'},{...target,id:'foreign'}]){const h=root();assert.equal(h.run(t),false);assert.deepEqual(h.calls,[]);}
});

test('actual root snapshot expression refuses hidden/removed, unavailable and out-of-side selections',()=>{
 assert.deepEqual(root().state(),{status:'selected',selection:target});
 for(const change of [{exam:true},{workspace:{mode:'practice'}},{guidedLearning:true},{inlineStudy:true},{displayReady:false},{catalog:null},{regionStructures:[]},{loaded:[]},{failed:['muscles']},{resolved:{visible:[]}},{systems:{muscles:false}}])assert.equal(root(change).state().status,'blocked',JSON.stringify(change));
 assert.deepEqual(root({selected:null}).state(),{status:'empty'});
});

test('actual canonical snapshot resolver refuses copied modifications, duplicated identities and cross-region references',()=>{
 const resolve=mod.exports.bodyRootSelection,catalog={structures:[candidate],bundles:[{id:'muscles',sha256:source}]};
 assert.deepEqual(resolve(catalog,{...candidate},'leg'),{status:'selected',selection:target});
 for(const [cat,selection,region]of [[catalog,{...candidate,laterality:'right'},'leg'],[catalog,{...candidate,presentationParts:[{nodeName:'guessed'}]},'leg'],[{...catalog,structures:[candidate,candidate]},candidate,'leg'],[{...catalog,bundles:[...catalog.bundles,...catalog.bundles]},candidate,'leg'],[{...catalog,bundles:[]},candidate,'leg'],[catalog,candidate,'thigh'],[catalog,candidate,'head-neck'],[null,candidate,'leg']])assert.equal(resolve(cat,selection,region).status,'blocked');
});

test('actual provider closes hidden/pagehide sessions and returns with fresh readiness, never stale reports',async()=>{
 const oldWindow=globalThis.window,oldDocument=globalThis.document,messages=[],origin='http://127.0.0.1:3000',revision='f'.repeat(40),session='body-session-12345678';
 const parent={postMessage:(message,where)=>messages.push({message,where})};
 const add=(name,fn)=>{if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn);},remove=(name,fn)=>listeners.get(name)?.delete(fn);
 const emit=(name,event={})=>{for(const fn of [...(listeners.get(name)??[])])fn(event);};
 globalThis.window={parent,location:{origin},addEventListener:add,removeEventListener:remove};globalThis.document={hidden:false,addEventListener:add,removeEventListener:remove};
 let cleanup;try{
  effects.length=0;listeners.clear();const tree=mod.exports.BodySelectionChannel({revision,region:'leg',children:null}),state=tree.props.value;cleanup=effects[0]();state.root({status:'selected',selection:target},()=>true);
  const request={type:protocol.BODY_SELECTION_PROTOCOL+'-request',version:1,revision,region:'leg',session};
  emit('message',{data:request,source:parent,origin});await Promise.resolve();assert.equal(messages.at(-1).message.status,'selected');
  document.hidden=true;emit('visibilitychange');assert.equal(messages.at(-1).message.reason,'unavailable');assert.equal(listeners.get('message').size,0);
  state.root({status:'selected',selection:target},()=>true);await Promise.resolve();const closed=messages.length;emit('message',{data:request,source:parent,origin});await Promise.resolve();assert.equal(messages.length,closed);
  document.hidden=false;emit('visibilitychange');assert.equal(messages.at(-1).message.type,protocol.BODY_SELECTION_PROTOCOL+'-ready');await Promise.resolve();assert.equal(messages.length,closed+1,'No selected state before new handshake');
  const renewed={...request,session:'renewed-session-123456'};emit('message',{data:renewed,source:parent,origin});await Promise.resolve();assert.equal(messages.at(-1).message.session,renewed.session);
  emit('pagehide');assert.equal(messages.at(-1).message.reason,'unavailable');assert.equal(listeners.get('message').size,0);emit('pageshow');assert.equal(messages.at(-1).message.type,protocol.BODY_SELECTION_PROTOCOL+'-ready');
  cleanup();cleanup=null;assert([...listeners.values()].every(v=>v.size===0));const end=messages.length;state.root({status:'selected',selection:target});await Promise.resolve();assert.equal(messages.length,end);
 }finally{cleanup?.();globalThis.window=oldWindow;globalThis.document=oldDocument;listeners.clear();}
});

test('actual provider remains inactive for other regions, and contained specimens bypass both root protocols',()=>{
 for(const region of ['head-neck','abdomen','whole-body','knee','unknown']){effects.length=0;mod.exports.BodySelectionChannel({revision:'f'.repeat(40),region,children:null});assert.equal(effects[0](),undefined);}
 const bootstrap=readFileSync('integration/head-neck/main.tsx','utf8');
 assert.match(bootstrap,/specimen\.status==='ready'[\s\S]+<LowerLimb[\s\S]+: <HeadSelectionChannel/);
 assert.match(bootstrap,/HeadSelectionChannel revision=\{region==='head-neck'\?__VM_HEAD_SOURCE_REVISION__:''\}/);
 assert.match(bootstrap,/<BodySelectionChannel revision=\{__VM_HEAD_SOURCE_REVISION__\} region=\{region\}>/);
});

test('focus refuses an ID duplicated outside the active region or a borrowed regional record',()=>{
 const duplicate={...candidate,regions:['thigh'],bundle:'other'};
 const h=root({catalog:{structures:[candidate,duplicate],bundles:[{id:'muscles',sha256:source}]}});
 assert.equal(h.run(target),false,'Global ambiguity cannot receive an accepted focus');assert.deepEqual(h.calls,[]);
 const borrowed=root({catalog:{structures:[{...candidate}],bundles:[{id:'muscles',sha256:source}]}});
 assert.equal(borrowed.run(target),false,'Regional records must come from the actual canonical catalogue');assert.deepEqual(borrowed.calls,[]);
});
