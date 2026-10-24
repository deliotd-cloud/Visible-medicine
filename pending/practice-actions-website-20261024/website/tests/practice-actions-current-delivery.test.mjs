import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {build as esbuild} from 'esbuild';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const site=fileURLToPath(new URL('../',import.meta.url));
const review=resolve(site,'atlas-review');
const atlas='F:/VisibleMedicine/staging/20261024-practice-actions/atlas';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=p=>JSON.parse(readFileSync(p));
const build=options=>esbuild({jsx:'automatic',packages:'external',...options});

const baseline='5f3c0a9518b03ae23f3992129a09c4b6edeeda2b';
const require=createRequire(import.meta.url),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const printer=ts.createPrinter({newLine:ts.NewLineKind.LineFeed});
const text=p=>readFileSync(p==='package.json'?resolve(atlas,p):resolve(review,p),'utf8').replaceAll('\r\n','\n');
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
test('the reusable action-bar regression is registered without dependency or other script changes',()=>{
 const before=JSON.parse(execFileSync('git',['show',baseline+':package.json'],{cwd:atlas,encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
 const current=JSON.parse(text('package.json'));
 assert.equal(current.scripts['practice-actions:test'],'node --test scripts/test-practice-action-bar.mjs');
 delete current.scripts['practice-actions:test'];assert.deepEqual(current,before);
});
for(const [path,names,bars]of players)test(path+': original answer/next guards and every Button prop preserved',()=>{
 const original=execFileSync('git',['show',`${baseline}:${path}`],{cwd:atlas,encoding:'utf8',windowsHide:true,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},maxBuffer:16e6});
 const before=inspect(original),after=inspect(text(path));
 assert.deepEqual(after.buttons,before.buttons,'Complete button prop multiset, not just a marker');
 for(const name of names){assert(before.functions.has(name)&&after.functions.has(name),name);
  assert.equal(after.functions.get(name),before.functions.get(name),name+': complete original handler');}
 assert.equal(after.bars.length,bars);assert(text(path).includes("import { PracticeActionBar } from './practice-action-bar';"));
});

test('shared action bar preserves child controls and score semantics without focus or live-region side effects',async()=>{
 const built=await build({stdin:{contents:"export {PracticeActionBar} from './app/practice-action-bar';",resolveDir:review,loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs',loader:{'.css':'empty'}});
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


test('current Website delivers the exact shared controls without carrying forward an old Review display epoch',()=>{
 const source='7659453d7d99da78742b06ee6e6665a467e5d972';
 const pin=validateCurrentAtlasDelivery();
 assert.equal(pin.source,source);
 assert.equal(pin.sourceTree,'386b175434aa1f7cbcd705e05f0946b3b594ca54');
 const manifest=json(resolve(review,'manifest.json'));
 const binding=json(resolve(review,'integration-inputs.json'));
 const viewer=json(resolve(site,'public/atlas-review-viewer/manifest.json'));
 for(const path of ['app/body-explorer.tsx','app/shoulder-explorer.tsx','app/nested-practice.tsx','app/um-limb-learning.tsx','app/practice-action-bar.tsx','app/practice-action-bar.css']){
  const bytes=execFileSync('git',['show',source+':'+path],{cwd:atlas,windowsHide:true,maxBuffer:16e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  const row=manifest.files.find(row=>row.path===path);
  assert.equal(row?.sourceSha256,sha(bytes),path+': committed original');
  assert.equal(row.importedSha256,sha(readFileSync(resolve(review,path))),path+': actual import');
  assert.equal(binding.inputs.find(row=>row.path==='atlas-review/'+path)?.sha256,row.importedSha256,path+': bound Review');
 }
 assert.equal(viewer.sourceCommit,source);assert.equal(viewer.websiteIntegrationSha256,binding.sha256);
 assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.mode,'production');
 const emitted=(base,manifest)=>manifest.files.filter(row=>/\.(?:js|css)$/.test(row.path)).map(row=>readFileSync(resolve(base,row.path),'utf8')).join('\n');
 assert(emitted(resolve(site,'public/atlas-review-viewer'),viewer).includes('vm-practice-action-bar'));
 for(const name of ['head-neck','shoulder','lower-limb','female-pelvis']){
  const base=resolve(site,'public/atlas-runtime',name),module=json(resolve(base,'manifest.json'));
  const inputs=json(resolve(base,'source-inputs.json'));
  assert.equal(module.sourceCommit,source);assert.equal(module.patientDataIncluded,false);assert.notEqual(module.clinicalApproved,true);
  for(const path of ['app/practice-action-bar.tsx','app/practice-action-bar.css'])
   assert.equal(inputs.find(row=>row.path===path)?.sha256,sha(readFileSync(resolve(atlas,path))),name+': exact shared source '+path);
  const code=emitted(base,module);assert(code.includes('vm-practice-action-bar'),name+': actual emitted controls');
  assert(code.includes('Practice progress and actions'),name+': emitted accessible group');
 }
 const parent='F:/VisibleMedicine/staging/20261024-upper-vascular-website/website';
 const old=json(resolve(parent,'tests/fixtures/current-atlas-delivery.json'));
 assert.throws(()=>validateCurrentAtlasDelivery({pin:old,root:site}),'Old complete delivery cannot admit new display');
 const now=json(resolve(review,'content/review-revisions.json'));
 const prior=json(resolve(parent,'atlas-review/content/review-revisions.json'));
 assert.notDeepEqual(now,prior,'Display-dependent shoulder reviews advance instead of reusing stale geometry approval');
 assert.deepEqual(json(resolve(site,'lib/atlas-model-inventory.json')).models,json(resolve(parent,'lib/atlas-model-inventory.json')).models);
 for(const path of ['lib/head-atlas-links.ts','lib/head-separate-comparison.ts','package.json','package-lock.json','LICENSES/THIRD_PARTY_NOTICES.md'])
  assert.deepEqual(readFileSync(resolve(site,path)),readFileSync(resolve(parent,path)),path+': linking/access/dependencies/licensing unchanged');
});
