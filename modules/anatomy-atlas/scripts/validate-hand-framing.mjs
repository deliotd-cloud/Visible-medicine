import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';
import { contentContext } from './content-contract-tools.mjs';
import { Box3, Vector3 } from 'three';
import { fitBounds } from '../lib/explode-layout.mjs';

const compiled = await build({stdin:{contents:"export * from './lib/hand-framing';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs'});
const module = {exports:{}};
runInNewContext(compiled.outputFiles[0].text,{module,exports:module.exports,require:createRequire(import.meta.url)});
const {initialBodySide,handFramingBounds} = module.exports;
const context = await contentContext();
const catalog = context.api.bodyDisplayCatalog(context.catalog);
const before = JSON.stringify(catalog);
assert.equal(initialBodySide('hand'),'right');
for (const region of catalog.regions.filter(r=>r.id!=='hand'))
  assert.equal(initialBodySide(region.id),'both');
const results=[];
for (const side of ['right','left']) {
  const structures=catalog.structures.filter(s=>s.regions.includes('hand')&&s.laterality===side);
  const input={region:'hand',side,structures,visibleIds:structures.map(s=>s.id),selectedId:null,enabled:true};
  const core=handFramingBounds(input);
  assert(core);
  const coreBox=new Box3(new Vector3(...core.min),new Vector3(...core.max));
  const allBox=new Box3();
  for (const s of structures) {
    const bounds=new Box3(new Vector3(...s.bounds.min),new Vector3(...s.bounds.max));
    allBox.union(bounds);
    if(s.region==='hand') assert(coreBox.containsBox(bounds),s.id+' fully in regional preset');
    else assert.equal(handFramingBounds({...input,selectedId:s.id}),null,s.id+' proximal selection uses full source');
  }
  assert(allBox.containsBox(coreBox));
  assert(coreBox.getSize(new Vector3()).length()<allBox.getSize(new Vector3()).length());
  for (const change of [{region:'forearm'},{side:'both'},{side:'unknown'},{enabled:false},{visibleIds:[]},{structures:[]}])
    assert.equal(handFramingBounds({...input,...change}),null);
  const kept=structures.filter(s=>s.region==='hand'&&s.system==='skeleton');
  const skeleton=handFramingBounds({...input,visibleIds:kept.map(s=>s.id)});
  assert(skeleton);
  const noCore=structures.filter(s=>s.region!=='hand').map(s=>s.id);
  assert.equal(handFramingBounds({...input,visibleIds:noCore}),null);
  const ratios=[.65,1,1.5,2.8].map(aspect=>{
    const direction=new Vector3(0,.04,1),up=new Vector3(0,1,0);
    const regional=fitBounds(coreBox,direction,up,aspect);
    const full=fitBounds(allBox,direction,up,aspect);
    assert(regional.distance<full.distance);
    return {aspect,distanceRatio:regional.distance/full.distance};
  });
  results.push({side,selections:structures.length,coreSelections:structures.filter(s=>s.region==='hand').length,ratios});
}
assert.equal(JSON.stringify(catalog),before,'Framing does not mutate source anatomy');
console.log(JSON.stringify({sourceCatalogSelections:catalog.structures.length,results,sourceUnchanged:true,missingAnatomyInvented:false,clinicalAcceptance:false}));
