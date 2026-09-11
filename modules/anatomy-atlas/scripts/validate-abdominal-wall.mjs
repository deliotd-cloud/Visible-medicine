import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
const hash = b => createHash('sha256').update(b).digest('hex');
const out = 'public/models/bodyparts3d-v3/abdominal-wall', retained = 'content/sources/bodyparts3d-v3-abdominal-wall';
const raw = JSON.parse(await readFile(`${out}/catalog.json`)), audit = JSON.parse(await readFile(`${retained}/source-audit.json`));
let checks = 0, corners = 0, maxErrorMm = 0;
const same = (a,b) => { assert.deepEqual(a,b); checks++; };
const ok = value => { assert(value); checks++; };
same(raw.structures.length,29); same(raw.structures.filter(s=>s.tissue==='muscle').length,8);
same(raw.source.license, 'CC BY-SA 2.1 JP'); same(raw.source.registration, 'none');
same(raw.source.archive,'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/BodyParts3D_3.0_obj_99.zip');
same(hash(await readFile(`${retained}/parts_list_e.txt`)),audit.namesSha256);
for (const [file,e] of Object.entries(audit.evidence)) same(hash(await readFile(`${retained}/${file}`)),e.sha256);
const names = new Map((await readFile(`${retained}/parts_list_e.txt`,'utf8')).trim().split(/\r?\n/).map(r=>r.split('\t')));
const bytes = await readFile(`${out}/abdominal-wall.glb`), bundle = raw.bundles[0];
same(bytes.length,bundle.bytes); same(hash(bytes),bundle.sha256); ok(bytes.length<25*1024*1024);
const scene = (await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length), '')).scene;
const meshes = []; scene.traverse(o=>{if(o.isMesh)meshes.push(o);}); same(meshes.length,29);
for (const surface of raw.structures) {
  const mesh = meshes.find(m=>m.name===surface.nodeName); ok(mesh);
  same(mesh.userData.fmaId,surface.fmaId); same(mesh.userData.license,raw.source.license);
  same(mesh.userData.registration,'none'); same(surface.sourceName,names.get(surface.fmaId));
  const original = await readFile(`${retained}/${surface.fmaId}.obj`);
  same(hash(original),surface.sources[0].sha256); same(surface.sources[0].file,surface.fmaId);
  ok(original.toString().includes('CC Attribution-Share Alike 2.1 Japan'));
  const sourceAudit = audit.structures.find(s=>s.id===surface.id); same(sourceAudit.sourceBytes,original.length);
  same(surface.sourceQuality.components,sourceAudit.topology.components.length); same(surface.sourceQuality.nonManifoldEdges,sourceAudit.topology.nonManifoldEdges);
  const vertices = [], normals = [], faces = [];
  for (const line of original.toString().split(/\r?\n/)) {
    const [kind,...values] = line.trim().split(/\s+/);
    if(kind==='v')vertices.push(values.map(Number)); if(kind==='vn')normals.push(values.map(Number));
    if(kind==='f')faces.push(values.map(v=>{const [i,,n]=v.split('/').map(Number);return [i-1,n-1];}));
  }
  same(faces.length,surface.triangles); same(surface.omittedSourceFaces,[]);
  const p=mesh.geometry.getAttribute('position'), n=mesh.geometry.getAttribute('normal'), index=mesh.geometry.index;
  same(index.count,faces.length*3); mesh.geometry.computeBoundingBox();
  same(mesh.geometry.boundingBox.min.toArray(),surface.bounds.min); same(mesh.geometry.boundingBox.max.toArray(),surface.bounds.max);
  let cursor=0, anchor=false;
  for (const face of faces) for (const [v, normal] of face) {
    const i=index.getX(cursor++), displayed=[p.getX(i),p.getY(i),p.getZ(i)], restored=[displayed[0]*100, -displayed[2]*100-100, displayed[1]*100+1050];
    const error=Math.max(...restored.map((x,k)=>Math.abs(x-vertices[v][k]))); maxErrorMm=Math.max(maxErrorMm,error); assert(error<.0001);
    const sourceNormal=normals[normal], len=Math.hypot(...sourceNormal), expected=[sourceNormal[0]/len,sourceNormal[2]/len,-sourceNormal[1]/len];
    assert(Math.max(...[n.getX(i),n.getY(i),n.getZ(i)].map((x,k)=>Math.abs(x-expected[k])))<.00001);
    if(displayed.every((x,k)=>x===surface.anchor[k]))anchor=true; corners++;
  }
  ok(anchor);
}
// Earlier evidence-only candidates must remain identical source bytes; never overwrite the v4 root.
const held = JSON.parse(await readFile('content/abdominal-wall-audit.json'));
const candidates = held.candidates ?? held.results;
ok(Array.isArray(candidates));
for(const c of candidates) same(raw.structures.find(s=>s.fmaId===c.fmaId).sources[0].sha256,c.legacyV3Components[0].sha256);
same(hash(await readFile('public/models/bodyparts3d/full-body/catalog.json')),'109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7');
const archive=await readFile(`${out}/original-source.zip`);ok(archive.length<25*1024*1024);
for(const s of raw.structures) same(hash(execFileSync('tar',['-xOf',`${out}/original-source.zip`,`./${s.fmaId}.obj`],{maxBuffer:20*1024*1024})),s.sources[0].sha256);
same(execFileSync('tar',['-xOf',`${out}/original-source.zip`,'./NOTICE.md']).toString(),await readFile(`${out}/NOTICE.md`,'utf8'));
const compiled=await build({stdin:{contents:"export * from './lib/abdominal-wall.ts'; export * from './lib/independent-specimen.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const helpers=await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const {abdominalWallDefinition:def,abdominalWallNote,initialSpecimen,reduceSpecimen,specimenAction,activeSpecimenStudy,filterSpecimen}=helpers;
same(def.catalog.structures.filter(s=>s.sourceTree==='bodyparts3d-v3-atomic').length,29);
for(const study of def.studies){
  const initial=initialSpecimen(def), state=reduceSpecimen(def,initial,specimenAction(def,study.id));
  same(def.surfaces.filter(s=>!state.hidden.includes(s.id)).map(s=>s.id).sort(),[...study.ids].sort());
  same(activeSpecimenStudy(def,state.hidden).id,study.id);same(state.selectedId,study.selectedId);
  const removed=reduceSpecimen(def,state,{type:'visibility',id:study.selectedId,visible:false});same(removed.selectedId,null);
  const undo=reduceSpecimen(def,removed,{type:'undo'});same(undo.hidden,state.hidden);same(undo.selectedId,state.selectedId);
  same(reduceSpecimen(def,undo,{type:'redo'}).hidden,removed.hidden);
  same(reduceSpecimen(def,state,{type:'select',id:'body-FMA13336'}),state);
}
for(const side of ['right','left'])same(def.studies.find(s=>s.id===side).ids.filter(id=>def.surfaces.find(s=>s.id===id).tissue==='muscle').length,4);
same(filterSpecimen(def,'rectus abdominis').length,2);same(specimenAction(def,'__proto__'),null);
for(const s of def.surfaces.filter(s=>s.tissue==='muscle')){
  ok(abdominalWallNote(s));
  for(const field of ['id','fmaId','sourceName','laterality','bundle','nodeName','tissue'])same(abdominalWallNote({...s,[field]:'foreign'}),null);
  same(abdominalWallNote({...s,sources:[{...s.sources[0],sha256:'0'.repeat(64)}]}),null);
}
let empty=initialSpecimen(def);for(const tissue of ['muscle','skeleton'])empty=reduceSpecimen(def,empty,{type:'group',tissue,visible:false});
same(empty.hidden.length,29);same(empty.selectedId,null);same(reduceSpecimen(def,empty,specimenAction(def,'all')).hidden,[]);
// Real React/UI markup with only the WebGL boundary replaced; not browser/GPU acceptance.
const component=await componentBuild({stdin:{contents:"export { KneeSpecimenView } from './app/um-knee-study.tsx'; export { abdominalWallSupplement } from './app/abdominal-wall-study.tsx';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'cjs',platform:'node',plugins:[{name:'scene-boundary',setup(api){api.onLoad({filter:/body-scene\.tsx$/},()=>({loader:'js',contents:'export function BodyScene(props){globalThis.sceneProps=props;return null;} export function retryBodyAssets(){}'}));}}]});
const require=createRequire(import.meta.url),React=require('react'),mod={exports:{}},context={module:mod,exports:mod.exports,require,URL,URLSearchParams,console,process:{env:{NODE_ENV:'test'}}};
runInNewContext(component.outputFiles[0].text,context);
const html=require('react-dom/server').renderToStaticMarkup(React.createElement(mod.exports.KneeSpecimenView,{specimen:def,supplement:mod.exports.abdominalWallSupplement}));
for(const text of ['Search abdominal wall specimen structures','CC BY-SA 2.1 Japan','Download original sources','tissue separation','right external oblique'])ok(html.toLowerCase().includes(text.toLowerCase()));
for(const text of ['Practise identification','Muscles by nerve','Ontology mapping: pending','independent right-limb specimen'])same(html.includes(text),false);
same(context.sceneProps.structures.length,29);same(context.sceneProps.catalog.sourceVersion,def.key);same(context.sceneProps.explode,0);
same(context.sceneProps.plate,false);same(context.sceneProps.cameraBounds,null);same(context.sceneProps.hiddenIds.length,0);
console.log(JSON.stringify({checks,sourceFaceCornersChecked:corners,maxErrorMm,surfaces:29,muscles:8,studies:def.studies.length,glbBytes:bytes.length,originalDownloadBytes:archive.length,sourceCoordinatesAndFaceOrder:'preserved',clinicalOrBrowserAcceptance:false}));
