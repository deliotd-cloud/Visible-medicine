// Independent readback of quarantined, source-node-sampled FDA shoulder surfaces.
// Abaqus *INSTANCE: translation precedes rotation about the global a->b axis.
// https://docs.software.vt.edu/abaqusv2025/English/SIMACAEKEYRefMap/simakey-r-instance.htm
// C3D10M connectivity and tetrahedron face numbering:
// https://docs.software.vt.edu/abaqusv2025/English/SIMACAEELMRefMap/simaelm-r-3delem.htm
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {readPinnedShoulder} from './inspect-abaqus-shoulder-source.mjs';

const names=['AC_Lig','CLAVICLE','Gcart','Hcart','Humerus','Labrum','SCAPULA'];
const hash=b=>createHash('sha256').update(b).digest('hex');
const key=a=>[...a].sort((x,y)=>x-y).join(':');
const minus=(a,b)=>a.map((v,i)=>v-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const near=(a,b)=>Math.abs(a-b)<=2e-11*Math.max(1,Math.abs(a),Math.abs(b));
const provenance=n=>['Gcart','Hcart'].includes(n)?'publisher-reported-offset-constructed':'publisher-reported-CT-segmentation';

function placed(p,rows){
  if(!rows.length)return p;
  const q=p.map((x,i)=>x+rows[0][i]);
  if(rows.length===1)return q;
  const [ax,ay,az,bx,by,bz,angle]=rows[1],a=[ax,ay,az],axis=[bx-ax,by-ay,bz-az];
  const length=Math.hypot(...axis);assert(length>0,'Zero rotation axis');
  const u=axis.map(x=>x/length),v=minus(q,a),theta=angle*Math.PI/180;
  const c=Math.cos(theta),s=Math.sin(theta),w=cross(u,v),projection=dot(u,v);
  return a.map((x,i)=>x+c*v[i]+s*w[i]+(1-c)*projection*u[i]);
}

// Official face S1..S4: corners followed by midsides AB, BC, CA, then opposite corner.
const faces=[[0,1,2,4,5,6,3],[0,3,1,7,8,4,2],[1,3,2,8,9,5,0],[2,3,0,9,7,6,1]];
function expectedBoundary(part){
  const counts=new Map();
  for(const [element,ten] of part.elements){
    assert.equal(ten.length,10);assert.equal(new Set(ten).size,10);
    for(const n of ten)assert(part.nodes.has(n),'Unknown element node');
    for(let i=0;i<4;i++){
      const id=faces[i].map(j=>ten[j]),k=key(id.slice(0,3)),old=counts.get(k);
      if(old){assert.equal(old.count,1,'Three tetrahedra share one corner face');
        assert.equal(key(old.id.slice(3,6)),key(id.slice(3,6)),'Shared midside mismatch');old.count++;
      }else counts.set(k,{count:1,element,face:i+1,id});
    }
  }
  const boundary=[],triangles=[],used=new Set();let internal=0;
  for(const f of counts.values()){
    if(f.count===2){internal++;continue;}
    let [a,b,c,ab,bc,ca,op]=f.id;
    const pa=part.nodes.get(a),normal=cross(minus(part.nodes.get(b),pa),minus(part.nodes.get(c),pa));
    assert.notEqual(dot(normal,minus(part.nodes.get(op),pa)),0,'Flat corner tetrahedron');
    if(dot(normal,minus(part.nodes.get(op),pa))>0)[b,c,ab,ca]=[c,b,ca,ab];
    const id=[a,b,c,ab,bc,ca];boundary.push({element:f.element,face:f.face,nodeIds:id});
    for(const tri of [[a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]]){
      assert(Math.hypot(...cross(minus(part.nodes.get(tri[1]),part.nodes.get(tri[0])),minus(part.nodes.get(tri[2]),part.nodes.get(tri[0]))))>0,'Zero-area face sample');
      triangles.push(tri);tri.forEach(n=>used.add(n));
    }
  }
  return {boundary,triangles,ids:[...used].sort((a,b)=>a-b),internal};
}

function obj(text,name){
  const vertices=[],triangles=[];let object=0;
  for(const line of text.trimEnd().split(/\r?\n/)){
    if(line.startsWith('#'))continue;
    const t=line.split(/\s+/);
    if(t[0]==='o'){assert.equal(t.length,2);assert.equal(t[1],name);object++;}
    else if(t[0]==='v'){
      assert.equal(t.length,4,'OBJ vertex arity');const p=t.slice(1).map(Number);
      assert(p.every(Number.isFinite),'Nonfinite OBJ vertex');vertices.push(p);
    }else if(t[0]==='f'){
      assert.equal(t.length,4,'OBJ triangle arity');
      const tri=t.slice(1).map(Number);assert(tri.every(n=>Number.isSafeInteger(n)&&n>0),'Invalid OBJ index');
      assert.equal(new Set(tri).size,3,'Repeated triangle vertex');triangles.push(tri);
    }else assert.fail('Unexpected OBJ record '+t[0]);
  }
  assert.equal(object,1,'Exact OBJ object count');
  for(const tri of triangles)for(const n of tri)assert(n<=vertices.length,'OBJ face index out of bounds');
  return {vertices,triangles};
}

function topology(vertexCount,triangles){
  const edges=new Map(),links=Array.from({length:vertexCount},()=>new Map()),parent=Array.from({length:vertexCount},(_,i)=>i);
  const root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
  const unite=(a,b)=>{parent[root(a)]=root(b);};
  for(const [a,b,c] of triangles){
    for(const [u,v,w] of [[a,b,c],[b,c,a],[c,a,b]]){
      const k=key([u,v]),e=edges.get(k)||{count:0,direction:0};e.count++;e.direction+=u<v?1:-1;edges.set(k,e);unite(u,v);
      const link=links[w];(link.get(u)||link.set(u,new Set()).get(u)).add(v);
      (link.get(v)||link.set(v,new Set()).get(v)).add(u);
    }
  }
  const bad=[];let isolated=0;
  for(let i=0;i<links.length;i++){
    const link=links[i];if(!link.size){isolated++;continue;}
    const seen=new Set();let components=0;
    for(const n of link.keys())if(!seen.has(n)){
      components++;const pending=[n];while(pending.length){const x=pending.pop();if(seen.has(x))continue;seen.add(x);pending.push(...link.get(x));}
    }
    const degrees=[...link.values()].map(s=>s.size);
    if(components!==1||degrees.some(n=>n!==2))bad.push({index:i,linkComponents:components,linkVertices:link.size,linkDegreeHistogram:Object.fromEntries([...new Set(degrees)].map(n=>[n,degrees.filter(v=>v===n).length]))});
  }
  return {edges:edges.size,components:new Set(parent.map((_,i)=>root(i))).size,boundaryEdges:[...edges.values()].filter(e=>e.count===1).length,
    nonmanifoldEdges:[...edges.values()].filter(e=>e.count>2).length,inconsistentWindingEdges:[...edges.values()].filter(e=>e.count===2&&e.direction!==0).length,
    nonmanifoldVertices:bad.length,isolatedVertices:isolated,bad};
}

export function verifyReadback(sourceBytes,manifest,files){
  const {parts,manifest:original}=readPinnedShoulder(sourceBytes);
  assert.equal(manifest.schema,'visible-medicine-fda-shoulder-surface-quarantine/1');
  assert.deepEqual(manifest.source,original.source,'Pinned source identity');
  assert.equal(manifest.status,'converted-independent-reference-quarantined-not-admitted');
  assert.equal(manifest.sampling,'Four linear triangles per quadratic boundary face, preserving source corner/midside positions');
  for(const field of ['coordinateScaleChanged','geometrySmoothed','geometryWelded','geometryDecimated','selfIntersectionsChecked','unitsVerified','lateralityVerified','clinicalApproval','registeredToBodyParts3D','patientSpaceRegistration','learnerAssetsAdmitted','installed','previewChanged'])assert.equal(manifest[field],false,field);
  assert.equal(manifest.assemblyTransformsApplied,true);
  assert.deepEqual(manifest.sourceConnectorElementsNotExported,{CONN3D2:19});
  assert.deepEqual(manifest.loadAxisTransformsNotAppliedToMesh,original.unsupportedAssemblyTransforms);
  assert.deepEqual([...manifest.exports.map(e=>e.part)].sort(),names);
  assert.equal(new Set(manifest.exports.map(e=>e.part)).size,7);
  const report=[];
  for(const entry of manifest.exports){
    const part=parts.get(entry.part),instance=original.instances.find(i=>i.part===entry.part);
    assert(part&&instance,'Unknown source part/instance');
    assert.equal(entry.id,`fda-shoulder:${original.source.commit}:${entry.part}`);
    assert.equal(entry.instance,instance.name);assert.deepEqual(entry.transformRows,instance.transformRows);
    assert.equal(entry.provenance,provenance(entry.part));
    assert.equal(entry.units,null);assert.equal(entry.laterality,null);
    assert.match(entry.sourceFrame,/units and anatomical axes not yet independently established/);
    for(const f of ['clinicalApproval','registeredToBodyParts3D','patientSpaceRegistration'])assert.equal(entry[f],false,f);
    assert.equal(entry.rawAudit.construction,'Four linear triangles per six-node boundary face; existing corner/midside coordinates only');
    for(const f of ['smoothing','decimation','coordinateWelding','exactContinuousQuadraticSurface','selfIntersectionsChecked','anatomicalReview','registeredToBodyParts3D','patientSpaceRegistration'])assert.equal(entry.rawAudit[f],false,f);
    const wanted=[entry.part+'.obj',entry.part+'.source-map.json'];
    assert.deepEqual(entry.files.map(f=>f.path),wanted,'Exact export pair');
    for(const file of entry.files){const b=files.get(file.path);assert(Buffer.isBuffer(b),'Missing export '+file.path);
      assert.equal(b.length,file.bytes,'Export byte count '+file.path);assert.equal(hash(b),file.sha256,'Export SHA256 '+file.path);}
    const map=JSON.parse(files.get(wanted[1]).toString('utf8')),{boundary,triangles,ids,internal}=expectedBoundary(part);
    assert.deepEqual(Object.keys(map).sort(),['sourceFaces','sourceNodeIds']);
    assert.deepEqual(map.sourceNodeIds,ids,'Complete unique source-node IDs');
    assert.deepEqual(map.sourceFaces,boundary,'Complete oriented source-face membership');
    const mesh=obj(files.get(wanted[0]).toString('utf8'),entry.part);
    assert.equal(mesh.vertices.length,ids.length);assert.equal(mesh.triangles.length,triangles.length);
    const toIndex=new Map(ids.map((id,i)=>[id,i+1]));
    let maxCoordinateDiscrepancy=0;
    for(let i=0;i<ids.length;i++){
      const p=placed(part.nodes.get(ids[i]),instance.transformRows);
      for(let j=0;j<3;j++){
        const actual=mesh.vertices[i][j],discrepancy=Math.abs(actual-p[j]);
        maxCoordinateDiscrepancy=Math.max(maxCoordinateDiscrepancy,discrepancy);
        if(instance.transformRows.length===0)assert.equal(actual,p[j],`${entry.part} source node ${ids[i]} exact coordinate ${j}`);
        else assert(near(actual,p[j]),`${entry.part} source node ${ids[i]} rotated coordinate ${j}`);
      }
    }
    for(let i=0;i<triangles.length;i++)assert.deepEqual(mesh.triangles[i],triangles[i].map(id=>toIndex.get(id)),`${entry.part} triangle ${i}`);
    assert.equal(entry.rawAudit.sourceNodes,part.nodes.size);assert.equal(entry.rawAudit.sourceElements,part.elements.size);
    assert.equal(entry.rawAudit.boundaryQuadraticFaces,boundary.length);assert.equal(entry.rawAudit.internalQuadraticFaces,internal);
    const audit=topology(ids.length,mesh.triangles.map(t=>t.map(n=>n-1)));
    for(const field of ['vertices','triangles'])for(const record of [entry.rawAudit,entry.assembledAudit])assert.equal(record[field],field==='vertices'?ids.length:triangles.length,`${entry.part} ${field} cardinality`);
    for(const field of ['edges','components','boundaryEdges','nonmanifoldEdges','inconsistentWindingEdges','nonmanifoldVertices','isolatedVertices']){
      assert.equal(entry.assembledAudit[field],audit[field],`${entry.part} assembled ${field}`);
      assert.equal(entry.rawAudit[field],audit[field],`${entry.part} raw ${field}`);
    }
    const closed=audit.boundaryEdges===0&&audit.nonmanifoldEdges===0&&audit.inconsistentWindingEdges===0&&audit.nonmanifoldVertices===0&&audit.isolatedVertices===0;
    assert.equal(entry.rawAudit.closedOrientedVertexManifold,closed,`${entry.part} raw manifold claim`);
    assert.equal(entry.assembledAudit.closedOrientedVertexManifold,closed,`${entry.part} assembled manifold claim`);
    const min=[0,1,2].map(j=>Math.min(...mesh.vertices.map(p=>p[j]))),max=[0,1,2].map(j=>Math.max(...mesh.vertices.map(p=>p[j])));
    for(let j=0;j<3;j++){assert(near(entry.bounds.min[j],min[j]));assert(near(entry.bounds.max[j],max[j]));}
    report.push({part:entry.part,vertices:ids.length,triangles:triangles.length,boundaryFaces:boundary.length,internalFaces:internal,
      maxCoordinateDiscrepancy,closedOrientedVertexManifold:closed,
      ...Object.fromEntries(['edges','components','boundaryEdges','nonmanifoldEdges','inconsistentWindingEdges','nonmanifoldVertices','isolatedVertices'].map(k=>[k,audit[k]])),
      nonmanifoldVertexDetails:audit.bad.map(v=>({...v,sourceNodeId:ids[v.index],sourceCoordinate:part.nodes.get(ids[v.index])}))});
  }
  assert.deepEqual([...files.keys()].sort(),manifest.exports.flatMap(e=>e.files.map(f=>f.path)).sort(),'No extra exported files');
  return {sourceSha256:original.source.sha256,manifestSha256:hash(Buffer.from(JSON.stringify(manifest))),parts:report,status:'readback-passed-quarantined-not-admitted'};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  assert.equal(process.argv.length,4,'Usage: node scripts/check-fda-shoulder-surface-readback.mjs <pinned-Male-Shoulder.inp> <quarantine-directory>');
  const dir=path.resolve(process.argv[3]),manifestBytes=fs.readFileSync(path.join(dir,'MANIFEST.json'));
  const manifest=JSON.parse(manifestBytes),files=new Map();
  for(const entry of manifest.exports)for(const file of entry.files){assert.equal(path.basename(file.path),file.path,'Unsafe export path');files.set(file.path,fs.readFileSync(path.join(dir,file.path)));}
  const result=verifyReadback(fs.readFileSync(process.argv[2]),manifest,files);
  result.manifestSha256=hash(manifestBytes);console.log(JSON.stringify(result,null,2));
}
