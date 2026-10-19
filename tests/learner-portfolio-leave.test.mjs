import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),React=require('react');
const built=await build({stdin:{contents:"export {LearnerPortfolio} from './components/LearnerPortfolio';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'cjs',platform:'node',external:['react','react/jsx-runtime']});

test('actual mounted portfolio reads live closed-form drafts and in-flight saves, removing clean unload guards',async()=>{
 const original={window:globalThis.window,FormData:globalThis.FormData,fetch:globalThis.fetch};
 const documentListeners=new Map(),windowListeners=new Map(),timers=new Map(),states=[],refs=[],effects=[];
 let cursor=0,fetchResolve,cleanup;
 const listen=(map,name,fn)=>{if(!map.has(name))map.set(name,new Set());map.get(name).add(fn);};
 const document={location:{href:'https://visiblemedicine.test/my-learning'},addEventListener(name,fn){listen(documentListeners,name,fn);},removeEventListener(name,fn){documentListeners.get(name)?.delete(fn);}};
 const win={document,confirm:()=>false,setTimeout(fn){const id=timers.size+1;timers.set(id,fn);return id;},clearTimeout(id){timers.delete(id);},addEventListener(name,fn){listen(windowListeners,name,fn);},removeEventListener(name,fn){windowListeners.get(name)?.delete(fn);}};
 const form={fields:{resource:'atlas::ct-head',title:'',body:''},reset(){this.fields={resource:'atlas::ct-head',title:'',body:''};}};
 const hooks={...React,useState(initial){const i=cursor++;if(!(i in states))states[i]=initial;return[states[i],v=>{states[i]=typeof v==='function'?v(states[i]):v;}];},useRef(initial){const i=cursor++;if(!(i in refs))refs[i]={current:initial};return refs[i];},useEffect(create){cursor++;effects.push(create);}};
 const module={exports:{}};
 new Function('require','module','exports',built.outputFiles[0].text)(name=>name==='react'?hooks:require(name),module,module.exports);
 globalThis.window=win;globalThis.FormData=class{constructor(target){assert.equal(target,form);}*[Symbol.iterator](){yield*Object.entries(form.fields);}};
 globalThis.fetch=()=>new Promise(resolve=>{fetchResolve=resolve;});
 const walk=(node,predicate)=>{if(Array.isArray(node)){for(const child of node){const found=walk(child,predicate);if(found)return found;}return null;}if(!node?.props)return null;if(predicate(node))return node;return walk(node.props.children,predicate);};
 const render=()=>{cursor=0;return module.exports.LearnerPortfolio({initialPortfolio:{notes:[],reviews:[],completions:[]},resources:[{resourceType:'atlas',resourceId:'ct-head',label:'CT head'}]});};
 const unload=()=>{const event={prevented:false,returnValue:null,preventDefault(){this.prevented=true;}};for(const fn of windowListeners.get('beforeunload')??[])fn(event);return event;};
 const input=()=>{for(const fn of documentListeners.get('input')??[])fn({});};
 try{
  const tree=render();tree.props.ref.current={querySelectorAll(selector){assert.equal(selector,'form.portfolio-form');return[form];}};
  assert.equal(effects.length,1);cleanup=effects[0]();
  assert.equal(windowListeners.get('beforeunload')?.size??0,0,'empty forms do not install an unload listener');
  form.fields.body='Educational draft';input();
  assert.equal(unload().prevented,true);assert.equal(unload().returnValue,'Unsaved learning edits');
  const details=walk(tree,node=>node.type==='details');assert.equal(details.props.open,undefined,'draft remains in a native closed disclosure');
  form.fields.body='';input();assert.equal(windowListeners.get('beforeunload').size,0);
  form.fields.title='Recall';form.fields.body='Submitted draft';
  walk(tree,node=>node.type==='form').props.onSubmit({preventDefault(){},currentTarget:form});
  form.fields.title='';form.fields.body='';input();
  assert.equal(unload().prevented,true,'in-flight request remains protected even after fields are cleared');
  fetchResolve({ok:true,json:async()=>({notes:[],reviews:[],completions:[]})});await new Promise(resolve=>setImmediate(resolve));
  assert.equal(windowListeners.get('beforeunload').size,0,'cleared fields and a confirmed finished save remove the listener');
  assert(walk(render(),node=>node.props.role==='status'));
  cleanup();cleanup=null;assert.equal(documentListeners.get('click').size,0);assert.equal(documentListeners.get('input').size,0);assert.equal(documentListeners.get('change').size,0);
 }finally{cleanup?.();for(const[key,value]of Object.entries(original)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
