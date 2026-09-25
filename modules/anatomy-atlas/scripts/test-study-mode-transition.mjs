/* oxlint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps -- controlled persistent-hook harness */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {build} from './workspace-component-test-build.mjs';

const require=createRequire(import.meta.url), React=require('react');
const catalog=JSON.parse(await fs.readFile('public/models/bodyparts3d/full-body/catalog.json','utf8'));
const poplitealPins=JSON.parse(await fs.readFile('content/popliteal-vessel-study-pins.json','utf8'));
const printer=ts.createPrinter({removeComments:true});
function extractHandlers(source){
  const ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const handlers={};
  function visit(node){
    if(ts.isFunctionDeclaration(node)&&['changeStage','changeFocus'].includes(node.name?.text))
      handlers[node.name.text]=ts.transpileModule(printer.printNode(ts.EmitHint.Unspecified,node,ast),{
        compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None},
      }).outputText;
    ts.forEachChild(node,visit);
  }
  visit(ast);
  assert.deepEqual(Object.keys(handlers).sort(),['changeFocus','changeStage']);
  return handlers;
}
const handlers=extractHandlers(await fs.readFile('app/body-explorer.tsx','utf8'));

const built=await build({
  stdin:{contents:"export {AtlasSearch} from './app/atlas-workspace'; export {atlasSearchIndex} from './lib/atlas-navigation'; export {dissectionProfiles,dissectionReducer,initialDissection} from './app/dissection-data'; export {limbVascularStudyReady} from './lib/limb-vascular-studies'; export {longusColliStudyReady} from './lib/longus-colli';",resolveDir:process.cwd(),loader:'ts'},
  bundle:true,platform:'node',format:'cjs',write:false,
  external:['react','react/*','react-dom','react-dom/*','next/link'],loader:{'.css':'empty'},
});
let uiActive=false, uiSlots=[], uiCursor=0, uiContext;
const shim={...React,
  useState(initial){
    if(!uiActive)return React.useState(initial);
    const i=uiCursor++;
    if(!(i in uiSlots))uiSlots[i]=typeof initial==='function'?initial():initial;
    return [uiSlots[i],value=>{uiSlots[i]=typeof value==='function'?value(uiSlots[i]):value;}];
  },
  useRef(value){if(!uiActive)return React.useRef(value);const i=uiCursor++;return uiSlots[i]??(uiSlots[i]={current:value});},
  useMemo:(fn,deps)=>uiActive?fn():React.useMemo(fn,deps),
  useCallback:(fn,deps)=>uiActive?fn:React.useCallback(fn,deps),
  useContext:value=>uiActive?uiContext:React.useContext(value),
  useId:()=>uiActive?'study-transition':React.useId(),
  useEffect:(fn,deps)=>uiActive?undefined:React.useEffect(fn,deps),
};
const scope={exports:{}};
runInNewContext(built.outputFiles[0].text,{
  module:scope,exports:scope.exports,console,URLSearchParams,window:{innerWidth:1280,innerHeight:720},
  process:{env:{NODE_ENV:'test'}},require:id=>id==='react'?shim:id==='next/link'?()=>null:require(id),
});
const {AtlasSearch,atlasSearchIndex,dissectionProfiles,dissectionReducer,initialDissection,
  limbVascularStudyReady,longusColliStudyReady}=scope.exports;

const sessionSource=await fs.readFile('app/workspace-session.ts','utf8');
const sessionCode=ts.transpileModule(sessionSource,{
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},
}).outputText;
function makeSession(model){
  const slots=[];let cursor=0,restoreCount=0;
  const hooks={
    useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;
      return [slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];},
    useRef(value){const i=cursor++;return slots[i]??=( {current:value} );},
    useCallback(fn,deps){const i=cursor++;if(!slots[i]||deps.some((v,j)=>v!==slots[i].deps[j]))slots[i]={fn,deps};return slots[i].fn;},
    useMemo(fn,deps){return hooks.useCallback(fn,deps)();},
  };
  const exports={};
  runInNewContext(sessionCode,{exports,structuredClone,require:id=>{assert.equal(id,'react');return hooks;}});
  let session;
  const render=()=>{cursor=0;session=exports.useWorkspaceSession(
    ()=>model.capture(),state=>{model.restore(state);restoreCount++;},()=>model.initial());return session;};
  return {render,get session(){return session;},get restoreCount(){return restoreCount;}};
}
const walk=(node,pred,out=[])=>{
  if(React.isValidElement(node)){if(pred(node))out.push(node);React.Children.forEach(node.props.children,child=>walk(child,pred,out));}
  return out;
};
const label=node=>typeof node==='string'||typeof node==='number'?String(node):
  !node?'':Array.isArray(node)?node.map(label).join(''):label(node.props?.children);
const find=(tree,pred,message)=>{const node=walk(tree,pred)[0];assert(node,message);return node;};

function scenario({entryType,startingMode='explore',savedDissect=false,reject=false,
  sourceReject=null,stale=false,exam=false,SearchComponent=AtlasSearch,parentHandlers=handlers}){
  const region='leg',side='both',profile=dissectionProfiles[region];
  let model={
    dissection:structuredClone(initialDissection),systems:{marker:'explore'},explode:24,layout:'tray',
    inspection:{marker:'explore'},plate:true,ghostRemoved:false,anchorSkeleton:false,
    showOrigins:false,isolated:true,focus:true,regionalFraming:true,view:'anterior',zoom:2,
    camera:{marker:'explore'},reset:0,
  };
  const original=structuredClone(model);
  const trace=[];
  const sessionModel={
    capture:()=>model,
    restore:state=>{model={...structuredClone(state),reset:model.reset+1};trace.push('restore');},
    initial:()=>({...structuredClone(original),dissection:structuredClone(initialDissection),
      systems:{marker:'initial-dissect'},explode:0,layout:'spatial',plate:false,
      isolated:false,focus:false,view:'anterior',zoom:1}),
  };
  const session=makeSession(sessionModel);session.render();
  if(savedDissect){
    session.session.chooseMode('dissect');session.render();
    model={...model,dissection:{...structuredClone(initialDissection),stageId:'free',
      removed:['saved-surface']},systems:{marker:'saved-dissect'},explode:70,view:'lateral',zoom:3};
    session.render();session.session.chooseMode('explore');session.render();
  }
  if(startingMode==='dissect'){
    session.session.chooseMode('dissect');session.render();
    model={...model,dissection:{...structuredClone(initialDissection),stageId:'free',
      removed:['active-surface']},systems:{marker:'active-dissect'},explode:40};
    session.render();
  }else if(startingMode==='practice'){
    session.session.chooseMode('practice');session.render();
  }
  const before=structuredClone(model),modeBefore=session.session.mode,restoresBefore=session.restoreCount;
  trace.length=0;
  const cameraRestore={current:{marker:'pending'}};
  const setters={
    setInspection:value=>{model.inspection=value;trace.push('inspection');},
    setPlate:value=>{model.plate=value;trace.push('plate');},
    setLayout:value=>{model.layout=value;trace.push('layout');},
    dispatch:action=>{model.dissection=dissectionReducer(model.dissection,action);trace.push('dispatch');},
    setSystems:value=>{model.systems=value;trace.push('systems');},
    setSelectedId:()=>{},setFocus:value=>{model.focus=value;},
    setIsolated:value=>{model.isolated=value;},setExplode:value=>{model.explode=value;},
    setZoom:value=>{model.zoom=value;},setView:value=>{model.view=value;},
    setReset:value=>{model.reset=typeof value==='function'?value(model.reset):value;},
  };
  const context={exam:false,catalog,initialRegion:region,side,profile,cameraRestore,
    initialInspection:{marker:'study'},layout:model.layout,allBodySystems:{marker:'study'},
    limbVascularStudyReady,longusColliStudyReady,...setters};
  runInNewContext(`${parentHandlers.changeStage}\n${parentHandlers.changeFocus}\nthis.handlers={changeStage,changeFocus};`,context);
  uiContext={mode:session.session.mode,exam:false,focusView:false,panelLayout:null,
    chooseMode:next=>{trace.push(`mode:${next}`);session.session.chooseMode(next);},
    setPanelOpen:()=>{},showInfo:()=>{}};
  uiSlots=[true];
  const index=atlasSearchIndex(catalog,region,side);
  const entry=index.find(item=>item.action.type===entryType &&
    (entryType==='focus'?item.action.id==='knee-popliteal-vessel-pair':true));
  assert(entry,`${entryType} search entry`);
  const props={catalog,region,side,onSelect:()=>{},onWindow:context.handlers.changeStage,
    onFocus:context.handlers.changeFocus,onDissect:()=>{}};
  const render=()=>{uiActive=true;uiCursor=0;const tree=SearchComponent(props);uiActive=false;return tree;};
  let tree=render();
  if(stale){
    // Keep a preview from the prior source scope while Search receives a new scope.
    uiSlots[1]=entry.label;
  }else uiSlots[1]=entry.label;
  uiSlots[2]='view';tree=render();
  const result=find(tree,node=>node.type==='button'&&node.key===entry.key,'search result');
  result.props.onClick({currentTarget:{isConnected:true,focus(){}}});tree=render();
  if(stale){props.region='hand';tree=render();}
  if(reject) context.profile={...profile,
    stages:profile.stages.filter(item=>item.id!==entry.action.id),
    focuses:profile.focuses.filter(item=>item.id!==entry.action.id)};
  if(sourceReject){
    assert.equal(entryType,'focus','source-pin rejection exercises the popliteal focus');
    assert.equal(limbVascularStudyReady(catalog,region,entry.action.id),true,
      'the original catalog admits this study');
    const damaged=structuredClone(catalog);
    const pin=poplitealPins.entries.find(item=>damaged.structures.some(s=>s.id===item.id));
    assert(pin,'a required popliteal source binding is in the catalog');
    const target=damaged.structures.find(item=>item.id===pin.id);
    if(sourceReject==='absent') damaged.structures=damaged.structures.filter(item=>item.id!==pin.id);
    else if(sourceReject==='mutated') target.nodeName=`${target.nodeName}-changed`;
    else assert.fail('unknown source rejection');
    assert.equal(limbVascularStudyReady(damaged,region,entry.action.id),false,
      'the real source-pin guard rejects the altered catalog');
    context.catalog=damaged;
  }
  if(exam){context.exam=true;uiContext.exam=true;tree=render();}
  find(tree,node=>label(node)==='Open study view','study confirmation').props.onClick();
  tree=render();session.render();
  if(reject||sourceReject||stale||exam){
    assert.equal(session.session.mode,modeBefore);
    assert.equal(session.restoreCount,restoresBefore);
    assert.deepEqual(model,before);
    assert.deepEqual(trace,[]);
    assert.equal(cameraRestore.current.marker,'pending');
    assert.equal(tree.props.open,!exam);
    return;
  }
  assert.equal(session.session.mode,'dissect');
  assert.equal(model.dissection.focusId,entryType==='focus'?entry.action.id:null);
  assert.equal(model.dissection.stageId,entryType==='focus'?'free':entry.action.id);
  assert.equal(model.view,entryType==='focus'?'posterior':profile.stages.find(s=>s.id===entry.action.id).view);
  assert.deepEqual(model.systems,{marker:'study'});
  assert.equal(model.explode,0);assert.equal(model.zoom,1);
  assert.equal(model.layout,'spatial');assert.equal(model.plate,false);
  assert(trace.indexOf('mode:dissect')>=0 && trace.indexOf('mode:dissect')<trace.indexOf('dispatch'),
    'session restore precedes study dispatch');
  assert.equal(session.restoreCount-restoresBefore,startingMode==='dissect'?0:1);
  assert.equal(tree.props.open,false);
  session.session.chooseMode('explore');session.render();
  if(modeBefore==='explore')assert.deepEqual(model.dissection,before.dissection,'old Explore dissection returns');
  if(modeBefore==='explore')assert.equal(model.explode,before.explode,'old Explore settings return');
}

for(const entryType of ['window','focus']){
  scenario({entryType});
  scenario({entryType,savedDissect:true});
  scenario({entryType,startingMode:'dissect'});
  scenario({entryType,startingMode:'practice'});
  scenario({entryType,reject:true});
  scenario({entryType,stale:true});
  scenario({entryType,exam:true});
}
scenario({entryType:'focus',sourceReject:'absent'});
scenario({entryType:'focus',sourceReject:'mutated'});

if(process.argv.includes('--pre-fix-probe')){
  const baselineRevision='d732f0b519f5e9a61fca4460cd6e57dc918d9755';
  const oldExplorer=execFileSync('git',['show',`${baselineRevision}:app/body-explorer.tsx`],
    {encoding:'utf8',maxBuffer:2e6});
  const oldSearch=execFileSync('git',['show',`${baselineRevision}:app/atlas-workspace.tsx`],
    {encoding:'utf8',maxBuffer:2e6});
  assert(!oldSearch.includes('prepareDissection'),
    'the pinned pre-fix Search source has no preparation callback');
  assert(!oldExplorer.includes('beforeApply?: () => void'),
    'the pinned pre-fix parent handlers have no preparation parameter');
  const prior=await build({
    stdin:{contents:"export {AtlasSearch} from './app/atlas-workspace';",resolveDir:process.cwd(),loader:'ts'},
    bundle:true,platform:'node',format:'cjs',write:false,
    external:['react','react/*','react-dom','react-dom/*','next/link'],loader:{'.css':'empty'},
    plugins:[{name:'pre-fix-search-source',setup(api){
      api.onLoad({filter:/[\\/]app[\\/]atlas-workspace\.tsx$/,namespace:'component-test'},
        ()=>({contents:oldSearch,loader:'tsx',resolveDir:`${process.cwd()}/app`}));
    }}],
  });
  const priorScope={exports:{}};
  runInNewContext(prior.outputFiles[0].text,{
    module:priorScope,exports:priorScope.exports,console,URLSearchParams,
    window:{innerWidth:1280,innerHeight:720},process:{env:{NODE_ENV:'test'}},
    require:id=>id==='react'?shim:id==='next/link'?()=>null:require(id),
  });
  let observedFailure;
  try{scenario({entryType:'focus',SearchComponent:priorScope.exports.AtlasSearch,
    parentHandlers:extractHandlers(oldExplorer)});}
  catch(error){observedFailure=error;}
  assert(observedFailure instanceof assert.AssertionError,
    'the pre-fix Search and parent handlers must fail the same transition assertion');
  assert.match(observedFailure.message,/knee-popliteal-vessel-pair/,
    'the pre-fix failure is the lost focused study');
  console.log(JSON.stringify({preFixProbe:true,revision:baselineRevision,
    result:'expected failure: the focused study is overwritten by workspace restoration'}));
}
console.log(JSON.stringify({passed:true,scenarios:16,
  boundaries:'Actual AtlasSearch activation, source BodyExplorer handlers, dissection reducer and persistent useWorkspaceSession; controlled React/DOM boundary, not browser or GPU evidence.'}));
