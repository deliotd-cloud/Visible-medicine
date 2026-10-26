import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createContext,runInContext} from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {restorePreExpansionFrame} from './expansion-frame-adoption-inverse.mjs';
import {restorePreHeadAccessWrapper} from './head-access-wrapper-inverse.mjs';

const testRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=process.env.VM_WEBSITE_ROOT||testRoot;
const featureRoot=process.env.VM_BODY_LEARNING_PROPOSAL?path.join(process.env.VM_BODY_LEARNING_PROPOSAL,'website'):testRoot;
const require=createRequire(path.join(root,'package.json'));
const React=require('react'),{build}=require('esbuild');
const manifest=JSON.parse(readFileSync(path.join(root,'public/atlas-runtime/head-neck/manifest.json'),'utf8'));
const catalog=JSON.parse(readFileSync(path.join(root,'lib/lecture-body-catalog.json'),'utf8'));
const source='/atlas-runtime/head-neck/index.html?region=whole-body&study=1';
const frameHref='https://vm.test'+source;
const id=catalog.rows[0][0];
const bundle=catalog.bundles[catalog.rows[0][6]];
const laterality=id.split(':').find(token=>['left','right','midline','unpaired','unspecified'].includes(token));
const built=await build({entryPoints:[path.join(featureRoot,'components/AtlasBodyLearning.tsx')],bundle:true,write:false,
  format:'cjs',platform:'node',packages:'external',jsx:'automatic',loader:{'.css':'empty'},plugins:[{name:'stage-and-current',setup(b){
    b.onResolve({filter:/^\.\.\/lib\/atlas-body-learning-selection$/},()=>({path:path.join(featureRoot,'lib/atlas-body-learning-selection.ts')}));
    b.onResolve({filter:/^\.\/atlas-runtime-state(?:\.ts)?$/},()=>({path:path.join(root,'components/atlas-runtime-state.ts')}));
    b.onResolve({filter:/^\.\.\/lib\/lecture-body-related-links$/},()=>({path:path.join(root,'lib/lecture-body-related-links.ts')}));
    b.onResolve({filter:/^\.\.\/public\/atlas-runtime\/head-neck\/manifest\.json$/},()=>({path:path.join(root,'public/atlas-runtime/head-neck/manifest.json')}));
    b.onResolve({filter:/^\.\/lecture-body-reference(?:\.ts)?$/},()=>({path:path.join(root,'lib/lecture-body-reference.ts')}));
  }}]});

const walk=(node,p,out=[])=>{if(React.isValidElement(node)){if(p(node))out.push(node);
  React.Children.forEach(node.props.children,child=>walk(child,p,out));}return out;};
class Events{
  #listeners=new Map();
  addEventListener(type,fn){let set=this.#listeners.get(type);if(!set)this.#listeners.set(type,set=new Set());set.add(fn);}
  removeEventListener(type,fn){this.#listeners.get(type)?.delete(fn);}
  emit(type,event={}){for(const fn of [...(this.#listeners.get(type)||[])])fn(event);}
  count(type){return this.#listeners.get(type)?.size??0;}
}
function harness(actualHref=frameHref){
  const doc=new Events();doc.hidden=false;
  const timers=new Map(),sent=[],fetches=[];
  let nextTimer=1,uuid=0,slots=[],cursor=0,pending=[],tree,properties={src:source};
  const browser=new Events();browser.location={href:'https://vm.test/atlas/3d',origin:'https://vm.test'};
  browser.setTimeout=(fn,delay)=>{const timer=nextTimer++;timers.set(timer,{fn,delay});return timer;};
  browser.clearTimeout=timer=>timers.delete(timer);
  const contentWindow={location:{href:actualHref},postMessage:(value,origin)=>sent.push({value,origin})};
  const element=new Events();element.isConnected=true;element.ownerDocument=doc;element.contentWindow=contentWindow;
  element.contentDocument={readyState:'complete'};
  element.getAttribute=key=>key==='src'?element.src:null;element.src=source;
  const frame={current:element};
  const depsSame=(a,b)=>!!a&&!!b&&a.length===b.length&&a.every((x,i)=>Object.is(x,b[i]));
  const shim={...React,
    useRef(initial){const i=cursor++;if(!slots[i])slots[i]={kind:'ref',value:{current:initial}};return slots[i].value;},
    useState(initial){const i=cursor++;if(!slots[i])slots[i]={kind:'state',value:typeof initial==='function'?initial():initial};
      return [slots[i].value,next=>{slots[i].value=typeof next==='function'?next(slots[i].value):next;}];},
    useMemo(fn,deps){const i=cursor++;if(!slots[i]||!depsSame(slots[i].deps,deps))slots[i]={kind:'memo',deps,value:fn()};return slots[i].value;},
    useLayoutEffect(fn,deps){effect('layout',fn,deps);},
    useEffect(fn,deps){effect('passive',fn,deps);},
  };
  function effect(kind,fn,deps){const i=cursor++,prior=slots[i];
    if(!prior||!depsSame(prior.deps,deps)){pending.push({i,kind,fn,prior});slots[i]={kind,deps};}
  }
  const module={exports:{}};
  const realm=createContext({module,exports:module.exports,require:name=>name==='react'?shim:require(name),
    URL,URLSearchParams,window:browser,document:doc,crypto:{randomUUID:()=>`session-${String(++uuid).padStart(24,'0')}`},
    fetch:(...args)=>{fetches.push(args);throw Error('Unexpected fetch');},setTimeout:browser.setTimeout,clearTimeout:browser.clearTimeout});
  runInContext(built.outputFiles[0].text,realm);
  const intoRealm=runInContext('(value)=>JSON.parse(JSON.stringify(value))',realm);
  const Component=module.exports.AtlasBodyLearning;
  function render(commit=true){cursor=0;pending=[];tree=Component({frame,...properties});
    if(commit){for(const kind of ['layout','passive'])for(const item of pending.filter(x=>x.kind===kind)){
      item.prior?.cleanup?.();slots[item.i].cleanup=item.fn();
    }}return tree;
  }
  function reply(status='selected',extra={}){const request=sent.at(-1)?.value;
    const state=status==='selected'?{selection:{kind:'root',id,source:bundle,laterality}}:
      status==='blocked'?{reason:'practice'}:{};
    return {type:'vm-atlas-learning-selection',version:1,revision:manifest.sourceCommit,region:'whole-body',
      session:request?.session,sequence:1,status,...state,...extra};
  }
  const dispatch=(data,origin='https://vm.test',sourceWindow=contentWindow)=>browser.emit('message',{data:intoRealm(data),origin,source:sourceWindow});
  const state=()=>walk(tree,n=>n.type==='details')[0]?.props['data-learning-state'];
  const anchor=()=>walk(tree,n=>n.type==='a')[0];
  const advance=()=>{for(const [key,item] of [...timers]){timers.delete(key);item.fn();}};
  const unmount=()=>{for(const slot of slots)slot?.cleanup?.();};
  return {render,reply,dispatch,state,anchor,advance,unmount,doc,browser,frame,element,contentWindow,timers,sent,fetches,
    setProps(next){properties={...properties,...next};},get tree(){return tree;}};
}


const issue=h=>walk(h.tree,n=>typeof n.props.readContext==='function')[0].props.readContext;
test('problem details require a live acknowledged catalog selection, never the requested URL',()=>{
 const h=harness();h.render();assert.equal(issue(h)(),null);h.dispatch(h.reply());h.render();
 const read=issue(h),value=read();assert.equal(value.atlas,'3D');assert.equal(value.structure.id,id);assert.equal(value.sourceRevision,manifest.sourceCommit);
 assert.deepEqual(Object.keys(value).sort(),['atlas','region','sourceRevision','structure']);
 assert.deepEqual(Object.keys(value.structure).sort(),['id','label']);assert(!JSON.stringify(value).includes('https:'));
 h.element.contentDocument={readyState:'complete'};assert.equal(read(),null);h.unmount();
});
test('practice, retired source, hidden document and unmount refuse copied context',()=>{
 const h=harness();h.render();h.dispatch(h.reply());h.render();const read=issue(h);assert(read());
 h.doc.hidden=true;assert.equal(read(),null);h.doc.hidden=false;
 h.dispatch(h.reply('blocked',{reason:'practice',sequence:2}));assert.equal(read(),null);h.render();assert.equal(issue(h)(),null);
 h.element.emit('load');h.dispatch(h.reply());h.render();const next=issue(h);assert(next());
 h.frame.current={...h.element};assert.equal(next(),null);h.frame.current=h.element;h.unmount();assert.equal(next(),null);
});
test('head problem details use only loaded current manifest anatomy and refuse inactive contexts',()=>{
 const source=readFileSync(path.join(root,'components/HeadAtlasViewer.tsx'),'utf8');
 const a=source.indexOf('  const readIssueContext=useMemo('),b=source.indexOf("  const count=modality==='CT'?355:117;",a);assert(a>0&&b>a);
 const names=['comparisonScopeRef','comparisonScope','importGeneration','document','quizActive','practiceRef','rightPanel','packageOpening','pkg','study','selected','activeEntry','modality','HEAD_MANIFEST_SHA256','headLabel','useMemo'];
 const make=new Function(...names,source.slice(a,b)+'return readIssueContext;');
 function fixture(){const entry={id:'pons',label:'Pons'},comparisonScope={generation:3};return {comparisonScopeRef:{current:comparisonScope},comparisonScope,importGeneration:{current:3},document:{hidden:false},quizActive:false,practiceRef:{current:{active:false}},rightPanel:'info',packageOpening:false,pkg:{filename:'PRIVATE_DO_NOT_COPY'},study:{definition:{entries:[entry]}},selected:{entry,pixels:'PRIVATE_DO_NOT_COPY'},activeEntry:entry,modality:'MRI',HEAD_MANIFEST_SHA256:'a'.repeat(64),headLabel:e=>e.label,useMemo:f=>f()};}
 const s=fixture(),read=make(...names.map(n=>s[n]));assert.deepEqual(read(),{atlas:'MRI',region:'head-neck',sourceRevision:'a'.repeat(64),structure:{id:'pons',label:'Pons'}});
 s.importGeneration.current++;assert.equal(read(),null);
 for(const change of [s=>s.comparisonScopeRef.current=null,s=>s.document.hidden=true,s=>s.quizActive=true,s=>s.practiceRef.current.active=true,s=>s.rightPanel='practice',s=>s.packageOpening=true,s=>s.pkg=null,s=>s.study=null,s=>s.selected=null,s=>s.activeEntry={...s.activeEntry},s=>s.study.definition.entries=[]]){const s=fixture();change(s);assert.equal(make(...names.map(n=>s[n]))(),null);}
});
