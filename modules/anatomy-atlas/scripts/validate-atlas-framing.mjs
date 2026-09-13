import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Box3,Vector3,PerspectiveCamera,OrthographicCamera} from 'three';
import {contentContext} from './content-contract-tools.mjs';
import {build} from './workspace-test-build.mjs';
import {fitBounds,translatedBox} from '../lib/explode-layout.mjs';
const context=await contentContext(),catalog=context.api.bodyDisplayCatalog(context.catalog);
const compiled=await build({stdin:{contents:"export {abdominalWallDefinition} from './lib/abdominal-wall'; export {hraRenalDefinition} from './lib/hra-renal'; export {hraPelvisDefinition} from './lib/hra-pelvis'; export {backLayersDefinition} from './lib/back-layers'; export {limbDefinitions} from './lib/um-limb-studies';",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',write:false});
const specimens=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const groups=[{name:'whole-body',structures:catalog.structures}];
for(const region of catalog.regions){const structures=catalog.structures.filter(s=>s.regions.includes(region.id));if(structures.length)groups.push({name:region.id,structures});}
for(const definition of [specimens.abdominalWallDefinition,specimens.hraRenalDefinition,specimens.hraPelvisDefinition,specimens.backLayersDefinition,...Object.values(specimens.limbDefinitions)]){
  groups.push({name:definition.key,structures:definition.catalog.structures});
  for(const study of definition.studies)groups.push({name:definition.key+'/'+study.id,structures:definition.catalog.structures.filter(s=>study.ids.includes(s.id))});
}
const original=JSON.stringify(groups),up=new Vector3(0,1,0);
const views=[[[0,.04,1],up],[[0,.04,-1],up],[[-1,.04,0],up],[[1,.04,0],up],[[0,1,0],new Vector3(0,0,-1)],[[0,-1,0],new Vector3(0,0,1)]];
let fits=0,projectedCorners=0;const improvements=[];
for(const group of groups){
  const bounds=group.structures.reduce((b,s)=>b.union(translatedBox(s.bounds)),new Box3());
  assert(!bounds.isEmpty());
  for(const aspect of [390/600,1,724/250,850/320])for(const [d,u]of views){
    const direction=new Vector3(...d).normalize(),old=fitBounds(bounds,direction,u,aspect,38),fit=fitBounds(bounds,direction,u,aspect,38,[.7,.9]);
    assert(fit.distance<=old.distance+1e-10);assert.deepEqual(fit.center,old.center);
    if(aspect===724/250&&d[2]===1&&['abdomen','thorax','head-neck'].includes(group.name))improvements.push({region:group.name,distanceRatio:fit.distance/old.distance});
    for(const orthographic of [false,true]){
      const far=Math.max(150,fit.distance+bounds.getSize(new Vector3()).length()*4);
      const camera=orthographic?new OrthographicCamera(-fit.halfHeight*aspect,fit.halfHeight*aspect,fit.halfHeight,-fit.halfHeight,.01,far):new PerspectiveCamera(38,aspect,.01,far);
      camera.up.copy(u);camera.position.copy(fit.center).addScaledVector(direction,fit.distance);camera.lookAt(fit.center);camera.updateMatrixWorld();
      for(const s of group.structures)for(const x of [s.bounds.min[0],s.bounds.max[0]])for(const y of [s.bounds.min[1],s.bounds.max[1]])for(const z of [s.bounds.min[2],s.bounds.max[2]]){
        const p=new Vector3(x,y,z).project(camera);assert(Math.abs(p.x)<=.700001&&Math.abs(p.y)<=.900001&&p.z>-1&&p.z<1,group.name);projectedCorners++;
      }
      fits++;
    }
  }
}
assert.equal(JSON.stringify(groups),original,'Original source bounds and study identities are unchanged');
assert(improvements.length===3&&improvements.every(x=>x.distanceRatio<.85),'Every main torso/head overview meaningfully enlarges');
assert((await readFile('app/body-scene.tsx','utf8')).includes('fitOccupancy={props.fitOccupancy ?? [0.7, 0.9]}'),'Shared scene forwards new default while retaining explicit overrides');
assert((await readFile('app/fitted-camera.tsx','utf8')).includes('fitOccupancy = [0.7, 0.7]'),'Persisted legacy scale convention unchanged');
console.log(JSON.stringify({groups:groups.length,fits,projectedCorners,improvements,allSourceBoundsRetained:true,clinicalOrBrowserAcceptance:false}));
