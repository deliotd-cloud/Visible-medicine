import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Box3, Matrix4, Vector3 } from 'three';
import { build } from './workspace-test-build.mjs';
import { loadCurrentSourceHolds } from './current-source-holds.mjs';
import { geometryFingerprint } from './anatomy-inventory.mjs';
import { sourceObjShape, mergeSourceShapes, sourceBoundsNear, sourceTriangleSet } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
import { spatialDistanceIndex, uniqueSourceVertices, distanceSummary } from './source-spatial-math.mjs';
import { shapeCandidate, compareTranslatedShape } from './vessel-shape-math.mjs';
import { inferiorEpigastricSources } from './inferior-epigastric-sources.mjs';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const { catalog: raw, inventory, records, policy, evidence, supplementalEvidence } = await loadCurrentSourceHolds();
const built = await build({ stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog.ts'",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm' });
const {bodyDisplayCatalog} = await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const display = bodyDisplayCatalog(raw);
// Replay excludes only this addition; any other source change must be reviewed.
const catalog = {...display, structures:display.structures.filter(s=>s.bundle!=='inferior-epigastric-vessels')};
async function original(tree,file,sha) {
  const bytes=await readFile(`../work/bodyparts3d/${tree}/${file}.obj`);
  assert.equal(hash(bytes),sha);
  return sourceObjShape(bytes);
}
const shapes=new Map(), groups=[];
for(const candidate of inferiorEpigastricSources) {
  const definition=records.find(r=>r.tree==='isa'&&r.id===candidate.id);
  assert.equal(definition.name,candidate.name); assert.deepEqual(definition.files,[candidate.file]);
  policy.assertNoKnownHolds([definition]);
  const bytes=await readFile(`../work/bodyparts3d/isa/${candidate.file}.obj`);
  assert.equal(hash(bytes),candidate.sha256);
  const shape=sourceObjShape(bytes), topology=sourceTopology(shape), fingerprint=geometryFingerprint(bytes);
  assert(topology.closedOrientedManifold); assert.equal(topology.components.length,1);
  assert.equal(topology.duplicateFaces,0); assert.equal(topology.collapsedFaces,0);
  assert(shape.vertices.every(p=>candidate.side==='right'?p[0]<0:p[0]>0));
  shapes.set(candidate.id,shape);
  groups.push({...candidate,tree:'isa',bytes:bytes.length,definition,geometrySha256:fingerprint,topology,
    directOwners:catalog.structures.filter(s=>s.sourceTree==='isa'&&s.sources.some(f=>f.file===candidate.file)).map(s=>s.id),
    exactInventoryMatches:inventory.assets.filter(a=>a.geometrySha256===fingerprint&&a.representedBy.length),
    holdScreen:policy.inspect(definition)});
}
const inverse=new Matrix4().fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor).invert();
const screened=[],comparisons=[];
const nearest=new Map([...shapes].map(([id,s])=>[id,spatialDistanceIndex(s)]));
const samples=shape=>{const vertices=uniqueSourceVertices(shape), stride=Math.max(1,Math.ceil(vertices.length/128));return vertices.filter((_,i)=>i%stride===0);};
for(const owner of catalog.structures) {
  const box=new Box3(new Vector3(...owner.bounds.min),new Vector3(...owner.bounds.max)).applyMatrix4(inverse);
  const bounds={min:box.min.toArray(),max:box.max.toArray(),extent:box.getSize(new Vector3()).toArray()};
  const candidates=groups.filter(g=>sourceBoundsNear(shapes.get(g.id),bounds,1.01)||(owner.system==='vessels'&&shapeCandidate(shapes.get(g.id),bounds)));
  screened.push({id:owner.id,recordSha256:hash(JSON.stringify(owner)),candidateIds:candidates.map(g=>g.id)});
  if(!candidates.length) continue;
  const reference=mergeSourceShapes(await Promise.all(owner.sources.map(f=>original(owner.sourceTree,f.file,f.sha256))));
  const referenceIndex=spatialDistanceIndex(reference), triangles=sourceTriangleSet(reference);
  for(const group of candidates) {
    const candidate=shapes.get(group.id);
    comparisons.push({candidate:group.id,reference:owner.id,referenceFma:owner.fmaId,referenceSources:owner.sources,
      exactSharedTriangles:[...sourceTriangleSet(candidate)].filter(t=>triangles.has(t)).length,
      candidateToReference:distanceSummary(samples(candidate),referenceIndex),
      referenceToCandidate:distanceSummary(samples(reference),nearest.get(group.id)),
      translatedDiagnostic:owner.system==='vessels'&&shapeCandidate(candidate,reference)?compareTranslatedShape(candidate,reference):null});
  }
}
const pairComparisons=[];
for(let i=0;i<groups.length;i++) for(let j=i+1;j<groups.length;j++) {
  const a=shapes.get(groups[i].id),b=shapes.get(groups[j].id),triangles=sourceTriangleSet(b);
  pairComparisons.push({a:groups[i].id,b:groups[j].id,exactSharedTriangles:[...sourceTriangleSet(a)].filter(t=>triangles.has(t)).length,
    translatedDiagnostic:shapeCandidate(a,b)?compareTranslatedShape(a,b):null});
}
assert(groups.every(g=>!g.directOwners.length&&!g.exactInventoryMatches.length));
assert([...comparisons,...pairComparisons].every(c=>!c.exactSharedTriangles&&!c.translatedDiagnostic?.similar));
const report={schemaVersion:1,sourceCommit:'28c9486ed698848aa0d7b32e97dcd214413aa359',evidence,supplementalEvidence,
  license:catalog.license,credit:catalog.credit,coordinateSystem:catalog.coordinateSystem,
  sourceArchive:'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip',
  licenseUrl:'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',groups,screened,comparisons,pairComparisons,
  geometryModified:false,clinicalApproval:false,
  limitations:['Complete source definitions are not complete anatomical trees, joined lumens or verified tissue relationships.',
    'Topology and bounded distance/translated-shape screening do not exclude self-intersection or establish clinical correctness.',
    'No fitted or mirrored surfaces, bridge, reconstructed branch or face deletion. Original archive directory, CRC and sizes verified on retrieval.']};
const text=JSON.stringify(report,null,2)+'\n', path='docs/inferior-epigastric-source-audit.json';
if(process.argv.includes('--check')) assert.equal((await readFile(path,'utf8')).replace(/\r\n/g,'\n'),text);
else await writeFile(path,text,{flag:'wx'});
console.log(JSON.stringify({groups:groups.length,rootEnvelopes:screened.length,comparisons:comparisons.length,pairComparisons:pairComparisons.length,triangles:groups.reduce((n,g)=>n+g.topology.triangles,0),auditSha256:hash(text),clinicalApproval:false}));
