import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';

const proposalRoot=resolve(import.meta.dirname,'..');
const websiteRoot=process.env.VM_WEBSITE_ROOT||'F:/VisibleMedicine/website';
const requireWebsite=createRequire(resolve(websiteRoot,'package.json'));
const ts=requireWebsite('typescript');
const React=requireWebsite('react');
const {renderToStaticMarkup}=requireWebsite('react-dom/server');
const read=name=>readFileSync(resolve(proposalRoot,'components',name),'utf8');
const compile=(source,name,imports={})=>{
  const output=ts.transpileModule(source,{fileName:name,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};
  new Function('require','module','exports',output)((id)=>id in imports?imports[id]:requireWebsite(id),module,module.exports);
  return module.exports;
};
const {createAtlasRuntimeExpansion}=compile(read('atlas-runtime-expansion.ts'),'atlas-runtime-expansion.ts');

function fakeEnvironment(){
  const listeners=new Map();
  const calls={request:0,exit:0};
  const doc={fullscreenEnabled:true,fullscreenElement:null,
    addEventListener(type,fn){const set=listeners.get(type)||new Set();set.add(fn);listeners.set(type,set);},
    removeEventListener(type,fn){listeners.get(type)?.delete(fn);},
    fire(type,event){for(const fn of listeners.get(type)||[])fn(event);},
    exitFullscreen(){calls.exit++;doc.fullscreenElement=null;doc.fire('fullscreenchange');return Promise.resolve();},
  };
  const owner={requestFullscreen(){calls.request++;doc.fullscreenElement=owner;doc.fire('fullscreenchange');return Promise.resolve();}};
  const states=[];
  const create=(frame)=>createAtlasRuntimeExpansion({owner,doc,frame,change:state=>states.push(state)});
  return {doc,owner,calls,states,create,listeners};
}
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
function fakeKeyDocument(){
  const listeners=new Map();
  return {listeners,
    addEventListener(type,fn){const set=listeners.get(type)||new Set();set.add(fn);listeners.set(type,set);},
    removeEventListener(type,fn){listeners.get(type)?.delete(fn);},
    fire(type,event){for(const fn of listeners.get(type)||[])fn(event);},
  };
}
const key=(overrides={})=>({key:'Escape',defaultPrevented:false,isComposing:false,repeat:false,...overrides});

test('request is guarded, state follows native fullscreenchange, Escape and owned exit',async()=>{
  const f=fakeEnvironment();
  let release;
  f.owner.requestFullscreen=()=>{f.calls.request++;return new Promise(resolve=>{release=resolve;});};
  const c=f.create();
  c.request();c.request();
  assert.equal(f.calls.request,1);
  assert.equal(c.state.pending,true);
  f.doc.fullscreenElement=f.owner;f.doc.fire('fullscreenchange');release();await flush();
  assert.deepEqual(c.state,{active:true,pending:false,message:null});
  f.doc.fullscreenElement=null;f.doc.fire('fullscreenchange');
  assert.equal(c.state.active,false); // Native Escape does not need a custom key handler.
  c.request();assert.equal(f.calls.request,2);
  f.doc.fullscreenElement=f.owner;f.doc.fire('fullscreenchange');release();await flush();
  c.exit();await flush();
  assert.equal(f.calls.exit,1);
  assert.equal(c.state.active,false);
  c.retire();
});

test('unavailable, unrelated fullscreen and rejected transitions fail closed',async()=>{
  const f=fakeEnvironment();const c=f.create();
  f.doc.fullscreenEnabled=false;c.request();
  assert.match(c.state.message,/unavailable/);assert.equal(f.calls.request,0);
  f.doc.fullscreenEnabled=true;f.doc.fullscreenElement={};c.request();
  assert.match(c.state.message,/Another view/);assert.equal(f.calls.request,0);
  c.exit();assert.equal(f.calls.exit,0);
  f.doc.fullscreenElement=null;
  f.owner.requestFullscreen=()=>Promise.reject(new Error('denied'));
  c.request();await flush();assert.match(c.state.message,/could not change/);
  assert.equal(c.state.pending,false);
  f.doc.fullscreenElement=f.owner;f.doc.fire('fullscreenchange');
  f.doc.exitFullscreen=()=>Promise.reject(new Error('denied'));
  c.exit();await flush();
  assert.equal(c.state.active,true);
  assert.match(c.state.message,/could not change/);
  c.retire();
});

test('retirement removes listeners and exits only the owned container, including late request',async()=>{
  const f=fakeEnvironment();
  let release;
  f.owner.requestFullscreen=()=>new Promise(resolve=>{release=resolve;});
  const c=f.create();c.request();c.retire();
  assert.equal(f.listeners.get('fullscreenchange').size,0);
  assert.equal(f.listeners.get('fullscreenerror').size,0);
  f.doc.fullscreenElement=f.owner;release();await flush();
  assert.equal(f.calls.exit,1);
  const other=f.create();f.doc.fullscreenElement={};other.retire();
  assert.equal(f.calls.exit,1);
});

test('unrelated fullscreen errors do not change this owner and synchronous retirement failure is contained',async()=>{
  const f=fakeEnvironment();
  const c=f.create();
  f.doc.fire('fullscreenerror',{target:{}});
  assert.deepEqual(c.state,{active:false,pending:false,message:null});
  let release;
  f.owner.requestFullscreen=()=>new Promise(resolve=>{release=resolve;});
  c.request();
  f.doc.fire('fullscreenerror',{target:{}});
  assert.equal(c.state.pending,true);
  f.doc.fullscreenElement=f.owner;f.doc.fire('fullscreenchange');
  release();await flush();
  f.doc.exitFullscreen=()=>{throw new Error('denied synchronously');};
  assert.doesNotThrow(()=>c.retire());
  assert.equal(f.listeners.get('fullscreenchange').size,0);
});

test('owned parent and same-origin iframe Escape restore; consumed and irrelevant keys do not',async()=>{
  const f=fakeEnvironment();const child=fakeKeyDocument();
  const c=f.create({contentDocument:child});
  f.doc.fire('keydown',key());await flush();assert.equal(f.calls.exit,0);
  c.request();await flush();
  assert.equal(f.listeners.get('keydown').size,1);
  assert.equal(child.listeners.get('keydown').size,1);
  for(const event of [key({key:'Enter'}),key({repeat:true}),key({isComposing:true}),key({defaultPrevented:true})]){
    child.fire('keydown',event);await flush();
  }
  assert.equal(f.calls.exit,0);
  const menuEscape=key();child.fire('keydown',menuEscape);menuEscape.defaultPrevented=true;
  await flush();assert.equal(f.calls.exit,0);
  child.fire('keydown',key());await flush();
  assert.equal(f.calls.exit,1);
  assert.equal(f.listeners.get('keydown').size,0);
  assert.equal(child.listeners.get('keydown').size,0);
  c.request();await flush();f.doc.fire('keydown',key());await flush();
  assert.equal(f.calls.exit,2);
  c.retire();
});

test('iframe load replacement rebinds only the current document and retirement cleans all keys',async()=>{
  const f=fakeEnvironment();const first=fakeKeyDocument();const second=fakeKeyDocument();
  const frame={contentDocument:first};const c=f.create(frame);
  c.request();await flush();
  assert.equal(first.listeners.get('keydown').size,1);
  frame.contentDocument=second;c.refreshFrame(frame);
  assert.equal(first.listeners.get('keydown').size,0);
  assert.equal(second.listeners.get('keydown').size,1);
  c.refreshFrame({get contentDocument(){throw new Error('cross-origin');}});
  assert.equal(second.listeners.get('keydown').size,0);
  assert.equal(f.listeners.get('keydown').size,1);
  c.refreshFrame(frame);
  assert.equal(second.listeners.get('keydown').size,1);
  c.retire();await flush();
  assert.equal(second.listeners.get('keydown').size,0);
  assert.equal(f.listeners.get('keydown').size,0);
  const exits=f.calls.exit;
  f.doc.fullscreenElement={};f.doc.fire('keydown',key());await flush();
  assert.equal(f.calls.exit,exits);
});

test('live frame rendering retains one iframe and exact source, fallback and opt-out',()=>{
  const frame=compile(read('AtlasRuntimeFrame.tsx'),'AtlasRuntimeFrame.tsx',{
    './atlas-runtime-state':{createAtlasDocumentAttempt:()=>({})},
    './atlas-runtime-expansion':{createAtlasRuntimeExpansion},
    './atlas-runtime-frame.css':{},
    './AtlasBodyLearning':{AtlasBodyLearning:()=>React.createElement('details',{className:'atlas-body-learning'},'Teaching')},
  });
  const src='/anatomy/head-neck/index.html?revision=6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
  const html=renderToStaticMarkup(React.createElement(frame.AtlasRuntimeFrame,{src,title:'Atlas'}));
  assert.equal((html.match(/<iframe\b/g)||[]).length,1);
  assert.match(html,/src="\/anatomy\/head-neck\/index.html\?revision=6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1"/);
  assert.match(html,/allowFullScreen=""/);
  assert.match(html,/Expand viewer/);
  assert.match(html,/atlas-body-learning/);
  assert.match(read('AtlasRuntimeFrame.tsx'),/Open this source full screen/);
  assert.match(read('AtlasRuntimeFrame.tsx'),/<summary aria-label="Viewer help">Help<\/summary>/);
  assert.match(read('AtlasRuntimeFrame.tsx'),/frame:frame\.current/);
  assert.match(read('AtlasRuntimeFrame.tsx'),/expansion\.current\?\.refreshFrame\(event\.currentTarget\)/);
  const optedOut=renderToStaticMarkup(React.createElement(frame.AtlasRuntimeFrame,{src,title:'Atlas',allowFullScreen:false}));
  assert.doesNotMatch(optedOut,/Expand viewer|allowFullScreen/);
  assert.equal((optedOut.match(/<iframe\b/g)||[]).length,1);
  const noDock=compile(read('AtlasRuntimeFrame.tsx'),'AtlasRuntimeFrame.tsx',{
    './atlas-runtime-state':{createAtlasDocumentAttempt:()=>({})},
    './atlas-runtime-expansion':{createAtlasRuntimeExpansion},
    './atlas-runtime-frame.css':{},
    './AtlasBodyLearning':{AtlasBodyLearning:()=>null},
  });
  const noDockHtml=renderToStaticMarkup(React.createElement(noDock.AtlasRuntimeFrame,{src,title:'Atlas'}));
  assert.equal((noDockHtml.match(/<iframe\b/g)||[]).length,1);
  assert.match(noDockHtml,/Expand viewer/);
  assert.doesNotMatch(noDockHtml,/atlas-body-learning/);
});

test('fullscreen CSS explicitly preserves teaching reservations and default styles',()=>{
  const css=read('atlas-runtime-frame.css');
  requireWebsite('postcss').parse(css);
  const preimage=readFileSync(resolve(proposalRoot,'tests','fixtures','atlas-runtime-expansion-before-20261022','atlas-runtime-frame.css.raw'),'utf8');
  assert.ok(css.startsWith(preimage));
  assert.match(css,/\.atlas-runtime-frame:fullscreen \{/);
  assert.match(css,/\.atlas-runtime-frame:fullscreen > iframe/);
  assert.match(css,/\.atlas-runtime-expand \{[\s\S]*?flex-shrink: 0;[\s\S]*?white-space: nowrap;/);
  assert.match(css,/\.atlas-runtime-frame:fullscreen:has\(> \.atlas-body-learning\)/);
  for(const row of ['36px','96px','168px','128px','224px'])assert.match(css,new RegExp(`--atlas-learning-row: ${row.replace('px','px')}`));
  assert.match(css,/bottom: calc\(var\(--atlas-learning-row, 36px\) - 32px\)/);
  assert.match(css,/\.atlas-runtime-frame:has\(> \.atlas-runtime-host-tools\) > \.atlas-body-learning > summary[\s\S]*?width: calc\(100% - 212px\)/);
  assert.match(css,/\.atlas-runtime-frame:not\(:has\(> \.atlas-body-learning\)\) > iframe[\s\S]*?height: calc\(100% - 36px\)/);
  assert.match(css,/\.atlas-runtime-host-tools > \.atlas-runtime-help\[open\][\s\S]*?bottom: 32px/);
  for(const row of [36,96,168,128,224])assert.equal((row-32)+32,row);
});
