import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {readFile} from 'node:fs/promises';
import {contentContext} from './content-contract-tools.mjs';
import {build} from './workspace-component-test-build.mjs';
import {Box3,Vector3,PerspectiveCamera,OrthographicCamera} from 'three';
import {fitBounds,translatedBox} from '../lib/explode-layout.mjs';

const context=await contentContext(),catalog=context.api.bodyDisplayCatalog(context.catalog);
const original=JSON.stringify(catalog),all=catalog.structures.filter(s=>s.regions.includes('head-neck'));
assert.equal(all.length,290);
const union=ss=>ss.reduce((b,s)=>b.union(translatedBox(s.bounds)),new Box3());
const full=union(all),core=union(all.filter(s=>s.region==='head-neck'));
// The neighbouring source extent is not the reason for the small presentation.
assert(core.getSize(new Vector3()).y/full.getSize(new Vector3()).y>.98);
const groups=[all,...[...new Set(all.map(s=>s.system))].map(system=>all.filter(s=>s.system===system))];
const angles=[['anterior',[0,.04,1],[0,1,0]],['posterior',[0,.04,-1],[0,1,0]],['right',[-1,.04,0],[0,1,0]],['left',[1,.04,0],[0,1,0]],['superior',[0,1,0],[0,0,-1]],['inferior',[0,-1,0],[0,0,1]]];
let fits=0;
const ratios=[];
for(const ss of groups)for(const aspect of [.46,.65,1.58,2.8])for(const [view,d,u] of angles){
  const bounds=union(ss),direction=new Vector3(...d).normalize(),up=new Vector3(...u);
  const old=fitBounds(bounds,direction,up,aspect,38),fit=fitBounds(bounds,direction,up,aspect,38,[.7,.86]);
  assert(fit.distance<=old.distance+1e-10);
  assert.deepEqual(fit.center,old.center);
  if(ss===all&&view==='anterior')ratios.push({aspect,distanceRatio:fit.distance/old.distance});
  for(const orthographic of [false,true]){
    const camera=orthographic?new OrthographicCamera(-fit.halfHeight*aspect,fit.halfHeight*aspect,fit.halfHeight,-fit.halfHeight,.01,150):new PerspectiveCamera(38,aspect,.01,150);
    camera.position.copy(fit.center).addScaledVector(direction,fit.distance);camera.up.copy(up);camera.lookAt(fit.center);camera.updateMatrixWorld();
    // Every full source box remains within the permitted drawing area, not just
    // one chosen landmark or a cropped regional subset.
    for(const s of ss)for(const x of [s.bounds.min[0],s.bounds.max[0]])for(const y of [s.bounds.min[1],s.bounds.max[1]])for(const z of [s.bounds.min[2],s.bounds.max[2]]){
      const p=new Vector3(x,y,z).project(camera);
      assert(Math.abs(p.x)<=.700001&&Math.abs(p.y)<=.860001&&p.z>-1&&p.z<1,`${view}/${aspect}/${s.id}`);
    }
    fits++;
  }
}
assert(ratios.find(r=>r.aspect===1.58).distanceRatio<.9,'Desktop anatomy is meaningfully enlarged');
assert.equal(JSON.stringify(catalog),original,'No anatomy, identities or source coordinates changed');

// Inspect the actual scene's returned camera element. Hooks and the WebGL root
// are controlled; separate browser QA covers the rendered result.
const compiled=await build({stdin:{contents:"export {BodyScene} from './app/body-scene'; export {FittedCamera} from './app/fitted-camera';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
const require=createRequire(import.meta.url),React=require('react'),mod={exports:{}};
runInNewContext(compiled.outputFiles[0].text,{module:mod,exports:mod.exports,require:id=>id==='react'?{...React,useMemo:fn=>fn(),useRef:v=>({current:v}),useEffect:()=>{},useLayoutEffect:()=>{}}:require(id)});
const nodes=n=>!n||typeof n!=='object'?[]:Array.isArray(n)?n.flatMap(nodes):[n,...nodes(n.props?.children)];
const props={catalog,structures:all,selectedId:null,systems:Object.fromEntries(all.map(s=>[s.system,true])),isolated:false,hiddenIds:[],ghostRemoved:false,illustrated:true,landmarks:[],explode:0,layout:'spatial',anchorSkeleton:false,showOrigins:false,labels:true,view:'anterior',zoom:1,reset:0,focus:false,exam:false,inspection:{plane:'off',position:50,flipped:false,opacity:{},keepSelectedSolid:true},plate:false,onSelect(){},onLoaded(){},onFailure(){},onRendererHealth(){}};
let sceneCases=0;
for(const fitOccupancy of [undefined,[.7,.86]])for(const exam of [false,true])for(const layout of ['spatial','extract','tray']){
  const scene=mod.exports.BodyScene({...props,fitOccupancy,exam,layout});
  const camera=nodes(scene.props.children(()=>{})).find(n=>n.type===mod.exports.FittedCamera);
  assert(camera);assert.equal(camera.props.fitOccupancy,fitOccupancy);sceneCases++;
}
const explorer=await readFile('app/body-explorer.tsx','utf8');
assert(explorer.includes("fitOccupancy={['head-neck', 'thorax'].includes(initialRegion) ? [0.7, 0.86] : undefined}"),'Only head/neck and thorax opt in; full source fitting is retained');
console.log(JSON.stringify({sourceSelections:all.length,sourceGroups:groups.length,cameraFits:fits,actualSceneCases:sceneCases,anteriorDistanceRatios:ratios,sourceUnchanged:true,croppedSources:0,browserOrClinicalAcceptance:false}));
