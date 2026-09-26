/* oxlint-disable react-hooks/rules-of-hooks -- controlled hook harness */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {build} from './workspace-component-test-build.mjs';

const require=createRequire(import.meta.url), React=require('react');
let context,slots=[],cursor=0;
const shim={...React,useContext:()=>context,
  useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;
    return [slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];},
  useRef(value){const i=cursor++;return slots[i]??={current:value};},
  useCallback:fn=>fn,useMemo:fn=>fn()};
const built=await build({stdin:{contents:"export {PracticeResultStudyButton} from './app/atlas-workspace'; export {useWorkspaceSession} from './app/workspace-session'; export {practiceReducer,initialPractice} from './lib/atlas-practice'; export {initialDissection,dissectionProfiles,resolveDissection,dissectionReducer} from './app/dissection-data';",resolveDir:process.cwd(),loader:'ts'},
  bundle:true,platform:'node',format:'cjs',write:false,loader:{'.css':'empty'}});
const compiled={exports:{}};let pendingFocus;
runInNewContext(built.outputFiles[0].text,{module:compiled,exports:compiled.exports,structuredClone,console,requestAnimationFrame:fn=>{pendingFocus=fn;},process:{env:{NODE_ENV:'test'}},require:id=>id==='react'?shim:id==='next/link'?()=>null:require(id)});
const api=compiled.exports;
const source=await readFile('app/body-explorer.tsx','utf8');
const ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),printer=ts.createPrinter();
const extracted={};
function save(name,node){extracted[name]=ts.transpileModule(`this.handler=${printer.printNode(ts.EmitHint.Expression,node,ast)};`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;}
function visit(node){
  if(ts.isVariableDeclaration(node)&&['select','applySelection'].includes(node.name.getText(ast)))save(node.name.getText(ast),node.initializer.arguments[0]);
  if(ts.isJsxOpeningElement(node)&&node.tagName.getText(ast)==='PracticeResultStudyButton'){
    const attr=node.attributes.properties.find(a=>a.name?.getText(ast)==='onSelect');save('result',attr.initializer.expression);
  }
  ts.forEachChild(node,visit);
}
visit(ast);assert.deepEqual(Object.keys(extracted).sort(),['applySelection','result','select']);
const catalog=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json','utf8'));
const regionStructures=catalog.structures.filter(s=>s.regions.includes('head-neck'));
const target=regionStructures.find(s=>s.name==='Left sternocleidomastoid');assert(target);
const profile=api.dissectionProfiles['head-neck'];
let scenarios=0;
for(const finish of ['complete','exit'])for(const removed of [true,false])for(const layout of ['desktop','mobile','compact','focus']){
  slots=[];let session,model={systems:{skeleton:true,muscles:false,organs:false},dissection:{...structuredClone(api.initialDissection),stageId:'free',removed:removed?[target.id]:[]}};
  const cameraRestore={current:null};
  const render=()=>{cursor=0;session=api.useWorkspaceSession(()=>model,value=>{model=value;cameraRestore.current={pan:[99,0,0]};events.push('restore');},()=>model);};
  const events=[];render();session.chooseMode('practice');render();
  model={systems:{skeleton:true,muscles:false,organs:false},dissection:structuredClone(api.initialDissection)};
  let practice={...api.initialPractice,id:12,status:'active',mode:'name',questions:[{target:target.id,choices:[target.id]},{target:'other',choices:['other']}],responses:[],index:0,renderedIds:[target.id,'other']};
  practice=api.practiceReducer(practice,{type:'answer',sessionId:12,index:0,chosen:null});
  if(finish==='complete'){
    practice=api.practiceReducer(practice,{type:'next',sessionId:12,index:0});
    practice=api.practiceReducer(practice,{type:'answer',sessionId:12,index:1,chosen:'other'});
    practice=api.practiceReducer(practice,{type:'next',sessionId:12,index:1});
  }else practice=api.practiceReducer(practice,{type:'exit'});
  assert.equal(practice.status,'complete');const saved=structuredClone(practice);
  const state={exam:false,regionStructures,profile,resolveDissection:api.resolveDissection,dissectionReducer:api.dissectionReducer,
    r:{target:target.id},cameraRestore,initialInspection:{opacity:1},selected:null,inspection:null,focus:false,zoom:2,reset:0,
    setSelectedId:id=>{state.selected=id;events.push('select');},setSelectionNotice:()=>{},publishSelection:()=>{},
    setSystems:value=>{model.systems=value(model.systems);},setDissection:value=>{model.dissection=value(model.dissection);},
    setInspection:value=>{state.inspection=value;},setFocus:value=>{state.focus=value;},setZoom:value=>{state.zoom=value;},setReset:value=>{state.reset=value(state.reset);}};
  for(const name of ['applySelection','select','result']){runInNewContext(extracted[name],state);state[name]=state.handler;}
  let info=false;context={exam:false,mode:'practice',focusView:layout==='focus',panelLayout:{info:layout!=='desktop'},
    chooseMode:mode=>{events.push(mode);session.chooseMode(mode);},showInfo:()=>{events.push('info');info=true;}};
  const button=api.PracticeResultStudyButton({onSelect:state.result,children:'Review structure'});
  assert.equal(button.type,'button');assert.equal(button.props.type,'button');assert.equal(button.props.disabled,false);
  button.props.onClick({currentTarget:{closest:()=>null}});render();
  assert.equal(session.mode,'explore');assert.deepEqual(events,['explore','restore','select','info']);
  assert.equal(state.selected,target.id);assert.equal(model.systems.muscles,true);
  assert(api.resolveDissection(regionStructures,profile,model.dissection).visible.some(s=>s.id===target.id));
  assert.equal(cameraRestore.current,null,'Saved camera cannot override target framing');
  assert.equal(state.focus,true);assert.equal(state.zoom,1);assert.equal(state.reset,1);assert.equal(info,true);
  assert.deepEqual(structuredClone(practice),saved,'Study action retains completed/early-exit results');
  session.chooseMode('practice');render();assert.deepEqual(structuredClone(practice),saved,'Results remain on return to Practice');scenarios++;
}
{
  const events=[];context={exam:true,chooseMode:()=>events.push('mode'),showInfo:()=>events.push('info')};
  const button=api.PracticeResultStudyButton({onSelect:()=>events.push('select'),children:'Review'});
  assert.equal(button.props.disabled,true);button.props.onClick();assert.deepEqual(events,[]);scenarios++;
}
assert.match(source,/WorkspaceOnly modes=\{\['explore', 'dissect'\]\}/,'Teaching stays available in Explore');
for(const situation of ['origin','body','new-focus','disconnected','closed-sheet','missing-heading']){
  let focused=0;
  const doc={body:{},activeElement:null};
  const heading={isConnected:true,focus:()=>focused++};
  const root={isConnected:situation!=='disconnected',ownerDocument:doc,
    closest:selector=>{assert.equal(selector,'.anatomy-controls-popup');return situation==='closed-sheet'?{hasAttribute:()=>true}:null;},
    querySelector:selector=>{assert.equal(selector,'[data-structure-study-heading]');return situation==='missing-heading'?null:heading;}};
  const origin={closest:selector=>{assert.equal(selector,'.body-info');return root;}};
  doc.activeElement=situation==='body'?doc.body:situation==='new-focus'?{}:origin;
  context={exam:false,chooseMode:()=>{},showInfo:()=>{}};
  api.PracticeResultStudyButton({onSelect:()=>{},children:'Review'}).props.onClick({currentTarget:origin});
  pendingFocus();assert.equal(focused,['origin','body'].includes(situation)?1:0);scenarios++;
}
assert.match(source,/<h2 data-structure-study-heading tabIndex=\{-1\}>\{selected.name\}<\/h2>/,'Named study heading accepts programmatic focus');
// Reproduce the saved pre-fix handler, not a hypothetical replacement.
const baseline='167dcb91783e015e3bd63c36124c2c9e316fd23c';
const oldSource=execFileSync('git',['show',`${baseline}:app/body-explorer.tsx`],{encoding:'utf8'});
const oldAst=ts.createSourceFile('old.tsx',oldSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let oldResult;
function findOld(node){
  if(ts.isJsxAttribute(node)&&node.name.getText(oldAst)==='onClick'&&node.initializer?.getText(oldAst).includes('select(r.target)'))oldResult=node.initializer.expression;
  ts.forEachChild(node,findOld);
}
findOld(oldAst);assert(oldResult,'Actual baseline result handler found');
const oldState={r:{target:target.id},mode:'practice',selected:null,initialInspection:{},
  select:id=>{oldState.selected=id;},setInspection:()=>{},setFocus:()=>{},setZoom:()=>{},
  workspace:{chooseMode:mode=>{oldState.mode=mode;}}};
runInNewContext(ts.transpileModule(`(${oldResult.getText(oldAst)})();`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,oldState);
assert.equal(oldState.selected,target.id);assert.equal(oldState.mode,'practice','Baseline selects but leaves teaching hidden');
console.log(JSON.stringify({passed:true,scenarios,boundaries:'Actual result component, source result/selection handlers, workspace hook and practice/dissection reducers; controlled React boundary, no browser/GPU acceptance.'}));
