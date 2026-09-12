import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { readGlb } from './glb-lossless-codec.mjs';
import { hraSource, hraDigest, hraSubset, hraWriteGlb, hraAccessor } from './hra-pelvis-source.mjs';

const target = 'content/sources/hra-renal';
const directory = process.argv.find(a=>a.startsWith('--source='))?.slice(9)
  ?? 'D:/VisibleMedicine-Atlas-Recovery/source-candidates/hra-united-female-v1.10';
const audit = JSON.parse(await readFile('docs/hra-renal-source-audit.json'));
assert.equal(audit.sourceSha256, hraSource.sha256);
assert.equal(audit.sourceBytes, hraSource.bytes);
assert.equal(audit.rows.length,85);
assert.equal(audit.admitted,false);
assert.equal(audit.clinicalApproval,false);
const identity = [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
for(const r of audit.rows) assert.deepEqual(r.worldMatrix,identity,'Do not discard source transforms');
const held = {
  VH_F_outer_cortex_of_kidney_L: 'Duplicate/collapsed faces, nonmanifold edges/vertices and inconsistent winding; retain both original components, no automatic repair.',
  VH_F_renal_column_R: 'Duplicate/collapsed faces, nonmanifold edges/vertices, inconsistent winding and four components; no fragment deletion or replacement.',
  VH_F_left_renal_vein: 'Nonmanifold vertex and four components, including two tiny fragments; no joining, pruning or assumed vessel continuity.',
};
if(process.argv.includes('--retain-source')) {
  assert(!process.argv.includes('--check'));
  const full = await readFile(directory+'/3d-vh-f-united.glb');
  assert.equal(full.length,hraSource.bytes);
  assert.equal(hraDigest(full),hraSource.sha256);
  const {json:g,bin}=readGlb(full);
  const parents=new Map();
  g.nodes.forEach((n,i)=>(n.children??[]).forEach(c=>{
    assert(!parents.has(c)); parents.set(c,i);
  }));
  for(const r of audit.rows) {
    assert.equal(g.nodes[r.nodeIndex].name,r.nodeName);
    let i=r.nodeIndex;
    const seen=new Set();
    while(i!==undefined) {
      assert(!seen.has(i)); seen.add(i);
      const n=g.nodes[i];
      assert(!n.matrix&&!n.translation&&!n.rotation&&!n.scale);
      i=parents.get(i);
    }
  }
  const subset=hraSubset(g,bin,audit.rows.map(r=>r.nodeIndex));
  await mkdir(target,{recursive:true});
  await writeFile(target+'/renal-source.glb',hraWriteGlb(subset.json,subset.bin),{flag:'wx'});
  for(const [file,pin] of [['metadata.json',hraSource.metadataSha256],['crosswalk.csv',hraSource.crosswalkSha256]]) {
    const b=await readFile(directory+'/'+file); assert.equal(hraDigest(b),pin);
    await writeFile(target+'/'+file,b,{flag:'wx'});
  }
}
const bytes=await readFile(target+'/renal-source.glb');
const {json:g,bin}=readGlb(bytes);
assert.equal(g.nodes.length,85);
assert(!g.textures?.length&&!g.images?.length&&!g.animations?.length&&!g.skins?.length);
let values=0;
for(const [i,row] of audit.rows.entries()) {
  const n=g.nodes[i]; assert.equal(n.name,row.nodeName);
  assert.equal(n.extras.originalNodeIndex,row.nodeIndex);
  const mesh=g.meshes[n.mesh]; assert.equal(mesh.primitives.length,1);
  const p=mesh.primitives[0];
  assert.equal(p.mode??4,4);
  assert.deepEqual(Object.keys(p.attributes).sort(),Object.keys(row.attributeAccessorSha256).sort());
  for(const [key,index] of Object.entries(p.attributes)) {
    const array=hraAccessor(g,bin,index);
    assert.equal(hraDigest(JSON.stringify(array)),row.attributeAccessorSha256[key],key+' changed');
    values+=array.reduce((n,r)=>n+r.length,0);
  }
  const indices=hraAccessor(g,bin,p.indices);
  assert.equal(indices.length,row.triangles*3);
  assert.equal(hraDigest(JSON.stringify(indices)),row.indexAccessorSha256);
  values+=indices.length;
}
for(const [file,pin] of [['metadata.json',hraSource.metadataSha256],['crosswalk.csv',hraSource.crosswalkSha256]])
  assert.equal(hraDigest(await readFile(target+'/'+file)),pin);
const metadata=JSON.parse(await readFile(target+'/metadata.json'));
assert.equal(metadata.license,hraSource.licenseUrl);
assert.match(metadata.was_derived_from.license,/CC BY 4.0/);
assert(metadata.was_derived_from.distributions.some(d=>d.downloadUrl===hraSource.url));
const crosswalk=String(await readFile(target+'/crosswalk.csv'));
for(const row of audit.rows) {
  const matches=crosswalk.split(/\r?\n/).filter(line=>line.startsWith(row.nodeName+','));
  assert.equal(matches.length,1,'Missing/ambiguous source crosswalk row');
  assert.equal(matches[0].split(',')[1],row.metadata.ontologyid,'Embedded/crosswalk ontology mismatch');
}
const defective=audit.rows.filter(r=>['duplicateFaces','collapsedFaces','degenerateFaces','nonManifoldEdges','nonManifoldVertices','inconsistentWindingEdges'].some(k=>r.topology[k])).map(r=>r.nodeName).sort();
assert.deepEqual(defective,Object.keys(held).sort(),'Source condition changed; review holds rather than silently broadening admission');
const report={
  source: {...hraSource,key:'hra-united-female-v1.10-renal-audit'},
  retainedSourceSha256:hraDigest(bytes),retainedSourceBytes:bytes.length,
  auditSha256:hraDigest(await readFile('docs/hra-renal-source-audit.json')),
  originalNodes:audit.rows.map(r=>({index:r.nodeIndex,name:r.nodeName,triangles:r.triangles})),
  verifiedAccessorValues:values,
  originalTriangles:audit.rows.reduce((n,r)=>n+r.triangles,0),
  heldNodes:held,
  candidateSurfaces:audit.rows.filter(r=>!Object.hasOwn(held,r.nodeName)).length,
  published:false,admissionApproved:false,clinicalApproval:false,patientRegistration:false,
  limitation:'Source fidelity and metadata verification only; not complete kidney anatomy, continuous walls/lumens, clinical validation or a rendered product module.',
};
const text=JSON.stringify(report,null,2)+'\n',path=target+'/retention.json';
if(process.argv.includes('--check'))
  assert.equal((await readFile(path,'utf8')).replace(/\r\n/g,'\n'),text);
else await writeFile(path,text,{flag:'wx'});
console.log(JSON.stringify({retainedSurfaces:g.nodes.length,triangles:report.originalTriangles,verifiedAccessorValues:values,held:Object.keys(held).length,candidates:report.candidateSurfaces,bytes:bytes.length,sha256:report.retainedSourceSha256,published:false}));
