import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {currentInputs,assertCurrentReportPins,hash} from './anterior-choroidal-source-report.mjs';
import {sourceObjShape,mergeSourceShapes} from './source-surface-audit.mjs';
import {sourceShapeSignature} from './source-shape-equivalence.mjs';
import {sourceContainmentSampler} from './source-containment-sampler.mjs';

const visualPin='5b1a018edcc3b4d271eeb5ae0fe81aef1b92161e1c179585573602ffd57184f6';
export async function choroidalContextReport({readSource=(tree,file)=>readFile(`../work/bodyparts3d/${tree}/${file}.obj`)}={}){
 const inputs=await currentInputs(),originalBytes=await readFile('content/anterior-choroidal-source-audit.json'),original=JSON.parse(originalBytes);
 await assertCurrentReportPins(original,inputs);
 const visualBytes=await readFile('docs/visual-pathway-source-audit.json');assert.equal(hash(visualBytes),visualPin,'Visual source pins changed');
 const visual=JSON.parse(visualBytes);assert.deepEqual(visual.evidence,inputs.context.evidence);
 const loaded=new Map();
 async function load(tree,file,pin){const key=tree+'/'+file;assert.match(pin??'',/^[a-f0-9]{64}$/,'Missing context source pin');
  if(!loaded.has(key)){const bytes=await readSource(tree,file);assert.equal(hash(bytes),pin,'Source SHA changed '+key);loaded.set(key,{tree,file,sha256:pin,bytes,shape:sourceObjShape(bytes)});}
  assert.equal(loaded.get(key).sha256,pin,'Conflicting context source pin');return loaded.get(key);
 }
 const descriptors=original.candidates.map(c=>({id:c.id,name:c.name,side:c.side,role:c.role,tree:c.tree,sources:[{file:c.file,sha256:c.sha256}],displayed:false}));
 for(const fma of ['FMA3949','FMA4062','FMA50085','FMA50086','FMA61934']){
  const s=inputs.catalog.structures.find(s=>s.fmaId===fma);assert(s,'Missing context '+fma);descriptors.push({id:fma,name:s.sourceName,side:s.laterality,role:fma==='FMA61934'?'plexus':'arterial-context',tree:s.sourceTree,sources:s.sources,displayed:true});
 }
 for(const g of visual.groups){const definition=inputs.context.records.find(r=>r.tree===g.tree&&r.id===g.id);assert(definition);assert.equal(definition.name,g.name);assert.deepEqual(definition.files,g.files);
  descriptors.push({id:g.id,name:g.name,side:g.side,role:'visual-source-context',tree:g.tree,sources:g.sources.map(s=>({file:s.file,sha256:s.sha256})),displayed:false});
 }
 const meshes=[];
 for(const d of descriptors){const shapes=[];for(const s of d.sources)shapes.push((await load(d.tree,s.file,s.sha256)).shape);const shape=mergeSourceShapes(shapes);
  meshes.push({...d,hold:inputs.context.policy.inspect(inputs.context.records.find(r=>r.tree===d.tree&&r.id===d.id)),shape});}
 const probes=[];
 for(const target of meshes.filter(m=>m.role==='plexus'||m.role==='visual-source-context')){
  const sampler=sourceContainmentSampler(target.shape);
  for(const candidate of meshes.filter(m=>['parent','branch'].includes(m.role))){
   const vertices=[...new Map(candidate.shape.vertices.map(p=>[p.join(','),p])).values()],centroids=candidate.shape.triangles.map(t=>t.triangle.getMidpoint(new Vector3()).toArray());
   function samples(points,weights){const rows=points.map((p,i)=>({...sampler.sample(p),weight:weights[i]})),total=weights.reduce((a,b)=>a+b,0),counts={};
    for(const status of ['inside-envelope','outside-envelope','boundary','ambiguous','unsupported-open-or-invalid-surface'])counts[status]={count:rows.filter(r=>r.classification===status).length,fraction:rows.filter(r=>r.classification===status).reduce((n,r)=>n+r.weight,0)/total};
    return {samples:rows.length,counts,minSurfaceDistanceMm:sampler.supported?Math.min(...rows.map(r=>r.distanceMm)):null};}
   probes.push({candidate:candidate.id,target:target.id,targetName:target.name,targetDisplayed:target.displayed,supported:sampler.supported,targetTopology:sampler.topology,
    vertices:samples(vertices,vertices.map(()=>1)),areaWeightedCentroids:samples(centroids,candidate.shape.triangles.map(t=>t.triangle.getArea()))});
  }
 }
 // Screen complete source files from every displayed owner and prior held set.
 // Triangle-count mismatch cannot exclude remeshed or partial surface overlap.
 const sources=new Map();
 for(const s of inputs.catalog.structures)for(const f of s.sources){const key=s.sourceTree+'/'+f.file,prior=sources.get(key);if(prior){assert.equal(prior.sha256,f.sha256);prior.owners.push(s.id);}else sources.set(key,{tree:s.sourceTree,file:f.file,sha256:f.sha256,owners:[s.id],heldBy:[]});}
 for(const s of original.heldScreen){const key=s.tree+'/'+s.file,prior=sources.get(key);if(prior){assert.equal(prior.sha256,s.sha256);prior.heldBy=[...new Set([...prior.heldBy,...s.heldBy])];}else sources.set(key,{tree:s.tree,file:s.file,sha256:s.sha256,owners:[],heldBy:s.heldBy});}
 const signatureOptions={tolerance:1e-6,allowReflections:true},candidateShapes=meshes.filter(m=>['parent','branch'].includes(m.role)).map(m=>({...m,signature:sourceShapeSignature(m.shape,signatureOptions)}));
 const screen=[],matches=[];
 for(const s of sources.values()){
  let bytes;try{bytes=await readSource(s.tree,s.file);}catch(error){screen.push({...s,status:'cache-unavailable',errorCode:error.code??'read-failed'});continue;}
  assert.equal(hash(bytes),s.sha256,'Duplicate-screen source SHA changed '+s.tree+'/'+s.file);
  const faces=bytes.toString().split(/\r?\n/).filter(l=>/^f\s/.test(l.trim())),triangleCount=faces.reduce((n,l)=>n+l.trim().split(/\s+/).length-3,0);
  const relevant=candidateShapes.filter(c=>c.shape.faces.length===triangleCount);
  if(!relevant.length){screen.push({...s,status:'different-triangle-count',triangleCount});continue;}
  let signature;try{signature=sourceShapeSignature(sourceObjShape(bytes),signatureOptions);}catch(error){screen.push({...s,status:'signature-unsupported',triangleCount,reason:error.message});continue;}
  const row={...s,status:'signature-screened',triangleCount,signature:signature.signature,matchingCandidates:relevant.filter(c=>c.signature.signature===signature.signature).map(c=>c.id)};
  screen.push(row);for(const id of row.matchingCandidates)matches.push({candidate:id,source:s.tree+'/'+s.file,owners:s.owners,heldBy:s.heldBy});
 }
 const candidatePairMatches=[];for(let i=0;i<candidateShapes.length;i++)for(let j=i+1;j<candidateShapes.length;j++){const a=candidateShapes[i],b=candidateShapes[j];candidatePairMatches.push({a:a.id,b:b.id,sameSide:a.side===b.side,matchingSignature:a.signature.signature===b.signature.signature,triangleCountA:a.shape.faces.length,triangleCountB:b.shape.faces.length});}
 const algorithmFiles=['scripts/choroidal-context-report.mjs','scripts/source-containment-sampler.mjs','scripts/source-shape-equivalence.mjs'];
 const algorithms=[];for(const path of algorithmFiles)algorithms.push({path,sha256:hash((await readFile(path,'utf8')).replaceAll('\r\n','\n'))});
 const report={schemaVersion:1,purpose:'source-only-choroidal-context-review',anteriorAuditSha256:hash(originalBytes),visualAuditSha256:visualPin,evidence:inputs.context.evidence,supplementalEvidence:inputs.context.supplementalEvidence,algorithms,
  license:original.license,credit:original.credit,coordinateSystem:original.coordinateSystem,
  context:meshes.map(({shape,...m})=>({...m,vertices:shape.vertices.length,triangles:shape.faces.length,bounds:{min:shape.min,max:shape.max},geometrySha256:hash(JSON.stringify({vertices:shape.vertices,faces:shape.faces}))})),sourceFiles:[...loaded.values()].map(({bytes,shape,...s})=>({...s,bytes:bytes.length})),
  envelopeProbes:probes,duplicateScreen:{...signatureOptions,displayedDefinitions:inputs.catalog.structures.length,verifiedSources:screen.filter(s=>s.status!=='cache-unavailable').length,unavailableSources:screen.filter(s=>s.status==='cache-unavailable').length,unsupportedSignatures:screen.filter(s=>s.status==='signature-unsupported').length,screen,matches,candidatePairMatches},
  limitations:['Original-coordinate diagnostic source surfaces only; zero admission or clinical clearance.','Closed, oriented topology does not certify absence of self intersections. Three-direction ray agreement samples an envelope, not tissue, lumen, supply territory or continuous surface penetration. Disagreements and boundary samples remain unclassified.','Open/invalid target surfaces produce only unsupported results. An inside sample is not a clinical overlap diagnosis.','Shape signatures use nearest1e-6mm bins and optional source-axis reflections, not scaling. Bin boundaries can give false negatives and within-bin changes can give false positives. Rotation, retessellation and subset overlap are not excluded. Missing caches/unsupported signatures remain explicit.','Visual-pathway context is unadmitted and source-only; neither it nor the choroidal candidates may be approved from this inspector.','No patient images, CT-head masks, desktop PACS, registration or access entitlements are changed.'],admissions:0,clinicalValidation:false,sourceGeometryChanged:false};
 return {report,meshes};
}
