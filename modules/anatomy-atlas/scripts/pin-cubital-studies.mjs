import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {cubitalSourceIds} from '../content/cubital-studies.ts';
const hash=b=>createHash('sha256').update(b).digest('hex');
const raw=await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(hash(raw),'109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7');
const catalog=JSON.parse(raw),extra=JSON.parse(await readFile('public/models/bodyparts3d/cubital-veins/catalog.json'));
for(const k of ['sourceVersion','license','coordinateSystem'])assert.deepEqual(catalog[k],extra[k]);
const entries=[...catalog.structures,...extra.structures].filter(s=>cubitalSourceIds.includes(s.fmaId));
assert.equal(entries.length,32);assert.equal(new Set(entries.map(s=>s.fmaId)).size,32);
const bundles=[...catalog.bundles,...extra.bundles].filter(b=>entries.some(s=>s.bundle===b.id));
const positions=new Map();
for(const b of bundles){
 const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(hash(bytes),b.sha256);
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 for(const s of entries.filter(s=>s.bundle===b.id)){
  const n=gltf.scene.getObjectByName(s.nodeName);assert(n?.isMesh);assert.deepEqual(n.position.toArray(),[0,0,0]);assert.deepEqual(n.scale.toArray(),[1,1,1]);assert.deepEqual(n.quaternion.toArray(),[0,0,0,1]);positions.set(s.id,n.geometry.attributes.position);
 }
}
// Reuse the existing elbow camera band's vertical extent, then include every
// supplied surface's actual vertices within that band. No vertex is rewritten.
const elbow=JSON.parse(await readFile('content/elbow-study-pins.json')),cameraBounds={},inBand={};
for(const side of ['left','right']){
 const min=[Infinity,elbow.cameraBounds[side].min[1],Infinity],max=[-Infinity,elbow.cameraBounds[side].max[1],-Infinity];
 for(const s of entries.filter(s=>s.laterality===side)){
  const p=positions.get(s.id);let count=0;
  for(let i=0;i<p.count;i++)if(p.getY(i)>=min[1]&&p.getY(i)<=max[1]){
   count++;for(const [axis,value] of [[0,p.getX(i)],[2,p.getZ(i)]]){assert(Number.isFinite(value));min[axis]=Math.min(min[axis],value);max[axis]=Math.max(max[axis],value);}
  }
  assert(count>0,s.name+' must have actual elbow-band vertices');inBand[s.id]=count;
 }
 for(const i of [0,2]){min[i]-=.12;max[i]+=.12;}cameraBounds[side]={min,max};
}
const record={sourceCommit:'c442b24d83b7dae377f937a0a3e4411a4cffef3a',sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,entries,bundles,cameraBounds,inBand};
const text=JSON.stringify(record,null,2)+'\n',path='content/cubital-study-pins.json';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replace(/\r\n/g,'\n'),text);else await writeFile(path,text,{flag:'wx'});
console.log(JSON.stringify({selections:entries.length,bundles:bundles.length,cameraBounds,geometryWritten:false}));
