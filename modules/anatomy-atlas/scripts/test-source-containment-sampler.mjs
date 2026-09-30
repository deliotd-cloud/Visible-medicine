import assert from 'node:assert/strict';
import test from 'node:test';
import {sourceObjShape} from './source-surface-audit.mjs';
import {sourceContainmentSampler} from './source-containment-sampler.mjs';
const obj='v 0 0 0\nv 4 0 0\nv 0 4 0\nv 0 0 4\nf 1 3 2\nf 1 2 4\nf 1 4 3\nf 2 3 4\n';
test('closed tetrahedron classifies interior/exterior/boundary without modifying sources',()=>{
 const shape=sourceObjShape(Buffer.from(obj)),before=structuredClone({vertices:shape.vertices,faces:shape.faces}),q=sourceContainmentSampler(shape);
 assert.equal(q.supported,true);assert.equal(q.sample([.5,.5,.5]).classification,'inside-envelope');assert.equal(q.sample([3,3,3]).classification,'outside-envelope');
 for(const point of [[0,0,0],[1,1,0],[4,0,0]])assert.equal(q.sample(point).classification,'boundary');
 assert.deepEqual({vertices:shape.vertices,faces:shape.faces},before);
});
test('winding reversal and source translation retain envelope classification',()=>{
 const reversed=obj.replaceAll(/f (\d+) (\d+) (\d+)/g,'f $3 $2 $1'),q=sourceContainmentSampler(sourceObjShape(Buffer.from(reversed)));
 assert.equal(q.sample([.5,.5,.5]).classification,'inside-envelope');
 const moved=obj.replaceAll(/v (\d+) (\d+) (\d+)/g,(_,x,y,z)=>`v ${+x+100} ${+y-300} ${+z+1700}`),r=sourceContainmentSampler(sourceObjShape(Buffer.from(moved)));
 assert.equal(r.sample([100.5,-299.5,1700.5]).classification,'inside-envelope');assert.equal(r.sample([103,-297,1703]).classification,'outside-envelope');
});
test('open source cannot yield a trusted inside/outside result',()=>{
 const q=sourceContainmentSampler(sourceObjShape(Buffer.from(obj.replace('f 2 3 4\n',''))));assert.equal(q.supported,false);
 assert.equal(q.sample([.5,.5,.5]).classification,'unsupported-open-or-invalid-surface');
});
test('invalid settings and point samples fail closed',()=>{
 const shape=sourceObjShape(Buffer.from(obj));assert.throws(()=>sourceContainmentSampler(shape,{boundaryMm:0}));const q=sourceContainmentSampler(shape);
 for(const point of [[NaN,0,0],[0,Infinity,0],[0,0],Array(3)])assert.throws(()=>q.sample(point));
});
