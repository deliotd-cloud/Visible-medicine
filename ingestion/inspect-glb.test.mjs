import assert from 'node:assert/strict';
import test from 'node:test';
import { inspect } from './inspect-glb.mjs';

function makeGlb(change = () => {}) {
  const bin = Buffer.alloc(44);
  [0,0,0, 1,0,0, 0,1,0].forEach((v,i)=>bin.writeFloatLE(v,i*4));
  [0,1,2].forEach((v,i)=>bin.writeUInt16LE(v,36+i*2));
  const g = {
    asset:{version:'2.0'}, buffers:[{byteLength:42}],
    bufferViews:[{buffer:0,byteOffset:0,byteLength:36},{buffer:0,byteOffset:36,byteLength:6}],
    accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3'},{bufferView:1,componentType:5123,count:3,type:'SCALAR'}],
    meshes:[{primitives:[{attributes:{POSITION:0},indices:1}]}],
    nodes:[{mesh:0}], scenes:[{nodes:[0]}], scene:0,
  };
  change(g,bin);
  const json=Buffer.from(JSON.stringify(g));
  const padded=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);
  const out=Buffer.alloc(12+8+padded.length+8+bin.length);
  out.write('glTF',0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);
  out.writeUInt32LE(padded.length,12);out.write('JSON',16);padded.copy(out,20);
  const p=20+padded.length;out.writeUInt32LE(bin.length,p);out.write('BIN\0',p+4);bin.copy(out,p+8);
  return out;
}
test('valid source transforms and topology',()=>{
  const r=inspect(makeGlb(g=>{g.nodes[0].translation=[2,3,4];}));
  assert.equal(r.meshes[0].triangleCount,1);
  assert.equal(r.meshes[0].exactIndexComponents,1);
  assert.deepEqual(r.sceneBounds,{min:[2,3,4],max:[3,4,4]});
});
const refuses=[
  ['declared length',b=>b.writeUInt32LE(b.length-4,8),/length mismatch/],
  ['chunk alignment',b=>b.writeUInt32LE(b.readUInt32LE(12)-1,12),/length\/alignment/],
  ['out of range view',null,/outside buffer/,(g)=>{g.bufferViews[0].byteLength=100;}],
  ['bad accessor stride',null,/alignment\/stride/,(g)=>{g.bufferViews[0].byteStride=4;}],
  ['nonfinite position',null,/nonfinite value/,(g,b)=>{b.writeFloatLE(NaN,0);} ],
  ['out of range index',null,/index out of bounds/,(g,b)=>{b.writeUInt16LE(9,36);} ],
  ['node cycle',null,/root has parent|node cycle/,(g)=>{g.nodes[0].children=[0];}],
  ['matrix and TRS',null,/matrix and TRS/,(g)=>{g.nodes[0].matrix=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];g.nodes[0].translation=[0,0,0];}],
  ['external buffer',null,/external URI/,(g)=>{g.buffers[0].uri='elsewhere.bin';}],
  ['external image',null,/external URI/,(g)=>{g.images=[{uri:'elsewhere.png'}];}],
  ['morph target',null,/morph\/extension/,(g)=>{g.meshes[0].primitives[0].targets=[{}];}],
  ['extension',null,/unsupported extensionsUsed/,(g)=>{g.extensionsUsed=['KHR_example'];}],
];
for(const [name, mutateBytes, match, mutateData] of refuses)
  test(`refuses ${name}`,()=>{const b=makeGlb(mutateData);mutateBytes?.(b);assert.throws(()=>inspect(b),match);});


test('refuses non-affine transform rather than ignoring homogeneous coordinates',()=>assert.throws(()=>inspect(makeGlb(g=>{g.nodes[0].matrix=[1,0,0,0.25,0,1,0,0,0,0,1,0,0,0,0,1]})),/non-affine matrix/));
test('refuses non-unit quaternion rather than inventing a normalized rotation',()=>assert.throws(()=>inspect(makeGlb(g=>{g.nodes[0].rotation=[0,0,0,2]})),/non-unit quaternion/));
test('CLI cannot overwrite an input model or an existing report',async()=>{
 const fs=await import('node:fs'),path=await import('node:path'),cp=await import('node:child_process'),url=await import('node:url');
 const dir=fs.mkdtempSync(url.fileURLToPath(new URL('./qa-fixture-',import.meta.url))),input=path.join(dir,'original.glb'),report=path.join(dir,'report.json'),bytes=makeGlb();fs.writeFileSync(input,bytes);
 const tool=url.fileURLToPath(new URL('./inspect-glb.mjs',import.meta.url));
 const same=cp.spawnSync(process.execPath,[tool,input,input],{encoding:'utf8',windowsHide:true});assert.notEqual(same.status,0);assert.match(same.stderr,/EEXIST/);assert.deepEqual(fs.readFileSync(input),bytes);
 fs.writeFileSync(report,'Existing report');const existing=cp.spawnSync(process.execPath,[tool,input,report],{encoding:'utf8',windowsHide:true});assert.notEqual(existing.status,0);assert.match(existing.stderr,/EEXIST/);assert.equal(fs.readFileSync(report,'utf8'),'Existing report');
});
