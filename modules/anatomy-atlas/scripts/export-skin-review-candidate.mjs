// Isolated review asset: never adds FMA7163 to the learner body catalogue.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {BufferGeometry,Float32BufferAttribute,Mesh,MeshStandardMaterial,Matrix4,Group} from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
assert(process.argv.includes('--check'),'Use --check for the pinned source audit');
const {skinMesh}=await import('./audit-skin-source.mjs');
const audit=JSON.parse(await readFile('docs/skin-source-audit-20260926.json'));
const catalog=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
assert(!catalog.structures.some(s=>s.fmaId==='FMA7163'));
const matrix=new Matrix4().fromArray(audit.coordinateSystem.sourceToSceneColumnMajor);
const geometry=new BufferGeometry();
geometry.setAttribute('position',new Float32BufferAttribute(skinMesh.vertices.flat(),3));
geometry.setIndex(skinMesh.faces.flat());geometry.applyMatrix4(matrix);geometry.computeVertexNormals();geometry.computeBoundingBox();
const mesh=new Mesh(geometry,new MeshStandardMaterial({color:'#caa782',roughness:.85}));mesh.name='FMA7163_candidate';
const group=new Group();group.add(mesh);
if(!globalThis.FileReader)globalThis.FileReader=class{
  readAsArrayBuffer(blob){blob.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}
};
const glb=Buffer.from(await new GLTFExporter().parseAsync(group,{binary:true}));
const hash=b=>createHash('sha256').update(b).digest('hex');
const frontal=catalog.structures.find(s=>s.fmaId==='FMA52734');assert(frontal);
const bundle=catalog.bundles.find(b=>b.id===frontal.bundle);assert(bundle);
const out='public/models/review-candidates/skin';await mkdir(out,{recursive:true});
const section=await readFile('../work/skin-head-sections-20260926.png');
const manifest={schemaVersion:1,id:'vm:candidate:skin:FMA7163',name:'Whole-body skin candidate',fmaId:'FMA7163',
  sourceFile:'FJ2810',sourceSha256:audit.sha256,license:audit.license,credit:audit.credit,
  model:{url:'/models/review-candidates/skin/skin.glb',sha256:hash(glb),bytes:glb.length,nodeName:mesh.name,vertices:skinMesh.vertices.length,triangles:skinMesh.faces.length,bounds:{min:geometry.boundingBox.min.toArray(),max:geometry.boundingBox.max.toArray()}},
  context:{id:frontal.fmaId,name:frontal.name,nodeName:frontal.nodeName,bundleUrl:bundle.url,bundleSha256:bundle.sha256},
  section:{url:'/models/review-candidates/skin/head-sections.png',sha256:hash(section)},
  evidence:await Promise.all(['skin-source-audit','skin-seam-screen','skin-context-screen','skin-head-sections'].map(async name=>{
    const path=`docs/${name}-20260926.json`;return {path,sha256:hash(await readFile(path))};})),
  learnerCatalogAdmission:false,clinicalApproval:false,decisionSavingSupported:false,
  changes:'Existing common coordinate transform, float32 export and recomputed display normals only. Original vertices/faces retained; no welding, repair, region splitting or individual fitting.'};
for(const [path,bytes] of [[out+'/skin.glb',glb],[out+'/head-sections.png',section],['content/skin-review-candidate.json',Buffer.from(JSON.stringify(manifest,null,2)+'\n')]]){
  if(process.argv.includes('--verify-output'))assert.deepEqual(bytes,await readFile(path),'Candidate asset changed');
  else await writeFile(path,bytes,{flag:'wx'});
}
console.log(JSON.stringify({bytes:glb.length,sha256:hash(glb),learnerCatalogAdmission:false}));
