import assert from 'node:assert/strict';
import { build } from './workspace-test-build.mjs';
import { contentContext } from './content-contract-tools.mjs';
import { Box3, Vector3, PerspectiveCamera } from 'three';
import { fitBounds } from '../lib/explode-layout.mjs';

const compiled = await build({stdin:{contents:`
export * from './lib/regional-framing';
export * from './lib/hand-framing';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api = await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const context = await contentContext();
const catalog = context.api.bodyDisplayCatalog(context.catalog);
const before = JSON.stringify(catalog);
const box = b => new Box3(new Vector3(...b.min),new Vector3(...b.max));
assert.equal(api.initialBodySide('foot'),'both','Do not copy the unilateral hand landing policy');
const results=[];
let cameraFits=0,proximalSelections=0;
for (const side of ['both','right','left']) {
  assert.equal(api.regionalFramingRegion('foot',side),'foot');
  const structures=catalog.structures.filter(s=>s.regions.includes('foot')&&(side==='both'||s.laterality===side));
  const input={region:'foot',side,structures,visibleIds:structures.map(s=>s.id),selectedId:null,enabled:true};
  const core=api.regionalFramingBounds(input);
  assert(core);
  const coreBox=box(core),allBox=new Box3();
  const primary=structures.filter(s=>s.region==='foot');
  for (const s of structures) {
    allBox.union(box(s.bounds));
    if (s.region==='foot') {
      assert(coreBox.containsBox(box(s.bounds)),s.id+' completely contained');
      assert.deepEqual(api.regionalFramingBounds({...input,selectedId:s.id}),core);
      assert.equal(api.regionalFramingBounds({...input,selectedId:s.id,visibleIds:input.visibleIds.filter(id=>id!==s.id)}),null,'Hidden selection must not retain close-up');
    } else {
      assert.equal(api.regionalFramingBounds({...input,selectedId:s.id}),null,s.id+' full source on selection');
      proximalSelections++;
    }
  }
  assert(allBox.containsBox(coreBox));
  assert(coreBox.getSize(new Vector3()).length()<allBox.getSize(new Vector3()).length());
  assert(structures.some(s=>s.kind==='tendon'||s.sourceName.toLowerCase().includes('calcaneal tendon')),'Include real Achilles source in the test');
  for (const change of [{region:'forearm'},{side:'unknown'},{enabled:false},{visibleIds:[]},{structures:[]}])
    assert.equal(api.regionalFramingBounds({...input,...change}),null);
  const skeleton=primary.filter(s=>s.system==='skeleton');
  const boneBox=box(api.regionalFramingBounds({...input,visibleIds:skeleton.map(s=>s.id)}));
  for (const s of skeleton) assert(boneBox.containsBox(box(s.bounds)));
  assert.equal(api.regionalFramingBounds({...input,visibleIds:structures.filter(s=>s.region!=='foot').map(s=>s.id)}),null);
  const angles=[['anterior',[0,.04,1],[0,1,0]],['posterior',[0,.04,-1],[0,1,0]],['right',[-1,.04,0],[0,1,0]],['left',[1,.04,0],[0,1,0]],['plantar',[0,-1,0],[0,0,1]],['superior',[0,1,0],[0,0,-1]]];
  const ratios=[];
  for (const aspect of [.65,1,1.5,2.8]) for (const [name,d,u] of angles) {
    const direction=new Vector3(...d).normalize(),up=new Vector3(...u);
    const regional=fitBounds(coreBox,direction,up,aspect,38),full=fitBounds(allBox,direction,up,aspect,38);
    const camera=new PerspectiveCamera(38,aspect,.01,Math.max(150,full.distance+allBox.getSize(new Vector3()).length()*4));
    camera.position.copy(regional.center).addScaledVector(direction,regional.distance);
    camera.up.copy(up);camera.lookAt(regional.center);camera.updateMatrixWorld();
    for(const x of [coreBox.min.x,coreBox.max.x])for(const y of [coreBox.min.y,coreBox.max.y])for(const z of [coreBox.min.z,coreBox.max.z]) {
      const p=new Vector3(x,y,z).project(camera);
      assert(Math.abs(p.x)<.95&&Math.abs(p.y)<.95&&p.z>-1&&p.z<1,`${side}/${name}/${aspect} regional bounds fit`);
    }
    if(name==='anterior') {
      assert(regional.distance<full.distance,'Front foot detail is genuinely enlarged');
      ratios.push({aspect,distanceRatio:regional.distance/full.distance});
    }
    cameraFits++;
  }
  results.push({side,selections:structures.length,coreSelections:primary.length,anterior:ratios});
}
// The shared entry point delegates hand behavior unchanged, including Both sides.
for(const side of ['both','right','left']) {
  const structures=catalog.structures.filter(s=>s.regions.includes('hand')&&(side==='both'||s.laterality===side));
  const input={region:'hand',side,structures,visibleIds:structures.map(s=>s.id),selectedId:null,enabled:true};
  for (const selectedId of [null,...structures.map(s=>s.id)])
    assert.deepEqual(api.regionalFramingBounds({...input,selectedId}),api.handFramingBounds({...input,selectedId}));
}
assert.equal(api.regionalFramingRegion('hand','both'),null);
for(const region of catalog.regions.filter(r=>!['hand','foot','pelvis','thorax','leg'].includes(r.id))) {
  assert.equal(api.initialBodySide(region.id),'both');
  assert.equal(api.regionalFramingRegion(region.id,'right'),null);
}
assert.equal(JSON.stringify(catalog),before,'No source-coordinate, identity or catalogue mutation');
console.log(JSON.stringify({sourceCatalogSelections:catalog.structures.length,results,cameraFits,proximalSelections,sourceUnchanged:true,handBehaviorPreserved:true,clinicalAcceptance:false,browserAcceptance:false}));
