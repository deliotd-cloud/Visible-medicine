import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { parseObj, auditObj } from './obj-audit.mjs';
const projectRoot=path.resolve(import.meta.dirname,'..'),root=process.env.VM_FOOT_ROOT??projectRoot,atlas=process.env.VM_ATLAS_ROOT??'F:/VisibleMedicine/atlas';
const {prepareShape}=await import(pathToFileURL(atlas+'/scripts/vessel-shape-math.mjs'));
const {sourceTopology}=await import(pathToFileURL(atlas+'/scripts/source-topology.mjs'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFile(path.join(root,p)), json=async p=>JSON.parse(await read(p));
const write=async(p,data)=>{await fs.mkdir(path.dirname(path.join(root,p)),{recursive:true});await fs.writeFile(path.join(root,p),JSON.stringify(data,null,2)+'\n');};
const acquired=await json('ACQUISITION.json');assert.equal(acquired.structures.length,12);
assert.equal(acquired.admittedToAtlas,false);
for(const [name,record] of Object.entries(acquired.evidence))assert.equal(sha(await read('original/'+name)),record.sha256);
assert((await read('original/source-readme.html')).toString().includes('Attribution-Share Alike 2.1 Japan'));
const v4Bytes=await fs.readFile(atlas+'/public/models/bodyparts3d/full-body/catalog.json'),v4=JSON.parse(v4Bytes);
const report=[],render=[];let triangles=0,maxFloat32Error=0;
for(const record of acquired.structures){
 const bytes=await read(record.path);assert.equal(sha(bytes),record.sha256);assert.equal(bytes.length,record.bytes);
 const parsed=parseObj(bytes),raw=auditObj(parsed),topology=sourceTopology(prepareShape(parsed.positions,parsed.faces));
 const muscle=record.id==='FMA74140'||record.id==='FMA74141',laterality=record.name.includes('right')?'right':'left';
 const rawReport={...raw};delete rawReport.positions;delete rawReport.faces;
 for(const point of parsed.positions)for(const coordinate of point)maxFloat32Error=Math.max(maxFloat32Error,Math.abs(Math.fround(coordinate)-coordinate));
 const current=v4.structures.find(s=>s.fmaId===record.id);let versionComparison=null;
 if(current){assert(!muscle,'Unexpected existing v4 muscle source');const originals=[];
  for(const s of current.sources){const original=await fs.readFile(projectRoot+'/original-v4/'+s.file+'.obj');assert.equal(sha(original),s.sha256);const p=parseObj(original);const b=auditObj(p).bounds;originals.push({file:s.file,sha256:s.sha256,sourceBounds:b});}
  assert.equal(originals.length,1);const b=originals[0].sourceBounds;
  versionComparison={currentId:current.id,currentSourceVersion:v4.sourceVersion,originals,v3Bounds:raw.bounds,v4MinusV3BoundsCenter:b.min.map((v,i)=>(v+b.max[i]-raw.bounds.min[i]-raw.bounds.max[i])/2),registration:'none; bounds comparison is descriptive only, not a transform'};
 }
 report.push({...record,laterality,kind:muscle?'muscle-group':'bone-context',rawIndexTopology:rawReport,exactCoordinateTopology:topology,versionComparison});
 render.push({id:record.id,name:record.name,laterality,kind:muscle?'muscle-group':'bone-context',positions:parsed.positions,faces:parsed.faces,sourceSha256:record.sha256});triangles+=parsed.faces.length;
}
assert(maxFloat32Error<0.00002);assert.equal(report.filter(r=>r.versionComparison).length,10);
const notice={title:'BodyParts3D v3 foot source review',status:'Technical candidate only; anatomical validation pending',credit:'BodyParts3D, Copyright© The Database Center for Life Science licensed by CC Attribution-Share Alike 2.1 Japan',license:'CC BY-SA 2.1 JP',licenseUrl:'https://creativecommons.org/licenses/by-sa/2.1/jp/',sourceUrl:acquired.archive,changes:'Selected 12 source meshes; original coordinate and triangle order retained in the data. Browser display uses Float32 positions and recomputed normals. No trimming, smoothing, mirroring, repair, fitting or registration. Each muscle set remains one labelled group; no individual muscle identity is inferred.',restriction:'When distributing these source assets or adaptations, retain attribution and license them under the same share-alike licence without additional asset restrictions. Application code remains separately licensed.',clinicalApproval:false,admittedToAtlas:false,registration:'none'};
await write('review/model.json',{schema:'vm-independent-foot-specimen/1',notice,structures:render});
const inputs=[];for(const p of ['scripts/source-topology.mjs','scripts/vessel-shape-math.mjs','public/models/bodyparts3d/full-body/catalog.json','node_modules/three/package.json','node_modules/three/LICENSE','node_modules/three/build/three.module.js','node_modules/three/build/three.core.js','node_modules/three/examples/jsm/controls/OrbitControls.js']){const b=await fs.readFile(atlas+'/'+p);inputs.push({path:p,bytes:b.length,sha256:sha(b)});}
await write('REVIEW_PACKET.json',{schema:'vm-independent-foot-screen/1',at:new Date().toISOString(),notice,acquisitionSha256:sha(await read('ACQUISITION.json')),modelSha256:sha(await read('review/model.json')),structures:report,render:{triangles,maxFloat32Error,transform:'identity: no position normalization, common translation, scale or rotation',normals:'recomputed for display only; original source retained',fragments:'all source triangles retained'},inputs,reviewQuestions:['Are all four principal dorsal-interosseous masses in each group recognisable and acceptably shaped relative to the source-matched metatarsals?','Do the retained small source fragments or surface defects make either group unsuitable for teaching?','Should an independently framed v3 foot specimen be included, with group-level selection, rather than claiming individual numbered muscle segmentation?','Any proposed individual muscle split, v4 placement or patient-space link needs a separate revision-bound anatomical and spatial review.'],next:'Keep as a separate unadmitted source-frame specimen. No direct merge with the v4 body; do not remove fragments or assign numbered muscle names without review.'});
console.log(JSON.stringify({structures:report.length,triangles,maxFloat32Error,groups:report.filter(s=>s.kind==='muscle-group').map(s=>({id:s.id,components:s.exactCoordinateTopology.components.map(c=>c.triangles),duplicateFaces:s.exactCoordinateTopology.duplicateFaces,degenerateFaces:s.exactCoordinateTopology.degenerateFaces,closed:s.exactCoordinateTopology.closedOrientedManifold})),versionCompared:10}));
