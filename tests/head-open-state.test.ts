import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import ts from 'typescript';

const source=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
const ast=ts.createSourceFile('HeadAtlasViewer.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const require=createRequire(import.meta.url);
const renderToStaticMarkup=require('react-dom/server').renderToStaticMarkup as (element:unknown)=>string;

function declaration(name:string){
  const node=ast.statements.find((statement):statement is ts.FunctionDeclaration=>
    ts.isFunctionDeclaration(statement)&&statement.name?.text===name);
  assert(node,`${name} must be a top-level function declaration`);
  return node;
}
function actualFunction(name:string){
  const node=declaration(name);
  const compiled=ts.transpileModule(`${node.getText(ast)}\nreturn ${name};`,{
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX},
  });
  const runtimeRequire=(id:string)=>id==='react/jsx-runtime'?require(id):(()=>{throw Error(`unexpected dependency ${id}`);})();
  return new Function('require','exports',compiled.outputText)(runtimeRequire,{});
}

const headSourceAfterCancel=actualFunction('headSourceAfterCancel') as (state:string,hostname:string)=>string;
const renderHeadAtlasOpening=actualFunction('renderHeadAtlasOpening') as (props:Record<string,unknown>)=>unknown;
const render=(props:Record<string,unknown>)=>renderToStaticMarkup(renderHeadAtlasOpening({
  modality:'CT',count:355,packageOpening:false,hasPackage:false,sourceState:'unknown',
  studyLoadFailed:false,error:'',busy:false,onChooseFolder:()=>{},...props,
}));

test('cancelling an unknown automatic check preserves loopback uncertainty and classifies other hosts',()=>{
  for(const host of ['localhost','127.0.0.1','[::1]'])assert.equal(headSourceAfterCancel('unknown',host),'paused',host);
  for(const host of ['example.test','vm.example.org'])assert.equal(headSourceAfterCancel('unknown',host),'unavailable',host);
  for(const state of ['available','unavailable','failed','paused']){
    assert.equal(headSourceAfterCancel(state,'localhost'),state);
    assert.equal(headSourceAfterCancel(state,'example.test'),state);
  }
});

test('opening screen reflects classification and preserves manual folder and annotation controls',()=>{
  for(const modality of ['CT','MRI']){
    const count=modality==='CT'?355:117;
    const unknown=render({modality,count});
    assert.match(unknown,/head-atlas-open/);assert.match(unknown,new RegExp(`${modality} · Head`));
    assert.match(unknown,new RegExp(`${count} accepted annotations`));
    assert.match(unknown,/Choose atlas folder/);
    assert.match(unknown,/Checking for an approved local source/);
    assert.match(unknown,/<details><summary>Manual folder help<\/summary>/);
    assert.doesNotMatch(unknown,/No automatic local source is connected/);
    assert.doesNotMatch(unknown,/Use Reopen local atlas/);
    assert.doesNotMatch(unknown,/Use Retry local atlas/);
    const unavailable=render({modality,count,sourceState:'unavailable'});
    assert.match(unavailable,/No automatic local source is connected/);
    assert.match(unavailable,/Choose atlas folder/);
    assert.match(unavailable,/Hosted scan delivery is not yet enabled/);
    const paused=render({modality,count,sourceState:'paused'});
    assert.match(paused,/Resume local atlas/);
    assert.doesNotMatch(paused,/No automatic local source is connected/);
    const available=render({modality,count,sourceState:'available'});
    assert.match(available,/Reopen local atlas/);
    const failed=render({modality,count,sourceState:'failed'});
    assert.match(failed,/Retry local atlas/);
  }
});

test('package opening and native study loading are distinct from a failed study',()=>{
  const opening=render({packageOpening:true,busy:true});
  assert.match(opening,/Opening the approved CT head atlas/);
  assert.match(opening,/Loading and verifying the selected source/);
  assert.match(opening,/disabled=""/);
  const loading=render({hasPackage:true,busy:true});
  assert.match(loading,/Loading and verifying the selected source/);
  const failed=render({hasPackage:true,studyLoadFailed:true,error:'Native image failed'});
  assert.doesNotMatch(failed,/Loading and verifying the selected source/);
  assert.match(failed,/Retry opening scan/);
  assert.match(failed,/Unable to open the approved CT head atlas/);
  assert.match(failed,/Choose atlas folder/);
  const manualFailure=render({sourceState:'paused',error:'Manual folder invalid'});
  assert.match(manualFailure,/Choose the approved folder below to try again/);
  assert.doesNotMatch(manualFailure,/No automatic local source is connected/);
});

test('opening tree keeps the real folder callback and busy flag',()=>{
  let chosen=0;
  const onChooseFolder=()=>{chosen++;};
  const idle=renderHeadAtlasOpening({modality:'MRI',count:117,packageOpening:false,hasPackage:false,
    sourceState:'unknown',studyLoadFailed:false,error:'',busy:false,onChooseFolder}) as any;
  assert.equal(idle.type,'section');assert.equal(idle.props.className,'head-atlas-open');
  const walk=(value:any):any[]=>!value?[]:Array.isArray(value)?value.flatMap(walk):typeof value==='object'&&'props'in value?[value,...walk(value.props.children)]:[];
  const button=walk(idle).find(node=>node.type==='button'&&node.props.children==='Choose atlas folder');
  assert(button);assert.equal(button.props.disabled,false);button.props.onClick();assert.equal(chosen,1);
  const busy=renderHeadAtlasOpening({modality:'MRI',count:117,packageOpening:true,hasPackage:false,
    sourceState:'unknown',studyLoadFailed:false,error:'',busy:true,onChooseFolder}) as any;
  assert.equal(walk(busy).find(node=>node.type==='button'&&node.props.children==='Choose atlas folder')?.props.disabled,true);
});

test('a failed study flag or stopped error cannot masquerade as loading',()=>{
  for(const modality of ['CT','MRI'])for(const state of [
    {hasPackage:true,studyLoadFailed:true,error:''},
    {hasPackage:true,studyLoadFailed:false,error:'Native read stopped'},
  ]){
    const html=render({modality,...state});
    assert.match(html,new RegExp(`Unable to open the approved ${modality} head atlas`));
    assert.doesNotMatch(html,/Loading and verifying/);
    assert.match(html,/aria-busy="false"/);
  }
});

test('viewer passes live state to opening renderer and uses cancellation classification in automatic effect',()=>{
  const viewer=declaration('HeadAtlasViewer');
  const calls:ts.CallExpression[]=[];
  const walk=(node:ts.Node):void=>{if(ts.isCallExpression(node))calls.push(node);ts.forEachChild(node,walk);};walk(viewer);
  const opening=calls.find(node=>ts.isIdentifier(node.expression)&&node.expression.text==='renderHeadAtlasOpening');
  assert(opening,'viewer must render the opening state through the tested function');
  const props=opening.arguments[0];assert(props&&ts.isObjectLiteralExpression(props));
  const keys=new Map(props.properties.flatMap(property=>
    ts.isPropertyAssignment(property)?[[property.name.getText(ast),property.initializer.getText(ast)] as const]:
    ts.isShorthandPropertyAssignment(property)?[[property.name.text,property.name.text] as const]:[]));
  for(const key of ['modality','count','packageOpening','hasPackage','sourceState','studyLoadFailed','error','busy','onChooseFolder'])assert(keys.has(key),`live ${key} is passed`);
  assert.equal(keys.get('sourceState'),'localSourceState');
  assert.equal(keys.get('hasPackage'),'!!pkg');
  assert.equal(keys.get('busy'),'!!status');
  assert.equal(calls.filter(node=>ts.isIdentifier(node.expression)&&node.expression.text==='headSourceAfterCancel').length,2,'manual takeover and close both preserve source uncertainty');
  assert.match(viewer.getText(ast),/setLocalSourceState\('unavailable'\)/,'nonloopback must be classified after the skipped automatic check');
  assert.match(viewer.getText(ast),/localSourceState==='paused'\?'Resume local atlas'/,'paused header has an explicit resume action');
});
