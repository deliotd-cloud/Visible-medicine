import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {build} from './workspace-component-test-build.mjs';

const baseline='5f3c0a9518b03ae23f3992129a09c4b6edeeda2b';
const actionBarCommit='2bdab1455914ef50fe3cb32edc020abea2aaf743';
const require=createRequire(import.meta.url),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const printer=ts.createPrinter({newLine:ts.NewLineKind.LineFeed});
const text=p=>readFileSync(p,'utf8').replaceAll('\r\n','\n');
function inspect(source){
 const ast=ts.createSourceFile('player.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 assert.equal(ast.parseDiagnostics.length,0);
 const functions=new Map(),buttons=[],bars=[];
 const print=node=>printer.printNode(ts.EmitHint.Unspecified,node,ast);
 function visit(node){
  if(ts.isFunctionDeclaration(node)&&node.name)functions.set(node.name.text,print(node));
  if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.initializer&&
   (ts.isArrowFunction(node.initializer)||ts.isCallExpression(node.initializer)))functions.set(node.name.text,print(node));
  if((ts.isJsxOpeningElement(node)||ts.isJsxSelfClosingElement(node))&&node.tagName.getText(ast)==='Button'){
   // Every original button's complete props, especially readiness and epoch
   // guards, must remain present. Only their containing presentation moves.
   buttons.push(node.attributes.properties.map(print).sort().join('\n'));
  }
  if(ts.isJsxOpeningElement(node)&&node.tagName.getText(ast)==='PracticeActionBar')bars.push(print(node));
  ts.forEachChild(node,visit);
 }
 visit(ast);return{functions,buttons:buttons.sort(),bars};
}
const players=[
 ['app/body-explorer.tsx',['nextQuestion','submitPractice'],2],
 ['app/shoulder-explorer.tsx',['nextQuestion','answerExamOption'],1],
 ['app/nested-practice.tsx',['answer','next','retryMissed'],1],
 ['app/um-limb-learning.tsx',['acceptsEvent','next','again','answer','reveal'],1],
];
test('the original action-bar registration changed only its command, and the current command retains its dependencies',()=>{
 const before=JSON.parse(execFileSync('git',['show',baseline+':package.json'],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
 const introduced=JSON.parse(execFileSync('git',['show',actionBarCommit+':package.json'],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
 assert.equal(introduced.scripts['practice-actions:test'],'node --test scripts/test-practice-action-bar.mjs');
 delete introduced.scripts['practice-actions:test'];
 assert.deepEqual(introduced,before,'Exact historical action-bar commit changed only the test command');
 const current=JSON.parse(text('package.json'));
 assert.equal(current.scripts['practice-actions:test'],'node --test scripts/test-practice-action-bar.mjs');
 assert.deepEqual(current.dependencies,before.dependencies,'Current runtime dependencies remain unchanged');
 assert.deepEqual(current.devDependencies,before.devDependencies,'Current test dependencies remain unchanged');
});
for(const [path,names,bars]of players)test(path+': original answer/next guards and every Button prop preserved',()=>{
 const original=execFileSync('git',['show',`${baseline}:${path}`],{encoding:'utf8',windowsHide:true,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},maxBuffer:16e6});
 const before=inspect(original),after=inspect(text(path));
 assert.deepEqual(after.buttons,before.buttons,'Complete button prop multiset, not just a marker');
 for(const name of names){assert(before.functions.has(name)&&after.functions.has(name),name);
  if(path==='app/body-explorer.tsx'&&name==='submitPractice'){
   // Invert only the intentionally strengthened session/readiness gate. The
   // historical handler body must otherwise still match byte for byte after printing.
   const guardedSource=original.replace(
    /function submitPractice\(chosen: string \| null\) \{\s*if \(practicePaused\) return;/,
    `function submitPractice(chosen: string | null) {
      const current = practiceInput.current;
      if (practicePaused || !current.ready || !rendererReady(rendererHealthRef.current)
        || current.sessionId !== practice.id || current.index !== question) return;`);
   assert.notEqual(guardedSource,original,'Historical submit gate found exactly');
   const actual=after.functions.get(name),expected=inspect(guardedSource).functions.get(name);
   assert.equal(actual,expected,
    name+': exact intended readiness/session guard, original dispatch and nothing else');
   const dispatch='    practiceDispatch({';
   const actualDispatch=actual.indexOf(dispatch),historicalDispatch=before.functions.get(name).indexOf(dispatch);
   assert(actualDispatch>0&&historicalDispatch>0,'Dispatch preserved in both handlers');
   assert.equal(actual.slice(actualDispatch),before.functions.get(name).slice(historicalDispatch),
    'Inverting the added guard restores the complete historical dispatch and handler tail');
  }else assert.equal(after.functions.get(name),before.functions.get(name),name+': complete original handler');}
 assert.equal(after.bars.length,bars);assert(text(path).includes("import { PracticeActionBar } from './practice-action-bar';"));
});

test('shared action bar preserves child controls and score semantics without focus or live-region side effects',async()=>{
 const built=await build({stdin:{contents:"export {PracticeActionBar} from './app/practice-action-bar';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs',loader:{'.css':'empty'}});
 const module={exports:{}};runInNewContext(built.outputFiles[0].text,{module,exports:module.exports,require,console,process:{env:{NODE_ENV:'test'}}});
 const {PracticeActionBar}=module.exports;
 const action=React.createElement('button',{disabled:true,type:'button'},'Next question');
 const html=renderToStaticMarkup(React.createElement(PracticeActionBar,{correct:2,answered:4,children:action}));
 assert(html.includes('Practice progress and actions'));assert(html.includes('2 / 4'));
 assert(html.includes('disabled=""'));assert(html.includes('Next question'));
 assert(!html.includes('aria-live'));assert(!html.includes('tabindex'));assert(!html.includes('autofocus'));
 const specimen=renderToStaticMarkup(React.createElement(PracticeActionBar,{correct:1,answered:3,label:'First try',children:action}));
 assert(specimen.includes('First try'));assert(specimen.includes('1 / 3'));
 assert(!text('app/practice-action-bar.tsx').includes('useEffect'));
});

test('bar is local to the panel, wraps controls and has short-viewport/high-contrast fallbacks',()=>{
 const css=text('app/practice-action-bar.css');
 assert.match(css,/position: sticky/);assert.match(css,/inset-block-end: 0/);
 assert.match(css,/flex-wrap: wrap/);assert.match(css,/min-block-size: 2\.75rem/);
 assert.match(css,/@media \(max-height: 480px\)[\s\S]*position: static/);
 assert.match(css,/@media \(forced-colors: active\)[\s\S]*background: Canvas/);
 assert.match(css,/:is\(\.body-info, \.eye-layer-controls\):has\(\.vm-practice-action-bar\)[\s\S]*padding-block-end: 0;[\s\S]*scroll-padding-block-end: 9rem;/);
 assert.match(css,/\.anatomy-controls-popup \.vm-practice-action-bar\s*\{\s*position: static;/);
 assert.match(css,/\[data-panel-info='false'\]\[data-focus-view='false'\]\[data-workspace-mode='practice'\] > \.body-layout\s*\{\s*flex: 1 1 0;\s*min-height: 0;\s*overflow: hidden;/);
 const scope=".body-app[data-presentation='panel'][data-panel-short='true'][data-panel-info='false'][data-focus-view='false'][data-workspace-mode='practice']";
 const hiddenRules=[...css.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(match=>/overflow:\s*hidden/.test(match[2]));
 assert.deepEqual(hiddenRules.map(match=>match[1].trim()),[scope,scope+' > .body-layout'],
  'No content/bar clipping: only the two exact short-Quiz viewport containers may hide outer overflow');
 for(const forbidden of ['position: fixed','height: 100vh','scrollIntoView','window.scroll'])assert(!css.includes(forbidden));
});
