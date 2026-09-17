import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {initialInspection} from '../lib/inspection-state.ts';

// Execute the actual JSX callback, not a duplicate reducer or text-pattern test.
const source=await readFile('app/body-explorer.tsx','utf8');
const ast=ts.createSourceFile('body-explorer.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const attr=(node,name)=>node.attributes.properties.find(p=>ts.isJsxAttribute(p)&&p.name.getText(ast)===name);
const handlers=[];
function visit(n){
 if(ts.isJsxElement(n)&&n.openingElement.tagName.getText(ast)==='Select'){
  const trigger=n.children.find(c=>ts.isJsxElement(c)&&c.openingElement.tagName.getText(ast)==='SelectTrigger');
  const label=trigger&&attr(trigger.openingElement,'aria-label')?.initializer;
  if(label&&ts.isStringLiteral(label)&&label.text==='Laterality filter'){
   const expression=attr(n.openingElement,'onValueChange')?.initializer?.expression;
   assert(expression&&ts.isArrowFunction(expression));handlers.push(expression);
   assert.equal(attr(trigger.openingElement,'disabled')?.initializer?.expression?.getText(ast),'exam');
  }
 }
 ts.forEachChild(n,visit);
}
visit(ast);assert.equal(handlers.length,1);
const code=ts.transpileModule('const changeSide='+handlers[0].getText(ast)+';changeSide(value);',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
let transitions=0;
for(const side of ['both','left','right'])for(const value of ['both','left','right','',null,undefined])
 for(const isolated of [false,true])for(const focus of [false,true])for(const selectedId of [null,'left-structure','right-structure']){
  const state={side,isolated,focus,selectedId,inspection:{...initialInspection,plane:'axial',position:30},practiceActions:[],hiddenIds:['removed-structure'],history:{past:['prior-stage'],future:['redo-stage']},zoom:1.4,explode:.3};
  const before=structuredClone(state);
  const ctx={value,initialInspection:structuredClone(initialInspection),
   setSide:v=>state.side=v,setSelectedId:v=>state.selectedId=v,setFocus:v=>state.focus=v,setIsolated:v=>state.isolated=v,setInspection:v=>state.inspection=v,
   practiceDispatch:action=>state.practiceActions.push(JSON.parse(JSON.stringify(action)))};
  runInNewContext(code,ctx);
  if(value){
   assert.equal(state.side,value);assert.equal(state.selectedId,null);assert.equal(state.focus,false);assert.equal(state.isolated,false);
   assert.deepEqual(state.inspection,initialInspection);assert.deepEqual(state.practiceActions,[{type:'dismiss'}]);
   for(const key of ['hiddenIds','history','zoom','explode'])assert.deepEqual(state[key],before[key]);
  }else assert.deepEqual(state,before,'Empty select event must preserve state');
  transitions++;
 }
const report={transitions,actualLateralityHandlerExecuted:true,examControlDisabled:true,selectionFocusIsolationClearedTogether:true,hiddenHistoryAndCameraValuesPreserved:true,browserAcceptance:false,clinicalAcceptance:false};
await writeFile('docs/side-isolation-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
