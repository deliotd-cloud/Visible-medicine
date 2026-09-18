import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {Matrix4,Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {sourceObjShape} from './source-surface-audit.mjs';
import {sourceTopology} from './source-topology.mjs';
import {cardiacVeinApi,cardiacVeinBase,priorCardiacVeinState,hash} from './anterior-cardiac-vein-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const api=await cardiacVeinApi(),raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const baseline=JSON.parse(await readFile('content/anterior-cardiac-vein-baseline.json'));
assert.equal(baseline.sourceCommit,cardiacVeinBase);
const saved=await exactSourceHistoryApi(cardiacVeinBase);
assert.deepEqual(priorCardiacVeinState(saved,raw),priorCardiacVeinState(api,raw),'Exact saved source proves old anatomy, bundles, recipes and 9,927 topics unchanged');
assert.deepEqual({...priorCardiacVeinState(api,raw),sourceCommit:cardiacVeinBase},baseline);
const pins=JSON.parse(await readFile('public/models/bodyparts3d/anterior-cardiac-vein/catalog.json'));
const auditBytes=await readFile('docs/anterior-cardiac-vein-source-audit.json'),audit=JSON.parse(auditBytes);assert.equal(hash(auditBytes),pins.auditSha256);
const catalog=api.bodyDisplayCatalog(raw),before=JSON.stringify(raw),s=catalog.structures.find(p=>p.fmaId==='FMA76767');
assert.equal(catalog.structures.length,1104);assert.equal(catalog.structures.filter(p=>p.sources.some(f=>['FJ2725','FJ2730'].includes(f.file))).length,1);
assert.equal(api.bodyDisplayCatalog(catalog),catalog);assert.equal(JSON.stringify(raw),before);assert.deepEqual(s,pins.structures[0]);
const bytes=await readFile('public/models/bodyparts3d/anterior-cardiac-vein/anterior-cardiac-vein.glb');assert.equal(bytes.length,pins.bundles[0].bytes);assert.equal(hash(bytes),pins.bundles[0].sha256);
const loaded=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');const meshes=[];loaded.scene.traverse(m=>{if(m.isMesh)meshes.push(m);});assert.equal(meshes.length,1);const mesh=meshes[0];assert.equal(mesh.name,s.nodeName);
const positions=[],indices=[],matrix=new Matrix4().fromArray(raw.coordinateSystem.sourceToSceneColumnMajor);
for(const source of s.sources){const raw=await readFile(`content/sources/anterior-cardiac-vein/${source.file}.obj`);assert.equal(hash(raw),source.sha256);const shape=sourceObjShape(raw);assert.deepEqual(sourceTopology(shape),audit.candidates.find(c=>c.file===source.file).topology);const offset=positions.length/3;positions.push(...shape.vertices.flatMap(v=>new Vector3(...v).applyMatrix4(matrix).toArray()));indices.push(...shape.faces.flatMap(f=>f.map(i=>i+offset)));}
assert.deepEqual(Array.from(mesh.geometry.attributes.position.array),Array.from(new Float32Array(positions)));assert.deepEqual(Array.from(mesh.geometry.index.array),indices);assert.equal(indices.length/3,730);
mesh.geometry.computeBoundingBox();assert.deepEqual(mesh.geometry.boundingBox.min.toArray(),s.bounds.min);assert.deepEqual(mesh.geometry.boundingBox.max.toArray(),s.bounds.max);
const anchorMatches=Array.from({length:positions.length/3},(_,i)=>Array.from(new Float32Array(positions.slice(i*3,i*3+3)))).some(v=>JSON.stringify(v)===JSON.stringify(s.anchor));assert(anchorMatches,'Anchor must be original transformed vertex');
let mutations=0;
for(const record of [...pins.contextRecords,...pins.structures])for(const mutate of [r=>r.sources[0].sha256='0'.repeat(64),r=>r.name+=' altered',r=>r.bounds.min[0]+=.1,r=>r.sourceTree='other',r=>r.fmaId+='x']){const copy=structuredClone(catalog);mutate(copy.structures.find(r=>r.id===record.id));assert.throws(()=>api.addAnteriorCardiacVein(copy));mutations++;}
for(const b of [...pins.contextBundles,...pins.bundles]){const copy=structuredClone(catalog);copy.bundles.find(r=>r.id===b.id).sha256='0'.repeat(64);assert.throws(()=>api.addAnteriorCardiacVein(copy));mutations++;}
for(const mutate of [c=>c.structures.push(structuredClone(s)),c=>c.structures=c.structures.filter(p=>p.id!==s.id),c=>c.sourceVersion='changed',c=>c.license='unreviewed',c=>c.coordinateSystem.sourceToSceneColumnMajor[0]+=1]){const copy=structuredClone(catalog);mutate(copy);assert.throws(()=>api.addAnteriorCardiacVein(copy));mutations++;}
const profile=api.dissectionProfiles.thorax,focus=profile.focuses.find(f=>f.id==='cardiac-venous-surfaces');assert(focus);assert.equal(focus.includeSkeleton,false);assert.equal(focus.view,'anterior');assert.deepEqual(focus.rule.fmaIds,['FMA76767','FMA7088','FMA3802','FMA4707','FMA4713']);
let historyActions=0,links=0;
for(const side of ['both','left','right']){
 const scope=api.bodyStudyScope(catalog,'thorax',side),state=api.dissectionReducer(api.initialDissection,{type:'focus',id:focus.id}),visible=api.resolveDissection(scope,profile,state).visible;
 const ids=ss=>ss.map(s=>s.id).sort();assert.deepEqual(ids(visible),ids(scope.filter(s=>focus.rule.fmaIds.includes(s.fmaId))));assert(visible.some(p=>p.id===s.id));
 for(const target of visible){const removed=api.dissectionReducer(state,{type:'remove',id:target.id});assert(!api.resolveDissection(scope,profile,removed).visible.some(s=>s.id===target.id));const undo=api.dissectionReducer(removed,{type:'undo'});assert.deepEqual(ids(api.resolveDissection(scope,profile,undo).visible),ids(visible));const redo=api.dissectionReducer(undo,{type:'redo'});assert(!api.resolveDissection(scope,profile,redo).visible.some(s=>s.id===target.id));historyActions+=3;}
 for(const region of ['thorax','whole-body']){const url=api.makeStudyLink(catalog,region,s.id,side,region==='thorax'?focus.id:null);assert(url);const request=api.parseStudyLink(Object.fromEntries(new URL(url,'https://local.invalid').searchParams));const resolved=api.resolveStudyLink(catalog,region,request);assert.equal(resolved.status,'ready');assert.deepEqual(resolved.selected,s);assert.equal(resolved.focusId,region==='thorax'?focus.id:null);if(region==='thorax'){assert.equal(resolved.view,focus.view);assert.deepEqual([...resolved.visibleIds].sort(),ids(visible));}links++;}
}
for(const tab of ['anatomy','function','quiz']){const lesson=api.bodyLesson(s,tab);assert.equal(lesson.readiness,'draft');assert.equal(lesson.citations.length,2);assert(lesson.note.includes('radiologist review'));}
for(const tab of ['ct','clinical'])assert.equal(api.bodyLesson(s,tab).readiness,'draft');
for(const tab of ['mri','xray','ultrasound','pathology'])assert.equal(api.bodyLesson(s,tab).readiness,'pending');
const altered=structuredClone(s);altered.sources[0].sha256='0'.repeat(64);assert.equal(api.anteriorCardiacVeinLesson(altered,'anatomy'),undefined);
const review=await api.bodyReviewMaterial(s.id);assert.equal(review.approval,false);assert.deepEqual(review.source.structure,s);
const result={sourceCommit:cardiacVeinBase,rootSelections:1104,addedSelections:1,sourceFiles:2,originalTriangles:730,previousSelectionsUnchanged:1103,previousTopicsUnchanged:9927,priorRecipesAndBundlesUnchanged:true,sourceBindingRejections:mutations,historyActions,links,sourceGeometryVerified:true,clinicalApproval:false,browserAcceptance:false};
await writeFile('docs/anterior-cardiac-vein-validation.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
