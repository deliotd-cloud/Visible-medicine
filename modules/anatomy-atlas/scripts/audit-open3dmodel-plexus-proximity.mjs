// Offline diagnostic derivative. Never reads clinical data or writes learner assets.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {readFile,writeFile,mkdir,lstat} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {validatePlexusScene} from './open3dmodel-plexus-scene.mjs';
import {prepareProximityObject,sourceProximity,edgeConnectedComponents} from './open3dmodel-plexus-proximity.mjs';

const root=resolve(import.meta.dirname,'..');
const source='F:/VisibleMedicine/staging/20261003-open3dmodel-plexus';
const candidate='F:/VisibleMedicine/staging/20261003-plexus-conversion-v7';
export const outputDirectory='F:/VisibleMedicine/staging/20261012-plexus-proximity/review';
export const pins=Object.freeze({
 inventory:'2dfd9f51ffb03e54c14b90ff1f0338db866f7d03801312272ce7550f32bb123a',
 report:'64e267450fa2d8d7c7c09f1a483133549bfb3cd5e800c95beec19f6d3cce15be',
 scene:'37b3035a173269533e17e8d97a24d001b13e03c4adad2840a655e3dfd4b2af94',
});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const normalized=bytes=>bytes.toString().replaceAll('\r\n','\n');
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
async function fileSha(path){const h=createHash('sha256');for await(const chunk of createReadStream(path))h.update(chunk);return h.digest('hex');}

export function verifyInputs({inventoryText,reportText,sceneText}){
 assert.equal(sha(normalized(inventoryText)),pins.inventory,'Original inventory changed');
 assert.equal(sha(reportText),pins.report,'v7 conversion report changed');
 assert.equal(sha(sceneText),pins.scene,'v7 scene changed');
 const inventory=JSON.parse(inventoryText),report=JSON.parse(reportText),scene=JSON.parse(sceneText);
 validatePlexusScene(scene);
 assert.equal(scene.conversionReportSha256,pins.report);assert.equal(scene.sourceInventorySha256,pins.inventory);
 assert.equal(scene.sourceObjSha256,inventory.obj.sha256);assert.equal(report.sourceObjSha256,inventory.obj.sha256);
 assert.equal(report.sourceZipSha256,inventory.zip.sha256);assert.equal(report.sourceCoordinatesChanged,false);
 assert.equal(report.sourceFacesOmittedForRepair,0);assert.equal(report.admissions,0);assert.equal(report.registered,false);
 assert.equal(report.clinicalApproved,false);assert.equal(scene.objects.length,42);assert.equal(scene.held.length,8);
 assert.equal(scene.objects.filter(o=>o.core).length,15);assert.equal(report.objects.length,50);
 const rows=new Map(report.objects.map(row=>[row.id,row]));assert.equal(rows.size,50);
 for(const object of scene.objects){
  const row=rows.get(object.id);assert(row&&row.disposition==='converted-offline-candidate');
  assert.equal(object.sourceName,row.sourceName);assert.equal(object.core,row.core);
  assert.equal(object.groupedDivisions,row.groupedDivisions);assert.equal(object.sourceNamedRight,row.sourceNamedRight);
  assert.equal(sha(JSON.stringify({vertices:object.vertices,faces:object.faces})),row.derivedGeometrySha256,'Derived source geometry changed');
  assert.equal(object.vertices.length,row.sourceVertices);assert.equal(object.faces.length,row.triangles);
 }
 assert.deepEqual(scene.held.map(o=>[o.id,o.sourceName]).sort(),report.objects.filter(o=>o.disposition==='held-entire-source-object').map(o=>[o.id,o.sourceName]).sort());
 return {inventory,report,scene};
}

function componentRecord(object,component,index){
 const coords=component.vertexIds.map(i=>object.vertices[i]);
 return {index,firstSourceFaceId:component.faceIds[0],sourceFaceIds:component.faceIds,sourceVertexIds:component.vertexIds,
  triangles:component.faceIds.length,vertices:component.vertexIds.length,
  bounds:{min:[0,1,2].map(k=>Math.min(...coords.map(v=>v[k]))),max:[0,1,2].map(k=>Math.max(...coords.map(v=>v[k])))}};
}
function query(a,b){
 try{return sourceProximity(a,b);}catch(error){
  // Identical source surfaces are an identity concern, not a reason to drop a pair.
  if(error instanceof RangeError&&error.message==='identical objects are not a cross-pair')
   return {status:'query-incomplete',distanceSourceUnits:null,witnessVerified:false,reason:'identical source geometry requires identity adjudication'};
  throw error;
 }
}
export function buildMeasurements(scene,{onProgress=()=>{}}={}){
 validatePlexusScene(scene);
 const objects=[...scene.objects].sort((a,b)=>a.id.localeCompare(b.id));
 assert.equal(new Set(objects.map(o=>o.sourceName)).size,objects.length);
 const prepared=objects.map(prepareProximityObject),components=prepared.map(edgeConnectedComponents);
 const objectRecords=objects.map((object,i)=>({id:object.id,sourceName:object.sourceName,core:object.core,
  groupedDivisions:object.groupedDivisions,sourceNamedRight:object.sourceNamedRight,
  components:components[i].map((c,index)=>componentRecord(object,c,index))}));
 const pairs=[];
 try{
  for(let i=0;i<objects.length;i++)for(let j=i+1;j<objects.length;j++){
   const result=query(prepared[i],prepared[j]);pairs.push({idA:objects[i].id,idB:objects[j].id,...result});
   if(pairs.length%100===0)onProgress({objectPairs:pairs.length});
  }
  // A grouped division remains one labelled object. Component numbers describe
  // diagnostic mesh connectivity, never named individual anterior/posterior divisions.
  const groupedComponents=[];
  for(const [i,object]of objects.entries())if(object.groupedDivisions){
   for(const [componentIndex,component]of components[i].entries()){
    const componentObject=prepareProximityObject({id:object.id+':diagnostic-component:'+componentIndex,
     sourceName:object.sourceName+':diagnostic-component:'+componentIndex,vertices:object.vertices,
     faces:component.faceIds.map(k=>object.faces[k])});
    try{
     const comparisons=[];
     for(const [j,other]of objects.entries())if(j!==i&&other.core){
      const result=query(componentObject,prepared[j]);
      if(result.status==='verified')result.sourceFaceIdA=component.faceIds[result.sourceFaceIdA];
      comparisons.push({otherId:other.id,...result});
     }
     groupedComponents.push({objectId:object.id,componentIndex,comparisons});
    }finally{componentObject.geometry.dispose();}
   }
  }
  const counts={objects:objects.length,coreObjects:objects.filter(o=>o.core).length,heldObjects:scene.held.length,
   disconnectedObjects:components.filter(c=>c.length>1).length,components:components.reduce((n,c)=>n+c.length,0),
   objectPairs:pairs.length,verifiedObjectPairs:pairs.filter(p=>p.status==='verified').length,
   unresolvedObjectPairs:pairs.filter(p=>p.status!=='verified').length,
   groupedDivisionObjects:objects.filter(o=>o.groupedDivisions).length,groupedDivisionComponents:groupedComponents.length,
   groupedComponentComparisons:groupedComponents.reduce((n,c)=>n+c.comparisons.length,0),
   unresolvedGroupedComparisons:groupedComponents.flatMap(c=>c.comparisons).filter(p=>p.status!=='verified').length};
  assert.equal(pairs.length,objects.length*(objects.length-1)/2);
  return {counts,objects:objectRecords,pairs,groupedComponents,held:scene.held};
 }finally{for(const handle of prepared)handle.geometry.dispose();}
}

export async function buildAudit({onProgress}={}){
 const inventoryText=await readFile(join(root,'docs/open3dmodel-plexus-source-inventory.json'),'utf8');
 const reportText=await readFile(join(candidate,'conversion-report.json'),'utf8');
 const sceneText=await readFile(join(candidate,'preview/scene.json'),'utf8');
 const {inventory,scene}=verifyInputs({inventoryText,reportText,sceneText});
 for(const [name,row]of [['upper-limb.obj',inventory.obj],['upper-limb-obj.zip',inventory.zip]]){
  const path=join(source,name),stat=await lstat(path);assert(stat.isFile()&&!stat.isSymbolicLink());
  assert.equal(stat.size,row.bytes);assert.equal(await fileSha(path),row.sha256,'Original source changed: '+name);
 }
 const dependencies=await Promise.all(['scripts/open3dmodel-plexus-proximity.mjs','scripts/audit-open3dmodel-plexus-proximity.mjs','scripts/open3dmodel-plexus-scene.mjs',
  'node_modules/three/build/three.module.js','node_modules/three/build/three.core.js','node_modules/three-mesh-bvh/build/index.module.js'].map(async path=>({path,sha256:await fileSha(join(root,path))})));
 return {schemaVersion:1,purpose:'open3dmodel-plexus-offline-proximity-review',
  sourceObjSha256:inventory.obj.sha256,sourceZipSha256:inventory.zip.sha256,sourceInventorySha256:pins.inventory,
  conversionReportSha256:pins.report,sceneSha256:pins.scene,dependencies,
  threeVersion:JSON.parse(await readFile(join(root,'node_modules/three/package.json'))).version,
  bvhVersion:JSON.parse(await readFile(join(root,'node_modules/three-mesh-bvh/package.json'))).version,
  units:'unknown-source-units',coordinateFrame:'unaltered-source-OBJ',
  sourceCoordinatesChanged:false,mirrored:false,registered:false,admissions:0,clinicalApproved:false,
  license:'CC-BY-SA-4.0',credit:scene.credit,
  method:'Float64 source positions; indirect BVHs; complete triangle-surface nearest query; independent witness-on-original-face and separation checks. No translation or vertex sampling.',
  componentMethod:'Original face IDs; edges shared at exact coordinates only. Point contact alone is not an edge connection. Component numbers are not anatomical branch identities.',
  ...buildMeasurements(scene,{onProgress}),
  limitations:[
   'Distances are diagnostic quantities in unknown source units, never millimetres or clinical tolerances.',
   'Float64 triangles and padded Float32 BVH bounds use floating-point arithmetic, not exact predicates. Verified witnesses are not a formal global-minimum proof.',
   'Zero surface separation may be overlap, crossing or touch. Positive separation does not establish tissue identity, continuity, containment or completeness.',
   'Invalid library witnesses remain explicitly unresolved; no surface, face or incomplete pair is silently repaired or discarded.',
   'Grouped divisions remain grouped; component order does not identify the superior, middle or inferior division.',
   'Eight held source objects are excluded from measurement, not admitted or repaired. Optional bones are not neural selections.',
   'No source-to-body transform, anatomy approval, patient-space registration, imaging link, nerve-block instruction or learner admission follows from this report.'
  ]};
}

export function renderReport(report){
 assert.equal(report.purpose,'open3dmodel-plexus-offline-proximity-review');assert.equal(report.units,'unknown-source-units');
 assert.equal(report.admissions,0);assert.equal(report.registered,false);assert.equal(report.clinicalApproved,false);
 const rows=new Map(report.objects.map(o=>[o.id,o]));
 const metric=p=>p.status==='verified'?`${p.distanceSourceUnits.toPrecision(7)} source units`:`Unresolved: ${p.reason}`;
 const witness=p=>p.status==='verified'?`Original triangles ${p.sourceFaceIdA} / ${p.sourceFaceIdB}; coordinates ${p.witnessA.map(n=>n.toPrecision(7)).join(', ')} → ${p.witnessB.map(n=>n.toPrecision(7)).join(', ')}`:'No verified witness; inspect original surfaces.';
 const tableRows=report.pairs.map(p=>`<tr><th scope="row">${esc(rows.get(p.idA).sourceName)}</th><td>${esc(rows.get(p.idB).sourceName)}</td><td>${esc(metric(p))}</td><td><details><summary>Source witness</summary><p>${esc(witness(p))}</p></details></td></tr>`).join('');
 const groupRows=report.groupedComponents.map(c=>`<details><summary>${esc(rows.get(c.objectId).sourceName)} · diagnostic component ${c.componentIndex+1}</summary><p>No individual anatomical division is assigned. Original source face IDs remain in the JSON report.</p><ol>${[...c.comparisons].sort((a,b)=>Number(b.status==='verified')-Number(a.status==='verified')||(a.distanceSourceUnits??Infinity)-(b.distanceSourceUnits??Infinity)).map(p=>`<li>${esc(rows.get(p.otherId).sourceName)}: ${esc(metric(p))}<details><summary>Source witness</summary><p>${esc(witness(p))}</p></details></li>`).join('')}</ol></details>`).join('');
 return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Visible Medicine plexus proximity review</title><style>body{font:15px system-ui,sans-serif;color:#153a3e;background:#f4f7f6;max-width:1400px;margin:auto;padding:24px}h1{font-size:24px}p,li{line-height:1.5}summary{cursor:pointer}details{margin:10px 0}table{border-collapse:collapse;width:100%;background:white}th,td{padding:10px;text-align:left;border-bottom:1px solid #cad8d4;overflow-wrap:anywhere}thead{position:sticky;top:0;background:#e7efeb}input{padding:10px;width:min(100%,480px);font:inherit}.warning{border-left:4px solid #a97c26;background:#fff4d9;padding:12px}.table{overflow:auto}a{color:#006478}input:focus-visible,summary:focus-visible,a:focus-visible{outline:3px solid #187381;outline-offset:3px}[hidden]{display:none!important}</style><h1>Brachial plexus source proximity review</h1><p class="warning">Offline candidate only · Unknown source units · No learner admission or clinical approval. Geometric neighbours are not validated nerve junctions. Source object labels and grouped divisions remain unchanged.</p><p>${report.counts.objects} neural objects; ${report.counts.disconnectedObjects} contain multiple edge-connected components (${report.counts.components} components in total). ${report.counts.objectPairs} complete object-pair queries: ${report.counts.verifiedObjectPairs} verified witness results, ${report.counts.unresolvedObjectPairs} unresolved. Eight held objects remain excluded.</p><p>Compare these exact names in the unchanged v7 local 3D candidate. Its six raw-axis views and optional source-matched bone context remain independent of the learner Atlas. <a href="proximity-report.json">Full source-bound JSON report</a></p><details><summary>Grouped division components</summary>${groupRows}</details><details><summary>Disconnected source objects</summary><ul>${report.objects.filter(o=>o.components.length>1).map(o=>`<li>${esc(o.sourceName)} · ${o.components.length} components</li>`).join('')}</ul></details><h2>All neural object pairs</h2><label for="filter">Filter by exact source name or result text</label><p><input id="filter" type="search" autocomplete="off" placeholder="For example C5_root or unresolved"></p><p id="results" role="status">${report.pairs.length} pairs</p><div class="table"><table><thead><tr><th scope="col">Object A</th><th scope="col">Object B</th><th scope="col">Surface query result</th><th scope="col">Original source witness</th></tr></thead><tbody>${tableRows}</tbody></table></div><h2>Interpretation limits</h2><ul>${report.limitations.map(v=>`<li>${esc(v)}</li>`).join('')}</ul><p>${esc(report.credit)}. Model and diagnostic derivatives retain CC BY-SA 4.0. Existing source notices and recipient reuse rights remain applicable; MIT diagnostic code does not relicense geometry.</p><p>v7 scene: <code>${report.sceneSha256}</code><br>v7 report: <code>${report.conversionReportSha256}</code></p><script>const input=document.getElementById('filter'),rows=Array.from(document.querySelectorAll('tbody tr'));input.addEventListener('input',()=>{const terms=input.value.toLowerCase().trim().split(/\\s+/).filter(Boolean);let count=0;for(const row of rows){row.hidden=!terms.every(t=>row.textContent.toLowerCase().includes(t));if(!row.hidden)count++;}document.getElementById('results').textContent=count+' / '+rows.length+' pairs';});</script></html>\n`;
}

export async function persistAudit(report,{check=false}={}){
 const json=JSON.stringify(report,null,2)+'\n',html=renderReport(report);
 if(check){
  assert.equal(await readFile(join(outputDirectory,'proximity-report.json'),'utf8'),json,'Proximity report changed');
  assert.equal(await readFile(join(outputDirectory,'index.html'),'utf8'),html,'Readable report changed');
 }else{
  await mkdir(outputDirectory,{recursive:true});
  await writeFile(join(outputDirectory,'proximity-report.json'),json,{flag:'wx'});
  await writeFile(join(outputDirectory,'index.html'),html,{flag:'wx'});
 }
 return {reportSha256:sha(json),htmlSha256:sha(html),...report.counts};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 assert(process.argv.slice(2).every(arg=>arg==='--check')&&process.argv.slice(2).length<=1,'Only --check is accepted');
 const report=await buildAudit({onProgress:value=>process.stdout.write(JSON.stringify(value)+'\n')});
 console.log(JSON.stringify({passed:true,...await persistAudit(report,{check:process.argv.includes('--check')}),outputDirectory,admissions:0,clinicalApproved:false}));
}
