import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {build} from './workspace-component-test-build.mjs';
import {runInNewContext} from 'node:vm';
const source=fs.readFileSync('app/body-explorer.tsx','utf8');
const ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),printer=ts.createPrinter();
const found=new Map();
function visit(n){if((ts.isFunctionDeclaration(n)||ts.isVariableDeclaration(n))&&n.name&&ts.isIdentifier(n.name))found.set(n.name.text,n);ts.forEachChild(n,visit);}visit(ast);
const emitted=n=>ts.transpileModule(printer.printNode(ts.EmitHint.Unspecified,n,ast),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const functions=['submitPractice','previewPracticeStructure'].map(n=>emitted(found.get(n))).join('\n');
const reducerBuild=await build({stdin:{contents:"export {practiceReducer} from './lib/atlas-practice';",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false});
const mod={exports:{}};runInNewContext(reducerBuild.outputFiles[0].text,{module:mod,exports:mod.exports});
const initial={id:1,index:0,mode:'find',status:'active',renderedIds:['b','a'],questions:[{target:'a',choices:[]},{target:'b',choices:[]}],responses:[]};
function harness(){
 let session=structuredClone(initial),cursor=null;
 const input={current:{sessionId:1,index:0,ready:true,keyboardIds:['b','a'],required:['group']}},health={current:'ready'};
 const scope={practice:session,question:0,practicePaused:false,practiceInput:input,rendererHealthRef:health,rendererReady:h=>h==='ready',setPracticeCursor:v=>{cursor=v;},practiceDispatch:action=>{session=mod.exports.practiceReducer(session,action);}};
 const make=()=>new Function('scope',`with(scope){${functions};return {submitPractice,previewPracticeStructure};}`)({...scope,practice:session,question:session.index});
 return{input,health,make,state:()=>session,cursor:()=>cursor};
}
test('preview is anonymous selection only; submission uses actual answer-once reducer',()=>{
 const h=harness(),f=h.make();f.previewPracticeStructure('b');assert.deepEqual(h.cursor(),{sessionId:1,index:0,id:'b'});assert.equal(h.state().responses.length,0);
 f.submitPractice('b');f.submitPractice('a');assert.equal(h.state().responses.length,1);assert.equal(h.state().responses[0].chosen,'b');
});
test('stale question and session callbacks cannot preview or answer new scope',()=>{
 const h=harness(),old=h.make();h.input.current={...h.input.current,index:1};old.previewPracticeStructure('a');old.submitPractice('a');assert.equal(h.cursor(),null);assert.equal(h.state().responses.length,0);
 h.input.current={...h.input.current,index:0,sessionId:2};old.previewPracticeStructure('a');old.submitPractice('a');assert.equal(h.cursor(),null);assert.equal(h.state().responses.length,0);
});
test('immediate renderer loss and missing anatomy refuse captured callbacks',()=>{
 const h=harness(),f=h.make();h.health.current='lost';f.previewPracticeStructure('a');f.submitPractice('a');assert.equal(h.cursor(),null);assert.equal(h.state().responses.length,0);
 h.health.current='ready';h.input.current.ready=false;f.previewPracticeStructure('b');f.submitPractice(null);assert.equal(h.cursor(),null);assert.equal(h.state().responses.length,0);
});
test('unknown and removed cursor IDs cannot preview; close clears only current scope',()=>{
 const h=harness(),f=h.make();f.previewPracticeStructure('foreign');assert.equal(h.cursor(),null);f.previewPracticeStructure('a');assert.equal(h.cursor().id,'a');f.previewPracticeStructure(null);assert.equal(h.cursor(),null);
 h.input.current.keyboardIds=['b'];f.previewPracticeStructure('a');assert.equal(h.cursor(),null);
});
test('closing while paused clears the current cursor but a stale close cannot clear another question',()=>{
 const h=harness(),f=h.make();f.previewPracticeStructure('a');h.input.current.ready=false;h.health.current='lost';f.previewPracticeStructure(null);assert.equal(h.cursor(),null);
 h.input.current.ready=true;h.health.current='ready';f.previewPracticeStructure('b');h.input.current.index=1;f.previewPracticeStructure(null);assert.equal(h.cursor().id,'b');
});
test('actual candidate expression keeps catalogue order, visibility, load and context boundaries',()=>{
 const expression=printer.printNode(ts.EmitHint.Expression,found.get('keyboardIds').initializer,ast);
 const evaluate=new Function('scope',`with(scope){return (${expression});}`);
 const scope={useMemo:f=>f(),exam:true,practice:{mode:'find'},sceneStructures:[
  {id:'second-question',system:'bones',bundle:'g'},{id:'first-question',system:'bones',bundle:'g'},
  {id:'hidden',system:'bones',bundle:'g'},{id:'off',system:'muscles',bundle:'g'},
  {id:'notloaded',system:'bones',bundle:'pending'},{id:'context',system:'bones',bundle:'g'}],systems:{bones:true,muscles:false},hiddenIds:['hidden'],loadStatus:{loaded:['g']},coronaryScene:{contextIds:['context']}};
 assert.deepEqual(evaluate(scope),['second-question','first-question']);
 scope.practice.mode='name';assert.deepEqual(evaluate(scope),[]);scope.practice.mode='find';scope.exam=false;assert.deepEqual(evaluate(scope),[]);
});
test('actual highlight expression refuses old scope, answered, paused and absent candidates',()=>{
 const expression=printer.printNode(ts.EmitHint.Expression,found.get('practiceFocusId').initializer,ast),evaluate=new Function('scope',`with(scope){return (${expression});}`);
 const scope={practicePaused:false,answered:false,practiceCursor:{sessionId:1,index:0,id:'a'},practice:{id:1},question:0,keyboardIds:['a']};assert.equal(evaluate(scope),'a');
 for(const patch of [{practicePaused:true},{answered:true},{question:1},{practice:{id:2}},{keyboardIds:[]}])assert.equal(evaluate({...scope,...patch}),null);
});
test('scene cursor drives both batched and individual selection without enabling labels',()=>{
 const scene=fs.readFileSync('app/body-scene.tsx','utf8');assert.match(scene,/props\.exam \? s\.id === props\.practiceFocusId : s\.id === props\.selectedId/);assert.match(scene,/props\.exam \? structure\.id === props\.practiceFocusId : structure\.id === props\.selectedId/);
 assert.match(scene,/props\.labels && !props\.exam/);assert.match(source,/practiceFocusId=\{practiceFocusId\}/);assert.match(source,/key=\{`\$\{practice\.id\}-\$\{question\}`\}/);
});
