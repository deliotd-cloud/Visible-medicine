import assert from 'node:assert/strict';
import { build } from './workspace-test-build.mjs';
import { contentContext } from './content-contract-tools.mjs';
import { Box3, PerspectiveCamera, Vector3 } from 'three';
import { fitBounds } from '../lib/explode-layout.mjs';

const compiled = await build({stdin:{contents:`
export * from './lib/regional-framing';
export * from './lib/hand-framing';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api = await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const context = await contentContext();
const catalog = context.api.bodyDisplayCatalog(context.catalog);
const before = JSON.stringify(catalog);
const sacrumId = 'vm:anatomy:body:spine:midline:bone:sacrum';
const neutral = new Set(['midline','unpaired','unspecified']);
const box = bounds => new Box3(new Vector3(...bounds.min),new Vector3(...bounds.max));
const member = (s,side) => s.regions.includes('pelvis') &&
  (s.region === 'pelvis' || (s.id === sacrumId && s.fmaId === 'FMA16202' &&
    s.system === 'skeleton' && s.laterality === 'midline')) &&
  (side === 'both' || s.laterality === side || neutral.has(s.laterality));

assert.equal(catalog.structures.length,1102,'Use the actual augmented display catalog');
assert.equal(api.initialBodySide('pelvis'),'both');
const pelvis = catalog.structures.filter(s=>s.regions.includes('pelvis'));
const sacrum = pelvis.find(s=>s.id===sacrumId);
assert(sacrum,'Exact source-bound sacrum is present');
assert.equal(sacrum.fmaId,'FMA16202');
assert.equal(sacrum.system,'skeleton');
assert.equal(sacrum.laterality,'midline');
assert.deepEqual(sacrum.bounds.min.map(n=>Number(n.toFixed(3))),[-0.596,-0.172,-0.573]);
assert.deepEqual(sacrum.bounds.max.map(n=>Number(n.toFixed(3))),[0.582,1.272,0.314]);
for(const mutation of [
  {id:sacrumId+'-other'}, {fmaId:'FMA-other'}, {system:'muscles'},
  {laterality:'right'}, {regions:['spine']},
]) {
  const changed={...sacrum,...mutation};
  assert.equal(api.regionalFramingBounds({region:'pelvis',side:'both',structures:[changed],
    visibleIds:[changed.id],selectedId:null,enabled:true}),null,'Reject changed sacral context identity');
}

const outsideIds = [
  'vm:anatomy:body:abdomen:right:organ:right-ureter',
  'vm:anatomy:body:abdomen:left:organ:left-ureter',
  'vm:anatomy:body:abdomen:midline:vessel:abdominal-aorta',
  'vm:anatomy:body:abdomen:unspecified:vessel:inferior-vena-cava',
  'vm:anatomy:body:thigh:right:vessel:right-femoral-artery',
  'vm:anatomy:body:thigh:left:vessel:left-femoral-artery',
  'vm:anatomy:body:thigh:right:vessel:right-great-saphenous-vein',
  'vm:anatomy:body:thigh:left:vessel:left-great-saphenous-vein',
];
for(const id of outsideIds) {
  const source=pelvis.find(s=>s.id===id);
  assert(source,id+' exact deep-link source identity is present');
  assert.notEqual(source.region,'pelvis',id+' remains outside the camera core');
}

const results=[];
let cameraFits=0, outsideSelectionFallbacks=0, wrongSideFallbacks=0;
for(const side of ['both','right','left']) {
  assert.equal(api.regionalFramingRegion('pelvis',side),'pelvis');
  const expected=pelvis.filter(s=>member(s,side));
  const visibleForSide=pelvis.filter(s=>side==='both'||s.laterality===side||neutral.has(s.laterality));
  const input={region:'pelvis',side,structures:pelvis,visibleIds:visibleForSide.map(s=>s.id),selectedId:null,enabled:true};
  const core=api.regionalFramingBounds(input);
  assert(core,side+' pelvis core exists');
  const coreBox=box(core), expectedBox=new Box3(), fullBox=new Box3();
  for(const s of expected) {
    expectedBox.union(box(s.bounds));
    assert(coreBox.containsBox(box(s.bounds)),side+'/'+s.id+' core source completely contained');
    assert.deepEqual(api.regionalFramingBounds({...input,selectedId:s.id}),core,side+'/'+s.id+' visible core selection retains preset');
  }
  assert.deepEqual(coreBox.min.toArray(),expectedBox.min.toArray());
  assert.deepEqual(coreBox.max.toArray(),expectedBox.max.toArray());
  for(const s of visibleForSide) fullBox.union(box(s.bounds));
  assert(fullBox.containsBox(coreBox));
  assert(coreBox.containsBox(box(sacrum.bounds)),side+' core contains the visible midline sacrum');
  assert(expected.some(s=>s.laterality==='midline'));
  assert(expected.some(s=>s.laterality==='unpaired'));

  for(const id of outsideIds) {
    const source=pelvis.find(s=>s.id===id);
    const onSide=side==='both'||source.laterality===side||neutral.has(source.laterality);
    if(onSide) {
      assert.equal(api.regionalFramingBounds({...input,selectedId:id}),null,id+' selection restores full-source fit');
      outsideSelectionFallbacks++;
    }
  }
  if(side!=='both') {
    const wrong=pelvis.find(s=>s.region==='pelvis' && s.laterality!==side && ['left','right'].includes(s.laterality));
    assert(wrong);
    assert.equal(api.regionalFramingBounds({...input,visibleIds:[...input.visibleIds,wrong.id],selectedId:wrong.id}),null,'Contralateral selection restores full-source fit');
    wrongSideFallbacks++;
  }
  const hidden=expected.find(s=>s.id!==sacrumId);
  assert(hidden);
  assert.equal(api.regionalFramingBounds({...input,selectedId:hidden.id,visibleIds:input.visibleIds.filter(id=>id!==hidden.id)}),null,'Hidden selection restores full-source fit');
  assert.equal(api.regionalFramingBounds({...input,selectedId:'vm:anatomy:body:pelvis:missing:deep-link'}),null,'Unknown selection restores full-source fit');
  assert.equal(api.regionalFramingBounds({...input,selectedId:sacrumId+'-near-match'}),null,'Source identity match is exact');

  const onlySacrum=api.regionalFramingBounds({...input,visibleIds:[sacrumId]});
  assert.deepEqual(onlySacrum,sacrum.bounds,'Sacrum-only helper input remains bounded');
  assert.equal(api.regionalFramingBounds({...input,visibleIds:[]}),null);
  assert.equal(api.regionalFramingBounds({...input,structures:[]}),null);
  assert.equal(api.regionalFramingBounds({...input,enabled:false}),null);
  assert.equal(api.regionalFramingBounds({...input,region:'abdomen'}),null);
  assert.equal(api.regionalFramingBounds({...input,side:'unknown'}),null);

  const angles=[['anterior',[0,.04,1],[0,1,0]],['posterior',[0,.04,-1],[0,1,0]],['right',[-1,.04,0],[0,1,0]],['left',[1,.04,0],[0,1,0]],['inferior',[0,-1,0],[0,0,1]],['superior',[0,1,0],[0,0,-1]]];
  const anterior=[];
  for(const aspect of [.65,1,1.5,2.8]) for(const [name,d,u] of angles) {
    const direction=new Vector3(...d).normalize(),up=new Vector3(...u);
    const regional=fitBounds(coreBox,direction,up,aspect,38),full=fitBounds(fullBox,direction,up,aspect,38);
    const camera=new PerspectiveCamera(38,aspect,.01,Math.max(150,full.distance+fullBox.getSize(new Vector3()).length()*4));
    camera.position.copy(regional.center).addScaledVector(direction,regional.distance);
    camera.up.copy(up);camera.lookAt(regional.center);camera.updateMatrixWorld();
    for(const x of [coreBox.min.x,coreBox.max.x])for(const y of [coreBox.min.y,coreBox.max.y])for(const z of [coreBox.min.z,coreBox.max.z]) {
      const p=new Vector3(x,y,z).project(camera);
      assert(Math.abs(p.x)<.95&&Math.abs(p.y)<.95&&p.z>-1&&p.z<1,`${side}/${name}/${aspect} pelvis bounds fit`);
    }
    if(name==='anterior') {
      assert(regional.distance<full.distance,side+' pelvis detail is enlarged');
      anterior.push({aspect,distanceRatio:regional.distance/full.distance});
    }
    cameraFits++;
  }
  results.push({side,regionMembers:visibleForSide.length,coreSelections:expected.length,neutralCoreSelections:expected.filter(s=>neutral.has(s.laterality)).length,anterior});
}

// The current camera core has no primary unspecified record, so exercise that
// neutral-laterality contract with an isolated non-mutating input copy.
const unspecifiedProbe={...pelvis.find(s=>s.region==='pelvis'),id:'test:pelvis:unspecified',laterality:'unspecified'};
for(const side of ['right','left'])
  assert.deepEqual(api.regionalFramingBounds({region:'pelvis',side,structures:[unspecifiedProbe],visibleIds:[unspecifiedProbe.id],selectedId:unspecifiedProbe.id,enabled:true}),unspecifiedProbe.bounds);

assert.equal(api.regionalFramingRegion('pelvis','unknown'),null);
assert.equal(JSON.stringify(catalog),before,'No source-coordinate, mesh, identity or catalog mutation');
console.log(JSON.stringify({sourceCatalogSelections:catalog.structures.length,pelvisRegionMembers:pelvis.length,results,cameraFits,outsideSelectionFallbacks,wrongSideFallbacks,sourceUnchanged:true,anatomicalValidation:false,clinicalAcceptance:false,browserAcceptance:false}));
