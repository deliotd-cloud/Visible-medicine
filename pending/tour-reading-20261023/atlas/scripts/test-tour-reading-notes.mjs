import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import ts from 'typescript';
import {build} from './workspace-component-test-build.mjs';

const require=createRequire(import.meta.url);
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const bundled=await build({stdin:{contents:"export {TourReadingNotes} from './app/tour-reading-notes'; export {regionalTours,regionalTourLimitations} from './lib/regional-tours';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'cjs',platform:'node'});
const module={exports:{}};
runInNewContext(bundled.outputFiles[0].text,{module,exports:module.exports,require,URL});
const {TourReadingNotes,regionalTours,regionalTourLimitations}=module.exports;
const children=node=>node?.props?.children;
const array=value=>value==null?[]:Array.isArray(value)?value:[value];
const walk=node=>node==null?[]:Array.isArray(node)?node.flatMap(walk):typeof node==='object'?[node,...walk(children(node))]:[];
const text=node=>node==null?'':Array.isArray(node)?node.map(text).join(''):typeof node==='object'?text(children(node)):String(node);
const plain=value=>JSON.parse(JSON.stringify(value));
const find=(node,predicate)=>walk(node).filter(predicate);
const byClass=(node,name)=>find(node,item=>item.props?.className===name);

test('the real component preserves every registered tour stop, order, reference and limitation',()=>{
  assert.equal(regionalTours.length,53);
  assert.equal(regionalTours.reduce((n,tour)=>n+tour.steps.length,0),317);
  let stops=0,references=0,limitations=0;
  for(const tour of regionalTours){
    let reads=0;
    const tree=TourReadingNotes({tour,onRead(){reads++;}});
    assert.equal(reads,0,'Rendering cannot pause or navigate');
    assert.equal(tree.type,'details');
    assert.equal(tree.props.open,undefined,'Native disclosure starts collapsed');
    assert.equal(tree.props.className,'tour-reading-notes');
    assert.equal(text(find(tree,node=>node.type==='summary')[0]),`Read tour notes · ${tour.steps.length} ${tour.steps.length===1?'step':'steps'}`);
    const ordered=find(tree,node=>node.type==='ol');
    assert.equal(ordered.length,1);
    const rows=array(children(ordered[0]));
    assert.equal(rows.length,tour.steps.length);
    for(const [index,step] of tour.steps.entries()){
      const row=rows[index];
      assert.equal(row.type,'li');assert.equal(row.key,step.id);
      assert.equal(text(find(row,node=>node.type==='h3')[0]),step.title);
      assert.equal(text(find(row,node=>node.type==='p')[0]),step.caption);
      const anchors=find(row,node=>node.type==='a');
      assert.deepEqual(plain(anchors.map(anchor=>anchor.props.href)),plain(step.references));
      for(const anchor of anchors){
        const url=new URL(anchor.props.href);
        assert(['http:','https:'].includes(url.protocol));
        assert.equal(url.username,'');assert.equal(url.password,'');
        assert.equal(anchor.props.target,'_blank');
        assert.match(anchor.props.rel,/\bnoopener\b/);assert.match(anchor.props.rel,/\bnoreferrer\b/);
      }
      references+=anchors.length;stops++;
    }
    const limits=byClass(tree,'tour-reading-limits');
    assert.equal(limits.length,1);
    assert.equal(text(limits[0]),regionalTourLimitations(tour));
    if(tour.limitations)limitations++;
    const html=renderToStaticMarkup(React.createElement(TourReadingNotes,{tour,onRead(){reads++;}}));
    assert.equal(reads,0,'Server render cannot call onRead');
    assert.match(html,/class="tour-reading-notes"/);
    assert.doesNotMatch(html,/<details[^>]*\sopen(?:\s|=|>)/);
  }
  console.log(JSON.stringify({tours:regionalTours.length,stops,references,limitations}));
});

test('opening, focus and pointer reading pause; close and render remain inert',()=>{
  const calls=[];
  const tree=TourReadingNotes({tour:regionalTours[0],onRead(){calls.push('read');}});
  tree.props.onToggle({currentTarget:{open:false}});assert.deepEqual(calls,[]);
  tree.props.onToggle({currentTarget:{open:true}});
  tree.props.onFocusCapture({});tree.props.onPointerDownCapture({});
  assert.deepEqual(calls,['read','read','read']);
  assert.equal(tree.props.onBlur,undefined);
});

test('Escape closes only connected, unconsumed, non-composing open disclosure',()=>{
  const tree=TourReadingNotes({tour:regionalTours[0],onRead(){}});
  function fixture(overrides={}){
    const calls=[];
    const summary={focus(options){assert.equal(details.open,false);assert.deepEqual(plain(options),{preventScroll:true});calls.push('focus');}};
    const details={open:true,isConnected:true,querySelector(selector){assert.equal(selector,'summary');return summary;}};
    const event={key:'Escape',defaultPrevented:false,nativeEvent:{isComposing:false},currentTarget:details,preventDefault(){calls.push('prevent');},stopPropagation(){calls.push('stop');},...overrides};
    return {calls,details,event};
  }
  const valid=fixture();tree.props.onKeyDown(valid.event);
  assert.equal(valid.details.open,false);assert.deepEqual(valid.calls,['prevent','stop','focus']);
  tree.props.onKeyDown(valid.event);assert.deepEqual(valid.calls,['prevent','stop','focus']);
  for(const overrides of [{key:'Enter'},{defaultPrevented:true},{nativeEvent:{isComposing:true}}]){
    const item=fixture(overrides);tree.props.onKeyDown(item.event);
    assert.equal(item.details.open,true);assert.deepEqual(item.calls,[]);
  }
  for(const field of ['open','isConnected']){
    const item=fixture();item.details[field]=false;tree.props.onKeyDown(item.event);
    assert.deepEqual(item.calls,[]);
  }
});

test('dangerous or credential-bearing references never become links',()=>{
  const unsafe=['javascript:alert(1)','data:text/html,payload','/relative','//example.org/path','https://user:pass@example.org/','http://user@example.org/','ftp://example.org/','https://example.org@evil.test/'];
  const tour={...regionalTours[0],steps:[{...regionalTours[0].steps[0],references:[...unsafe,'https://example.org/safe','http://example.org/safe']}]};
  const tree=TourReadingNotes({tour,onRead(){}});
  assert.deepEqual(plain(find(tree,node=>node.type==='a').map(node=>node.props.href)),['https://example.org/safe','http://example.org/safe']);
  const html=renderToStaticMarkup(React.createElement(TourReadingNotes,{tour,onRead(){}}));
  assert.equal((html.match(/<a\s/g)||[]).length,2);
  assert.doesNotMatch(html,/href="(?:javascript:|data:|ftp:|\/|https?:\/\/user)/);
});

test('parent gates unresolved source and synchronously suspends before revoking playback',async()=>{
  const path=new URL('../app/regional-guided-learning.tsx',import.meta.url);
  const source=await readFile(path,'utf8');
  const ast=ts.createSourceFile(path.pathname,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const occurrences=[];
  function visit(node){
    if(ts.isJsxSelfClosingElement(node)&&node.tagName.getText(ast)==='TourReadingNotes')occurrences.push(node);
    ts.forEachChild(node,visit);
  }
  visit(ast);assert.equal(occurrences.length,1);
  const element=occurrences[0];
  const parent=element.parent;
  assert(ts.isBinaryExpression(parent)&&parent.operatorToken.kind===ts.SyntaxKind.AmpersandAmpersandToken);
  assert.equal(parent.left.getText(ast),'!resolved.error');
  const attributes=Object.fromEntries(element.attributes.properties.map(attr=>[attr.name.getText(ast),attr]));
  assert.equal(attributes.key.initializer.expression.getText(ast),'scope.key');
  assert.equal(attributes.tour.initializer.expression.getText(ast),'tour');
  const callback=attributes.onRead.initializer.expression.getText(ast);
  const code=ts.transpileModule(`(${callback})`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  for(const current of [false,true]){
    const calls=[];
    const handler=runInNewContext(code,{isCurrentAction(){calls.push('guard');return current;},pausedImaging:{suspend(){calls.push('suspend');}},revokePlayback(){calls.push('revoke');}});
    handler();assert.deepEqual(calls,current?['guard','suspend','revoke']:['guard']);
  }
});

test('committed parent reader pauses synchronously; retired reader and unresolved source cannot act',async()=>{
  // Only the GPU scene and deferred teaching boundary are replaced. Parent,
  // reader, resolver, tour, and callback are the bundled application source.
  const parentBuild=await build({stdin:{contents:"export {RegionalGuidedLearning} from './app/regional-guided-learning'; export {thoraxTour} from './lib/regional-tours'; export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'cjs',platform:'node',loader:{'.css':'empty'},plugins:[{name:'scene-and-teaching-boundaries',setup(api){
    api.onLoad({filter:/[\\/]app[\\/]body-scene\.tsx$/},()=>({loader:'tsx',contents:'export function BodyScene(){return null;} export function retryBodyAssets(){}'}));
    api.onLoad({filter:/[\\/]app[\\/]lazy-body-teaching\.tsx$/},()=>({loader:'tsx',contents:'export function LazyBodyTeaching(){return null;}'}));
  }}]});
  const raw=JSON.parse(await readFile(new URL('../public/models/bodyparts3d/full-body/catalog.json',import.meta.url),'utf8'));
  function controlled(removeSelected=false){
    const slots=[],timers=new Map(),events=[];let cursor=0,pending=[],dirty=false,tree,serial=0;
    const changed=(a,b)=>!a||!b||a.length!==b.length||a.some((value,i)=>!Object.is(value,b[i]));
    const effect=(fn,deps,kind)=>{const i=cursor++;if(changed(slots[i]?.deps,deps))pending.push({i,fn,deps,kind});};
    const shim={...React,
      useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],value=>{events.push('state');const next=typeof value==='function'?value(slots[i]):value;if(!Object.is(next,slots[i])){slots[i]=next;dirty=true;}}];},
      useRef(initial){return slots[cursor++]??={current:initial};},
      useMemo(fn,deps){const i=cursor++;if(changed(slots[i]?.deps,deps))slots[i]={deps,value:fn()};return slots[i].value;},
      useCallback(fn,deps){return shim.useMemo(()=>fn,deps);},
      useEffect(fn,deps){effect(fn,deps,'passive');},
      useLayoutEffect(fn,deps){effect(fn,deps,'layout');},
    };
    const window={matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),setTimeout(fn){const id=++serial;timers.set(id,fn);return id;},clearTimeout(id){timers.delete(id);},addEventListener(){},removeEventListener(){}};
    const document={hidden:false,body:{},addEventListener(){},removeEventListener(){}};
    const mod={exports:{}};
    runInNewContext(parentBuild.outputFiles[0].text,{module:mod,exports:mod.exports,window,document,structuredClone,crypto,URL,require(id){if(id==='react')return shim;if(id==='next/dynamic')return ()=>'BodyScene';return require(id);}});
    const api=mod.exports,catalog=api.bodyDisplayCatalog(raw),tour=api.thoraxTour;
    if(removeSelected)catalog.structures=catalog.structures.filter(item=>item.id!==tour.steps[0].selectedId);
    const props={catalog,tour,onExit(){},pausedImaging:{suspend(){events.push('suspend');},setStop(){}}};
    function render(){let rounds=0;do{
      dirty=false;cursor=0;pending=[];tree=api.RegionalGuidedLearning(props);
      for(const kind of ['layout','passive'])for(const item of pending.filter(effect=>effect.kind===kind)){
        slots[item.i]?.cleanup?.();slots[item.i]={deps:item.deps,kind,cleanup:item.fn()};
      }
      assert(++rounds<15);
    }while(dirty);return tree;}
    const one=predicate=>{const found=find(tree,predicate);assert.equal(found.length,1);return found[0];};
    const reader=()=>find(tree,node=>node.type?.name==='TourReadingNotes');
    const scene=()=>one(node=>node.type==='BodyScene');
    const button=label=>one(node=>node.props?.onClick&&text(node)===label);
    const unmount=()=>{for(const slot of slots)if(slot?.kind==='layout')slot.cleanup?.();};
    render();return {render,reader,scene,button,timers,events,unmount};
  }
  const live=controlled();
  assert.equal(live.reader().length,1);
  const scene=live.scene().props;
  for(const id of new Set(scene.structures.map(item=>item.bundle)))scene.onLoaded(id);
  scene.onRendererHealth('ready');live.render();
  live.button('Play full tour').props.onClick();live.render();
  assert.equal(live.timers.size,1);
  const onRead=live.reader()[0].props.onRead;
  live.events.length=0;onRead();
  assert.deepEqual(live.events.slice(0,3),['suspend','state','state'],'Suspension precedes playback state changes in the actual callback');
  live.render();assert.equal(live.timers.size,0);
  live.unmount();live.events.length=0;onRead();
  assert.deepEqual(live.events,[],'Retired callback cannot suspend or schedule state');
  const unresolved=controlled(true);
  assert.equal(unresolved.reader().length,0,'Unresolved source omits the reader');
  unresolved.unmount();
});
