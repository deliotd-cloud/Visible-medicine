import test from 'node:test';
import assert from 'node:assert/strict';
import {extractQuadraticBoundary,auditTriangleSurface,writeWavefrontText,TETRA10_FACES} from './abaqus-quadratic-boundary.mjs';
const fixture=()=>({elementType:'C3D10M',nodes:new Map([[1,[0,0,0]],[2,[1,0,0]],[3,[0,1,0]],[4,[0,0,1]],
 [5,[.5,0,0]],[6,[.5,.5,0]],[7,[0,.5,0]],[8,[0,0,.5]],[9,[.5,0,.5]],[10,[0,.5,.5]]]),elements:new Map([[1,[1,2,3,4,5,6,7,8,9,10]]])});
const pair=()=>{const p=fixture();for(const [n,v]of [[11,[0,0,-1]],[12,[0,0,-.5]],[13,[0,.5,-.5]],[14,[.5,0,-.5]]])p.nodes.set(n,v);p.elements.set(2,[1,3,2,11,7,6,5,12,13,14]);return p;};

test('official corner and midside face membership is explicit',()=>assert.deepEqual(TETRA10_FACES,[[0,1,2,4,5,6,3],[0,3,1,7,8,4,2],[1,3,2,8,9,5,0],[2,3,0,9,7,6,1]]));
test('one quadratic tetrahedron yields sixteen outward triangles and a closed vertex manifold',()=>{
 const p=fixture(),v=extractQuadraticBoundary(p);assert.equal(v.vertices.length,10);assert.equal(v.triangles.length,16);
 assert.equal(v.sourceFaces.length,4);assert.equal(v.audit.internalQuadraticFaces,0);assert.equal(v.audit.components,1);
 assert.equal(v.audit.closedOrientedVertexManifold,true);assert.equal(v.audit.selfIntersectionsChecked,false);
 for(const tri of v.triangles){const [a,b,c]=tri.map(i=>v.vertices[i]),ab=b.map((x,i)=>x-a[i]),ac=c.map((x,i)=>x-a[i]),n=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];assert(n.reduce((s,x,i)=>s+x*(.25-a[i]),0)<0);}
 assert.deepEqual(v.sourceNodeIds,[1,2,3,4,5,6,7,8,9,10]);assert.equal(v.audit.exactContinuousQuadraticSurface,false);
});
test('matching internal six-node face cancels exactly once without coordinate welding',()=>{
 const v=extractQuadraticBoundary(pair());assert.equal(v.audit.internalQuadraticFaces,1);assert.equal(v.sourceFaces.length,6);
 assert.equal(v.triangles.length,24);assert.equal(v.vertices.length,14);assert.equal(v.audit.closedOrientedVertexManifold,true);
 assert.equal(v.audit.components,1);assert.equal(v.audit.coordinateWelding,false);
});
test('preserves non-collinear midside coordinates and original maps exactly',()=>{
 const p=fixture();p.nodes.set(5,[.5,0,-.012345678901234]);const before=structuredClone(p),v=extractQuadraticBoundary(p);
 assert.deepEqual(p,before);assert.deepEqual(v.vertices[v.sourceNodeIds.indexOf(5)],[.5,0,-.012345678901234]);
 const text=writeWavefrontText(v,'Labrum');assert(text.includes('v 0.5 0 -0.012345678901234'));
 const parsed=text.split('\n').filter(l=>l.startsWith('v ')).map(l=>l.slice(2).split(' ').map(Number));assert.deepEqual(parsed,v.vertices);
 assert.equal(text.split('\n').filter(l=>l.startsWith('f ')).length,16);assert.throws(()=>writeWavefrontText(v,'x\nv 1 2 3'),/Unsafe object/);
});
test('opposite tetrahedron orientation retains an outward closed boundary',()=>{
 const p=fixture();p.elements.set(1,[1,3,2,4,7,6,5,8,10,9]);const v=extractQuadraticBoundary(p);
 assert.equal(v.audit.negativeCornerVolumes,1);assert.equal(v.audit.closedOrientedVertexManifold,true);
});
for(const [name,change,pattern]of [
 ['unsupported type',p=>p.elementType='C3D4',/Unsupported/],
 ['missing node',p=>p.nodes.delete(10),/Missing element node/],
 ['repeated node',p=>p.elements.get(1)[9]=9,/Invalid ten-node/],
 ['nonfinite node',p=>p.nodes.get(1)[0]=NaN,/Invalid node/],
 ['zero-volume corners',p=>p.nodes.set(4,[1,1,0]),/Degenerate corner/],
 ['duplicate tetrahedron',p=>p.elements.set(2,[1,2,3,4,5,6,7,8,9,10]),/Duplicate corner/],
 ['zero sampled face area',p=>p.nodes.set(5,[0,0,0]),/Degenerate sampled/],
])test('refuses '+name,()=>{const p=fixture();change(p);assert.throws(()=>extractQuadraticBoundary(p),pattern);});
test('refuses mismatched midside identities on a shared corner face',()=>{
 const p=pair();p.nodes.set(15,[.5,0,0]);p.elements.get(2)[6]=15;assert.throws(()=>extractQuadraticBoundary(p),/Shared face midside mismatch/);
});
test('refuses a third tetrahedron sharing an existing face',()=>{
 const p=pair();for(const [n,v]of [[15,[0,0,2]],[16,[0,0,1]],[17,[.5,0,1]],[18,[0,.5,1]]])p.nodes.set(n,v);
 p.elements.set(3,[1,2,3,15,5,6,7,16,17,18]);assert.throws(()=>extractQuadraticBoundary(p),/Nonmanifold tetrahedron face/);
});
test('refuses neighbours overlapping on the same side of their shared face',()=>{
 const p=pair();p.nodes.set(11,[0,0,2]);assert.throws(()=>extractQuadraticBoundary(p),/Overlapping face-neighbour/);
});
test('audit identifies an open edge and inconsistent winding without claiming watertight geometry',()=>{
 const v=extractQuadraticBoundary(fixture()),open=auditTriangleSurface(v.vertices,v.triangles.slice(1));
 assert.equal(open.boundaryEdges,3);assert.equal(open.closedOrientedVertexManifold,false);
 const reversed=structuredClone(v.triangles);reversed[0].reverse();const r=auditTriangleSurface(v.vertices,reversed);
 assert.equal(r.inconsistentWindingEdges,3);assert.equal(r.closedOrientedVertexManifold,false);
});
test('audit detects a pinched vertex even when all edges have two incident faces',()=>{
 const v=extractQuadraticBoundary(fixture()),vertices=[...v.vertices,...v.vertices.slice(1).map(p=>p.map(x=>-x))];
 const second=v.triangles.map(t=>t.map(i=>i===0?0:i+9));const r=auditTriangleSurface(vertices,[...v.triangles,...second]);
 assert.equal(r.boundaryEdges,0);assert.equal(r.nonmanifoldEdges,0);assert.equal(r.nonmanifoldVertices,1);assert.equal(r.closedOrientedVertexManifold,false);
});
test('equal coordinates with distinct source node IDs are never silently welded',()=>{
 const p=fixture();for(const [n,v]of [...p.nodes])p.nodes.set(n+10,[...v]);p.elements.set(2,[11,12,13,14,15,16,17,18,19,20]);
 const v=extractQuadraticBoundary(p);assert.equal(v.vertices.length,20);assert.equal(v.audit.components,2);assert.equal(v.audit.selfIntersectionsChecked,false);
});
