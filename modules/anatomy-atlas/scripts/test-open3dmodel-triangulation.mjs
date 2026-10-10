import assert from 'node:assert/strict';
import test from 'node:test';
import {triangulateSourcePolygon,triangulateSourceObject} from './open3dmodel-triangulation.mjs';
test('concave source polygon preserves all boundaries, area and winding deterministically',()=>{
 const vertices=[[0,0,0],[3,0,0],[3,3,0],[2,3,0],[2,1,0],[1,1,0],[1,3,0],[0,3,0]],face=vertices.map((_,i)=>i),saved=JSON.stringify(vertices);
 const result=triangulateSourcePolygon(vertices,face);assert.equal(result.triangles.length,6);assert.equal(result.projectedAreaSourceUnits2,7);assert.deepEqual(triangulateSourcePolygon(vertices,face),result);assert.equal(JSON.stringify(vertices),saved);
 const reverse=triangulateSourcePolygon(vertices,[...face].reverse());assert.equal(reverse.projectedAreaSourceUnits2,-7);assert.equal(reverse.triangles.length,6);
});
test('source triangle is unchanged; nonplanar quad is disclosed without coordinate edits',()=>{
 const vertices=[[10,10,10],[11,10,10],[11,11,10],[10,11,10.05]],face=[0,1,2];assert.deepEqual(triangulateSourcePolygon(vertices,face).triangles,[face]);const result=triangulateSourcePolygon(vertices,[0,1,2,3]);assert(result.nonplanarQuad);assert(result.planeDistanceFraction>0);assert.equal(result.triangles.length,2);
});
test('repeated, crossing, degenerate and nonplanar large polygons are refused',()=>{
 assert.throws(()=>triangulateSourcePolygon([[0,0,0],[1,0,0],[1,1,0]],[0,1,1]),/Repeated/);
 assert.throws(()=>triangulateSourcePolygon([[0,0,0],[1,0,0],[0,0,0]],[0,1,2]),/Repeated/);
 assert.throws(()=>triangulateSourcePolygon([[0,0,0],[1,1,0],[0,1,0],[1,0,0]],[0,1,2,3]),/Zero Newell|Self-intersecting/);
 assert.throws(()=>triangulateSourcePolygon([[0,0,0],[1,0,0],[2,0,0]],[0,1,2]),/Zero Newell/);
 assert.throws(()=>triangulateSourcePolygon([[0,0,0],[2,0,0],[3,1,0],[2,2,.2],[0,2,0]],[0,1,2,3,4]),/Nonplanar n-gon/);
});
test('a failed source face holds the whole object, never silently removes geometry',()=>{
 const result=triangulateSourceObject({name:'test',vertices:[[0,0,0],[1,0,0],[0,1,0]],faces:[[0,1,2],[0,0,2]]});assert.equal(result.failures.length,1);assert.equal(result.failures[0].sourceFace,1);assert.equal(result.triangles,null);assert.equal(result.polygonRanges,null);
});
test('planar twelve-sided polygons work in all projection axes and source scales',()=>{
 const polygon=Array.from({length:12},(_,i)=>[Math.cos(i*Math.PI/6),Math.sin(i*Math.PI/6),0]);
 for(const scale of [1e-6,1,1e6])for(const axis of [0,1,2]){
  const vertices=polygon.map(p=>p.map((_,i)=>p[(i+axis)%3]*scale+17*scale)),saved=JSON.stringify(vertices);
  const face=vertices.map((_,i)=>i),result=triangulateSourcePolygon(vertices,face);
  assert.equal(result.triangles.length,10);assert.equal(JSON.stringify(vertices),saved);
  assert(Math.abs(Math.abs(result.projectedAreaSourceUnits2)/(scale*scale)-3)<1e-10);
  const reversed=triangulateSourcePolygon(vertices,[...face].reverse());
  assert(Math.abs(result.projectedAreaSourceUnits2+reversed.projectedAreaSourceUnits2)<scale*scale*1e-10);
 }
});
