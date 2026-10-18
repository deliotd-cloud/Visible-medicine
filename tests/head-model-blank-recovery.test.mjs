import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {HEAD_SELECTION_PROTOCOL,parseHeadSelection} from '../lib/head-live-selection.ts';

const require=createRequire(import.meta.url),ts=require('typescript'),jsx=require('react/jsx-runtime');
const revision='f'.repeat(40),origin='https://atlas.test';
const compile=path=>ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),
  {compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function load(code,imports){
  const module={exports:{}};
  new Function('require','module','exports',code)(id=>{assert(Object.hasOwn(imports,id),`Unexpected import ${id}`);return imports[id];},module,module.exports);
  return module.exports;
}
const nav=load(compile('../components/HeadAtlasComparisonNavigation.tsx'),{
  'next/navigation':{useRouter:()=>({push(){throw Error('Recovery must not navigate');}})},
  '../lib/head-link-availability.ts':{headLinksCurrent:()=>true,HEAD_LINK_REVISION_NOTICE:'Unavailable'},
  '../lib/head-atlas-links':{headAtlasConceptOptions:()=>[],headConceptById:()=>null,HEAD_LINK_REVISION:revision},
  '../lib/head-atlas-navigation.ts':{headImageHref:()=>null},
  '../lib/lecture-related-links':{relatedLectureHref:()=>null},
  './HeadAtlasLearningPicker':{HeadAtlasLearningPicker:()=>null},
  './LearningResourceStatus.ts':{LearningResourceStatus:()=>null,LearningStatusKey:()=>null},
  'react/jsx-runtime':jsx,
}).HeadAtlasComparisonNavigation;
function find(value,predicate){
  if(Array.isArray(value)){for(const item of value){const found=find(item,predicate);if(found)return found;}return null;}
  if(!value||typeof value!=='object'||!('props'in value))return null;
  return predicate(value)?value:find(value.props.children,predicate);
}

function harness(initialHref='about:blank'){
  const previousWindow=Object.getOwnPropertyDescriptor(globalThis,'window');
  const previousDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
  const previousCrypto=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  const document={};
  let sessionNumber=0,timerNumber=0,dirty=false,cursor=0,frameNode=null,frameElement=null,tree=null;
  let props={src:'/atlas-runtime/head-neck/index.html?region=head-neck',sourceRevision:revision,coverage:null};
  const states=[],refs=[],effects=new Map(),layouts=new Map(),pending=[],pendingLayouts=[];
  const timers=new Map(),listeners=new Set(),sent=[];
  const window={location:{origin,href:origin+'/atlas/head-neck-3d'},
    setTimeout(callback,delay){assert.equal(delay,15000);timers.set(++timerNumber,callback);return timerNumber;},
    clearTimeout(id){timers.delete(id);},
    addEventListener(name,listener){assert.equal(name,'message');listeners.add(listener);},
    removeEventListener(name,listener){assert.equal(name,'message');listeners.delete(listener);},
    history:{pushState(){throw Error('Recovery must not write history');},replaceState(){throw Error('Recovery must not write history');}},
    localStorage:{setItem(){throw Error('Recovery must not write storage');}},
  };
  Object.defineProperty(globalThis,'window',{configurable:true,value:window});
  Object.defineProperty(globalThis,'document',{configurable:true,value:document});
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{randomUUID:()=>`session-${++sessionNumber}`}});
  const same=(a,b)=>!!a&&a.length===b.length&&a.every((item,index)=>Object.is(item,b[index]));
  const hooks={
    useState(initial){const index=cursor++;if(!(index in states))states[index]=initial;
      return [states[index],next=>{const value=typeof next==='function'?next(states[index]):next;if(!Object.is(value,states[index])){states[index]=value;dirty=true;}}];},
    useRef(initial){const index=cursor++;if(!(index in refs))refs[index]={current:initial};return refs[index];},
    useEffect(create,deps){const index=cursor++,prior=effects.get(index);if(!same(prior?.deps,deps))pending.push(()=>{
      prior?.cleanup?.();const cleanup=create();effects.set(index,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});
    });},
    useLayoutEffect(create,deps){const index=cursor++,prior=layouts.get(index);if(!same(prior?.deps,deps))pendingLayouts.push(()=>{
      prior?.cleanup?.();const cleanup=create();layouts.set(index,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});
    });},
  };
  const linked=load(compile('../components/HeadAtlasLinkedModel.tsx'),{
    react:hooks,
    '../lib/head-live-selection':{HEAD_SELECTION_PROTOCOL,parseHeadSelection},
    '../lib/head-atlas-import':{HEAD_MANIFEST_SHA256:revision},
    '../lib/head-link-availability.ts':{headLinksCurrent:()=>true},
    '../lib/head-learning-resource-availability.ts':{headReferenceLearningAvailable:()=>false},
    './HeadAtlasComparisonNavigation':{HeadAtlasComparisonNavigation:nav},
    './HeadAtlasReferenceTeaching':{HeadAtlasReferenceTeaching:()=>null},
    './useVerifiedFacialTeaching':{FACIAL_CONCEPTS:new Set(),useVerifiedFacialTeaching:()=>false},
    'react/jsx-runtime':jsx,
  }).HeadAtlasLinkedModel;
  function makeFrame(node,href){
    const contentWindow={location:{href},postMessage(packet,target){assert.equal(target,origin);sent.push({packet,target,source:contentWindow});}};
    const element={isConnected:true,ownerDocument:document,contentWindow,_src:node.props.src,
      contentDocument:{readyState:'complete',body:{childElementCount:href==='about:blank'?0:1,textContent:href==='about:blank'?'':'loaded'}},
      getAttribute(name){assert.equal(name,'src');return this._src;}};
    return element;
  }
  function prepare(nextProps){
      dirty=false;cursor=0;pending.length=0;pendingLayouts.length=0;tree=linked(nextProps);
      const nextFrame=find(tree,node=>node.type==='iframe');assert(nextFrame);
      if(!frameNode||nextFrame.key!==frameNode.key){
        if(frameElement)frameElement.isConnected=false;
        frameElement=makeFrame(nextFrame,frameNode? 'about:blank':initialHref);
      }
      frameNode=nextFrame;frameElement._src=nextFrame.props.src;frameNode.props.ref.current=frameElement;
      for(const effect of pendingLayouts)effect();
  }
  function render(patch={}){
    props={...props,...patch};
    for(let round=0;round<12;round++){
      prepare(props);
      for(const effect of pending)effect();
      if(!dirty)return;
    }
    throw Error('Unstable synthetic render');
  }
  function renderThroughLayout(patch={}){
    props={...props,...patch};prepare(props);
    const remaining=[...pending];
    return ()=>{for(const effect of remaining)effect();if(dirty)render();};
  }
  function speculative(patch={}){
    const savedTree=tree,savedCursor=cursor;
    cursor=0;pending.length=0;pendingLayouts.length=0;linked({...props,...patch});
    cursor=savedCursor;pending.length=0;pendingLayouts.length=0;tree=savedTree;
  }
  function navigation(){const element=find(tree,node=>node.type===nav);assert(element);return nav(element.props);}
  function button(label){return find(navigation(),node=>node.type==='button'&&node.props.children===label);}
  function click(button){assert(button);let focused=0;button.props.onClick({currentTarget:{closest:()=>({focus(){focused++;}})}});assert.equal(focused,1);render();}
  function fail(){const job=[...timers.values()][0];assert(job);job();render();}
  function deliver(data,source=frameElement.contentWindow,from=origin){for(const listener of [...listeners])listener({data,source,origin:from});render();}
  function dispose(){for(const effect of layouts.values())effect.cleanup?.();for(const effect of effects.values())effect.cleanup?.();
    if(previousWindow)Object.defineProperty(globalThis,'window',previousWindow);else delete globalThis.window;
    if(previousDocument)Object.defineProperty(globalThis,'document',previousDocument);else delete globalThis.document;
    if(previousCrypto)Object.defineProperty(globalThis,'crypto',previousCrypto);else delete globalThis.crypto;
  }
  render();
  return {render,renderThroughLayout,speculative,navigation,button,click,fail,deliver,dispose,sent,timers,listeners,
    get frame(){return frameNode;},get element(){return frameElement;},get props(){return props;},get sessions(){return sessionNumber;}};
}

test('loaded unavailable document retains its iframe and ordinary comparison retry',()=>{
  const h=harness(origin+'/atlas-runtime/head-neck/index.html?region=head-neck');
  try{
    const original=h.element,key=h.frame.key;h.fail();
    assert(h.button('Retry comparison'));assert.equal(h.button('Retry opening model'),null);
    h.click(h.button('Retry comparison'));
    assert.equal(h.element,original);assert.equal(h.frame.key,key);
    const session=h.sent.at(-1).packet.session;
    h.deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision,session,sequence:1,status:'empty'});
    assert.match(JSON.stringify(h.navigation()),/Select mapped anatomy/);
    assert.equal(h.element,original,'normal selection leaves the frame mounted');
  }finally{h.dispose();}
});

test('blank unavailable document offers one explicit exact-source remount and retires late callbacks',()=>{
  const h=harness();
  try{
    h.fail();const oldFrame=h.frame,oldElement=h.element,oldSession=h.sent.at(-1).packet.session;
    const retry=h.button('Retry opening model');assert(retry);
    assert.equal(retry.props.type,'button');assert(h.button('Retry comparison'));
    const oldLoad=oldFrame.props.onLoad,oldError=oldFrame.props.onError;
    h.click(retry);
    const afterClick=h.frame.key;
    assert.notEqual(afterClick,oldFrame.key);assert.equal(h.frame.props.src,h.props.src);
    assert.equal(oldElement.isConnected,false);assert.equal(h.button('Retry opening model'),null);
    retry.props.onClick({currentTarget:{closest:()=>({focus(){}})}});h.render();
    assert.equal(h.frame.key,afterClick,'retained callback cannot remount a second time');
    const newSession=h.sent.at(-1).packet.session,requests=h.sent.length;
    oldLoad();oldError();h.render();
    assert.equal(h.sent.length,requests,'retired callbacks cannot reconnect');
    h.deliver({type:HEAD_SELECTION_PROTOCOL+'-ready',version:1,revision},oldElement.contentWindow);
    assert.equal(h.sent.length,requests,'retired frame ready packet cannot reconnect');
    h.deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision,session:oldSession,sequence:1,status:'empty'},oldElement.contentWindow);
    assert.match(JSON.stringify(h.navigation()),/Connecting to the model selection/);
    h.deliver({type:HEAD_SELECTION_PROTOCOL+'-ready',version:1,revision:'a'.repeat(40)});
    assert.equal(h.sent.length,requests,'wrong revision cannot acknowledge');
    h.deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision,session:newSession,sequence:1,status:'empty'});
    assert.equal(h.button('Retry opening model'),null);
    assert.equal(h.frame.key,afterClick,'accepted selection does not remount');
  }finally{h.dispose();}
});

test('only an accessible current empty about:blank document exposes model recovery',()=>{
  for(const makeInvalid of [
    element=>{element.contentWindow.location.href=origin+'/atlas-runtime/head-neck/index.html';},
    element=>{element.contentDocument.body.textContent='loaded';},
    element=>{element.contentDocument.readyState='loading';},
    element=>{element.isConnected=false;},
    element=>{element.getAttribute=()=>'/different-model';},
    element=>{Object.defineProperty(element.contentWindow,'location',{get(){throw Error('cross origin');}});},
  ]){
    const h=harness();
    try{makeInvalid(h.element);h.fail();assert.equal(h.button('Retry opening model'),null);assert(h.button('Retry comparison'));}
    finally{h.dispose();}
  }
});

test('stale recovery callbacks cannot remount after either supplied source or revision changes',()=>{
  const h=harness();
  try{
    h.fail();const stale=h.button('Retry opening model');assert(stale);
    const retained=h.element;
    h.render({src:h.props.src+'&study=2'});
    assert.equal(h.element,retained,'ordinary source change does not key-remount the frame');
    let key=h.frame.key,sessions=h.sessions;
    stale.props.onClick({currentTarget:{closest:()=>({focus(){}})}});h.render();
    assert.equal(h.frame.key,key);assert.equal(h.sessions,sessions);
    assert.equal(h.button('Retry opening model'),null);
    h.fail();const staleRevision=h.button('Retry opening model');assert(staleRevision);
    h.render({sourceRevision:'e'.repeat(40)});
    assert.equal(h.element,retained,'ordinary revision change does not key-remount the frame');
    key=h.frame.key;sessions=h.sessions;
    staleRevision.props.onClick({currentTarget:{closest:()=>({focus(){}})}});h.render();
    assert.equal(h.frame.key,key);assert.equal(h.sessions,sessions);
    assert.equal(h.button('Retry opening model'),null);
  }finally{h.dispose();}
});

test('discarded speculative identity cannot retire the visible timeout or recovery callback',()=>{
  const h=harness();
  try{
    const visible=h.element,listener=[...h.listeners][0];
    h.speculative({src:'/atlas-runtime/other/index.html',sourceRevision:'e'.repeat(40)});
    assert.equal([...h.listeners][0],listener);
    h.fail();
    const retry=h.button('Retry opening model');assert(retry);
    h.speculative({src:'/atlas-runtime/other/index.html'});
    h.click(retry);
    assert.notEqual(h.element,visible,'visible committed retry remains actionable');
  }finally{h.dispose();}
});

test('same-identity rerender keeps the listener and routes timeout to latest committed action',()=>{
  const h=harness();
  try{
    const listener=[...h.listeners][0],requests=h.sent.length;
    h.render({title:'Updated anatomy model'});
    assert.equal([...h.listeners][0],listener);
    assert.equal(h.sent.length,requests,'rerender does not reconnect');
    h.fail();
    assert(h.button('Retry opening model'),'previous timeout reaches current committed action');
  }finally{h.dispose();}
});

test('committed source and revision retire old frame callbacks before passive cleanup',()=>{
  for(const patch of [{src:'/atlas-runtime/head-neck/another.html'},{sourceRevision:'e'.repeat(40)}]){
    const h=harness();
    try{
      h.fail();
      const staleRetry=h.button('Retry opening model');assert(staleRetry);
      const oldFrame=h.frame,oldSource=h.element.contentWindow,oldSession=h.sent.at(-1).packet.session;
      const listener=[...h.listeners][0],requests=h.sent.length,key=h.frame.key;
      const finish=h.renderThroughLayout(patch);
      assert.equal([...h.listeners][0],listener,'passive cleanup has not yet run');
      oldFrame.props.onLoad();oldFrame.props.onError();
      staleRetry.props.onClick({currentTarget:{closest:()=>({focus(){}})}});
      listener({origin,source:oldSource,data:{type:HEAD_SELECTION_PROTOCOL+'-ready',version:1,revision}});
      listener({origin,source:oldSource,data:{type:HEAD_SELECTION_PROTOCOL,version:1,revision,session:oldSession,sequence:1,status:'empty'}});
      assert.equal(h.sent.length,requests,'old callbacks and messages are inert in layout gap');
      assert.equal(h.frame.key,key,'old retry cannot remount during layout gap');
      finish();
      assert.equal(h.listeners.size,1);
      assert.equal(h.sent.length,requests+1,'new identity connects after passive setup');
      assert.equal(h.button('Retry opening model'),null);
    }finally{h.dispose();}
  }
});
