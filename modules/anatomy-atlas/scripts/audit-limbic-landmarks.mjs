import assert from 'node:assert/strict';
import { readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { Box3,Matrix4,Vector3 } from 'three';
import { build } from './workspace-test-build.mjs';
import { loadCurrentSourceHolds,composeSourceHoldPolicy } from './current-source-holds.mjs';
import { loadSourceHolds } from './load-source-holds.mjs';
import { sourceObjShape,mergeSourceShapes,sourceBoundsNear,sourceTriangleSet } from './source-surface-audit.mjs';
import { geometryFingerprint } from './anatomy-inventory.mjs';
import { sourceTopology } from './source-topology.mjs';
import { spatialDistanceIndex,uniqueSourceVertices,distanceSummary } from './source-spatial-math.mjs';
import { limbicLandmarkSources } from './limbic-landmark-sources.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const current=await loadCurrentSourceHolds(), archived=await loadSourceHolds(), ownReport='docs/limbic-landmark-source-audit.json';
const policy=composeSourceHoldPolicy(archived.policy,current.records,current.supplemental.filter(h=>h.evidence!==ownReport));
const supplementalEvidence=current.supplementalEvidence.filter(e=>e.path!==ownReport);
const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog.ts'; export {nestedStudyTargets} from './lib/nested-anatomy.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const root=api.bodyDisplayCatalog(current.catalog), owners=[...root.structures.filter(s=>s.bundle!=='limbic-landmarks'),...api.nestedStudyTargets(root).map(t=>t.structure).filter(s=>s.bundle!=='limbic-landmarks')];
const cache=new Map();
async function original(tree,file,sha) {
  const key=tree+'/'+file, bytes=await readFile(`../work/bodyparts3d/${key}.obj`);
  assert.equal(hash(bytes),sha);
  if(!cache.has(key))cache.set(key,sourceObjShape(bytes));
  return cache.get(key);
}
const groups=[],shapes=new Map();
for(const candidate of limbicLandmarkSources) {
  const definition=current.records.find(r=>r.tree==='isa'&&r.id===candidate.id);
  assert.equal(definition.name,candidate.name);assert.deepEqual(definition.files,candidate.files.map(f=>f.file));policy.assertNoKnownHolds([definition]);
  const parts=[],files=[];
  for(const pin of candidate.files) {
    const bytes=await readFile(`../work/bodyparts3d/isa/${pin.file}.obj`);assert.equal(hash(bytes),pin.sha256);
    assert.equal(bytes.length,current.inventory.assets.find(a=>a.tree==='isa'&&a.file===pin.file).bytes);
    const shape=await original('isa',pin.file,pin.sha256),fingerprint=geometryFingerprint(bytes);
    const exactInventoryMatches=current.inventory.assets.filter(a=>a.geometrySha256===fingerprint&&a.representedBy.length);
    assert.equal(exactInventoryMatches.length,0);
    parts.push(shape);files.push({...pin,bytes:bytes.length,geometrySha256:fingerprint,topology:sourceTopology(shape),bounds:{min:shape.min,max:shape.max},exactInventoryMatches});
  }
  const shape=mergeSourceShapes(parts),topology=sourceTopology(shape);shapes.set(candidate.id,shape);
  if(candidate.status==='candidate'){
    assert(files.every(f=>f.topology.closedOrientedManifold&&f.topology.duplicateFaces===0&&f.topology.collapsedFaces===0));
    assert.equal(topology.duplicateFaces,0);assert.equal(topology.collapsedFaces,0);
    if(candidate.id==='FMA61975'){
      // Complete original halves touch at one source-coordinate vertex. Keep
      // per-file indices/normals separate; do not invent a connected sheet.
      assert.equal(topology.components.length,2);assert.equal(topology.nonManifoldVertices,1);
      assert.equal(topology.nonManifoldEdges,0);assert.equal(topology.boundaryEdges,0);
    }else assert(topology.closedOrientedManifold);
  }
  else assert(files.some(f=>!f.topology.closedOrientedManifold&&f.topology.duplicateFaces>0));
  const directOwners=owners.filter(s=>s.sourceTree==='isa'&&s.sources.some(f=>candidate.files.some(p=>p.file===f.file))).map(s=>s.id);assert.equal(directOwners.length,0);
  groups.push({...candidate,definition,files:candidate.files,fileDiagnostics:files,topology,sourceBounds:{min:shape.min,max:shape.max},
    coordinateSigns:{negative:shape.vertices.filter(p=>p[0]<0).length,positive:shape.vertices.filter(p=>p[0]>0).length},directOwners,holdScreen:policy.inspect(definition)});
}
const inverse=new Matrix4().fromArray(root.coordinateSystem.sourceToSceneColumnMajor).invert(),screened=[],comparisons=[];
const samples=shape=>{const points=uniqueSourceVertices(shape),stride=Math.max(1,Math.ceil(points.length/128));return points.filter((_,i)=>i%stride===0);};
const indexes=new Map([...shapes].map(([id,s])=>[id,spatialDistanceIndex(s)]));
for(const owner of owners) {
  const box=new Box3(new Vector3(...owner.bounds.min),new Vector3(...owner.bounds.max)).applyMatrix4(inverse);
  const near=groups.filter(g=>sourceBoundsNear(shapes.get(g.id),{min:box.min.toArray(),max:box.max.toArray()},1.01));
  screened.push({id:owner.id,recordSha256:hash(JSON.stringify(owner)),candidateIds:near.map(g=>g.id)});
  if(!near.length)continue;
  const shape=mergeSourceShapes(await Promise.all(owner.sources.map(f=>original(owner.sourceTree,f.file,f.sha256)))),triangles=sourceTriangleSet(shape),index=spatialDistanceIndex(shape);
  for(const g of near)comparisons.push({candidate:g.id,reference:owner.id,referenceFma:owner.fmaId,exactSharedTriangles:[...sourceTriangleSet(shapes.get(g.id))].filter(t=>triangles.has(t)).length,
    toReference:distanceSummary(samples(shapes.get(g.id)),index),fromReference:distanceSummary(samples(shape),indexes.get(g.id))});
}
const pairs=[];
for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++){
  const a=shapes.get(groups[i].id),b=shapes.get(groups[j].id),triangles=sourceTriangleSet(b);
  pairs.push({a:groups[i].id,b:groups[j].id,exactSharedTriangles:[...sourceTriangleSet(a)].filter(t=>triangles.has(t)).length,toB:distanceSummary(samples(a),indexes.get(groups[j].id)),toA:distanceSummary(samples(b),indexes.get(groups[i].id))});
}
const findings=[...comparisons,...pairs].filter(c=>c.exactSharedTriangles);
const admitted=new Set(groups.filter(g=>g.status==='candidate').map(g=>g.id));
assert(!findings.some(f=>admitted.has(f.candidate)||admitted.has(f.a)||admitted.has(f.b)),'Admitted source shares actual triangles');
const report={schemaVersion:1,sourceCommit:'59341397183a650f45ae9c4557ab9814aa3dd399',evidence:current.evidence,supplementalEvidence,
 license:root.license,credit:root.credit,coordinateSystem:root.coordinateSystem,
 sourceArchive:'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip',licenseUrl:'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
 groups,screened,comparisons,pairs,findings,geometryModified:false,clinicalApproval:false,
 limitations:['All five complete source definitions checked; the stria terminalis compound remains held, including subsets/aliases.',
 'The source origin is not a validated individual midsagittal plane. The left stria medullaris slightly crosses zero-X; source names/positions are retained for review, not automatically repaired or inferred from coordinate sign.',
 'Manifold topology and bounded surface distances are not clinical validation, tractography or proof against self-intersections. Septum and lamina are compound surfaces, not nuclei or complete physiological circuits.',
 'Lamina terminalis source halves touch at one coordinate vertex: the complete compound is not a manifold sheet. Preserve the two files and their individual normals; no joining or repair is authorised.',
 'No fitting, mirroring, smoothing, invented fibre, bridged component or face deletion. Original archive directory, CRC and sizes verified.']};
const output=JSON.stringify(report,null,2)+'\n',path=ownReport;
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replace(/\r\n/g,'\n'),output);
else {const replace=process.argv.includes('--replace-untracked');if(replace)assert.equal(execFileSync('git',['ls-files','--',path],{encoding:'utf8'}).trim(),'');await writeFile(path,output,{flag:replace?'w':'wx'});}
console.log(JSON.stringify({groups:groups.map(g=>({id:g.id,status:g.status,triangles:g.topology.triangles,components:g.topology.components.length,sourceBounds:g.sourceBounds,signs:g.coordinateSigns})),owners:owners.length,comparisons:comparisons.length,pairs:pairs.length,findings,auditSha256:hash(output),clinicalApproval:false}));
