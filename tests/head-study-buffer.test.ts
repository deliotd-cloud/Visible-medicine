import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import {loadHeadStudy,openLocalHeadPackage} from '../lib/head-atlas-import.ts';

// Invented bytes and descriptors only; use the real package/hash/native loader.
const voxels=Float32Array.from({length:24},(_,i)=>i-12),bytes=new Uint8Array(voxels.buffer);
const hash=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const affine=[[1,0,0,10],[0,2,0,20],[0,0,3,30],[0,0,0,1]];
function file(path:string,value:Uint8Array|string){
  const result=new File([value as BlobPart],path);Object.defineProperty(result,'webkitRelativePath',{value:`invented/${path}`});return result;
}
function source(){
  const image={file:'invented.bin',sha256:hash(bytes),dtype:'float32',shape_kji:[2,3,4],ijk_to_ras:affine};
  const entries=(length:number)=>Array.from({length},(_,i)=>({id:`invented.${i}`,label:'Invented point',family:'test',representation:'point',color:[1,0,0],opacity:{fill:.2,outline:1}}));
  const manifest=JSON.stringify({schema_version:'visible-medicine.head-browser/1',version:'1.0.2',byte_order:'little',source_studies_are_distinct:true,studies:{CT:{image,entries:entries(355)},MRI:{image,entries:entries(117)}}});
  return openLocalHeadPackage([file('manifest.json',manifest),file('invented.bin',bytes)],hash(manifest));
}
for(const modality of ['CT','MRI'] as const)test(`${modality}: scalar bytes stay directly accessible but are not enumerable metadata`,async()=>{
  const pkg=await source(),study=await loadHeadStudy(pkg,modality),descriptor=Object.getOwnPropertyDescriptor(study,'data');
  assert.ok(descriptor);assert.equal(descriptor.enumerable,false);
  assert.equal(descriptor.value,study.data);assert.equal(descriptor.writable,true);assert.equal(descriptor.configurable,true);
  assert.ok(study.data instanceof Float32Array);assert.deepEqual([...study.data],[...voxels]);
  assert.deepEqual([...new Uint8Array(study.data.buffer)],[...bytes]);
  assert.equal(study.definition,pkg.manifest.studies[modality]);
  assert.deepEqual(study.geometry.shapeKJI,[2,3,4]);assert.deepEqual(study.geometry.ijkToRas([1,1,1]),[11,22,33]);
  assert.deepEqual(study.range,[-12,10]);
  assert.equal(Object.hasOwn(study,'data'),true);
  assert.deepEqual(Object.keys(study).sort(),['definition','geometry','range']);
  assert.equal(Object.hasOwn({...study},'data'),false);
  assert.equal(Object.hasOwn(JSON.parse(JSON.stringify(study)),'data'),false);
});
