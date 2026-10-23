// Local-quarantine conversion only. Never run a publisher solver/journal or install assets.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {readPinnedShoulder} from './inspect-abaqus-shoulder-source.mjs';
import {extractQuadraticBoundary,auditTriangleSurface,writeWavefrontText} from './abaqus-quadratic-boundary.mjs';
import {transformInstancePoint} from './abaqus-instance-transform.mjs';
assert.equal(process.argv.length,4,'Usage: node scripts/convert-pinned-fda-shoulder.mjs <pinned-Male-Shoulder.inp> <NEW-external-quarantine-directory>');
const input=path.resolve(process.argv[2]),output=path.resolve(process.argv[3]),repo=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
assert(output!==repo&&!output.startsWith(repo+path.sep),'Quarantine output must be outside the Atlas source checkout');
assert(!fs.existsSync(output),'Output must be a new directory; no overwrite');
const {parts,manifest}=readPinnedShoulder(fs.readFileSync(input));
const hash=b=>createHash('sha256').update(b).digest('hex');
fs.mkdirSync(output);
const write=(name,data)=>{fs.writeFileSync(path.join(output,name),data,{flag:'wx'});return {path:name,bytes:Buffer.byteLength(data),sha256:hash(data)};};
write('STARTED.json',JSON.stringify({at:new Date().toISOString(),source:manifest.source,status:'conversion-started-not-admitted',installed:false,previewChanged:false},null,2)+'\n');
const exports=[];
for(const instance of manifest.instances){
  const part=parts.get(instance.part),surface=extractQuadraticBoundary(part);
  const vertices=surface.vertices.map(p=>transformInstancePoint(p,instance.transformRows));
  const transformedAudit=auditTriangleSurface(vertices,surface.triangles);
  const areaDrift=Math.abs(transformedAudit.areaInUnverifiedSourceUnitsSquared-surface.audit.areaInUnverifiedSourceUnitsSquared);
  assert(areaDrift<=Math.max(1,surface.audit.areaInUnverifiedSourceUnitsSquared)*1e-10,'Rigid transform changed surface area beyond numerical tolerance');
  const mesh={...surface,vertices};
  const files=[write(part.name+'.obj',writeWavefrontText(mesh,part.name)),write(part.name+'.source-map.json',JSON.stringify({sourceNodeIds:surface.sourceNodeIds,sourceFaces:surface.sourceFaces})+'\n')];
  const bounds={min:[0,1,2].map(i=>vertices.reduce((n,p)=>Math.min(n,p[i]),Infinity)),max:[0,1,2].map(i=>vertices.reduce((n,p)=>Math.max(n,p[i]),-Infinity))};
  exports.push({id:'fda-shoulder:'+manifest.source.commit+':'+part.name,part:part.name,instance:instance.name,transformRows:instance.transformRows,files,
    provenance:manifest.provenance[part.name],units:null,laterality:null,sourceFrame:'Publisher assembly coordinates; units and anatomical axes not yet independently established',bounds,
    rawAudit:surface.audit,assembledAudit:transformedAudit,rigidAreaAbsoluteDrift:areaDrift,clinicalApproval:false,registeredToBodyParts3D:false,patientSpaceRegistration:false});
}
const result={schema:'visible-medicine-fda-shoulder-surface-quarantine/1',source:manifest.source,exports,
  status:'converted-independent-reference-quarantined-not-admitted',assemblyTransformsApplied:true,
  sampling:'Four linear triangles per quadratic boundary face, preserving source corner/midside positions',
  coordinateScaleChanged:false,geometrySmoothed:false,geometryWelded:false,geometryDecimated:false,
  sourceConnectorElementsNotExported:manifest.assemblyElementTypes,loadAxisTransformsNotAppliedToMesh:manifest.unsupportedAssemblyTransforms,
  selfIntersectionsChecked:false,unitsVerified:false,lateralityVerified:false,clinicalApproval:false,
  registeredToBodyParts3D:false,patientSpaceRegistration:false,learnerAssetsAdmitted:false,installed:false,previewChanged:false};
write('MANIFEST.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({output,source:manifest.source.sha256,parts:exports.map(r=>({part:r.part,vertices:r.assembledAudit.vertices,triangles:r.assembledAudit.triangles,components:r.assembledAudit.components,closedOrientedVertexManifold:r.assembledAudit.closedOrientedVertexManifold,nonmanifoldVertices:r.assembledAudit.nonmanifoldVertices})),status:result.status}));
