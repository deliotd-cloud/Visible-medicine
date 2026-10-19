import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {focusImagingPane,type ImagingPane} from '../lib/imaging-pane-focus.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/ImagingPaneNavigation.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../components/imaging-atlas-shell.css',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const loaded={exports:{} as {ImagingPaneNavigation:(props:{infoLabel:string})=>React.ReactElement<any>}};
new Function('require','module','exports',compiled)((name:string)=>name==='../lib/imaging-pane-focus'?{focusImagingPane}:require(name),loaded,loaded.exports);

function fixture(pane:ImagingPane,box={top:140,bottom:650,left:16,right:1264},present=true){
  const calls:unknown[]=[];
  const state={selection:'source-bound-pons',question:'pending',firstScore:2,route:'/atlas/mri-head?concept=brainstem-pons',indexScroll:480,learningScroll:96};
  const before=JSON.stringify(state);
  const target={ownerDocument:{defaultView:{innerHeight:720,innerWidth:1280}},getBoundingClientRect:()=>box,
    focus:(options:unknown)=>calls.push(['focus',options]),scrollIntoView:(options:unknown)=>calls.push(['reveal',options])};
  const origin={closest:(selector:string)=>{calls.push(['scope',selector]);return {querySelector:(selector:string)=>{calls.push(['target',selector]);assert.equal(selector,`[data-imaging-pane="${pane}"]`);return present?target:null;}};}};
  return {origin:origin as unknown as HTMLElement,calls,state,before};
}

test('keyboard shortcuts use exact workspace-scoped targets and preserve viewer/session state',()=>{
  for(const pane of ['image','learning','index'] as const){
    const f=fixture(pane);assert.equal(focusImagingPane(f.origin,pane),true);
    assert.deepEqual(f.calls,[['scope','.imaging-workspace-page'],['target',`[data-imaging-pane="${pane}"]`],['focus',{preventScroll:true}]]);
    assert.equal(JSON.stringify(f.state),f.before);
  }
});

test('an off-screen stacked pane is revealed only after focus without resetting internal scroll',()=>{
  for(const box of [{top:1100,bottom:1500,left:16,right:360},{top:-500,bottom:0,left:16,right:360}]){
    const f=fixture('learning',box);focusImagingPane(f.origin,'learning');
    assert.deepEqual(f.calls.slice(-2),[['focus',{preventScroll:true}],['reveal',{block:'nearest',inline:'nearest',behavior:'instant'}]]);
    assert.equal(JSON.stringify(f.state),f.before);
  }
  const partlyVisible=fixture('image',{top:650,bottom:1200,left:16,right:360});focusImagingPane(partlyVisible.origin,'image');
  assert(!partlyVisible.calls.some(call=>Array.isArray(call)&&call[0]==='reveal'));
});

test('missing, foreign and detached targets fail without document-wide fallback or routing',()=>{
  const absent=fixture('image',undefined,false);assert.equal(focusImagingPane(absent.origin,'image'),false);
  assert.equal(absent.calls.length,2);
  assert.equal(focusImagingPane({closest:()=>null} as unknown as HTMLElement,'image'),false);
  const foreign=fixture('index');assert.equal(focusImagingPane(foreign.origin,'foreign' as ImagingPane),false);assert.deepEqual(foreign.calls,[]);
});

test('real navigation renders three native buttons and activates the requested pane only',()=>{
  for(const infoLabel of ['Anatomy learning panel','Structure information']){
    const tree=loaded.exports.ImagingPaneNavigation({infoLabel});
    const buttons=tree.props.children as React.ReactElement<any>[];
    assert.deepEqual(buttons.map(button=>button.props.children),['Skip to image viewer',`Skip to ${infoLabel.toLowerCase()}`,'Skip to anatomy index']);
    for(const [index,pane]of (['image','learning','index'] as const).entries()){
      const f=fixture(pane);assert.equal(buttons[index].props.type,'button');
      buttons[index].props.onClick({currentTarget:f.origin});assert.equal(f.calls.length,3);
    }
    const html=renderToStaticMarkup(tree);assert.match(html,/aria-label="Imaging workspace shortcuts"/);
    assert.doesNotMatch(html,/href=|tabindex="0"|accesskey=|aria-hidden/);
  }
});

test('shortcuts stay visually hidden until keyboard focus and targets retain visible focus',()=>{
  assert.match(css,/\.imaging-pane-navigation\{[^}]*width:1px;height:1px;overflow:hidden;clip-path:inset\(50%\)/);
  assert.match(css,/\.imaging-pane-navigation:focus-within\{[^}]*flex-wrap:wrap[^}]*clip-path:none/);
  assert.match(css,/\.imaging-pane-navigation button\{min-height:44px;font-size:14px/);
  assert.match(css,/\[data-imaging-pane\]:focus-visible\{outline:2px/);
});
