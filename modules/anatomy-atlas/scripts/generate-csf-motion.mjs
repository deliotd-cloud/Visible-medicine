// Original schematic markers, derived only from the existing licensed CSF spaces.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const catalog=JSON.parse(await readFile('public/models/bodyparts3d/ventricles/catalog.json','utf8'));
const bundle=catalog.bundles.find(b=>b.id==='ventricles');
const bytes=await readFile('public'+new URL(bundle.url,'https://local.invalid').pathname);
assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);
const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const meshes=new Map();scene.traverse(m=>{if(m.isMesh){assert(!meshes.has(m.name));meshes.set(m.name,m);}});
function halton(n,base){let v=0,f=1;while(n){f/=base;v+=f*(n%base);n=Math.floor(n/base);}return v;}
const ray=new THREE.Raycaster(),direction=new THREE.Vector3(0,1,0);
const records=[];
for(const id of catalog.ventricularIds){
  const structure=catalog.structures.find(s=>s.id===id);
  const report=catalog.sourceReports.find(r=>r.file===structure.sources[0].file);
  assert.equal(report.topology.closedOrientedManifold,true,'Only closed source spaces admit illustrative markers');
  const original=meshes.get(structure.nodeName);assert(original);
  assert(original.matrix.equals(new THREE.Matrix4()),'No unaccounted node transform');
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(original.geometry,material);mesh.updateMatrixWorld(true);
  original.geometry.computeBoundingBox();const box=original.geometry.boundingBox;
  const size=box.getSize(new THREE.Vector3()),tracks=[];
  // Each marker stays in a shrunken interval between consecutive surface hits.
  // No paths join different spaces, no inferred aqueduct/foramina, no velocities.
  for(let n=1;n<=1024&&tracks.length<40;n++){
    const origin=new THREE.Vector3(box.min.x+size.x*halton(n,2),box.min.y-size.y,
      box.min.z+size.z*halton(n,3));
    ray.set(origin,direction);
    const hits=ray.intersectObject(mesh,false).map(h=>h.distance);
    const unique=hits.filter((h,i)=>!i||Math.abs(h-hits[i-1])>1e-7);
    if(!unique.length||unique.length%2)continue; // Ambiguous ray: discard, never repair.
    for(let j=0;j<unique.length&&tracks.length<40;j+=2){
      const length=unique[j+1]-unique[j];if(length<size.y*0.04)continue;
      const lo=origin.y+unique[j]+length*0.25,hi=origin.y+unique[j+1]-length*0.25;
      tracks.push({center:[origin.x,(lo+hi)/2,origin.z],amplitude:(hi-lo)/2,
        phase:halton(n,5)*Math.PI*2});
    }
  }
  assert.equal(tracks.length,40,'Every exact space needs its complete marker set');
  records.push({structure,tracks});material.dispose();
}
const data={schemaVersion:1,status:'draft',kind:'schematic-in-space-oscillation',
  bundle:{...bundle},parent:catalog.parent,periodSeconds:4,axis:[0,1,0],records,
  license:'CC-BY-4.0',credit:catalog.credit,
  limitation:'Original visual markers in existing BodyParts3D spaces; not a flow dataset or fluid simulation. Closed source topology and ray intervals do not establish anatomical validity or prove absence of self-intersections.'};
const output=JSON.stringify(data,null,2)+'\n',destination='content/csf-motion.v1.json';
if(process.argv.includes('--check'))assert.equal(await readFile(destination,'utf8'),output,'Schematic markers must match exact source geometry');
else await writeFile(destination,output);
console.log('CSF schematic: 4 exact spaces × 40 contained scanline markers; no connected paths or geometry changes.');
