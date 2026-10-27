import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {createHash} from 'node:crypto';

const require=createRequire(new URL('../package.json',import.meta.url));
const {renderToStaticMarkup}=require('react-dom/server');
const jsx=require('react/jsx-runtime');
const componentSource=readFileSync(new URL('../components/HeadImageLayoutControl.tsx',import.meta.url),'utf8');
const viewerSource=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(componentSource,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const componentExports={};
new Function('require','exports',compiled)(name=>{assert.equal(name,'react/jsx-runtime');return jsx;},componentExports);
const {HeadImageLayoutControl}=componentExports;
const select=tree=>tree.props.children.props.children[1];
const options=tree=>select(tree).props.children;
const control=(layout='axial',practice=false,onChange=()=>{})=>HeadImageLayoutControl({layout,practice,onChange});

test('client control renders a labeled native select with five scan layouts',()=>{
  assert.match(componentSource,/^['"]use client['"];?/);
  const tree=control();
  assert.equal(tree.props.children.type,'label');
  assert.equal(select(tree).type,'select');
  assert.equal(select(tree).props['aria-label'],'Image layout');
  assert.deepEqual(options(tree).map(item=>[item.props.value,item.props.children]),[
    ['axial','Axial'],['coronal','Coronal'],['sagittal','Sagittal'],
    ['multiplanar','Multiplanar'],['3d','3D scan view'],
  ]);
  assert(!renderToStaticMarkup(tree).includes('reference 3D Atlas'));
});

test('controlled selection shows each current value and emits every different study layout',()=>{
  const values=['axial','coronal','sagittal','multiplanar','3d'];
  for(const current of values){
    const calls=[],tree=control(current,false,value=>calls.push(value));
    const picker=select(tree);
    assert.equal(picker.props.value,current);
    assert.match(renderToStaticMarkup(tree),new RegExp(`<option value="${current}" selected=""`));
    assert(options(tree).every(item=>!item.props.disabled));
    for(const next of values)picker.props.onChange({currentTarget:{value:next}});
    assert.deepEqual(calls,values.filter(next=>next!==current));
  }
});

test('practice allows three orthogonal layouts and refuses 3D, multiplanar and invalid choices',()=>{
  for(const current of ['axial','coronal','sagittal']){
    const calls=[],tree=control(current,true,value=>calls.push(value));
    const map=new Map(options(tree).map(item=>[item.props.value,item.props.disabled]));
    assert.deepEqual([...map],[['axial',false],['coronal',false],['sagittal',false],['multiplanar',true],['3d',true]]);
    const change=select(tree).props.onChange;
    for(const value of ['axial','coronal','sagittal','multiplanar','3d','bogus',''])change({currentTarget:{value}});
    assert.deepEqual(calls,['axial','coronal','sagittal'].filter(value=>value!==current));
  }
});

const ast=ts.createSourceFile('HeadAtlasViewer.tsx',viewerSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const viewer=ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='HeadAtlasViewer');
assert(viewer?.body);
const statement=name=>viewer.body.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text===name);
const navigate=viewer.body.statements.find(node=>ts.isVariableStatement(node)&&node.declarationList.declarations.some(item=>ts.isIdentifier(item.name)&&item.name.text==='navigateCursor'));
const handler=statement('changeImageLayout');
assert(navigate&&handler,'actual cursor navigation and layout handler');
const makeHandler=new Function(ts.transpileModule(`return function create(c){const {study,quizActive,practice,cursor,setExpanded,focusIJK,navigateCursor}=c;${handler.getText(ast)}return changeImageLayout;}`,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)();

test('parent practice handler retains target focus and uses guarded cursor navigation',()=>{
  const study={geometry:{views:{axial:{fixedAxisIJK:2},coronal:{fixedAxisIJK:1},sagittal:{fixedAxisIJK:0}}}};
  for(const [value,expected] of [['axial',[2,3,30]],['coronal',[2,20,4]],['sagittal',[10,3,4]]]){
    const expanded=[],cursor=[];
    const change=makeHandler({study,quizActive:true,practice:{target:{focus:'focus'}},cursor:[2,3,4],setExpanded:value=>expanded.push(value),focusIJK:(actual,focus)=>{assert.equal(actual,study);assert.equal(focus,'focus');return [10,20,30];},navigateCursor:point=>cursor.push(point)});
    change(value);assert.deepEqual(expanded,[value]);assert.deepEqual(cursor,[expected]);
    change('3d');change('multiplanar');assert.deepEqual(expanded,[value]);assert.deepEqual(cursor,[expected]);
  }
  const navigation=navigate.getText(ast);
  assert.match(navigation,/practiceRef\.current\.clearPendingPick\(point\)/);
  assert.match(navigation,/setCursor\(point\)/);
  assert(navigation.indexOf('clearPendingPick(point)')<navigation.indexOf('setCursor(point)'));
});

test('parent study mode accepts five layouts and missing study refuses changes',()=>{
  const expanded=[],cursor=[];
  const props={study:{},quizActive:false,practice:{},cursor:[1,2,3],setExpanded:value=>expanded.push(value),focusIJK:()=>{throw Error('focus only in practice');},navigateCursor:value=>cursor.push(value)};
  const change=makeHandler(props);
  for(const value of ['axial','coronal','sagittal','multiplanar','3d'])change(value);
  assert.deepEqual(expanded,['axial','coronal','sagittal',null,'3d']);assert.deepEqual(cursor,[]);
  makeHandler({...props,study:null})( 'axial');assert.equal(expanded.length,5);
});

test('parent wires current layout, practice state and handler; Atlas comparison stays separate',()=>{
  const controls=[],comparisons=[];
  function visit(node){
    if(ts.isJsxSelfClosingElement(node)){
      if(node.tagName.getText(ast)==='HeadImageLayoutControl')controls.push(node);
      if(node.tagName.getText(ast)==='HeadAtlasInlineComparisonLoader')comparisons.push(node);
    }
    ts.forEachChild(node,visit);
  }
  visit(viewer);
  assert.equal(controls.length,1);
  const attributes=new Map(controls[0].attributes.properties.map(item=>[item.name.text,item.initializer?.getText(ast)]));
  assert.equal(attributes.get('layout'),"{expanded??'multiplanar'}");
  assert.equal(attributes.get('practice'),'{quizActive}');
  assert.equal(attributes.get('onChange'),'{changeImageLayout}');
  assert.equal(comparisons.length,1);
  assert.match(viewer.getText(ast),/Compare beside 3D Atlas/);
  assert.match(viewer.getText(ast),/geometry from this scan, not the reference 3D Atlas/);
});

test('current Review binding includes the control and rejects stale or tampered display inputs',()=>{
  const inputs=JSON.parse(readFileSync(new URL('../atlas-review/integration-inputs.json',import.meta.url)));
  const path='components/HeadImageLayoutControl.tsx';
  assert.equal(inputs.inputs.find(row=>row.path===path)?.sha256,createHash('sha256').update(componentSource).digest('hex'));
  const current=validateCurrentAtlasDelivery();
  assert.equal(current.reviewIntegration,inputs.sha256);
  // The delivery validator checks metadata. The production Review gate owns
  // input-byte verification; execute that actual loop for a changed display file.
  const gateSource=readFileSync(new URL('../scripts/verify-clinical-review.mjs',import.meta.url),'utf8');
  const loop=gateSource.split('\n').filter(line=>line.startsWith('for (const file of receipt.inputs)'));
  assert.equal(loop.length,1);
  const verifyBytes=new Function('assert','sha','receipt','readFileSync',loop[0]);
  const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
  const read=p=>readFileSync(new URL('../'+p,import.meta.url));
  verifyBytes(assert,sha,inputs,read);
  assert.throws(()=>verifyBytes(assert,sha,inputs,p=>p===path?Buffer.from(componentSource+'\n// changed control'):read(p)),/Review input changed/);
  assert.throws(()=>validateCurrentAtlasDelivery({pin:{...current,reviewIntegration:'0'.repeat(64)}}));
});
