// Source assessment only. Does not admit geometry, repair meshes or grant approval.
import assert from 'node:assert/strict';
import {readFile, writeFile, statfs} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {archiveReader, cache} from './bodyparts-archive.mjs';
import {loadSourceHolds} from './load-source-holds.mjs';
import {geometryFingerprint} from './anatomy-inventory.mjs';

const inventory=await loadSourceHolds();
const destination='docs/skin-source-audit-20260926.json';
const check=process.argv.includes('--check');
const expected=check?JSON.parse(await readFile(destination,'utf8')):null;
const records=inventory.records.filter(r=>r.id==='FMA7163');
assert.equal(records.length,2);
for(const r of records){assert.equal(r.name,'skin');assert.deepEqual(r.files,['FJ2810']);}
assert(!inventory.catalog.structures.some(s=>s.fmaId==='FMA7163'));
if(!check){const disk=await statfs(cache);assert(disk.bavail*disk.bsize>80*1024*1024,'Need 80 MiB cache headroom');}
const archive=check?{source:expected.source,entries:new Map([['FJ2810.obj',expected.archiveEntry]])}:await archiveReader('isa');
const entry=archive.entries.get('FJ2810.obj');assert(entry);
assert(entry.unpacked<20*1024*1024&&entry.size<6*1024*1024,'Unexpected mesh size');
const bytes=check?await readFile(`${cache}/isa/FJ2810.obj`):await archive.get('FJ2810');
// Pinned original bytes, including offline checks. Acquisition also validates ZIP CRC32.
assert.equal(bytes.length,14465502);
assert.equal(createHash('sha256').update(bytes).digest('hex'),'682f402206f15592acdeaae8ffb6b34c3e5c3267fa4685e63d2e4920ef2a80e0');
const vertices=[],faces=[];
let normals=0,textureCoordinates=0;
for(const line of bytes.toString().split(/\r?\n/)){
  const [kind,...fields]=line.trim().split(/\s+/);
  if(!kind||kind.startsWith('#'))continue;
  if(kind==='v'){
    const v=fields.map(Number);assert.equal(v.length,3);assert(v.every(Number.isFinite));vertices.push(v);
  }else if(kind==='f'){
    assert.equal(fields.length,3,'Non-triangular source face; do not silently triangulate');
    const face=fields.map(s=>Number(s.split('/')[0]));
    assert(face.every(i=>Number.isInteger(i)&&i>0&&i<=vertices.length),'Unexpected face index');
    faces.push(face.map(i=>i-1));
  }else if(kind==='vn')normals++;
  else if(kind==='vt')textureCoordinates++;
  else assert(['g','o','s','mtllib','usemtl'].includes(kind),'Unsupported directive '+kind);
}
assert(vertices.length&&faces.length);
const parent=Uint32Array.from(vertices,(_,i)=>i),used=new Set(),edges=new Map();
const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
const unite=(a,b)=>{parent[find(a)]=find(b);};
let repeatedIndexFaces=0,zeroAreaFaces=0,areaMm2=0;
for(const f of faces){
  if(new Set(f).size!==3)repeatedIndexFaces++;
  f.forEach(i=>used.add(i));unite(f[0],f[1]);unite(f[1],f[2]);
  const [a,b,c]=f.map(i=>vertices[i]),u=b.map((v,i)=>v-a[i]),v=c.map((q,i)=>q-a[i]);
  const area=Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])/2;
  assert(Number.isFinite(area));areaMm2+=area;if(area===0)zeroAreaFaces++;
  for(const [a,b] of [[f[0],f[1]],[f[1],f[2]],[f[2],f[0]]]){
    const key=a<b?a+':'+b:b+':'+a;const e=edges.get(key)||{count:0,balance:0};
    e.count++;e.balance+=a<b?1:-1;edges.set(key,e);
  }
}
const components=new Map();for(const i of used){const r=find(i);components.set(r,(components.get(r)||0)+1);}
const sourceBounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
const sceneBounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
const matrix=inventory.catalog.coordinateSystem.sourceToSceneColumnMajor;
for(const p of vertices){
  const q=[0,1,2].map(i=>matrix[i]*p[0]+matrix[i+4]*p[1]+matrix[i+8]*p[2]+matrix[i+12]);
  for(let i=0;i<3;i++){
    sourceBounds.min[i]=Math.min(sourceBounds.min[i],p[i]);sourceBounds.max[i]=Math.max(sourceBounds.max[i],p[i]);
    sceneBounds.min[i]=Math.min(sceneBounds.min[i],q[i]);sceneBounds.max[i]=Math.max(sceneBounds.max[i],q[i]);
  }
}
const edgeRows=[...edges.values()];
const report={schemaVersion:1,fmaId:'FMA7163',name:'skin',tree:'isa',file:'FJ2810',
  source:archive.source,license:'CC-BY-4.0',rightsChecked:'2026-09-26',
  rightsUrl:'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html',
  credit:'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International',
  archiveEntry:entry,sha256:createHash('sha256').update(bytes).digest('hex'),geometryFingerprint:geometryFingerprint(bytes),
  vertices:vertices.length,faces:faces.length,normals,textureCoordinates,unusedVertices:vertices.length-used.size,
  indexedConnectedComponents:components.size,componentVertexCounts:[...components.values()].sort((a,b)=>b-a),
  repeatedIndexFaces,zeroAreaFaces,boundaryEdges:edgeRows.filter(e=>e.count===1).length,
  nonManifoldEdges:edgeRows.filter(e=>e.count>2).length,
  sameDirectionInteriorEdges:edgeRows.filter(e=>e.count===2&&e.balance!==0).length,
  areaMm2,sourceBounds,sceneBounds,coordinateSystem:inventory.catalog.coordinateSystem,
  admitted:false,clinicalApproval:false,meshModified:false,
  limitations:['Index topology only; coincident positions have not been welded.',
    'No self-intersection, enclosed-volume or regional tissue-boundary validation.',
    'No registration to patient imaging or independent confirmation of anatomical accuracy.',
    'Do not divide this whole source surface into named regional skin patches or infer dermal layers.']};
if(check)assert.deepEqual(report,expected,'Skin audit changed; do not overwrite evidence');
else await writeFile(destination,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(`Skin source audit ${check?'verified offline':'recorded'}: ${vertices.length} vertices; ${faces.length} faces; ${report.boundaryEdges} boundary edges. Not admitted.`);
export const skinMesh={vertices,faces};
