import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { Matrix4, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sourceObjShape, mergeSourceShapes } from './source-surface-audit.mjs';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import { preLimbicLandmarkProfiles } from './limbic-landmark-study-history.mjs';
const compiled=await build({stdin:{contents:`export * from './lib/limbic-landmarks'; export * from './lib/body-display-catalog'; export * from './lib/anatomy-link-registry'; export * from './lib/anatomy-coordinates'; export * from './lib/study-links'; export * from './lib/study-library'; export * from './lib/limb-vascular-studies'; export * from './lib/longus-colli'; export * from './app/dissection-data'; export {bodyLesson} from './app/body-content';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const rawBytes=await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(hash(rawBytes),'109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7');
const raw=JSON.parse(rawBytes),rawBefore=JSON.stringify(raw),catalog=api.bodyDisplayCatalog(raw),before=JSON.stringify(catalog);
const pins=JSON.parse(await readFile('public/models/bodyparts3d/limbic-landmarks/catalog.json'));
const studyId='deep-brain-septal-landmarks',bundle=pins.bundles[0];
assert.equal(catalog.structures.length,1078);assert.equal(JSON.stringify(raw),rawBefore);
for(const held of ['FMA61974','FMA72940'])assert(!catalog.structures.some(s=>s.fmaId===held),'Held source must remain absent from display');
assert.equal(api.bodyDisplayCatalog(catalog),catalog);
assert.deepEqual(catalog.structures.filter(s=>s.bundle===bundle.id),pins.structures);
assert.equal(hash(JSON.stringify(preLimbicLandmarkProfiles(api.dissectionProfiles))),'149c45795d93395fca32fe668ca3f91fc58993b1280bf0da5f6cdda98e663474');
const changedProfiles=structuredClone(api.dissectionProfiles);changedProfiles['head-neck'].title='Changed';
assert.notEqual(hash(JSON.stringify(preLimbicLandmarkProfiles(changedProfiles))),'149c45795d93395fca32fe668ca3f91fc58993b1280bf0da5f6cdda98e663474');
const detached=api.addLimbicLandmarks(raw);detached.structures.at(-1).anchor[0]=999;
assert.deepEqual(api.addLimbicLandmarks(raw).structures.slice(-4),pins.structures);
const unrelated={...raw,structures:[],bundles:[]};assert.equal(api.addLimbicLandmarks(unrelated),unrelated);
let rejections=0,links=0,faceCorners=0,scopes=0,handlers=0,renders=0;
const selected=pins.structures[0],href=api.makeStudyLink(catalog,'head-neck',selected.id,'both',studyId);
const params=Object.fromEntries(new URL(href,'https://atlas.invalid').searchParams),parsed=api.parseStudyLink(params);
const reject=mutate=>{const bad=structuredClone(catalog);mutate(bad);assert.throws(()=>api.addLimbicLandmarks(bad));assert.equal(api.limbicLandmarkStudyReady(bad,'head-neck',studyId),false);assert.equal(api.resolveStudyLink(bad,'head-neck',parsed).status,'rejected');rejections++;};
for(const pin of [...pins.structures,...pins.contextRecords]) {
  reject(c=>{c.structures=c.structures.filter(s=>s.id!==pin.id);});
  reject(c=>c.structures.push(structuredClone(pin)));
  for(const mutate of [s=>{s.anchor[0]+=.01;},s=>{s.laterality=s.laterality==='midline'?'left':'midline';},s=>{s.sources[0].sha256='changed';},s=>{s.nodeName='changed';},s=>{s.bundle='changed';}])reject(c=>mutate(c.structures.find(s=>s.id===pin.id)));
}
for(const pin of [...pins.bundles,...pins.contextBundles]) {
  reject(c=>{c.bundles=c.bundles.filter(b=>b.id!==pin.id);});
  reject(c=>c.bundles.push(structuredClone(pin)));
  reject(c=>{c.bundles.find(b=>b.id===pin.id).url+='/changed';});
}
reject(c=>{c.sourceVersion='other';});reject(c=>{c.license='other';});reject(c=>{c.coordinateSystem.sourceToSceneColumnMajor[0]+=.1;});
assert.equal(api.limbicLandmarkStudyReady(raw,'head-neck',studyId),false);
assert.equal(api.limbicLandmarkStudyReady(catalog,'abdomen',studyId),false);
assert.equal(api.limbicLandmarkStudyReady(null,'head-neck','unrelated'),true);
const bytes=await readFile('public'+bundle.url.split('?')[0]);assert.equal(hash(bytes),bundle.sha256);
const model=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const meshes=[];model.scene.traverse(m=>{if(m.isMesh)meshes.push(m);});assert.equal(meshes.length,4);
const matrix=new Matrix4().fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor),entries=api.bodyLinkEntries(catalog),transform=api.referenceTransform(catalog.coordinateSystem);
const tabs=['anatomy','function','clinical','quiz','ct','mri','xray','ultrasound','pathology'];
for(const surface of pins.structures) {
  const parts=[];
  for(const pin of surface.sources){const original=await readFile('content/sources/limbic-landmarks/'+pin.file+'.obj');assert.equal(hash(original),pin.sha256);parts.push(sourceObjShape(original));}
  const shape=mergeSourceShapes(parts),mesh=meshes.find(m=>m.name===surface.nodeName),positions=mesh.geometry.attributes.position.array;
  assert.equal(mesh.userData.structureId,surface.id);assert.equal(mesh.geometry.index.count,shape.faces.length*3);
  let vertexOffset=0,faceOffset=0;
  for(const part of parts){
    const uniqueCount=new Set(part.vertices.map(p=>p.join(','))).size;
    for(let i=faceOffset*3;i<(faceOffset+part.faces.length)*3;i++)assert(mesh.geometry.index.array[i]>=vertexOffset&&mesh.geometry.index.array[i]<vertexOffset+uniqueCount,'Separate original files keep separate index ranges');
    vertexOffset+=uniqueCount;faceOffset+=part.faces.length;
  }
  assert.equal(positions.length/3,vertexOffset);
  if(surface.fmaId==='FMA61975')assert.equal(vertexOffset,286,'Do not weld the lamina point contact across source files');
  for(let f=0;f<shape.faces.length;f++)for(let c=0;c<3;c++) {
    const expected=new Vector3(...shape.vertices[shape.faces[f][c]]).applyMatrix4(matrix).toArray().map(Math.fround),i=mesh.geometry.index.array[f*3+c];
    assert.deepEqual(Array.from(positions.slice(i*3,i*3+3)),expected);faceCorners++;
  }
  assert(Array.from({length:positions.length/3},(_,i)=>Array.from(positions.slice(i*3,i*3+3))).some(p=>JSON.stringify(p)===JSON.stringify(surface.anchor)));
  const entry=entries.find(e=>e.id===surface.id);assert(entry&&!('frameOfReferenceUid' in entry.reference));
  transform.toScene(entry.reference.point).forEach((n,i)=>assert(Math.abs(n-surface.center[i])<1e-8));
  for(const tab of tabs)assert.equal(api.bodyLesson(surface,tab).readiness,(['anatomy','quiz'].includes(tab)||(tab==='function'&&surface.fmaId!=='FMA61842'))?'draft':'pending');
  assert.equal(api.limbicLandmarkLesson({...surface,anchor:[0,0,0]},'anatomy'),undefined);
  const lesson=api.limbicLandmarkLesson(surface,'anatomy');lesson.citations.push('changed');assert(!api.limbicLandmarkLesson(surface,'anatomy').citations.includes('changed'));
  for(const region of ['whole-body',...surface.regions])for(const side of ['both','left','right']) {
    const link=api.makeStudyLink(catalog,region,surface.id,side);
    if(side!=='both'&&surface.laterality!=='midline'&&side!==surface.laterality){assert.equal(link,null);continue;}
    assert(link);assert.equal(api.resolveStudyLink(catalog,region,api.parseStudyLink(Object.fromEntries(new URL(link,'https://atlas.invalid').searchParams))).status,'ready');links++;
  }
}
for(const surface of catalog.structures.filter(s=>s.bundle!==bundle.id))for(const tab of tabs)assert.equal(api.limbicLandmarkLesson(surface,tab),undefined);
const expected=[...pins.structures,...pins.contextRecords].map(s=>s.fmaId);
for(const region of ['head-neck','whole-body'])for(const side of ['both','left','right']) {
  const scope=api.bodyStudyScope(catalog,region,side),profile=api.dissectionProfiles[region],state=api.dissectionReducer(api.initialDissection,{type:'focus',id:studyId});
  const visible=api.resolveDissection(scope,profile,state).visible;
  assert.equal(visible.length,side==='both'?11:8);assert.deepEqual(visible.map(s=>s.fmaId).sort(),scope.filter(s=>expected.includes(s.fmaId)).map(s=>s.fmaId).sort());
  for(const surface of visible){const link=api.makeStudyLink(catalog,region,surface.id,side,studyId);assert(link);assert.equal(api.resolveStudyLink(catalog,region,api.parseStudyLink(Object.fromEntries(new URL(link,'https://atlas.invalid').searchParams))).status,'ready');links++;}
  const removed=api.dissectionReducer(state,{type:'remove',id:visible[0].id});assert(!api.resolveDissection(scope,profile,removed).visible.some(s=>s.id===visible[0].id));
  assert.deepEqual(api.resolveDissection(scope,profile,api.dissectionReducer(removed,{type:'undo'})).visible,visible);scopes++;
}
// Execute the actual parent handler; not a browser or GPU test.
const source=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let action;
function visit(n){if(ts.isFunctionDeclaration(n)&&n.name?.text==='changeFocus')action=ts.transpile(n.getText(ast),{target:ts.ScriptTarget.ES2022});ts.forEachChild(n,visit);}visit(ast);assert(action);
for(const region of ['head-neck','whole-body'])for(const mode of ['ready','exam','changed']) {
  const calls=[],cameraRestore={current:{pending:true}},bad=structuredClone(catalog);if(mode==='changed')bad.structures=bad.structures.filter(s=>s.id!==selected.id);
  const env={catalog:bad,initialRegion:region,side:'both',profile:api.dissectionProfiles[region],exam:mode==='exam',layout:'tray',cameraRestore,initialInspection:{plane:'off'},allBodySystems:{},limbVascularStudyReady:api.limbVascularStudyReady,longusColliStudyReady:api.longusColliStudyReady};
  for(const name of ['dispatch','setInspection','setPlate','setLayout','setSystems','setSelectedId','setFocus','setIsolated','setExplode','setZoom','setView','setReset'])env[name]=v=>calls.push([name,typeof v==='function'?v(0):v]);
  assert.equal(runInNewContext(action+`;changeFocus('${studyId}')`,env),mode==='ready');
  if(mode==='ready'){assert.equal(cameraRestore.current,null);assert.equal(calls.find(c=>c[0]==='setView')[1],'anterior');assert.equal(calls.find(c=>c[0]==='setExplode')[1],0);}else assert.deepEqual(calls,[]);handlers++;
}
const component=await componentBuild({entryPoints:['app/study-library.tsx'],bundle:true,write:false,format:'cjs',platform:'node'}),require=createRequire(import.meta.url),React=require('react'),mod={exports:{}};
runInNewContext(component.outputFiles[0].text,{module:mod,exports:mod.exports,require,console,process:{env:{NODE_ENV:'test'}}});
for(const region of ['head-neck','whole-body'])for(const disabled of [false,true]) {
  const scope=api.bodyStudyScope(catalog,region,'both');
  const html=require('react-dom/server').renderToStaticMarkup(React.createElement(mod.exports.StudyLibrary,{profile:api.dissectionProfiles[region],state:api.initialDissection,structures:scope,visibleIds:scope.map(s=>s.id),loaded:[],failed:[],disabled,onStage(){},onFocus(){}}));
  assert(html.includes(disabled?'End practice':'Deep brain: septal landmarks'));renders++;
}
assert.equal(JSON.stringify(catalog),before);assert.equal(faceCorners,24126);
console.log(JSON.stringify({sourceSelections:4,displaySelections:1078,triangles:faceCorners/3,sourceFaceCorners:faceCorners,scopes,links,rejections,actualParentHandlers:handlers,actualMenus:renders,previousRecipesUnchanged:true,clinicalOrDeviceAcceptance:false}));
