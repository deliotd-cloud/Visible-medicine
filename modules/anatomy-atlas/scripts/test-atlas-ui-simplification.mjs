import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import React from 'react';
import ts from 'typescript';

const workspaceSource=readFileSync(new URL('../app/atlas-workspace.tsx',import.meta.url),'utf8');
const workspaceAst=ts.createSourceFile('atlas-workspace.tsx',workspaceSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let modesFunction;
function visit(node){
  if(ts.isFunctionDeclaration(node)&&node.name?.text==='WorkspaceModes')modesFunction=node;
  ts.forEachChild(node,visit);
}
visit(workspaceAst);
assert(modesFunction,'production WorkspaceModes component found');
const modeCode=ts.transpileModule(modesFunction.getText(workspaceAst).replace(/^export\s+/,''),{
  compilerOptions:{jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022},
}).outputText;
const RadioGroup='radio-group',RadioGroupItem='radio-item';
let context={mode:'explore',exam:false,chooseMode:()=>{},setPanelOpen:()=>{}};
const WorkspaceModes=new Function('React','useAtlasWorkspace','useId','RadioGroup','RadioGroupItem','workspaceModes',`${modeCode}\nreturn WorkspaceModes;`)(
  React,()=>context,()=> 'ui-test',RadioGroup,RadioGroupItem,['explore','dissect','practice']);
const items=tree=>React.Children.toArray(tree.props.children).map(label=>({
  label:React.Children.toArray(label.props.children).filter(child=>typeof child==='string').join(''),
  control:React.Children.toArray(label.props.children).find(child=>React.isValidElement(child)&&child.type===RadioGroupItem),
}));

test('actual mode component orders Explore, Dissect, optional Guided learning, Quiz while retaining practice identity',()=>{
  const plain=items(WorkspaceModes());
  assert.deepEqual(plain.map(item=>item.label),['Explore','Dissect','Quiz']);
  assert.deepEqual(plain.map(item=>item.control.props.value),['explore','dissect','practice']);
  const calls=[];
  context={mode:'dissect',exam:false,chooseMode:value=>calls.push(['mode',value]),setPanelOpen:(...args)=>calls.push(['panel',...args])};
  const guided={active:false,onChange:(...args)=>calls.push(['guided',...args])};
  const group=WorkspaceModes({guidedLearning:guided});
  assert.deepEqual(items(group).map(item=>item.label),['Explore','Dissect','Guided learning','Quiz']);
  assert.deepEqual(items(group).map(item=>item.control.props.value),['explore','dissect','guided-learning','practice']);
  group.props.onValueChange('guided-learning');
  assert.deepEqual(calls.splice(0),[['panel',false,false],['panel',true,false],['guided',true]]);
  group.props.onValueChange('practice');
  assert.deepEqual(calls.splice(0),[['guided',false,'mode-switch'],['mode','practice']]);
  context={...context,mode:'practice',exam:true};
  const exam=WorkspaceModes({guidedLearning:guided});
  assert.deepEqual(items(exam).map(item=>item.control.props.disabled),[true,true,true,false]);
  exam.props.onValueChange('guided-learning');
  assert.deepEqual(calls,[]);
});

test('actual body toolbar keeps slider, labels and reset exposed; layout remains in native disclosure',()=>{
  const source=readFileSync(new URL('../app/body-explorer.tsx',import.meta.url),'utf8');
  const ast=ts.createSourceFile('body-explorer.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  let toolbar;
  function find(node){
    if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(ast)==='div'&&node.openingElement.attributes.getText(ast).includes('className="body-toolbar"'))toolbar=node;
    ts.forEachChild(node,find);
  }
  find(ast);assert(toolbar,'production toolbar found');
  const markup=toolbar.getText(ast);
  const advanced=markup.match(/<details className="body-advanced-view">([\s\S]*?)<\/details>/)?.[1];
  assert(advanced,'Advanced view is a native keyboard-operable disclosure');
  assert.match(advanced,/<summary>Advanced view<\/summary>/);
  assert.match(advanced,/<ExplodeStyleSelect[\s\S]*?onChange=\{changeLayout\}/);
  assert.match(markup,/<div className="body-explode">\s*<Slider/);
  assert(markup.indexOf('<Slider')<markup.indexOf('<details className="body-advanced-view">'));
  assert.match(markup,/aria-label="Toggle stage and selected labels"/);
  assert.match(markup,/aria-label="Reset camera, layout, cutaway, focus, isolation, and separation"/);
  assert.equal((markup.match(/<ExplodeStyleSelect/g)??[]).length,1,'all three layout options retain one selector');
  const css=readFileSync(new URL('../app/body-explorer.css',import.meta.url),'utf8');
  assert.match(css,/\.body-advanced-view summary:focus-visible/);
  assert.match(css,/\.body-advanced-view-content\s*\{[^}]*position:absolute/);
});
