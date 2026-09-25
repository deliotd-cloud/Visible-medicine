import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {build} from './workspace-test-build.mjs';
import {contentContext} from './content-contract-tools.mjs';
import {Box3,PerspectiveCamera,Vector3} from 'three';
import {fitBounds} from '../lib/explode-layout.mjs';
import {kneeStudySets,kneeStudyBounds} from '../lib/knee-studies.ts';
import {genicularStudy} from '../content/genicular-study.ts';
import {poplitealVesselStudy} from '../content/popliteal-vessel-study.ts';

const compiled=await build({stdin:{contents:`export * from './lib/regional-framing'; export * from './lib/genicular-study';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {regionalFramingBounds:frame,regionalFramingRegion,genicularStudyBounds}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const context=await contentContext(),catalog=context.api.bodyDisplayCatalog(context.catalog),before=JSON.stringify(catalog);
const structures=catalog.structures.filter(s=>s.regions.includes('leg'));
assert.equal(structures.length,76);
const box=b=>new Box3(new Vector3(...b.min),new Vector3(...b.max));
const union=items=>items.reduce((b,s)=>b.union(box(s.bounds)),new Box3());
const results=[];let projectedFits=0,selectionChecks=0;
for(const side of ['both','left','right']){
 assert.equal(regionalFramingRegion('leg',side),'leg');
 const visible=structures.filter(s=>side==='both'||s.laterality===side),core=visible.filter(s=>s.region==='leg');
 assert.equal(core.length,side==='both'?62:31);
 for(const stem of ['patella','tibia','fibula','calcaneal tendon','anterior tibial vein','posterior tibial vein','middle genicular artery'])
  assert(core.some(s=>s.name.toLowerCase().endsWith(stem)),stem+' complete source retained');
 const input={region:'leg',side,structures,visibleIds:visible.map(s=>s.id),selectedId:null,enabled:true};
 const expected=union(core),full=union(visible),bounds=frame(input);
 assert.deepEqual(bounds,{min:expected.min.toArray(),max:expected.max.toArray()});
 for(const s of visible){
  assert.deepEqual(frame({...input,selectedId:s.id}),core.includes(s)?bounds:null);
  assert.equal(frame({...input,selectedId:s.id,visibleIds:input.visibleIds.filter(id=>id!==s.id)}),null);
  selectionChecks++;
 }
 assert.equal(frame({...input,selectedId:'unknown'}),null);
 if(side!=='both'){
  const other=structures.find(s=>s.region==='leg'&&s.laterality!==side);
  assert.equal(frame({...input,selectedId:other.id,visibleIds:[...input.visibleIds,other.id]}),null);
 }
 for(const system of new Set(visible.map(s=>s.system))){
  const only=visible.filter(s=>s.system===system),members=core.filter(s=>s.system===system),b=union(members);
  assert.deepEqual(frame({...input,visibleIds:only.map(s=>s.id)}),members.length?{min:b.min.toArray(),max:b.max.toArray()}:null);
 }
 for(const change of [{enabled:false},{side:'invalid'},{visibleIds:[]},{visibleIds:visible.filter(s=>!core.includes(s)).map(s=>s.id)},{region:'whole-body'}])
  assert.equal(frame({...input,...change}),null);
 const ratios=[];
 for(const aspect of [.65,1,1.5,2.8])for(const [index,d] of [[0,.04,1],[0,.04,-1],[-1,.04,0],[1,.04,0],[0,1,0],[0,-1,0]].entries()){
  const dir=new Vector3(...d).normalize(),up=new Vector3(...(index<4?[0,1,0]:[0,0,index===4?-1:1]));
  const close=fitBounds(expected,dir,up,aspect,38,[.7,.9]),all=fitBounds(full,dir,up,aspect,38,[.7,.9]);
  const camera=new PerspectiveCamera(38,aspect,.01,150);camera.position.copy(close.center).addScaledVector(dir,close.distance);camera.up.copy(up);camera.lookAt(close.center);camera.updateMatrixWorld();
  for(const x of [expected.min.x,expected.max.x])for(const y of [expected.min.y,expected.max.y])for(const z of [expected.min.z,expected.max.z]){
   const p=new Vector3(x,y,z).project(camera);assert(Math.abs(p.x)<.95&&Math.abs(p.y)<.95&&p.z>-1&&p.z<1);
  }
  if(index===0){assert(close.distance<all.distance);ratios.push({aspect,ratio:close.distance/all.distance});}
  projectedFits++;
 }
 assert(ratios.some(r=>r.ratio<.75),'Materially closer, not a renamed full-source view');
 results.push({side,visible:visible.length,core:core.length,bounds,ratios});
}
assert.equal(JSON.stringify(catalog),before,'No source geometry/identity mutation');
// Execute the real component's preset guard, including dedicated study precedence.
const source=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body-explorer.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let enabled,dedicated,presetKey;
function visit(n){if(ts.isCallExpression(n)&&n.expression.getText(ast)==='regionalFramingBounds')enabled=n.arguments[0].properties.find(p=>p.name?.getText(ast)==='enabled').initializer.getText(ast);if(ts.isVariableDeclaration(n)&&n.name.getText(ast)==='dedicatedCameraRecipe')dedicated=n.initializer.getText(ast);if(ts.isJsxAttribute(n)&&n.name.getText(ast)==='presetKey')presetKey=n.initializer.expression.getText(ast);ts.forEachChild(n,visit);}
visit(ast);assert(enabled);assert(dedicated);assert(presetKey);
for(const side of ['both','left','right'])for(const regionalCloseUp of [null,{min:[0,0,0],max:[1,1,1]}])
 assert.equal(runInNewContext(presetKey,{initialRegion:'leg',side,regionalCloseUp,jointCloseUp:null,cameraRecipeId:null}),`leg/${side}/${regionalCloseUp?'regional':'sources'}`,'Interactive fallback must change recenter key, not just bounds');
for(const cameraRecipeId of [...kneeStudySets.map(s=>s.id),genicularStudy.id,poplitealVesselStudy.id]){
 const input={initialRegion:'leg',side:'both',regionalCloseUp:null,cameraRecipeId};
 assert.equal(runInNewContext(presetKey,{...input,jointCloseUp:{min:[0,0,0],max:[1,1,1]}}),`leg/both/study:${cameraRecipeId}`);
 assert.equal(runInNewContext(presetKey,{...input,jointCloseUp:null}),'leg/both/sources','Rejected ROI must trigger recenter');
}
const normal={regionalFraming:true,dedicatedCameraRecipe:false,jointCloseUp:null,exam:false,focus:false,isolated:false,ghostRemoved:false,showOrigins:false,explode:0,layout:'spatial',inspection:{plane:'off'}};
assert.equal(runInNewContext(enabled,normal),true);
const guards=[{regionalFraming:false},{dedicatedCameraRecipe:true},{jointCloseUp:{min:[0,0,0],max:[1,1,1]}},{exam:true},{focus:true},{isolated:true},{ghostRemoved:true},{showOrigins:true},{explode:1},{layout:'tray'},{layout:'extract'},{inspection:{plane:'axial'}}];
for(const change of guards)assert.equal(runInNewContext(enabled,{...normal,...change}),false);
for(const cameraRecipeId of [...kneeStudySets.map(s=>s.id),genicularStudy.id,poplitealVesselStudy.id]){
 const dedicatedCameraRecipe=runInNewContext(dedicated,{initialRegion:'leg',cameraRecipeId,kneeStudySets,genicularStudy,poplitealVesselStudy});
 assert.equal(dedicatedCameraRecipe,true);
 assert.equal(runInNewContext(enabled,{...normal,dedicatedCameraRecipe,jointCloseUp:null}),false,'Rejected dedicated ROI must fall back to full sources, not generic preset');
}
for(const cameraRecipeId of [null,'free','superficial'])assert.equal(runInNewContext(dedicated,{initialRegion:'leg',cameraRecipeId,kneeStudySets,genicularStudy,poplitealVesselStudy}),false);
let dedicatedStudyChecks=0;
for(const side of ['both','left','right'])for(const study of [...kneeStudySets,genicularStudy]){
 const allowed=new Set([...study.targetFmaIds,...study.context.flatMap(rule=>rule.fmaIds??[])]);
 const visible=structures.filter(s=>allowed.has(s.fmaId)&&(side==='both'||s.laterality===side));
 const input={catalog,region:'leg',recipeId:study.id,structures,visibleIds:visible.map(s=>s.id),enabled:true};
 const getBounds=study.id===genicularStudy.id?genicularStudyBounds:kneeStudyBounds;
 assert(getBounds(input),'Dedicated knee ROI resolves unchanged');
 const extra=structures.find(s=>!allowed.has(s.fmaId)&&(side==='both'||s.laterality===side));
 assert.equal(getBounds({...input,visibleIds:[...input.visibleIds,extra.id]}),null,'Restoring anatomy outside recipe rejects ROI');
 const dedicatedCameraRecipe=runInNewContext(dedicated,{initialRegion:'leg',cameraRecipeId:study.id,kneeStudySets,genicularStudy,poplitealVesselStudy});
 assert.equal(frame({region:'leg',side,structures,visibleIds:[...input.visibleIds,extra.id],selectedId:null,enabled:runInNewContext(enabled,{...normal,dedicatedCameraRecipe,jointCloseUp:null})}),null);
 dedicatedStudyChecks++;
}
const report={results,projectedFits,selectionChecks,dedicatedStudyChecks,actualComponentGuards:guards.length,sourceUnchanged:true,browserAcceptance:false,clinicalAcceptance:false};
await writeFile('docs/leg-framing-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
