import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {navigateSceneLabels} from '../lib/scene-label-focus.ts';

function fixture() {
  const doc = {activeElement:null}, focuses=[];
  const button=(id,side,top)=>({id,dataset:{side},isConnected:true,disabled:false,
    ownerDocument:doc,offsetHeight:30,top,visibility:'visible',
    closest:()=>null,getClientRects:()=>[{}],getBoundingClientRect(){return {top:this.top};},
    focus(options){assert.equal(options.preventScroll,true);doc.activeElement=this;focuses.push(id);}});
  // Deliberately not in visual or alphabetical order.
  const rows=[button('left-bottom','left',180),button('right-bottom','right',195),
    button('left-top','left',30),button('right-top','right',20),button('left-middle','left',100)];
  const current=rows[4];doc.activeElement=current;
  const original=globalThis.getComputedStyle;
  globalThis.getComputedStyle=button=>({visibility:button.visibility});
  const event=key=>({key,altKey:false,ctrlKey:false,metaKey:false,shiftKey:false,
    isComposing:false,defaultPrevented:false,prevented:0,stopped:0,
    preventDefault(){this.prevented++;},stopPropagation(){this.stopped++;}});
  return {doc,rows,current,focuses,event,restore(){globalThis.getComputedStyle=original;}};
}

test('arrows and Home/End follow visible screen positions, never source order',()=>{
  const f=fixture();try {
    for(const [key,id] of [['ArrowUp','left-top'],['ArrowDown','left-bottom'],
      ['Home','left-top'],['End','left-bottom'],['ArrowRight','right-top']]){
      f.doc.activeElement=f.current;const e=f.event(key);
      navigateSceneLabels(e,f.current,f.rows);
      assert.equal(f.doc.activeElement.id,id);assert.equal(e.prevented,1);assert.equal(e.stopped,1);
    }
  }finally{f.restore();}
});

test('orbit/resize uses new rendered positions and current screen side',()=>{
  const f=fixture();try {
    f.rows[0].top=0;f.rows[2].top=200;
    navigateSceneLabels(f.event('ArrowUp'),f.current,f.rows);
    assert.equal(f.doc.activeElement.id,'left-bottom');
    f.doc.activeElement=f.current;f.current.dataset.side='right';
    navigateSceneLabels(f.event('ArrowLeft'),f.current,f.rows);
    assert.equal(f.doc.activeElement.id,'left-bottom');
  }finally{f.restore();}
});

test('hidden, disabled, removed, inert, zero-layout and foreign labels are excluded',()=>{
  for(const change of [b=>{b.visibility='hidden';},b=>{b.disabled=true;},
    b=>{b.isConnected=false;},b=>{b.closest=()=>({});},b=>{b.getClientRects=()=>[];},
    b=>{b.ownerDocument={};},b=>{b.dataset.side='';}]){
    const f=fixture();try{change(f.rows[3]);
      navigateSceneLabels(f.event('ArrowRight'),f.current,f.rows);
      assert.equal(f.doc.activeElement.id,'right-bottom');
    }finally{f.restore();}
  }
});

test('edges and single-label scenes do not wrap, scroll or bubble to camera controls',()=>{
  const f=fixture();try {
    for(const key of ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End']){
      const e=f.event(key);navigateSceneLabels(e,f.current,[f.current]);
      assert.equal(f.doc.activeElement,f.current);assert.equal(e.prevented,1);assert.equal(e.stopped,1);
    }
    assert.deepEqual(f.focuses,[]);
  }finally{f.restore();}
});

test('native activation/Tab, modifiers, composition and external focus are untouched',()=>{
  const f=fixture();try {
    for(const key of ['Enter',' ','Tab','Escape']){
      const e=f.event(key);navigateSceneLabels(e,f.current,f.rows);assert.equal(e.prevented,0);
    }
    for(const flag of ['altKey','ctrlKey','metaKey','shiftKey','isComposing','defaultPrevented']){
      const e=f.event('ArrowDown');e[flag]=true;navigateSceneLabels(e,f.current,f.rows);assert.equal(e.prevented,0);
    }
    f.doc.activeElement={};const e=f.event('ArrowDown');navigateSceneLabels(e,f.current,f.rows);
    assert.equal(e.prevented,0);assert.deepEqual(f.focuses,[]);
  }finally{f.restore();}
});

test('actual component key handler delegates only focus navigation and exposes instructions',()=>{
  const source=readFileSync('app/scene-label-layer.tsx','utf8');
  const ast=ts.createSourceFile('labels.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const handlers=[];function visit(n){if(ts.isJsxAttribute(n)&&n.name.getText(ast)==='onKeyDown')handlers.push(n.initializer.expression);ts.forEachChild(n,visit);}visit(ast);
  assert.equal(handlers.length,1);
  const f=fixture();try{
    const callback=runInNewContext(ts.transpileModule(`(${handlers[0].getText(ast)})`,
      {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,
      {navigateSceneLabels,buttons:{current:new Map(f.rows.map(b=>[b.id,b]))}});
    const e=Object.assign(f.event('ArrowDown'),{nativeEvent:{isComposing:false},currentTarget:f.current});callback(e);
    assert.equal(f.doc.activeElement.id,'left-bottom');assert.equal(e.prevented,1);
    f.doc.activeElement=f.current;
    const composing=Object.assign(f.event('ArrowDown'),{nativeEvent:{isComposing:true},currentTarget:f.current});callback(composing);
    assert.equal(f.doc.activeElement,f.current);assert.equal(composing.stopped,0);
    assert.match(source,/aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Home End"/);
    assert.match(source,/aria-description="Use arrow keys/);
    assert.match(source,/entry\.onSelect\(entry\.id\)/,'Native click activation retained');
  }finally{f.restore();}
});
