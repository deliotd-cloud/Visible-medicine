/* oxlint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps -- controlled persistent-hook harness */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {build} from './workspace-component-test-build.mjs';

const require=createRequire(import.meta.url),React=require('react');
const baseline='9f8a28c45fd20d2c9d423a06c9b7a951d06a5bba';
const catalog=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json','utf8'));
const bodySource=await readFile('app/body-explorer.tsx','utf8');
const sessionCode=ts.transpileModule(await readFile('app/workspace-session.ts','utf8'),{
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},
}).outputText;
let active=false,slots=[],cursor=0,context;
const shim={...React,
  useState(initial){if(!active)return React.useState(initial);const i=cursor++;
    if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;
    const owned=slots;return [owned[i],value=>{owned[i]=typeof value==='function'?value(owned[i]):value;}];},
  useRef(value){if(!active)return React.useRef(value);const i=cursor++;return slots[i]??={current:value};},
  useMemo:(fn,deps)=>active?fn():React.useMemo(fn,deps),
  useCallback:(fn,deps)=>active?fn:React.useCallback(fn,deps),
  useContext:value=>active?context:React.useContext(value),
  useEffect:(fn,deps)=>active?undefined:React.useEffect(fn,deps),
  useId:()=>active?'selection-transition':React.useId(),
};
const sessionExports={};
runInNewContext(sessionCode,{exports:sessionExports,structuredClone,require:id=>{assert.equal(id,'react');return shim;}});
function callbacks(source){
  const ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const printer=ts.createPrinter(),found={};
  function visit(node){
    if(ts.isVariableDeclaration(node)&&['applySelection','select'].includes(node.name.getText(ast))){
      const initializer=node.initializer;
      assert(ts.isCallExpression(initializer)&&initializer.expression.getText(ast)==='useCallback');
      found[node.name.getText(ast)]=ts.transpileModule(
        `this.handler = ${printer.printNode(ts.EmitHint.Expression,initializer.arguments[0],ast)};`,
        {compilerOptions:{target:ts.ScriptTarget.ES2022}},
      ).outputText;
    }
    ts.forEachChild(node,visit);
  }
  visit(ast);assert.deepEqual(Object.keys(found).sort(),['applySelection','select']);return found;
}
async function compile(oldSearch){
  const built=await build({stdin:{contents:"export {AtlasSearch} from './app/atlas-workspace'; export {atlasSearchIndex} from './lib/atlas-navigation'; export {dissectionProfiles,initialDissection,resolveDissection,dissectionReducer} from './app/dissection-data';",resolveDir:process.cwd(),loader:'ts'},
    bundle:true,platform:'node',format:'cjs',write:false,
    external:['react','react/*','react-dom','react-dom/*','next/link'],loader:{'.css':'empty'},
    plugins:oldSearch?[{name:'baseline-search',setup(api){api.onLoad({filter:/[\\/]app[\\/]atlas-workspace\.tsx$/,namespace:'component-test'},()=>({contents:oldSearch,loader:'tsx',resolveDir:`${process.cwd()}/app`}));}}]:[],
  });
  const scope={exports:{}};
  runInNewContext(built.outputFiles[0].text,{module:scope,exports:scope.exports,console,URLSearchParams,window:{innerWidth:1280,innerHeight:720},process:{env:{NODE_ENV:'test'}},require:id=>id==='react'?shim:id==='next/link'?()=>null:require(id)});
  return scope.exports;
}
const api=await compile();
const target=catalog.structures.find(s=>s.name==='Left sternocleidomastoid');assert(target);
const unrelated=catalog.structures.find(s=>s.name==='Right sternocleidomastoid');assert(unrelated);
const walk=(node,predicate)=>{
  if(!React.isValidElement(node))return null;
  if(predicate(node))return node;
  let found=null;
  React.Children.forEach(node.props.children,child=>{if(!found)found=walk(child,predicate);});
  return found;
};
let scenarios=0;
function scenario({mode='practice',origin='explore',removed=false,enabled=false,practiceEnabled=false,exam=false,Api=api,source=bodySource}={}){
  const {initialDissection,dissectionReducer,resolveDissection,dissectionProfiles,AtlasSearch,atlasSearchIndex}=Api;
  const profile=dissectionProfiles['head-neck'],regionStructures=catalog.structures.filter(s=>s.regions.includes('head-neck'));
  const initial=()=>({systems:{skeleton:true,muscles:enabled,organs:false},
    dissection:{...structuredClone(initialDissection),stageId:'free',removed:[unrelated.id,...(removed?[target.id]:[])]}});
  let model=initial(),selected=null,restoreCount=0,session;
  const published=[],notices=[];
  const sessionSlots=[];
  const renderSession=()=>{active=true;slots=sessionSlots;cursor=0;
    session=sessionExports.useWorkspaceSession(()=>model,value=>{model=value;restoreCount++;},initial);active=false;};
  renderSession();
  if(origin==='dissect'){session.chooseMode('dissect');renderSession();
    model={systems:{...model.systems,muscles:practiceEnabled},dissection:{...structuredClone(initialDissection),stageId:'free'}};renderSession();}
  if(mode==='practice'){session.chooseMode('practice');renderSession();
    model={systems:{...model.systems,muscles:practiceEnabled},dissection:{...structuredClone(initialDissection),stageId:'free'}};renderSession();}
  const before=structuredClone(model),restoreBefore=restoreCount;
  const captured={exam,regionStructures,profile,systems:model.systems,
    hiddenIds:resolveDissection(regionStructures,profile,model.dissection).removed.map(s=>s.id),
    bodySystems:{muscles:{name:'Muscles'}},resolveDissection,dissectionReducer,
    setSelectedId:id=>{selected=id;},setSelectionNotice:notice=>notices.push(notice),
    setSystems:value=>{model.systems=typeof value==='function'?value(model.systems):value;},
    setDissection:value=>{model.dissection=typeof value==='function'?value(model.dissection):value;},
    dispatch:action=>{model.dissection=dissectionReducer(model.dissection,action);},
    publishSelection:id=>published.push(id),
  };
  const extracted=callbacks(source);runInNewContext(extracted.applySelection,captured);captured.applySelection=captured.handler;
  runInNewContext(extracted.select,captured);const select=captured.handler;
  context={mode:session.mode,exam,focusView:false,panelLayout:null,chooseMode:next=>session.chooseMode(next),showInfo:()=>{},setPanelOpen:()=>{}};
  const entry=atlasSearchIndex(catalog,'head-neck','both').find(e=>e.action.type==='select'&&e.action.id===target.id);assert(entry);
  const searchSlots=[true,target.name,'structure',12,null];
  active=true;slots=searchSlots;cursor=0;
  const tree=AtlasSearch({catalog,region:'head-neck',side:'both',onSelect:select,onWindow:()=>{},onFocus:()=>{},onDissect:()=>{}});active=false;
  const result=walk(tree,node=>node.type==='button'&&node.key===entry.key);assert(result,'actual Search result');
  result.props.onClick({currentTarget:{isConnected:true,focus(){}}});renderSession();
  if(exam){assert.deepEqual(structuredClone(model),before);assert.equal(selected,null);assert.equal(restoreCount,restoreBefore);assert.equal(published.length,0);}
  else{
    assert.equal(session.mode,mode==='practice'?'explore':origin);
    assert.equal(model.systems.muscles,true,'searched structure system stays enabled after workspace restoration');
    assert.equal(selected,target.id);assert.deepEqual(published,[target.id]);
    assert(resolveDissection(regionStructures,profile,model.dissection).visible.some(s=>s.id===target.id),'searched structure is restored in destination dissection');
    if(mode==='practice'||origin==='explore'){
      assert(model.dissection.removed.includes(unrelated.id),'unrelated removal preserved');
      assert.equal(model.dissection.history.length,removed?1:0,'only an actual visibility change creates Undo');
      assert.equal(model.systems.organs,false,'unrelated system unchanged');
    }
    const history=model.dissection.history.length;
    // Captured selection callback must also preserve history when called again.
    select(target.id);assert.equal(model.dissection.history.length,history,'repeat selection preserves history');
    const snapshot=structuredClone(model);select('not-in-this-region');assert.deepEqual(structuredClone(model),snapshot);
  }
  scenarios++;
}
for(const origin of ['explore','dissect'])for(const removed of [false,true])for(const enabled of [false,true])for(const practiceEnabled of [false,true])scenario({origin,removed,enabled,practiceEnabled});
for(const origin of ['explore','dissect'])scenario({origin,mode:origin,removed:true});
scenario({exam:true});
if(process.argv.includes('--pre-fix-probe')){
  const oldSearch=execFileSync('git',['show',`${baseline}:app/atlas-workspace.tsx`],{encoding:'utf8'});
  const oldBody=execFileSync('git',['show',`${baseline}:app/body-explorer.tsx`],{encoding:'utf8'});
  assert.throws(()=>scenario({Api:api,source:oldBody,removed:true,practiceEnabled:true}),/searched structure is restored/,'ordering alone cannot fix stale removal capture');
  const oldApi=await compile(oldSearch);
  assert.throws(()=>scenario({Api:oldApi,source:oldBody}),/system stays enabled/,'baseline must reproduce the browser visibility failure');
  console.log(JSON.stringify({preFixProbe:true,baseline,failures:['system overwritten','stale removed-structure capture']}));
}
console.log(JSON.stringify({passed:true,scenarios,boundaries:'Actual Search activation, source selection callbacks, workspace hook and dissection reducer; controlled React/DOM boundary, not browser/GPU acceptance.'}));
