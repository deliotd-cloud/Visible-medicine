// Deterministic, source-index-preserving draft reference. No anatomical frame is inferred.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {verifyReadback} from './check-fda-shoulder-surface-readback.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const QUARANTINE='F:/VisibleMedicine/staging/20261023-fda-shoulder-surfaces/quarantine-surfaces';
const SOURCE='F:/VisibleMedicine/staging/20261023-fda-shoulder-source/Male-Shoulder.inp';
const OUT=path.join(ROOT,'public/models/fda-shoulder-draft');
const MANIFEST_SHA='da1f2e5181fedf6c5a1c5e1bc1c6c89f7d0a754aba0c7e4147d7f3f8e9ff3749';
const SOURCE_SHA='547de9cff23a4ae98d5a297ba32d8b01fe042739160c4b7144dfe7066d08c70a';
const parts=[
  ['AC_Lig','ac-ligament','Acromioclavicular ligament','ligament'],
  ['Hcart','humeral-cartilage','Constructed humeral cartilage','cartilage'],
  ['Labrum','labrum','Labrum','labrum'],
  ['CLAVICLE','clavicle','Clavicle','bone'],
  ['Humerus','humerus-source','Humerus (source extent unvalidated)','bone'],
  ['SCAPULA','scapula','Scapula','bone'],
];
const sha=b=>createHash('sha256').update(b).digest('hex');
const pad4=n=>(n+3)&~3;
function parseObj(bytes,expected){
  const vertices=[],indices=[];let object=0;
  for(const line of bytes.toString('utf8').trimEnd().split(/\r?\n/)){
    if(line.startsWith('#'))continue;
    const row=line.split(/\s+/);
    if(row[0]==='o'){assert.equal(row[1],expected);object++;}
    else if(row[0]==='v'){
      assert.equal(row.length,4);const v=row.slice(1).map(Number);
      assert(v.every(Number.isFinite));vertices.push(v);
    }else if(row[0]==='f'){
      assert.equal(row.length,4);
      for(const token of row.slice(1)){
        const n=Number(token)-1;assert(Number.isSafeInteger(n)&&n>=0);indices.push(n);
      }
    }else assert.fail(`Unexpected OBJ row ${row[0]}`);
  }
  assert.equal(object,1);assert.equal(indices.length%3,0);
  for(const n of indices)assert(n<vertices.length);
  return {vertices,indices};
}
function computeNormals(vertices,indices){
  const sums=new Float64Array(vertices.length*3);
  for(let i=0;i<indices.length;i+=3){
    const [a,b,c]=indices.slice(i,i+3),p=vertices[a],q=vertices[b],r=vertices[c];
    const ux=q[0]-p[0],uy=q[1]-p[1],uz=q[2]-p[2];
    const vx=r[0]-p[0],vy=r[1]-p[1],vz=r[2]-p[2];
    const n=[uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx];
    assert(Number.isFinite(Math.hypot(...n))&&Math.hypot(...n)>0,'Degenerate source triangle');
    for(const k of [a,b,c])for(let j=0;j<3;j++)sums[k*3+j]+=n[j];
  }
  const out=new Float32Array(sums.length);
  for(let i=0;i<vertices.length;i++){
    const length=Math.hypot(...sums.subarray(i*3,i*3+3));
    assert(Number.isFinite(length)&&length>1e-12,`Undefined area-weighted normal at vertex ${i}`);
    for(let j=0;j<3;j++)out[i*3+j]=Math.fround(sums[i*3+j]/length);
  }
  return out;
}
function glb(json,bin){
  const jb=Buffer.from(JSON.stringify(json));const jp=Buffer.alloc(pad4(jb.length),0x20);jb.copy(jp);
  const bp=Buffer.alloc(pad4(bin.length));bin.copy(bp);
  const out=Buffer.alloc(12+8+jp.length+8+bp.length);
  out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);
  out.writeUInt32LE(jp.length,12);out.writeUInt32LE(0x4e4f534a,16);jp.copy(out,20);
  const offset=20+jp.length;out.writeUInt32LE(bp.length,offset);out.writeUInt32LE(0x004e4942,offset+4);bp.copy(out,offset+8);
  return out;
}
export function build(){
  const mb=fs.readFileSync(path.join(QUARANTINE,'MANIFEST.json'));
  assert.equal(sha(mb),MANIFEST_SHA,'Pinned quarantine manifest');
  const manifest=JSON.parse(mb),source=fs.readFileSync(SOURCE);
  assert.equal(sha(source),SOURCE_SHA,'Pinned source input');
  const files=new Map();
  for(const e of manifest.exports)for(const f of e.files){
    assert.equal(path.basename(f.path),f.path);files.set(f.path,fs.readFileSync(path.join(QUARANTINE,f.path)));
  }
  const readback=verifyReadback(source,manifest,files);
  assert.equal(readback.parts.length,7);
  const held=readback.parts.find(x=>x.part==='Gcart');
  assert.equal(held.nonmanifoldEdges,2);assert.equal(held.nonmanifoldVertices,3);
  assert.deepEqual(held.nonmanifoldVertexDetails.map(x=>x.sourceNodeId).sort((a,b)=>a-b),[2798,4501,37871]);
  for(const p of readback.parts)if(p.part!=='Gcart')assert.equal(p.closedOrientedVertexManifold,true,`${p.part} topology hold`);
  const boundsMin=[Infinity,Infinity,Infinity],boundsMax=[-Infinity,-Infinity,-Infinity];
  for(const e of manifest.exports)for(let j=0;j<3;j++){
    boundsMin[j]=Math.min(boundsMin[j],e.bounds.min[j]);boundsMax[j]=Math.max(boundsMax[j],e.bounds.max[j]);
  }
  const center=boundsMin.map((v,j)=>(v+boundsMax[j])/2);
  const extent=Math.max(...boundsMax.map((v,j)=>v-boundsMin[j]));
  assert(Number.isFinite(extent)&&extent>0);const scale=8/extent;
  const matrix=[scale,0,0,0,0,scale,0,0,0,0,scale,0,-scale*center[0],-scale*center[1],-scale*center[2],1];
  const structures=[],chunks=[],bufferViews=[],accessors=[],meshes=[],nodes=[];let byteLength=0,maxReverseCoordinateError=0;
  const append=(array,target)=>{
    const bytes=Buffer.from(array.buffer,array.byteOffset,array.byteLength),offset=byteLength;
    chunks.push(bytes);byteLength+=bytes.length;
    if(byteLength%4){const padding=Buffer.alloc(4-byteLength%4);chunks.push(padding);byteLength+=padding.length;}
    const i=bufferViews.push({buffer:0,byteOffset:offset,byteLength:bytes.length,target})-1;return i;
  };
  for(const [sourcePart,slug,name,tissue] of parts){
    const e=manifest.exports.find(x=>x.part===sourcePart);assert(e);
    const {vertices,indices}=parseObj(files.get(sourcePart+'.obj'),sourcePart);
    const map=JSON.parse(files.get(sourcePart+'.source-map.json'));
    assert.equal(map.sourceNodeIds.length,vertices.length);
    const position=new Float32Array(vertices.length*3),localMin=[Infinity,Infinity,Infinity],localMax=[-Infinity,-Infinity,-Infinity];
    for(let i=0;i<vertices.length;i++)for(let j=0;j<3;j++){
      const exact=(vertices[i][j]-center[j])*scale,v=Math.fround(exact);
      assert(Number.isFinite(v));position[i*3+j]=v;
      localMin[j]=Math.min(localMin[j],v);localMax[j]=Math.max(localMax[j],v);
      maxReverseCoordinateError=Math.max(maxReverseCoordinateError,Math.abs(v/scale+center[j]-vertices[i][j]));
    }
    const normals=computeNormals(vertices,indices);
    const indexArray=new Uint32Array(indices);
    const pb=append(position,34962),nb=append(normals,34962),ib=append(indexArray,34963);
    const pa=accessors.push({bufferView:pb,componentType:5126,count:vertices.length,type:'VEC3',min:localMin,max:localMax})-1;
    const na=accessors.push({bufferView:nb,componentType:5126,count:vertices.length,type:'VEC3'})-1;
    const ia=accessors.push({bufferView:ib,componentType:5125,count:indices.length,type:'SCALAR'})-1;
    const nodeName='fda_'+sourcePart;
    const mi=meshes.push({name:nodeName,primitives:[{attributes:{POSITION:pa,NORMAL:na},indices:ia,mode:4}]})-1;
    nodes.push({name:nodeName,mesh:mi});
    structures.push({id:'vm:reference:fda-shoulder-fc9f3e56:'+slug,slug,sourcePart,sourceInstance:e.instance,name,tissue,provenance:e.provenance,nodeName,fmaId:null,laterality:null,coverage:'source-part-only',bounds:{min:localMin,max:localMax},center:localMin.map((v,j)=>(v+localMax[j])/2),vertices:vertices.length,triangles:indices.length/3,sourceObjSha256:e.files[0].sha256,sourceMapSha256:e.files[1].sha256,validation:{anatomicalReview:false,clinicalApproval:false,orientationVerified:false,unitCalibration:false,registeredToBodyParts3D:false,imagingRegistration:null}});
  }
  const bin=Buffer.concat(chunks),metadata={schema:'vm-fda-shoulder-reference/1',specimenId:'fda-shoulder-fc9f3e56',status:'draft-independent-reference',measurementEnabled:false,anatomicalPresetsEnabled:false,anatomicalAxesVerified:false,unitCalibration:false,registeredToBodyParts3D:false,imagingRegistration:null,clinicalApproval:false};
  const doc={asset:{version:'2.0',generator:'Visible Medicine deterministic FDA shoulder draft exporter',extras:metadata},scene:0,scenes:[{nodes:nodes.map((_,i)=>i)}],nodes,meshes,buffers:[{byteLength:bin.length}],bufferViews,accessors};
  const asset=glb(doc,bin);
  const catalog={schema:'vm-fda-shoulder-reference/1',specimenId:'fda-shoulder-fc9f3e56',status:'draft-independent-reference',source:{repository:manifest.source.repository,commit:manifest.source.commit,file:manifest.source.file,sha256:SOURCE_SHA,license:'CC0-1.0',licenseSha256:'a2010f343487d3f7618affe54f789f5487602331c0a8d03f49e9a7c547cf0499',credit:'OSEL-DAM / U.S. Food and Drug Administration shoulder finite element model',publicationURL:'https://pubmed.ncbi.nlm.nih.gov/35882682/',publisherReportedSide:'right',anatomicalSideIndependentlyVerified:false},display:{kind:'unitless-normalized-source-assembly',sourceCenter:center,uniformScale:scale,sourceToDisplayColumnMajor:matrix,unitsPerMillimetre:null,anatomicalAxesVerified:false,normalizedLongestExtent:8},structures,held:[{sourcePart:'Gcart',name:'Constructed glenoid cartilage',reason:'Source topology hold: two nonmanifold edges and three vertices',sourceNodeIds:[2798,4501,37871]}],bundle:{id:'fda-shoulder-draft',url:'/models/fda-shoulder-draft/reference.glb',bytes:asset.length,sha256:sha(asset),structures:6},measurementEnabled:false,anatomicalPresetsEnabled:false,registeredToBodyParts3D:false,imagingRegistration:null,clinicalApproval:false};
  return {asset,catalog,catalogBytes:Buffer.from(JSON.stringify(catalog,null,2)+'\n'),maxReverseCoordinateError};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  assert(process.argv.length===2||(process.argv.length===3&&process.argv[2]==='--check'),'Usage: node scripts/export-fda-shoulder-reference.mjs [--check]');
  const {asset,catalog,catalogBytes,maxReverseCoordinateError}=build();
  if(process.argv[2]==='--check'){
    assert.deepEqual(fs.readFileSync(path.join(OUT,'reference.glb')),asset,'GLB reproducibility');
    assert.deepEqual(fs.readFileSync(path.join(OUT,'catalog.json')),catalogBytes,'Catalogue reproducibility');
  }else{
    fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,'reference.glb'),asset);fs.writeFileSync(path.join(OUT,'catalog.json'),catalogBytes);
  }
  console.log(JSON.stringify({status:process.argv[2]==='--check'?'reproduced':'exported',glbBytes:asset.length,glbSha256:catalog.bundle.sha256,catalogSha256:sha(catalogBytes),maxReverseCoordinateError,structures:catalog.structures.map(s=>[s.sourcePart,s.vertices,s.triangles])}));
}
