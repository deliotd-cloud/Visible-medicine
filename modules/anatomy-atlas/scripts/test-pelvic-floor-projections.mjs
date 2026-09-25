import assert from 'node:assert/strict';
import test from 'node:test';
import {pelvicFloorProjection} from './render-pelvic-floor-review.mjs';

await test('review projections retain shared scale, whole extents and immutable geometry',()=>{
  const shape={tree:'isa',file:'FJTEST',min:[-20,-30,-40],max:[50,60,70],vertices:[[-20,-30,-40],[50,-30,-40],[0,60,70]],faces:[[0,1,2]]};
  const before=structuredClone(shape);
  const group={tree:'isa',id:'FMATEST',name:'test <surface>',files:['FJTEST']};
  const {svg,panes,width,height}=pelvicFloorProjection(group,[shape]);
  assert.deepEqual(shape,before);
  assert.equal(panes.length,6);
  assert.equal(new Set(panes.map(p=>p.pixelsPerMm)).size,1);
  assert(panes.every(p=>p.pixelsPerMm>0));
  assert.deepEqual(panes[0].boundsMm,{min:[-20,-40],max:[50,70]});
  assert.deepEqual(panes[1].boundsMm,{min:[-30,-40],max:[60,70]});
  assert.deepEqual(panes[2].boundsMm,{min:[-20,-30],max:[50,60]});
  assert(svg.includes('test &lt;surface&gt;'));
  assert(!svg.includes('NaN')&&!svg.includes('Infinity'));
  assert(svg.includes('X=0')&&svg.includes('CC Attribution 4.0'));
  assert.equal(width,1440);assert(height>0);
  assert.throws(()=>pelvicFloorProjection(group,[]),/Missing or ambiguous/);
  assert.throws(()=>pelvicFloorProjection(group,[shape,shape]),/Missing or ambiguous/);
});
