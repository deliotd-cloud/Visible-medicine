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
function harness(){
  const doc=new Events();doc.hidden=false;
  const timers=new Map(),sent=[],fetches=[];
  let nextTimer=1,uuid=0,slots=[],cursor=0,pending=[],tree,properties={src:source};
  const browser=new Events();browser.location={href:'https://vm.test/atlas/3d',origin:'https://vm.test'};
  browser.setTimeout=(fn,delay)=>{const timer=nextTimer++;timers.set(timer,{fn,delay});return timer;};
  browser.clearTimeout=timer=>timers.delete(timer);
  const contentWindow={location:{href:frameHref},postMessage:(value,origin)=>sent.push({value,origin})};
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

test('ready, current reply and exact related href require live origin, window and document',()=>{
  const h=harness();h.render();assert.equal(h.sent.length,1);assert.equal(h.sent[0].value.type,'vm-atlas-learning-selection-request');
  assert.equal(h.sent[0].value.revision,manifest.sourceCommit);assert.equal(h.sent[0].value.region,'whole-body');
  assert.equal(h.sent[0].origin,'https://vm.test');assert.equal(h.state(),'waiting');
  const good=h.reply();h.dispatch(good,'https://wrong.test');h.dispatch(good,'https://vm.test',{});h.render();assert.equal(h.state(),'waiting');
  h.element.ownerDocument={};h.dispatch(good);h.element.ownerDocument=h.doc;h.element.src='/other';h.dispatch(good);
  h.element.src=source;h.contentWindow.location.href='https://vm.test/other';h.dispatch(good);h.render();assert.equal(h.state(),'waiting');
  h.contentWindow.location.href=frameHref;h.dispatch(good);h.render();assert.equal(h.state(),'selected');
  const link=h.anchor();assert.match(link.props.href,/^\/learn\/related-structure\?/);
  const query=new URLSearchParams(link.props.href.split('?')[1]);
  assert.equal(query.get('structure'),id);assert.equal(query.get('source'),bundle);
  assert.equal(query.get('atlasRevision'),manifest.sourceCommit);
  assert.equal(link.props.target,'_blank');assert.equal(link.props.rel,'noopener noreferrer');
  assert.equal(h.fetches.length,0);h.unmount();
});

test('ready reload rotates nonce, rejects old session and replay, and accepts newer sequence',()=>{
  const h=harness();h.render();const original=h.reply();
  h.dispatch({type:'vm-atlas-learning-selection-ready',version:1,revision:manifest.sourceCommit,region:'whole-body'});
  assert.equal(h.sent.length,2);assert.notEqual(h.sent[1].value.session,h.sent[0].value.session);
  h.dispatch(original);h.render();assert.equal(h.state(),'waiting');
  h.dispatch(h.reply());h.render();assert.equal(h.state(),'selected');
  h.dispatch(h.reply('empty',{sequence:1}));h.render();assert.equal(h.state(),'selected');
  h.dispatch(h.reply('empty',{sequence:2}));h.render();assert.equal(h.state(),'empty');
  h.element.emit('load');assert.equal(h.sent.length,3);
  h.dispatch(h.reply('selected',{session:h.sent[1].value.session}));h.render();assert.equal(h.state(),'waiting');h.unmount();
});

test('stale render click, hidden page, pagehide and timeout never retain actionable href',()=>{
  const h=harness();h.render();h.dispatch(h.reply());h.render();
  const old=h.anchor();let prevented=0;
  const newTree=h.render(false);const uncommitted=walk(newTree,n=>n.type==='a')[0];
  uncommitted.props.onClick({preventDefault(){prevented++;}});assert.equal(prevented,1);
  h.render();h.doc.hidden=true;h.doc.emit('visibilitychange');h.render();assert.equal(h.state(),'waiting');
  old.props.onClick({preventDefault(){prevented++;}});assert.equal(prevented,2);
  h.doc.hidden=false;h.doc.emit('visibilitychange');assert.equal(h.sent.length,2);
  h.render();h.browser.emit('pagehide');h.render();assert.equal(h.state(),'waiting');
  h.browser.emit('pageshow');assert.equal(h.sent.length,3);h.advance();h.render();assert.equal(h.state(),'blocked');
  assert.equal(h.anchor(),undefined);h.unmount();
  assert.equal(h.browser.count('message'),0);assert.equal(h.browser.count('pagehide'),0);
  assert.equal(h.element.count('load'),0);assert.equal(h.timers.size,0);assert.equal(h.fetches.length,0);
});

test('replaced frame with the same source cannot activate an old link',()=>{
  const h=harness();h.render();h.dispatch(h.reply());h.render();
  const link=h.anchor();assert.ok(link);
  const replacement=new Events();replacement.isConnected=true;replacement.ownerDocument=h.doc;
  replacement.src=source;replacement.getAttribute=key=>key==='src'?source:null;
  replacement.contentWindow={location:{href:frameHref},postMessage(){}};
  replacement.contentDocument={readyState:'complete'};
  h.frame.current=replacement;
  let prevented=0;link.props.onClick({preventDefault(){prevented++;}});
  assert.equal(prevented,1,'Old link must not act after its iframe is replaced');
  h.unmount();
});

test('navigated frame with unchanged src attribute cannot activate an old link',()=>{
  const h=harness();h.render();h.dispatch(h.reply());h.render();
  const link=h.anchor();assert.ok(link);
  h.contentWindow.location.href='https://vm.test/other';
  let prevented=0;link.props.onClick({preventDefault(){prevented++;}});
  assert.equal(prevented,1,'Old link must not act after document navigation');
  h.unmount();
});

test('same-URL document swap rejects old reply and link until a fresh load session',()=>{
  const h=harness();h.render();
  const oldReply=h.reply();
  h.element.contentDocument={readyState:'complete'};
  h.dispatch(oldReply);h.render();assert.equal(h.state(),'waiting','Old session reply cannot select replacement document');
  h.element.emit('load');assert.equal(h.sent.length,2);
  h.dispatch(h.reply());h.render();assert.equal(h.state(),'selected');
  const oldLink=h.anchor();assert.ok(oldLink);
  h.element.contentDocument={readyState:'complete'};
  let prevented=0;oldLink.props.onClick({preventDefault(){prevented++;}});
  assert.equal(prevented,1,'Old anchor cannot outlive its document');
  h.unmount();
});

test('practice, guided, unavailable and empty states expose no related link',()=>{
  for(const [status,reason] of [['blocked','practice'],['blocked','guided'],['blocked','unavailable'],['empty',undefined]]){
    const h=harness();h.render();h.dispatch(h.reply(status,reason?{reason}:{}));h.render();
    assert.equal(h.state(),status);assert.equal(h.anchor(),undefined);
    assert.equal(h.fetches.length,0);h.unmount();
  }
});

test('three wrappers preserve the pinned original behavior with exact additive inverses',()=>{
  const hashes={AtlasRuntimeFrame:'673f6b25ab720fc250b7d55b04fd8571e5b2bc077a5bc1f69e984aabb624b234',HeadAtlasLinkedModel:'c90fd4b9a51a4fa67ef390fb6b79515825fd662160f83cabd127b7283b8d2fab',HeadAtlasGuidedModel:'cfaf695e1e6bd418fe6f2a1416cc18094aab7d7509ecc61396d4f55a37d37499'};
  for(const name of ['AtlasRuntimeFrame','HeadAtlasLinkedModel','HeadAtlasGuidedModel']){
    const original=readFileSync(path.join(featureRoot,`tests/fixtures/live-learning-original-${name}.tsx.raw`));
    assert.equal(createHash('sha256').update(original).digest('hex'),hashes[name]);
    const installed=original.toString().replaceAll('\r\n','\n');
    const candidate=readFileSync(path.join(featureRoot,`components/${name}.tsx`),'utf8').replaceAll('\r\n','\n');
    const beforeLearning=restorePreHeadAccessWrapper(name==='AtlasRuntimeFrame'?restorePreExpansionFrame(candidate):candidate,name);
    const recovered=beforeLearning.replace("import {AtlasBodyLearning} from './AtlasBodyLearning';\n",'')
      .replace(/^[ \t]*<AtlasBodyLearning(?: key=\{frameAttempt\})? frame=\{frame\} src=\{src\}(?: dock="flow")?\/>\n/m,'');
    if(name==='HeadAtlasLinkedModel')assert(candidate.includes('<AtlasBodyLearning key={frameAttempt} frame={frame} src={src} dock="flow"/>'),'Existing iframe retry must remount its independent learning session');
    assert.equal(recovered,installed,`${name} wrapper inverse`);
  }
});

test('a blocked update revokes a retained selected anchor before React commits',()=>{
  for(const reason of ['practice','guided','unavailable']){
    const h=harness();h.render();h.dispatch(h.reply());h.render();const link=h.anchor();assert.ok(link);
    h.dispatch(h.reply('blocked',{reason,sequence:2}));
    let prevented=0;link.props.onClick({preventDefault(){prevented++;}});assert.equal(prevented,1,reason);
    h.render();assert.equal(h.anchor(),undefined);h.unmount();
  }
});
