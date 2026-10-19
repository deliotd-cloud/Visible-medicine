import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {bindSliceWheel} from '../lib/slice-wheel.mjs';
function setup(slice=5) {
  const target=new EventTarget(),changes=[];
  const remove=bindSliceWheel(target,{getSlice:()=>slice,sliceCount:10,onSlice:value=>{slice=value;changes.push(value);},pagePixels:()=>240});
  const send=(deltaY,extra={})=>{
    const event=new Event('wheel',{cancelable:true});
    Object.defineProperties(event,Object.fromEntries(Object.entries({deltaY,deltaMode:0,timeStamp:100,...extra}).map(([k,value])=>[k,{value}])));
    target.dispatchEvent(event);return event.defaultPrevented;
  };
  return{target,send,remove,changes,slice:()=>slice};
}
test('image wheel changes slices and consumes page scrolling, including limits',()=>{
  const v=setup();assert.equal(v.send(80),true);assert.equal(v.slice(),6);
  v.send(-80);assert.equal(v.slice(),5);v.send(8000);assert.equal(v.slice(),9);
  assert.equal(v.send(80),true);assert.equal(v.slice(),9);
  v.send(-8000);assert.equal(v.slice(),3);v.send(-8000);assert.equal(v.slice(),0);
  assert.equal(v.send(-80),true);assert.equal(v.slice(),0);
});
test('trackpad accumulation, reversal, inactivity and wheel units are predictable',()=>{
  const v=setup();v.send(20);v.send(20);v.send(20);assert.equal(v.slice(),5);v.send(20);assert.equal(v.slice(),6);
  v.send(60);v.send(-40);assert.equal(v.slice(),6);v.send(-40);assert.equal(v.slice(),5);
  v.send(60);v.send(20,{timeStamp:400});assert.equal(v.slice(),5);
  const line=setup();line.send(2,{deltaMode:1});assert.equal(line.slice(),6);
  const page=setup();page.send(1,{deltaMode:2});assert.equal(page.slice(),8);
});
test('modified gestures, horizontal input and cleaned-up views do not capture scrolling',()=>{
  const v=setup();
  for(const modifier of ['ctrlKey','metaKey','shiftKey'])assert.equal(v.send(80,{[modifier]:true}),false);
  assert.equal(v.send(0),false);assert.equal(v.send(NaN),false);assert.equal(v.slice(),5);
  assert.equal(v.send(20,{deltaX:120}),false);assert.equal(v.slice(),5);
  v.remove();assert.equal(v.send(80),false);assert.equal(v.slice(),5);
});
test('wheel binding is scoped to the native slice area and uses the native fixed axis',()=>{
  const ui=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
  assert.ok(ui.includes('bindSliceWheel(area,'));
  assert.ok(ui.includes('liveCursor.current[view.fixedAxisIJK]'));
  assert.ok(ui.includes('next[view.fixedAxisIJK]=slice'));
  assert.doesNotMatch(ui,/bindSliceWheel\((?:document|window)/);
});
