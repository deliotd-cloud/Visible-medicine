import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {readFile} from 'node:fs/promises';
import {build} from './workspace-component-test-build.mjs';
import {contentContext} from './content-contract-tools.mjs';
import {Box3,Vector3,PerspectiveCamera,OrthographicCamera} from 'three';
import {fitBounds,translatedBox} from '../lib/explode-layout.mjs';
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const compiled=await build({entryPoints:['app/region-heading.tsx'],bundle:true,write:false,format:'cjs',platform:'node'});
const module={exports:{}};runInNewContext(compiled.outputFiles[0].text,{module,exports:module.exports,require});
const context=await contentContext(),catalog=context.api.bodyDisplayCatalog(context.catalog);
const original=JSON.stringify(catalog);let headingRenders=0,cornerChecks=0;
const viewDirections=[[0,.04,1],[0,.04,-1],[-1,.04,0],[1,.04,0],[0,1,0],[0,-1,0]];
for(const [region,count] of [['thorax',157],['head-neck',290]]){
 const all=catalog.structures.filter(s=>s.regions.includes(region));assert.equal(all.length,count);
 for(const compact of [false,true]){
  const html=render(React.createElement(module.exports.RegionHeading,{title:region,description:'Source anatomy <test>',count,compact}));
  assert.equal((html.match(/<h1\b/g)||[]).length,1);assert(html.includes(region));assert(html.includes(String(count))&&html.includes('structures'));
  assert(html.includes('Source anatomy &lt;test&gt;'));assert(/review pending/i.test(html));
  assert.equal((html.match(/<details\b/g)||[]).length,compact?1:0);assert(!/<details[^>]*\bopen\b/.test(html));headingRenders++;
 }
 const bounds=all.reduce((b,s)=>b.union(translatedBox(s.bounds)),new Box3());
 for(const aspect of [.46,.65,1.58,2.8])for(const direction of viewDirections){
  const up=direction[1]===1?[0,0,-1]:direction[1]===-1?[0,0,1]:[0,1,0];
  const d=new Vector3(...direction).normalize(),fit=fitBounds(bounds,d,new Vector3(...up),aspect,38,[.7,.86]);
  for(const ortho of [false,true]){
   const camera=ortho?new OrthographicCamera(-fit.halfHeight*aspect,fit.halfHeight*aspect,fit.halfHeight,-fit.halfHeight,.01,150):new PerspectiveCamera(38,aspect,.01,150);
   camera.position.copy(fit.center).addScaledVector(d,fit.distance);camera.up.fromArray(up);camera.lookAt(fit.center);camera.updateMatrixWorld();
   for(const s of all)for(const x of [s.bounds.min[0],s.bounds.max[0]])for(const y of [s.bounds.min[1],s.bounds.max[1]])for(const z of [s.bounds.min[2],s.bounds.max[2]]){
    const p=new Vector3(x,y,z).project(camera);assert(Math.abs(p.x)<=.700001&&Math.abs(p.y)<=.860001&&p.z>-1&&p.z<1,region+'/'+s.id);cornerChecks++;
   }
  }
 }
}
assert.equal(JSON.stringify(catalog),original);
const explorer=await readFile('app/body-explorer.tsx','utf8');
assert(explorer.includes("compact={presentation === 'panel'}"));
assert(explorer.includes("fitOccupancy={['head-neck', 'thorax'].includes(initialRegion) ? [0.7, 0.86] : undefined}"));
console.log(JSON.stringify({headingRenders,sourceSelections:447,sourceCornerChecks:cornerChecks,sourceUnchanged:true,croppedStructures:0,clinicalApproval:false,browserAcceptance:false}));
