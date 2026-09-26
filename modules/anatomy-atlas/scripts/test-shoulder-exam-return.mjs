// Exercise actual shoulder closures; no browser/GPU or clinical-validation claim.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createContext,runInContext} from 'node:vm';
import ts from 'typescript';
const source=process.argv.includes('--baseline')
 ?execFileSync('git',['show','65d15636579ea88397faa5d962ef2d45efacd273:app/shoulder-explorer.tsx'],{encoding:'utf8'})
 :await readFile('app/shoulder-explorer.tsx','utf8');
const ast=ts.createSourceFile('shoulder.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const printer=ts.createPrinter(),handlers=[];
function visit(n){
 if(ts.isFunctionDeclaration(n)&&['captureView','applyStudyView'].includes(n.name?.text))handlers.push(printer.printNode(ts.EmitHint.Unspecified,n,ast));
 if(ts.isVariableDeclaration(n)&&n.name.getText(ast)==='toggleMode')handlers.push('const '+printer.printNode(ts.EmitHint.Unspecified,n,ast)+';');
 ts.forEachChild(n,visit);
}
visit(ast);assert(handlers.length>=2);
const code=ts.transpileModule(handlers.join('\n')+'\nglobalThis.toggle=toggleMode;', {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const plain=v=>JSON.parse(JSON.stringify(v));
for(const initialLayer of ['surface','bones','cuff']){
 const state={selectedId:'original',view:'anterior',layer:initialLayer,zoom:1.7,zoomStep:4,
  visibleSystems:{skeleton:true,muscles:false,'soft-tissue':true},isolated:true,explode:65,
  layout:'tray',anchorSkeleton:true,showOrigins:true,plate:true,showLabels:false,syncPlane:true,
  inspection:{plane:'axial',position:32,opacity:{muscles:30}},resetNonce:0,
  cameraCapture:{current:{direction:[1,0,0],up:[0,1,0],pan:[.1,.2,0],scale:.8}},cameraRestore:{current:null},
  beforeExam:{current:null},mode:'study',displayReady:true,manifest:{sha256:'synthetic-revision'},
  structures:[{id:'original'}],structuredClone,starts:0,actions:[],workspaceChanges:0};
 const pending=[];
 for(const key of ['selectedId','view','layer','zoom','zoomStep','visibleSystems','isolated','explode','layout',
  'anchorSkeleton','showOrigins','plate','showLabels','syncPlane','inspection','mode','resetNonce'])
  state['set'+key[0].toUpperCase()+key.slice(1)]=v=>{pending.push(()=>{state[key]=typeof v==='function'?v(state[key]):v;});};
 state.practiceDispatch=a=>state.actions.push(a);
 state.beginShoulderPractice=()=>{state.starts++;};
 state.workspace={chooseMode:()=>{state.workspaceChanges++;}};
 const context=createContext(state);runInContext(code,context);
 // React setters commit after the event; reads inside a closure retain that render.
 const toggle=()=>{context.toggle();while(pending.length)pending.shift()();};
 const before=plain(context.captureView());
 toggle();assert.equal(state.mode,'exam');assert.equal(state.layer,'cuff');
 assert.equal(state.explode,0);assert.equal(state.starts,1);
 // Simulate an answer, orbit, view/zoom changes, and a renderer failure before exit.
 state.selectedId='exam-answer';state.view='posterior';state.zoom=.6;state.zoomStep=9;
 state.cameraCapture.current.pan[0]=9;state.displayReady=false;
 toggle();assert.equal(state.mode,'study');
 assert.equal(state.layer,initialLayer,'Exit must restore the original dissection layer');
 const after=plain(context.captureView());after.camera=plain(state.cameraRestore.current);
 assert.deepEqual(after,before,'Entire study presentation/selection and camera restored');
 assert.equal(state.zoomStep,4);assert.equal(state.workspaceChanges,0);
 assert.equal(state.beforeExam.current,null);assert.equal(state.starts,1);
 assert.equal(state.actions.at(-1).type,'dismiss');
 toggle();assert.equal(state.mode,'study','Cannot start while renderer unavailable');
 assert.equal(state.beforeExam.current,null,'Failed start does not capture/overwrite a return view');
 state.displayReady=true;state.layer='surface';state.cameraCapture.current=state.cameraRestore.current;
 toggle();toggle();assert.equal(state.layer,'surface','Second session captures its own starting view');
}
console.log('Shoulder exam return: three layers, full presentation/camera, selection, unavailable exit, blocked start and repeated sessions pass.');
