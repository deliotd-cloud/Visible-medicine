import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {build} from './export-fda-shoulder-reference.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const target=path.join(root,'public/models/fda-shoulder-draft');
const quarantine='F:/VisibleMedicine/staging/20261023-fda-shoulder-surfaces/quarantine-surfaces';
const sha=b=>createHash('sha256').update(b).digest('hex');
const sourceParts=['AC_Lig','Hcart','Labrum','CLAVICLE','Humerus','SCAPULA'];

test('draft bundle reproduces and Three decodes every preserved source vertex and triangle',async()=>{
  const {asset,catalog,catalogBytes,maxReverseCoordinateError}=build();
  assert.deepEqual(fs.readFileSync(path.join(target,'reference.glb')),asset);
  assert.deepEqual(fs.readFileSync(path.join(target,'catalog.json')),catalogBytes);
  assert.equal(sha(asset),catalog.bundle.sha256);assert.equal(asset.length,catalog.bundle.bytes);
  assert.equal(asset.readUInt32LE(0),0x46546c67);assert.equal(asset.readUInt32LE(4),2);assert.equal(asset.readUInt32LE(8),asset.length);
  const jsonLength=asset.readUInt32LE(12),json=JSON.parse(asset.subarray(20,20+jsonLength).toString('utf8'));
  assert.equal(json.buffers.length,1);assert.equal(Object.hasOwn(json.buffers[0],'uri'),false,'No external glTF buffer');
  assert.equal(json.images,undefined,'No external or embedded images');
  assert.equal(json.textures,undefined,'No textures');
  assert.equal(json.extensionsRequired,undefined,'No required external extensions');
  assert.equal(json.asset.extras.status,'draft-independent-reference');
  for(const field of ['measurementEnabled','anatomicalPresetsEnabled','registeredToBodyParts3D','clinicalApproval'])assert.equal(json.asset.extras[field],false);
  assert.equal(json.asset.extras.imagingRegistration,null);
  assert.deepEqual(catalog.structures.map(s=>s.sourcePart),sourceParts);
  assert.deepEqual(catalog.held,[{sourcePart:'Gcart',name:'Constructed glenoid cartilage',reason:'Source topology hold: two nonmanifold edges and three vertices',sourceNodeIds:[2798,4501,37871]}]);
  assert(!asset.includes(Buffer.from('fda_Gcart')));
  assert.equal(catalog.display.unitsPerMillimetre,null);assert.equal(catalog.display.normalizedLongestExtent,8);
  assert(catalog.display.uniformScale>0);assert(maxReverseCoordinateError<0.000004);
  const loaded=await new GLTFLoader().parseAsync(asset.buffer.slice(asset.byteOffset,asset.byteOffset+asset.byteLength),'');
  const meshes=new Map();loaded.scene.traverse(x=>{if(x.isMesh){assert(!meshes.has(x.name));meshes.set(x.name,x);}});
  assert.equal(meshes.size,6);
  for(const structure of catalog.structures){
    const mesh=meshes.get(structure.nodeName);assert(mesh,structure.nodeName);
    const obj=fs.readFileSync(path.join(quarantine,structure.sourcePart+'.obj'),'utf8');
    const vertices=[],indices=[];
    for(const line of obj.trimEnd().split(/\r?\n/)){
      if(line.startsWith('v '))vertices.push(line.split(/\s+/).slice(1).map(Number));
      if(line.startsWith('f '))indices.push(...line.split(/\s+/).slice(1).map(x=>Number(x)-1));
    }
    const position=mesh.geometry.getAttribute('position'),normal=mesh.geometry.getAttribute('normal'),index=mesh.geometry.getIndex();
    assert.equal(position.count,vertices.length);assert.equal(normal.count,vertices.length);assert.equal(index.count,indices.length);
    assert.equal(structure.vertices,vertices.length);assert.equal(structure.triangles,indices.length/3);
    for(let i=0;i<vertices.length;i++){
      for(let j=0;j<3;j++){
        const expected=Math.fround((vertices[i][j]-catalog.display.sourceCenter[j])*catalog.display.uniformScale);
        assert.equal(position.array[i*3+j],expected,`${structure.sourcePart} position ${i}:${j}`);
      }
      const length=Math.hypot(normal.array[i*3],normal.array[i*3+1],normal.array[i*3+2]);
      assert(Number.isFinite(length)&&Math.abs(length-1)<1e-6,`${structure.sourcePart} normal ${i}`);
    }
    for(let i=0;i<indices.length;i++)assert.equal(index.array[i],indices[i],`${structure.sourcePart} index ${i}`);
    assert.equal(structure.sourceObjSha256,sha(fs.readFileSync(path.join(quarantine,structure.sourcePart+'.obj'))));
    assert.equal(structure.sourceMapSha256,sha(fs.readFileSync(path.join(quarantine,structure.sourcePart+'.source-map.json'))));
    for(const flag of ['anatomicalReview','clinicalApproval','orientationVerified','unitCalibration','registeredToBodyParts3D'])assert.equal(structure.validation[flag],false);
  }
});
