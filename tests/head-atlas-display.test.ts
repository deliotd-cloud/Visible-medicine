import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {annotationInk,headLabel} from '../lib/head-atlas-display.ts';

test('display labels omit only the regional-mask suffix and never mutate source identities or scope',()=>{
  const entry={id:'mrb.bst.medulla',label:'Medulla oblongata — regional mask',source:{declared_scope:'Partial regional mask only.'}};
  assert.equal(headLabel(entry),'Medulla oblongata');
  assert.equal(entry.label,'Medulla oblongata — regional mask');assert.equal(entry.source.declared_scope,'Partial regional mask only.');
  assert.equal(headLabel({label:'Left peduncle - Regional mask'}),'Left peduncle');
  assert.equal(headLabel({label:'Left peduncle — point locator'}),'Left peduncle — point locator');
  assert.equal(headLabel({label:'Left peduncle — limited region'}),'Left peduncle — limited region');
});
test('annotation ink preserves bright colours and lifts dark colours without changing the mask colour array',()=>{
  const bright=[1,.8,.4],dark=[.05,.1,.3];
  assert.equal(annotationInk(bright),'rgb(255,204,102)');
  const channels=annotationInk(dark).match(/\d+/g)!.map(Number);
  assert.ok(channels[2]>channels[1]&&channels[1]>channels[0],'hue ordering preserved');
  assert.ok(channels[0]>128,'dark blue becomes readable ink');assert.deepEqual(dark,[.05,.1,.3]);
});
test('canvas labels remain vivid while leaders are softer dashed lines with isolated drawing state',()=>{
  const source=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
  assert.match(source,/const ink=annotationInk\(color\)/);
  assert.match(source,/ctx.save\(\);ctx.setLineDash\(\[4,5\]\);ctx.lineCap='round'/);
  assert.match(source,/ctx.strokeStyle='rgba\(0,0,0,.45\)';ctx.lineWidth=3.5/);
  assert.match(source,/ctx.strokeStyle=ink;ctx.globalAlpha=.8;ctx.lineWidth=1.5;ctx.stroke\(\);ctx.restore\(\);\s+ctx.beginPath\(\);ctx.arc\(anchor.x,anchor.y,4/);
  assert.match(source,/ctx.strokeText\(label/);assert.match(source,/ctx.fillStyle=ink;ctx.fillText\(label/);
  assert.match(source,/headLabel\(selected.entry\)/);assert.match(source,/headLabel\(entry\)/);
});
