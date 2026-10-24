import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {shouldConfirmHeadPracticeLink} from '../lib/head-practice-navigation.ts';
const require=createRequire(import.meta.url);
const readProduct=path=>readFileSync(process.env.HEAD_PRACTICE_NAV_ROOT?process.env.HEAD_PRACTICE_NAV_ROOT+'/'+path:new URL('../'+path,import.meta.url),'utf8');
const source=readFileSync(process.env.HEAD_PRACTICE_NAV_SOURCE??new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
const ast=ts.createSourceFile('HeadAtlasViewer.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const viewer=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='HeadAtlasViewer');assert(viewer?.body);
const declaration=name=>viewer.body.statements.find(n=>ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>ts.isIdentifier(d.name)&&d.name.text===name));
const scope=declaration('practiceExitScope'),ref=declaration('practiceExitScopeRef'),linkRef=declaration('practiceNavigationLinkRef');
const commit=viewer.body.statements.find(n=>ts.isExpressionStatement(n)&&n.getText(ast).startsWith('useLayoutEffect(')&&n.getText(ast).includes('practiceExitScopeRef.current=practiceExitScope'));
const guard=viewer.body.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='canExitPractice');
const capture=viewer.body.statements.find(n=>ts.isExpressionStatement(n)&&n.getText(ast).startsWith('useLayoutEffect(')&&n.getText(ast).includes("document.addEventListener('click',capture,true)"));
assert(scope&&ref&&commit&&guard);
let topClick,regionGuard;
function visit(node){
 if(ts.isJsxOpeningElement(node))for(const a of node.attributes.properties){
  if(!ts.isJsxAttribute(a)||!a.initializer||!ts.isJsxExpression(a.initializer))continue;
  if(node.tagName.getText(ast)==='Link'&&a.name.text==='onClick'&&a.initializer.getText(ast).includes('canExitPractice'))topClick=a.initializer.expression.getText(ast);
  if(node.tagName.getText(ast)==='ImagingAtlasShell'&&a.name.text==='onBeforeRegionNavigate')regionGuard=a.initializer.expression.getText(ast);
 }
 ts.forEachChild(node,visit);
}
visit(viewer);assert(topClick);
const names=['pkg','study','modality','practice','importGeneration','window','document','Element','HTMLAnchorElement','useRef','useLayoutEffect','shouldConfirmHeadPracticeLink','rememberHistoryView'];
const program=`return function create(input){const {${names.join(',')}}=input;${scope.getText(ast)}\n${ref.getText(ast)}\n${linkRef?.getText(ast)??'const practiceNavigationLinkRef=useRef(null);'}\n${commit.getText(ast)}\n${guard.getText(ast)}\n${capture?.getText(ast)??''}\nreturn {scope:practiceExitScope,scopeRef:practiceExitScopeRef,linkRef:practiceNavigationLinkRef,topClick:${topClick},beforeRegion:${regionGuard??'undefined'}};}`;
const create=new Function(ts.transpileModule(program,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText)();
class ElementFixture{constructor(anchor){this.anchor=anchor;}closest(selector){assert.equal(selector,'a[href]');return this.anchor;}}
class AnchorFixture extends ElementFixture{constructor(href,target='',download=false){super(null);this.anchor=this;this.href=href;this.target=target;this.download=download;}hasAttribute(name){assert.equal(name,'download');return this.download;}}
function harness(active=true,decision=false){
 const effects=[],cleanups=[],listeners=new Map(),question={active,index:3,draft:'typed answer',outcomes:[false,true]};
 const input={pkg:{id:'fixture'},study:{id:'synthetic'},modality:'CT',practice:{active},importGeneration:{current:4},
  window:{location:{href:'http://localhost/atlas/ct-head?concept=pons'},confirm:()=>{effects.push('confirm');return typeof decision==='function'?decision(input):decision;}},
  document:{addEventListener(type,handler,capture){assert.equal(type,'click');assert.equal(capture,true);listeners.set(handler,true);},removeEventListener(type,handler,capture){assert.equal(type,'click');assert.equal(capture,true);listeners.delete(handler);}},
  Element:ElementFixture,HTMLAnchorElement:AnchorFixture,useRef:value=>({current:value}),useLayoutEffect:effect=>{const cleanup=effect();if(cleanup)cleanups.push(cleanup);},shouldConfirmHeadPracticeLink,
  rememberHistoryView:()=>effects.push('remember-view'),
 };
 const controls=create(input),top=new AnchorFixture('http://localhost/atlas/mri-head');controls.linkRef.current=top;
 const event=(href,overrides={})=>({target:new ElementFixture(new AnchorFixture(href)),button:0,defaultPrevented:false,metaKey:false,ctrlKey:false,shiftKey:false,altKey:false,currentTarget:top,preventDefault(){this.defaultPrevented=true;},...overrides});
 const dispatch=click=>{for(const handler of listeners.keys())handler(click);return click;};
 return {input,controls,top,effects,listeners,question,event,dispatch,cleanups};
}
test('active modality, 3D and header links cancel without losing the question',()=>{
 for(const href of ['http://localhost/atlas/mri-head','http://localhost/atlas/head-neck-3d','http://localhost/courses','http://localhost/studio','https://example.test/lesson']){
  const h=harness(),before=structuredClone(h.question),event=h.dispatch(h.event(href));
  assert.equal(event.defaultPrevented,true,href);assert.deepEqual(h.question,before);assert.deepEqual(h.effects,['confirm']);assert.equal(h.controls.scope.consumed,false);
 }
});
test('inactive practice installs no capture listener and never prompts',()=>{
 const h=harness(false);assert.equal(h.listeners.size,0);assert.equal(h.dispatch(h.event('http://localhost/courses')).defaultPrevented,false);assert.deepEqual(h.effects,[]);
});
test('an accepted capture remains retryable if a later guard cancels the event',()=>{
 const h=harness(true,true),first=h.dispatch(h.event('http://localhost/courses'));assert.equal(first.defaultPrevented,false);first.preventDefault();
 const retry=h.dispatch(h.event('http://localhost/courses'));assert.equal(retry.defaultPrevented,false);assert.deepEqual(h.effects,['confirm','confirm']);assert.equal(h.controls.scope.consumed,false);
});
test('the existing top switch owns exactly one native confirmation',()=>{
 for(const decision of [false,true]){
  const h=harness(true,decision),event=h.event(h.top.href,{target:h.top});h.dispatch(event);h.controls.topClick(event);
  assert.equal(event.defaultPrevented,!decision);assert.equal(h.effects.filter(x=>x==='confirm').length,1);assert.equal(h.controls.scope.consumed,false);
 }
});
test('modified, handled, download, separate-target and same-document links keep native behavior',()=>{
 const variants=[{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1},{defaultPrevented:true},
  {target:new AnchorFixture('http://localhost/courses','_blank')},{target:new AnchorFixture('http://localhost/courses','reference')},
  {target:new AnchorFixture('http://localhost/courses','',true)},
  {target:new AnchorFixture('http://localhost/atlas/ct-head?concept=pons#details')}];
 for(const variant of variants){const h=harness();h.dispatch(h.event('http://localhost/courses',variant));assert.deepEqual(h.effects,[]);}
});
test('a retired capture cannot prompt or authorize a later question',()=>{
 for(const retire of [h=>{h.controls.scopeRef.current=null;},h=>{h.input.importGeneration.current++;}]){
  const h=harness(true,true);retire(h);assert.equal(h.dispatch(h.event('http://localhost/courses')).defaultPrevented,true);assert.deepEqual(h.effects,[]);
 }
});
test('replacement inside confirmation and unavailable dialogs fail closed without consuming state',()=>{
 for(const decision of [input=>{input.importGeneration.current++;return true;},()=>{throw Error('dialog unavailable');}]){
  const h=harness(true,decision),before=structuredClone(h.question);assert.equal(h.dispatch(h.event('http://localhost/courses')).defaultPrevented,true);assert.deepEqual(h.question,before);assert.equal(h.controls.scope.pending,false);assert.equal(h.controls.scope.consumed,false);
 }
 const h=harness();h.input.window.confirm=undefined;assert.equal(h.dispatch(h.event('http://localhost/courses')).defaultPrevented,true);assert.equal(h.controls.scope.consumed,false);
});
test('capture cleanup removes the exact listener and retires its committed scope',()=>{
 const h=harness();assert.equal(h.listeners.size,1);for(const cleanup of h.cleanups.toReversed())cleanup();assert.equal(h.listeners.size,0);assert.equal(h.controls.scopeRef.current,null);
});

// Execute the actual region form submitter, not a copied routing decision.
function regionSubmit(onBeforeNavigate,modality='ct',selected='head-neck'){
 const text=readProduct('components/AtlasRegionNavigation.tsx');
 const code=ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const loaded={exports:{}},destinations=[];
 new Function('require','module','exports',code)(name=>{
  if(name==='react')return {useEffect:()=>{},useRef:value=>({current:value})};
  if(name==='react/jsx-runtime')return {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  if(name==='next/navigation')return {useRouter:()=>({push:href=>destinations.push(href)})};
  if(name==='../lib/atlas-navigation')return require('../lib/atlas-navigation.ts');
  return require(name);
 },loaded,loaded.exports);
 const nav=loaded.exports.AtlasRegionNavigation({modality,selected,onBeforeNavigate}),form=nav.props.children;
 const submit=value=>{const event={preventDefault(){},currentTarget:{elements:{namedItem:()=>({value})}}};form.props.onSubmit(event);};
 return {submit,destinations};
}
test('Region Go Cancel preserves the active question and no-op choices never prompt',()=>{
 const h=harness(),region=regionSubmit(h.controls.beforeRegion),before=structuredClone(h.question);region.submit('head-neck');assert.deepEqual(h.effects,[]);
 region.submit('thorax');assert.deepEqual(region.destinations,[]);assert.deepEqual(h.effects,['confirm']);assert.deepEqual(h.question,before);
});
test('Region Go Continue is retryable and uses only the existing exact destination',()=>{
 const h=harness(true,true),region=regionSubmit(h.controls.beforeRegion);region.submit('thorax');assert.deepEqual(region.destinations,['/atlas/ct?region=thorax']);assert.deepEqual(h.effects,['confirm']);assert.equal(h.controls.scope.consumed,false);
});
test('a failed region guard refuses navigation and an absent guard retains existing routes',()=>{
 const denied=regionSubmit(()=>{throw Error('unavailable');});denied.submit('thorax');assert.deepEqual(denied.destinations,[]);
 const ordinary=regionSubmit(undefined);ordinary.submit('thorax');assert.deepEqual(ordinary.destinations,['/atlas/ct?region=thorax']);
});
test('the real shell and workspace navigation relay the optional region guard unchanged',()=>{
 const shell=readProduct('components/ImagingAtlasShell.tsx');
 const workspace=readProduct('components/AtlasWorkspaceNavigation.tsx');
 assert.match(shell,/<AtlasWorkspaceNavigation[^>]*onBeforeRegionNavigate=\{onBeforeRegionNavigate\}/);
 assert.match(workspace,/<AtlasRegionNavigation[^>]*onBeforeNavigate=\{onBeforeRegionNavigate\}/);
 assert(regionGuard,'The real viewer supplies the committed exit guard');
});
