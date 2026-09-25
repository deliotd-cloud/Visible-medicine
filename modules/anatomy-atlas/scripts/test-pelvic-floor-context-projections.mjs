import assert from 'node:assert/strict';
import test from 'node:test';
import {commonPelvicContextFrame,pelvicFloorContextProjection} from './render-pelvic-floor-context.mjs';

const shape=file=>({tree:'isa',file,min:[-20,-30,-40],max:[50,60,70],vertices:[[-20,-30,-40],[50,-30,-40],[0,60,70]],faces:[[0,1,2]]});
await test('context projections retain source geometry and one frame across candidates',()=>{
  const candidateShapes=[shape('FJA'),{...shape('FJB'),min:[-60,-30,-40],max:[50,100,70]}];
  const contextShapes=['FJ3152','FJ3288','FJ3393','FJ1426','FJ1426M'].map(shape);
  const before=structuredClone({candidateShapes,contextShapes});
  const frame=commonPelvicContextFrame(candidateShapes,contextShapes);
  assert.deepEqual(frame,{min:[-60,-30,-40],max:[50,100,70]});
  const a=pelvicFloorContextProjection({tree:'isa',id:'FMAA',name:'test <A>',files:['FJA']},candidateShapes,contextShapes,frame);
  const b=pelvicFloorContextProjection({tree:'isa',id:'FMAB',name:'test B',files:['FJB']},candidateShapes,contextShapes,frame);
  assert.equal(a.panes.length,6);
  assert.equal(new Set([...a.panes,...b.panes].map(p=>p.pixelsPerMm)).size,1);
  assert.deepEqual(a.panes.map(p=>p.boundsMm),b.panes.map(p=>p.boundsMm));
  assert(a.panes.slice(0,3).every(p=>p.files.length===4));
  assert(a.panes.slice(3).every(p=>p.files.length===6));
  assert.deepEqual({candidateShapes,contextShapes},before);
  assert(a.svg.includes('test &lt;A&gt;')&&a.svg.includes('No separate coccyx'));
  assert(!a.svg.includes('NaN')&&!a.svg.includes('Infinity'));
  assert.throws(()=>commonPelvicContextFrame([],contextShapes),/Missing source geometry/);
  assert.throws(()=>pelvicFloorContextProjection({tree:'isa',files:['FJA']},[],contextShapes,frame),/Missing or duplicate/);
  assert.throws(()=>pelvicFloorContextProjection({tree:'isa',files:['FJA']},candidateShapes,contextShapes.slice(1),frame),/five source-bound/);
});
