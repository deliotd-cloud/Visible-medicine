import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {inspectPinnedShoulder} from 'file:///F:/VisibleMedicine/staging/20261023-fda-shoulder-surfaces/atlas/scripts/inspect-abaqus-shoulder-source.mjs';
const stage='F:/VisibleMedicine/staging/20261023-fda-shoulder-surfaces';
const read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p)),hash=p=>createHash('sha256').update(read(p)).digest('hex');
const prepared=json(stage+'/PREPARED.json'),atlas=prepared.atlas;
const git=(...args)=>execFileSync('git',['-C',atlas,...args],{encoding:'utf8',windowsHide:true,stdio:'pipe',maxBuffer:32e6}).trim();
const changed=['docs/FDA_SHOULDER_SOURCE.md','scripts/inspect-abaqus-shoulder-source.mjs'];
const added=['scripts/abaqus-instance-transform.mjs','scripts/abaqus-quadratic-boundary.mjs','scripts/check-fda-shoulder-surface-readback.mjs','scripts/convert-pinned-fda-shoulder.mjs','scripts/test-abaqus-instance-transform.mjs','scripts/test-abaqus-quadratic-boundary.mjs','scripts/test-fda-shoulder-surface-readback.mjs'];
assert.equal(git('rev-parse','HEAD'),prepared.head);
assert.deepEqual(git('diff','--name-only').split('\n'),changed);
assert.deepEqual(git('ls-files','--others','--exclude-standard').split('\n').sort(),[...added].sort());
for(const r of prepared.files)if(!changed.includes(r.path))assert.equal(hash(atlas+'/'+r.path),r.sha256,r.path);
const source='F:/VisibleMedicine/staging/20261023-fda-shoulder-source/Male-Shoulder.inp';
assert.deepEqual(inspectPinnedShoulder(read(source)),json('F:/VisibleMedicine/staging/20261023-fda-shoulder-ingestion/SOURCE_INVENTORY.json'),'Complete original inventory API remains identical');
for(const phase of ['tests','conversion']){
 const dir=stage+'/'+phase,t=json(dir+'/TERMINAL.json');assert.equal(t.exitCode,0);assert.equal(hash(dir+'/stdout.log'),t.stdoutSha256);assert.equal(hash(dir+'/stderr.log'),t.stderrSha256);
 for(const row of t.source)assert.equal(hash(atlas+'/'+row.path),row.sha256,row.path);
}
assert.match(read(stage+'/tests/stdout.log').toString(),/# tests 49\r?\n# suites 0\r?\n# pass 49\r?\n# fail 0/);
const readback=json(stage+'/readback-worker/READBACK_EVIDENCE.v2.json');
assert.equal(hash(atlas+'/scripts/check-fda-shoulder-surface-readback.mjs'),readback.verifierSha256);
assert.equal(hash(atlas+'/scripts/test-fda-shoulder-surface-readback.mjs'),readback.mutationTestSha256);
assert.equal(readback.nativeReadback.exitCode,0);assert.equal(readback.mutationTest.exitCode,0);
const exports=json(stage+'/quarantine-surfaces/MANIFEST.json');assert.equal(exports.exports.length,7);assert.equal(exports.learnerAssetsAdmitted,false);
assert.equal(exports.exports.reduce((n,r)=>n+r.assembledAudit.triangles,0),386648);
const files=[];for(const r of exports.exports)for(const f of r.files){assert.equal(hash(stage+'/quarantine-surfaces/'+f.path),f.sha256);files.push(f);}
const gcart=exports.exports.find(r=>r.part==='Gcart');assert.equal(gcart.rawAudit.nonmanifoldEdges,2);assert.equal(gcart.rawAudit.nonmanifoldVertices,3);assert.equal(gcart.rawAudit.closedOrientedVertexManifold,false);
assert.equal(exports.exports.filter(r=>r.assembledAudit.closedOrientedVertexManifold).length,6);
git('diff','--check');fs.writeFileSync(stage+'/SOURCE_DIFF.patch',execFileSync('git',['-C',atlas,'diff','--',...changed],{windowsHide:true,stdio:'pipe'}),{flag:'wx'});
git('add','--',...changed,...added);git('commit','-m','Extract and independently verify quarantined FDA shoulder boundary surfaces');assert.equal(git('status','--porcelain'),'');
const sourceRows=git('ls-files','-z').split('\0').filter(Boolean).map(path=>({path,sha256:hash(atlas+'/'+path)}));
const receipt={at:new Date().toISOString(),atlas,head:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD^{tree}'),parent:prepared.parent,parentHead:prepared.head,parentTree:prepared.tree,sourceRows,changed,added,sourcePaths:sourceRows.length,unchangedParentFiles:prepared.files.length-changed.length,
 pinnedSourceSha256:exports.source.sha256,exportManifest:stage+'/quarantine-surfaces/MANIFEST.json',exportManifestSha256:hash(stage+'/quarantine-surfaces/MANIFEST.json'),exportFiles:files,
 nativeTests:49,independentReadback:stage+'/readback-worker/READBACK_EVIDENCE.v2.json',independentReadbackSha256:hash(stage+'/readback-worker/READBACK_EVIDENCE.v2.json'),mutationRefusals:8,
 completeOriginalInventoryUnchanged:true,sourceParts:7,sampledTriangles:386648,closedGraphParts:6,gcartNonmanifoldVertices:3,gcartNonmanifoldEdges:2,defectsRepaired:false,
 buildRun:false,fullSuitePassing:false,geometryPubliclyAdmitted:false,websiteCandidateChanged:false,coordinateUnitsVerified:false,lateralityIndependentlyVerified:false,
 publisherReportedLaterality:{side:'right',source:'https://pubmed.ncbi.nlm.nih.gov/35882682/',notUsedAsIndependentCoordinateVerification:true},
 selfIntersectionsChecked:false,clinicalApproval:false,registeredToBodyParts3D:false,patientSpaceRegistration:false,installed:false,previewChanged:false};
fs.writeFileSync(stage+'/SOURCE_BOUND.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({head:receipt.head,tree:receipt.tree,sourcePaths:sourceRows.length,sourceChanges:changed.length+added.length,nativeTests:49,mutationRefusals:8,sourceParts:7,sampledTriangles:386648,closedGraphParts:6,previewChanged:false}));
