import assert from 'node:assert/strict';
import test from 'node:test';
import {sourcePlaneSections as section} from './source-plane-sections.mjs';
const mesh={vertices:[[-1,0,0],[1,0,0],[1,2,0]],faces:[[0,1,2]]};
await test('known triangle crossing returns exact interpolated endpoints without edits',()=>{
  const before=structuredClone(mesh);assert.deepEqual(section(mesh,0,0),{segments:[[[0,0,0],[0,1,0]]],coplanarTriangles:0});assert.deepEqual(mesh,before);
});
await test('coplanar triangle is counted, not invented as tissue',()=>{
  assert.deepEqual(section(mesh,2,0),{segments:[],coplanarTriangles:1});
});
await test('touching vertex, touching edge, and disjoint plane distinguished',()=>{
  assert.deepEqual(section(mesh,0,-1).segments,[]);
  assert.deepEqual(section(mesh,0,1).segments,[[[1,0,0],[1,2,0]]]);
  assert.deepEqual(section(mesh,0,3).segments,[]);
});
await test('invalid geometry and plane fail closed',()=>{
  assert.throws(()=>section(mesh,3,0));assert.throws(()=>section(mesh,0,NaN));
  assert.throws(()=>section({...mesh,vertices:[[NaN,0,0]]},0,0));
  assert.throws(()=>section({...mesh,faces:[[0,1,4]]},0,0));
});
