// Offline independent-source conversion. No admission, repair, registration or
// calls to patient-data/clinical review storage. Original material stays on E:.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {build} from 'esbuild';
import {readNamedObjObjects} from './open3dmodel-obj-source.mjs';
import {triangulateSourceObject} from './open3dmodel-triangulation.mjs';
import {prepareShape} from './vessel-shape-math.mjs';
import {sourceTopology} from './source-topology.mjs';
import {validatePlexusScene,plexusContextNames} from './open3dmodel-plexus-scene.mjs';
const root=resolve(import.meta.dirname,'..'),rawFolder='F:/VisibleMedicine/staging/20261003-open3dmodel-plexus',destination='F:/VisibleMedicine/staging/20261003-plexus-conversion-v7';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function fileSha(path){const h=createHash('sha256');for await(const chunk of createReadStream(path))h.update(chunk);return h.digest('hex');}
const inventoryBytes=await readFile(join(root,'docs/open3dmodel-plexus-source-inventory.json')),inventoryText=inventoryBytes.toString().replaceAll('\r\n','\n');
assert.equal(sha(inventoryText),'2dfd9f51ffb03e54c14b90ff1f0338db866f7d03801312272ce7550f32bb123a');
const inventory=JSON.parse(inventoryText);
assert.equal(await fileSha(join(rawFolder,'upper-limb.obj')),inventory.obj.sha256);assert.equal(await fileSha(join(rawFolder,'upper-limb-obj.zip')),inventory.zip.sha256);
const expected=new Map(inventory.neuralObjects.map(row=>[row.name,row]));
const contextText=(await readFile(join(root,'docs/open3dmodel-plexus-context-audit.json'),'utf8')).replaceAll('\r\n','\n');
assert.equal(sha(contextText),'9ed20064e49347e2d7b8aa4348aaa9da8ce0e87c0ca3b04bafbf5ebe7710bc38','Context audit changed');
const contextAudit=JSON.parse(contextText),contextExpected=new Map(contextAudit.objects.map(row=>[row.sourceName,row]));
assert.deepEqual(contextAudit.objects.map(row=>row.sourceName),plexusContextNames);
assert.equal(contextAudit.sourceObjSha256,inventory.obj.sha256);assert.equal(contextAudit.sourceInventorySha256,sha(inventoryText));
assert.equal(contextAudit.registered,false);assert.equal(contextAudit.admitted,false);assert.equal(contextAudit.clinicalApproved,false);
assert.equal(await fileSha(join(rawFolder,'source-inventory.json')),contextAudit.fullOfflineInventorySha256);
for(const dependency of contextAudit.dependencies)assert.equal(sha((await readFile(join(root,'scripts',dependency.name),'utf8')).replaceAll('\r\n','\n')),dependency.sha256,'Context dependency changed');
const parsed=await readNamedObjObjects(join(rawFolder,'upper-limb.obj'),{selectName:name=>expected.has(name)||contextExpected.has(name)});
assert.equal(parsed.inventory.length,inventory.obj.objects);assert.equal(parsed.totalVertices,inventory.obj.vertices);assert.equal(parsed.totalFaces,inventory.obj.faces);assert.equal(parsed.objects.length,53);assert.deepEqual(parsed.materialLibraries,[]);
const objectRecords=[],sceneObjects=[],held=[],contextObjects=[],contextRecords=[];
for(const object of parsed.objects.filter(object=>expected.has(object.name))){
 const previous=expected.get(object.name);assert.equal(object.vertices.length,previous.vertices);assert.equal(object.faces.length,previous.faces);assert.equal(sha(JSON.stringify({vertices:object.vertices,faces:object.faces})),previous.sourceGeometrySha256);
 const converted=triangulateSourceObject(object),id='open3dmodel-upper-limb-'+sha(object.name).slice(0,20);
 const record={id,sourceName:object.name,sourceGeometrySha256:previous.sourceGeometrySha256,sourceVertices:object.vertices.length,sourceFaces:object.faces.length,sourceFaceSizes:previous.faceSizes,core:inventory.expectedCoreObjectNames.includes(object.name),sourceNamedRight:previous.originalSourceNamedRight,groupedDivisions:/divisions_of_brachial_plexus/.test(object.name),conversion:'projected Earcut; source polygon boundary/winding/area checked',failedFaces:converted.failures,nonplanarQuads:converted.nonplanarQuads,maxPlaneDistanceFraction:converted.maxPlaneDistanceFraction,nGons:converted.nGons,admitted:false,clinicallyApproved:false};
 if(converted.failures.length){record.disposition='held-entire-source-object';held.push({id,sourceName:object.name,reasons:[...new Set(converted.failures.map(row=>row.reason))]});}
 else{
  const shape=prepareShape(object.vertices,converted.triangles);
  // Existing BodyParts diagnostic uses an absolute mm-area cutoff. This source
  // has unknown units: use exactly zero area, then rename diagnostic unit fields.
  for(const triangle of shape.triangles)triangle.degenerate=triangle.triangle.getArea()===0;
  const topology=sourceTopology(shape);
  for(const component of topology.components){component.areaSourceUnitsSquared=component.areaMm2;component.algebraicVolumeSourceUnitsCubed=component.algebraicVolumeMm3;delete component.areaMm2;delete component.algebraicVolumeMm3;}
  record.disposition='converted-offline-candidate';record.triangles=converted.triangles.length;record.derivedGeometrySha256=sha(JSON.stringify({vertices:object.vertices,faces:converted.triangles}));record.polygonMapSha256=sha(JSON.stringify(converted.polygonRanges));record.topology=topology;
  record.maxFloat32PositionDifferenceSourceUnits=Math.max(...object.vertices.flatMap(point=>point.map(value=>Math.abs(value-Math.fround(value)))));
  // No omissions even if topology is open/non-manifold; those concerns remain
  // visible in the report and are not certified or silently repaired.
  sceneObjects.push({id,sourceName:object.name,core:record.core,sourceNamedRight:record.sourceNamedRight,groupedDivisions:record.groupedDivisions,vertices:object.vertices,faces:converted.triangles,quality:{closedOrientedManifold:topology.closedOrientedManifold,components:topology.components.length,boundaryEdges:topology.boundaryEdges,degenerateFaces:topology.degenerateFaces}});
 }
 objectRecords.push(record);
}
for(const name of plexusContextNames){
 const object=parsed.objects.find(object=>object.name===name),record=contextExpected.get(name);
 assert.equal(object.vertices.length,record.sourceVertices);assert.equal(object.faces.length,record.sourceFaces);
 assert.equal(sha(JSON.stringify({vertices:object.vertices,faces:object.faces})),record.sourceGeometrySha256,'Context source geometry changed');
 const converted=triangulateSourceObject(object);assert.deepEqual(converted.failures,[],'Context object held');
 assert.equal(converted.triangles.length,record.triangles);
 assert.equal(sha(JSON.stringify({vertices:object.vertices,faces:converted.triangles})),record.derivedGeometrySha256,'Context conversion changed');
 assert.equal(sha(JSON.stringify(converted.polygonRanges)),record.polygonMapSha256);
 const id='open3dmodel-upper-limb-'+sha(name).slice(0,20),topology=record.topology;
 contextObjects.push({id,role:'bone-context',sourceName:name,core:false,sourceNamedRight:true,groupedDivisions:false,
  vertices:object.vertices,faces:converted.triangles,quality:{closedOrientedManifold:topology.closedOrientedManifold,components:topology.components.length,boundaryEdges:topology.boundaryEdges,degenerateFaces:topology.degenerateFaces}});
 contextRecords.push({id,role:'bone-context',...record});
}
assert.equal(sceneObjects.length,42);assert.equal(held.length,8);assert.equal(sceneObjects.filter(object=>object.core).length,15);
const implementationFiles=['open3dmodel-obj-source.mjs','open3dmodel-triangulation.mjs','build-open3dmodel-plexus-review.mjs','source-topology.mjs','vessel-shape-math.mjs','open3dmodel-plexus-viewer.mjs','open3dmodel-plexus-scene.mjs','open3dmodel-plexus-presentation.mjs','open3dmodel-plexus-preview.html'];
const implementations=await Promise.all(implementationFiles.map(async name=>({name,sha256:sha((await readFile(join(root,'scripts',name),'utf8')).replaceAll('\r\n','\n'))})));
const report={schemaVersion:1,purpose:'open3dmodel-plexus-source-review',sourceObjSha256:inventory.obj.sha256,sourceZipSha256:inventory.zip.sha256,sourceInventorySha256:sha(inventoryText),implementationFiles:implementations,threeVersion:JSON.parse(await readFile(join(root,'node_modules/three/package.json'))).version,units:'unknown-source-units',coordinateFrame:'unaltered-source-OBJ',mirrored:false,registered:false,admissions:0,clinicalApproved:false,sourceObjects:50,convertedObjects:sceneObjects.length,heldObjects:held.length,sourceCoordinatesChanged:false,sourceFacesOmittedForRepair:0,objects:objectRecords,limitations:['Projected tessellation is a deterministic display derivative; nonplanar source quads have no unique implied surface.','Exactly zero-area diagnostics; raw source units unknown. No scale, body fit, bilateral claim or acquired-case correspondence.','Topology diagnostics do not prove self-intersection absence, branch continuity, named anatomical boundaries or clinical accuracy.']};
Object.assign(report,{contextAuditSha256:sha(contextText),convertedContextObjects:contextObjects.length,contextRecords});
report.limitations.push('Three source-matched bones are optional spatial context only; no validated plexus-to-bone relationship or atlas registration is inferred.');
const reportText=JSON.stringify(report,null,2)+'\n';
if(process.argv.includes('--check')){
 assert.equal((await readFile(join(destination,'conversion-report.json'),'utf8')).replaceAll('\r\n','\n'),reportText,'Saved conversion evidence stale');
 console.log(JSON.stringify({passed:true,converted:sceneObjects.length,context:contextObjects.length,held:held.length,sourceCoordinatesChanged:false}));
}else{
 await mkdir(destination,{recursive:true});
 // Permit an interrupted first build to resume only against identical evidence.
 // Retain older versioned folders; never replace a stale conversion report.
 let savedReport;
 try{savedReport=await readFile(join(destination,'conversion-report.json'),'utf8');}catch(error){if(error.code!=='ENOENT')throw error;}
 if(savedReport!==undefined)assert.equal(savedReport.replaceAll('\r\n','\n'),reportText,'Existing conversion evidence stale; use a new versioned destination');
 else await writeFile(join(destination,'conversion-report.json'),reportText,{flag:'wx'});
 const scene={schemaVersion:1,purpose:report.purpose,sourceObjSha256:report.sourceObjSha256,sourceInventorySha256:report.sourceInventorySha256,conversionReportSha256:sha(reportText),units:report.units,coordinateFrame:report.coordinateFrame,registered:false,mirrored:false,clinicalApproved:false,admissions:0,license:'CC-BY-SA-4.0',credit:'Open3DModel / Open 3D Anatomical Model for Education, LUMC-led project and contributors; BodyParts3D / DBCLS; Z-Anatomy / Gauthier Kervyn and contributors.',limitations:[...report.limitations,'Original object names are source labels, not independently validated anatomical identities. Divisions stay grouped. Some distal names do not specify laterality.'],objects:sceneObjects,held};
 scene.contextObjects=contextObjects;
 validatePlexusScene(scene);
 if(process.argv.includes('--preview')){
  const preview=join(destination,'preview');await mkdir(preview,{recursive:true});
  const bundled=await build({entryPoints:[join(root,'scripts/open3dmodel-plexus-viewer.mjs')],bundle:true,format:'esm',platform:'browser',write:false,minify:true,legalComments:'eof',tsconfigRaw:{}});
  const notices=Buffer.concat([Buffer.from(scene.credit+'\nModel: CC BY-SA 4.0\nhttps://creativecommons.org/licenses/by-sa/4.0/\nSource, July 2025: https://anatomytool.org/open3dmodel-create\nTeam: https://anatomytool.org/open3dmodel-credit\nProvenance: https://anatomytool.org/open3dmodel-about\nChanges: selected original neural objects; polygon tessellation; review colours and computed shading normals. Original coordinates retained; no smoothing, repair, mirroring or body registration. Renderer uses Float32 positions. Grouped divisions remain grouped. Unknown source units.\nProvided as-is, without warranty of anatomical accuracy or fitness for diagnosis/treatment; educational review only. No endorsement implied. No restriction on recipients\' CC BY-SA model reuse rights.\n\nViewer code authored for Visible Medicine: MIT. No Open3DViewer GPL software imported.\nThree.js and OrbitControls: MIT (notice follows).\n\n'),await readFile(join(root,'node_modules/three/LICENSE'))]);
  const earcutNotice=Buffer.concat([Buffer.from('Bone-context derivative: original Humerus.r, Scapula.r. and Clavicle.r selected from the same July 2025 upper-limb OBJ; polygon tessellation, ivory colour, translucency and computed shading normals. Source coordinates unchanged; no registration, anatomical certification or atlas admission. These model adaptations remain CC BY-SA 4.0, independently of the MIT viewer code.\n\n'),await readFile(join(root,'LICENSES/EARCUT_ISC.txt'))]);
  const files={'index.html':await readFile(join(root,'scripts/open3dmodel-plexus-preview.html')),'app.js':bundled.outputFiles[0].contents,'scene.json':Buffer.from(JSON.stringify(scene)+'\n'),'THIRD_PARTY_NOTICES.txt':Buffer.concat([notices,Buffer.from('\n\nEarcut 3.0.2, bundled by Three.js and used for polygon tessellation:\n'),earcutNotice])},manifest={purpose:report.purpose,files:[]};
  for(const[name,bytes]of Object.entries(files)){await writeFile(join(preview,name),bytes,{flag:'wx'});manifest.files.push({name,bytes:bytes.length,sha256:sha(bytes)});}
  await writeFile(join(preview,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
 }
 console.log(JSON.stringify({destination,converted:sceneObjects.length,context:contextObjects.length,held:held.length,reportSha256:sha(reportText),heldNames:held.map(row=>row.sourceName),coreConverted:sceneObjects.filter(row=>row.core).length,admissions:0}));
}
