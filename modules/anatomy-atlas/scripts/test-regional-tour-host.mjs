import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
const source=readFileSync('app/body-explorer.tsx','utf8');
const ast=ts.createSourceFile('host.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let fn;function walk(n){if(ts.isFunctionDeclaration(n)&&n.name?.text==='changeGuidedLearning')fn=n.getText(ast);ts.forEachChild(n,walk);}walk(ast);assert(fn);
const compiled=ts.transpileModule(fn,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
class Element {focus(){this.focused=true;}}
const context={initialRegion:'thorax',regionalTour:{id:'thorax'},practice:{status:'idle'},guidedLearning:false,cameraCapture:{current:{position:[2,4,6],target:[0,1,0],up:[0,1,0]}},cameraRestore:{current:null},guidedReturnCamera:{current:null},guidedReturnFocus:{current:null},document:{activeElement:new Element()},HTMLElement:Element,structuredClone,requestAnimationFrame:fn=>fn(),reset:0};
context.setGuidedLearning=v=>context.guidedLearning=v;context.setReset=fn=>context.reset=fn(context.reset);
runInNewContext(compiled+';this.change=changeGuidedLearning',context);
const before=structuredClone(context.cameraCapture.current);
context.change(true);assert(context.guidedLearning);assert.deepEqual(context.guidedReturnCamera.current,before);assert.notEqual(context.guidedReturnCamera.current,context.cameraCapture.current);
context.cameraCapture.current.position[0]=90;context.change(true);assert.deepEqual(context.guidedReturnCamera.current,before,'Repeated selection does not overwrite initial capture');
context.change(false);assert(!context.guidedLearning);assert.deepEqual(context.cameraRestore.current,before);assert.equal(context.reset,1);assert(context.document.activeElement.focused);
context.practice.status='active';context.change(true);assert(!context.guidedLearning,'No tour during exam');context.practice.status='idle';context.regionalTour=null;context.change(true);assert(!context.guidedLearning,'No undefined regional tour');
context.initialRegion='whole-body';context.change(true);assert(context.guidedLearning,'Whole-body library does not require a synthetic regional tour');
context.change(false);assert.equal(context.reset,2);context.practice.status='active';context.change(true);assert(!context.guidedLearning,'Whole-body exam cannot be bypassed');
// All changes performed by the actual entry/exit function are confined to its
// own navigation/focus/restore fields; dissection/history/selection stay intact.
for(const setter of ['setDissection','setSelectedId','setSystems','setSide','setExplode','setView','setZoom','chooseMode'])assert(!fn.includes(setter));
assert(source.includes('disabled: exam || inlineStudy || guidedLearning'));
assert(source.includes("if (exam || guidedLearning) throw new Error('Selection tools disabled during exam or guided learning')"));
assert(source.includes('!inlineStudy && !guidedLearning'));
assert(source.includes('guidedLearning && regionalTour ? <RegionalGuidedLearning'));
assert(source.includes('guidedLearning && (whole || regionalToursFor(initialRegion).length>1) ? <WholeBodyGuidedLearning'));
assert(source.includes('key={initialRegion} region={initialRegion}'));
// Execute the exact host bindings admitted by the historical migration. Testing
// only the shortcut helper would miss a host accidentally enabling it on a tour.
const historyBindings=[],exitBindings=[];
function collectBindings(n){
  if(ts.isJsxAttribute(n)&&n.initializer&&ts.isJsxExpression(n.initializer)){
    const expression=n.initializer.expression;
    if(expression&&n.name.text==='onKeyDown'&&expression.getText(ast).includes('handleDissectionHistoryKey')) historyBindings.push(expression.getText(ast));
    if(expression&&n.name.text==='onExit'&&expression.getText(ast).includes('changeGuidedLearning')) exitBindings.push(expression.getText(ast));
  }
  ts.forEachChild(n,collectBindings);
}
collectBindings(ast);assert.equal(historyBindings.length,1);assert.equal(exitBindings.length,2);
const compileBinding=expression=>ts.transpileModule(`const callback=(${expression});`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
for(const mode of ['explore','dissect','practice'])for(const exam of [false,true])for(const inlineStudy of [false,true])for(const guidedLearning of [false,true]){
  let received;
  const event={},undo=()=>{},redo=()=>{};
  runInNewContext(compileBinding(historyBindings[0])+';callback(event)',{
    workspace:{mode},exam,inlineStudy,guidedLearning,dissection:{history:[{}],future:[{}]},event,
    undoDissection:undo,redoDissection:redo,
    handleDissectionHistoryKey:(e,state,u,r)=>{assert.equal(e,event);assert.equal(u,undo);assert.equal(r,redo);received=state;},
  });
  assert.equal(received.enabled,mode==='dissect'&&!exam&&!inlineStudy&&!guidedLearning);
  assert.equal(received.canUndo,true);assert.equal(received.canRedo,true);
}
for(const expression of exitBindings){
  const calls=[];runInNewContext(compileBinding(expression)+';callback()',{changeGuidedLearning:value=>calls.push(value)});
  assert.deepEqual(calls,[false],'Each player exits through the shared restoration handler');
}
// Run the actual WorkspaceModes radio callback against the actual host handler.
// Queue RAF instead of invoking it synchronously: a mode-switch must not steal
// focus back from the selected radio after React has committed the new mode.
const modesSource=readFileSync('app/atlas-workspace.tsx','utf8');
const modesAst=ts.createSourceFile('modes.tsx',modesSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let modeCallback;
function collectModeCallback(n){
  if(ts.isFunctionDeclaration(n)&&n.name?.text==='WorkspaceModes'){
    function find(n){
      if(ts.isJsxAttribute(n)&&n.name.text==='onValueChange'&&ts.isJsxExpression(n.initializer)){
        assert(!modeCallback,'One WorkspaceModes radio callback');
        modeCallback=n.initializer.expression.getText(modesAst);
      }
      ts.forEachChild(n,find);
    }
    find(n.body);
  }
  ts.forEachChild(n,collectModeCallback);
}
collectModeCallback(modesAst);assert(modeCallback);
const modeFactory=ts.transpileModule(`function makeModeCallback(guidedLearning, exam, setPanelOpen, chooseMode, workspaceModes) { return ${modeCallback}; }`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
for(const region of ['thorax','whole-body'])for(const destination of ['explore','dissect','practice']){
  const frames=[], launcher=new Element(), chosenRadio=new Element(), choices=[], panels=[];
  const host={initialRegion:region,regionalTour:region==='whole-body'?null:{id:region},practice:{status:'idle'},guidedLearning:false,
    cameraCapture:{current:{position:[2,4,6],target:[0,1,0],up:[0,1,0]}},cameraRestore:{current:null},
    guidedReturnCamera:{current:null},guidedReturnFocus:{current:null},document:{activeElement:launcher},HTMLElement:Element,
    structuredClone,requestAnimationFrame:fn=>frames.push(fn),reset:0};
  host.setGuidedLearning=value=>host.guidedLearning=value;
  host.setReset=update=>host.reset=update(host.reset);
  runInNewContext(compiled+modeFactory+';this.change=changeGuidedLearning;this.makeModeCallback=makeModeCallback',host);
  const radio=host.makeModeCallback({active:false,onChange:host.change},false,(...args)=>panels.push(args),value=>choices.push(value),['explore','dissect','practice']);
  const camera=structuredClone(host.cameraCapture.current);
  radio('guided-learning');
  assert(host.guidedLearning,`${region}: library entered`);
  assert.deepEqual(panels,[[false,false],[true,false]],`${region}: entry closes panels`);
  assert.deepEqual(choices,[],`${region}: entry preserves underlying mode`);
  host.document.activeElement=chosenRadio;
  radio(destination);
  assert(!host.guidedLearning,`${region}/${destination}: library closed`);
  assert.deepEqual(choices,[destination],`${region}/${destination}: mode selected`);
  assert.deepEqual(host.cameraRestore.current,camera,`${region}/${destination}: camera restored`);
  assert.equal(host.reset,1,`${region}/${destination}: reset requested`);
  assert.equal(frames.length,0,`${region}/${destination}: no launcher-focus frame queued`);
  assert.equal(host.document.activeElement,chosenRadio,`${region}/${destination}: selected radio keeps focus`);
  assert(!launcher.focused,`${region}/${destination}: launcher remains unfocused`);
}
for(const region of ['thorax','whole-body']){
  const frames=[],launcher=new Element(),exit=new Element();
  const host={initialRegion:region,regionalTour:region==='whole-body'?null:{id:region},practice:{status:'idle'},guidedLearning:false,
    cameraCapture:{current:{position:[2,4,6]}},cameraRestore:{current:null},guidedReturnCamera:{current:null},guidedReturnFocus:{current:null},
    document:{activeElement:launcher},HTMLElement:Element,structuredClone,requestAnimationFrame:fn=>frames.push(fn),reset:0};
  host.setGuidedLearning=value=>host.guidedLearning=value;
  host.setReset=update=>host.reset=update(host.reset);
  runInNewContext(compiled+';this.change=changeGuidedLearning',host);
  host.change(true);host.document.activeElement=exit;
  runInNewContext(compileBinding(exitBindings[region==='whole-body'?0:1])+';callback()',host);
  assert.deepEqual(host.cameraRestore.current,{position:[2,4,6]},`${region}: explicit Exit restores camera`);
  assert.equal(host.reset,1);
  assert.equal(frames.length,1,`${region}: explicit Exit queues launcher focus`);
  assert(!launcher.focused,`${region}: focus waits for RAF`);
  frames.shift()();assert(launcher.focused,`${region}: explicit Exit returns focus to launcher`);
}
console.log(JSON.stringify({exactDetachedCameraRestore:true,workspaceStateUntouched:true,examBlocked:true,undefinedTourBlocked:true,exclusiveSceneBranch:true,queuedModeFocusPreserved:true,explicitExitFocusRestored:true}));
