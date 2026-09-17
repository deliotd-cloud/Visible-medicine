import assert from 'node:assert/strict';
import { build } from './workspace-test-build.mjs';
import { contentContext } from './content-contract-tools.mjs';
import { Box3, PerspectiveCamera, Vector3 } from 'three';
import { fitBounds } from '../lib/explode-layout.mjs';

const compiled = await build({stdin:{contents:`export * from './lib/regional-framing';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {regionalFramingBounds:frame,regionalFramingRegion} = await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const context = await contentContext();
const catalog = context.api.bodyDisplayCatalog(context.catalog);
const before = JSON.stringify(catalog);
const structures = catalog.structures.filter(s=>s.regions.includes('thorax'));
const neutral = new Set(['midline','unpaired','unspecified']);
const box = b=>new Box3(new Vector3(...b.min),new Vector3(...b.max));
const union = items=>items.reduce((result,s)=>result.union(box(s.bounds)),new Box3());
assert.equal(structures.length,157);
// These source groups are retained in full, not reduced to a chest silhouette.
const spine = structures.filter(s=>s.region==='spine');
assert.equal(spine.filter(s=>s.system==='skeleton').length,12);
assert.equal(spine.filter(s=>s.system==='connective').length,11);
assert.equal(spine.filter(s=>s.system==='muscles').length,3);
assert(structures.some(s=>s.fmaId==='FMA13295'),'Diaphragm retained');
assert(structures.some(s=>s.fmaId==='FMA7394'),'Complete supplied trachea retained');
const results=[];
let projectedFits=0,selectionChecks=0;
for(const side of ['both','left','right']) {
  assert.equal(regionalFramingRegion('thorax',side),'thorax');
  const visible=structures.filter(s=>side==='both'||s.laterality===side||neutral.has(s.laterality));
  const core=visible.filter(s=>s.region==='thorax'||s.system!=='vessels');
  const input={region:'thorax',side,structures,visibleIds:visible.map(s=>s.id),selectedId:null,enabled:true};
  const bounds=frame(input),expected=union(core),full=union(visible);
  assert.deepEqual(bounds,{min:expected.min.toArray(),max:expected.max.toArray()});
  for(const s of visible) {
    const result=frame({...input,selectedId:s.id});
    if(core.includes(s)) {
      assert.deepEqual(result,bounds);
      assert(expected.containsBox(box(s.bounds)));
    } else assert.equal(result,null,'Shared vessel selection returns to full-source framing');
    selectionChecks++;
  }
  for(const selectedId of ['missing',core[0].id])
    assert.equal(frame({...input,selectedId,visibleIds:input.visibleIds.filter(id=>id!==selectedId)}),null);
  if(side!=='both') {
    const other=structures.find(s=>s.laterality!==side&&['left','right'].includes(s.laterality));
    assert.equal(frame({...input,visibleIds:[...input.visibleIds,other.id],selectedId:other.id}),null);
  }
  for(const system of [...new Set(visible.map(s=>s.system))]) {
    const only=visible.filter(s=>s.system===system);
    const subset=core.filter(s=>s.system===system);
    const result=frame({...input,visibleIds:only.map(s=>s.id)});
    const exact=union(subset);
    assert.deepEqual(result,subset.length?{min:exact.min.toArray(),max:exact.max.toArray()}:null);
  }
  assert.equal(frame({...input,visibleIds:[]}),null);
  assert.equal(frame({...input,visibleIds:visible.filter(s=>!core.includes(s)).map(s=>s.id)}),null);
  assert.equal(frame({...input,enabled:false}),null);
  assert.equal(frame({...input,side:'invalid'}),null);
  assert.equal(frame({...input,region:'whole-body'}),null);
  const angles=[[0,.04,1],[0,.04,-1],[-1,.04,0],[1,.04,0],[0,1,0],[0,-1,0]];
  const anterior=[];
  for(const aspect of [.65,1,1.5,2.8]) for(const [index,d] of angles.entries()) {
    const dir=new Vector3(...d).normalize(),up=new Vector3(...(index<4?[0,1,0]:[0,0,index===4?-1:1]));
    const close=fitBounds(expected,dir,up,aspect,38,[.7,.9]),all=fitBounds(full,dir,up,aspect,38,[.7,.9]);
    const camera=new PerspectiveCamera(38,aspect,.01,150);
    camera.position.copy(close.center).addScaledVector(dir,close.distance);
    camera.up.copy(up);camera.lookAt(close.center);camera.updateMatrixWorld();
    for(const x of [expected.min.x,expected.max.x])for(const y of [expected.min.y,expected.max.y])for(const z of [expected.min.z,expected.max.z]) {
      const point=new Vector3(x,y,z).project(camera);
      assert(Math.abs(point.x)<.95&&Math.abs(point.y)<.95&&point.z>-1&&point.z<1,`${side}/${aspect}/${index} complete core fits`);
    }
    if(index===0) {
      assert(close.distance<=all.distance);
      anterior.push({aspect,distanceRatio:close.distance/all.distance});
    }
    projectedFits++;
  }
  assert(anterior.some(r=>r.distanceRatio<.8),'Wider viewports materially enlarge chest detail');
  results.push({side,visible:visible.length,core:core.length,bounds,anterior});
}
assert.equal(JSON.stringify(catalog),before,'No mesh, source, identity, bounds or catalog mutation');
console.log(JSON.stringify({results,projectedFits,selectionChecks,sourceUnchanged:true,clinicalAcceptance:false,browserAcceptance:false}));
