import assert from 'node:assert/strict';
import test from 'node:test';
import {projectSkinContext} from './skin-context-projection.mjs';
const frame={width:11,height:11,scale:1,origin:[5,5],horizontal:[1,0,0],depthAxis:[0,1,0]};
const skin={id:'skin',role:'skin',color:[180,150,120],vertices:[[-2,-2,-2],[2,-2,-2],[2,-2,2],[-2,-2,2],[-2,2,-2],[2,2,-2],[2,2,2],[-2,2,2]],
  faces:[[0,1,2],[0,2,3],[4,6,5],[4,7,6],[0,4,5],[0,5,1],[3,2,6],[3,6,7],[0,3,7],[0,7,4],[1,5,6],[1,6,2]]};
const context=y=>({id:'context',role:'context',color:[20,90,100],vertices:[[-1,y,-1],[1,y,-1],[0,y,1]],faces:[[0,1,2]]});
await test('unchanged interior geometry has no screen flags',()=>{
  const meshes=[skin,context(0)],before=structuredClone(meshes),r=projectSkinContext(meshes,frame);
  assert.deepEqual(meshes,before);assert(r.rows[1].occupiedPixels>0);
  assert.equal(r.rows[1].missingSkinPixels,0);assert.equal(r.rows[1].outsideDepthEnvelopePixels,0);
  assert.equal(r.pixels.length,11*11*3);
});
await test('geometry beyond front and back envelope is flagged',()=>{
  for(const y of [-4,4]){const r=projectSkinContext([skin,context(y)],frame).rows[1];
    assert(r.outsideDepthEnvelopePixels>0);assert.equal(r.maximumOutsideDepthMm,2);assert(r.flagSamples.length>0);}
});
await test('absent skin and disjoint silhouette are not treated as enclosed',()=>{
  const hole={...skin,faces:[[0,1,2]]};
  const r=projectSkinContext([hole,context(0)],frame).rows[1];assert(r.outsideDepthEnvelopePixels>0);
  const separate=context(0);separate.vertices=separate.vertices.map(p=>[p[0]+4,p[1],p[2]]);
  assert(projectSkinContext([skin,separate],frame).rows[1].missingSkinPixels>0);
});
await test('invalid coordinates/indices and cropped frames fail instead of clipping',()=>{
  assert.throws(()=>projectSkinContext([skin,{...context(0),vertices:[[NaN,0,0],[0,0,0],[1,0,0]]}],frame));
  assert.throws(()=>projectSkinContext([skin,{...context(0),faces:[[0,1,3]]}],frame));
  assert.throws(()=>projectSkinContext([skin],{...frame,scale:10}));
});
