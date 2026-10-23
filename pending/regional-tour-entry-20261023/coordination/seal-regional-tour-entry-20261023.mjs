// Main-owned source/production seal. Website generation and installation remain separate.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261023-regional-tour-entry',atlas=stage+'/atlas',prepared=json(stage+'/PREPARED.json'),preservation=json(stage+'/PRESERVATION.json');
const git=(...args)=>execFileSync('git',['-C',atlas,...args],{encoding:'utf8',windowsHide:true,maxBuffer:32e6}).trim();assert.equal(git('rev-parse','HEAD'),prepared.head);git('diff','--check');
const changed=git('diff','--name-only').split('\n').filter(Boolean),added=git('ls-files','--others','--exclude-standard').split('\n').filter(Boolean);
assert.deepEqual(new Set(changed),new Set([...preservation.changed,'content/body-renderer-revision.json']));assert.deepEqual(new Set(added),new Set(preservation.added));
for(const row of prepared.files){assert.equal(hash(prepared.parent+'/'+row.path),row.sha256);if(!changed.includes(row.path))assert.equal(hash(atlas+'/'+row.path),row.sha256,row.path);}
const checks=['native','player','types-v3','build','renderer-check'].map(phase=>{const dir=stage+'/checks/'+phase,t=json(dir+'/TERMINAL.json');assert.equal(t.code,0,phase);assert.equal(hash(dir+'/stdout.log'),t.stdoutSha256);assert.equal(hash(dir+'/stderr.log'),t.stderrSha256);return t;});
const failure=json(stage+'/checks/types/TERMINAL.json');assert.equal(failure.code,134);assert(failure.resourceFailure);assert.equal(hash(stage+'/checks/types/stderr.log'),failure.stderrSha256);
const types=json(stage+'/checks/types-v3/RESULT.json');assert.equal(types.sourceFiles.length,3309);assert.equal(types.diagnostics.length,0);assert(types.actualStrictConfiguration&&!types.moduleSubstitutions);
for(const row of types.sourceFiles)assert.equal(hash(row.path),row.sha256,'Actual type input drift: '+row.path);
const worker=json(stage+'/worker-checks/RESULT.json');assert(worker.checks.every(c=>c.exitCode===0));for(const [p,sha256] of Object.entries(worker.sourceHashesSha256))assert.equal(hash(stage+'/'+p),sha256);
for(const c of worker.checks)assert(fs.statSync(stage+'/worker-checks/'+c.log).size>0);
assert.equal(preservation.unchangedTrackedInputs,6282);assert(preservation.oldTestAssertionsWholeFileInverse&&preservation.teachingTourGeometrySourceHoldsAndDependenciesUnchanged);
const files=[];function walk(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){assert(!e.isSymbolicLink());if(e.isDirectory())walk(dir+'/'+e.name,prefix+e.name+'/');else files.push({path:prefix+e.name,bytes:fs.statSync(dir+'/'+e.name).size,sha256:hash(dir+'/'+e.name)});}}walk(atlas+'/dist');files.sort((a,b)=>a.path.localeCompare(b.path));
const markers=['This tour link is unavailable for the current source, revision or region.','The requested tour is unavailable for this region or revision.'];
const emitted=markers.map(marker=>{const found=files.filter(f=>f.path.startsWith('client/')&&f.path.endsWith('.js')).filter(f=>fs.readFileSync(atlas+'/dist/'+f.path,'utf8').includes(marker));assert(found.length,marker);return {marker,files:found.map(f=>f.path)};});
fs.writeFileSync(stage+'/BUILD_ARTIFACTS.json',JSON.stringify({at:new Date().toISOString(),files,emitted},null,2)+'\n',{flag:'wx'});
fs.writeFileSync(stage+'/SOURCE_DIFF.patch',git('diff','--no-ext-diff')+'\n',{flag:'wx'});
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
git('add','--',...changed,...added);git('commit','-m','Add exact source-bound regional guided tour entry');assert.equal(git('status','--porcelain'),'');
const sourceRows=git('ls-files','-z').split('\0').filter(Boolean).map(p=>({path:p,bytes:fs.statSync(atlas+'/'+p).size,sha256:hash(atlas+'/'+p)}));
const receipt={at:new Date().toISOString(),atlas,head:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD^{tree}'),parent:prepared.head,parentTree:prepared.tree,changed,added,sourceRows,sourcePaths:sourceRows.length,checks,
  buildArtifacts:stage+'/BUILD_ARTIFACTS.json',buildArtifactsSha256:hash(stage+'/BUILD_ARTIFACTS.json'),buildFiles:files.length,emitted,
  preservation:stage+'/PRESERVATION.json',preservationSha256:hash(stage+'/PRESERVATION.json'),worker:stage+'/worker-checks/RESULT.json',workerSha256:hash(stage+'/worker-checks/RESULT.json'),
  nativeCasesPassed:90,actualStrictTypesFiles:3309,actualStrictTypesDiagnostics:0,completeAtlasBuildPassed:true,allCurrentRegionalToursValidated:true,oldHistoricalInputs:1231,initialSeedRejectedCases:9,
  assetsDependenciesTourDefinitionsAndTeachingUnchanged:true,rendererRevisionChanged:true,existingApprovalsTransferred:false,privateDecisionsReadOrMigrated:false,
  embeddedExportAndWebsiteIntegrationPending:true,latestFullWebsiteCandidate:'F:/VisibleMedicine/staging/20261023-guided-region-website/SOURCE_BOUND.json',previewChanged:false,installed:false,browserAccepted:false,clinicalApproval:false,patientSpaceRegistration:false,wholeSuitePassing:false,fullProjectTypesPassed:false};
fs.writeFileSync(stage+'/SOURCE_BOUND.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:stage+'/SOURCE_BOUND.json',sha256:hash(stage+'/SOURCE_BOUND.json'),head:receipt.head,tree:receipt.tree,sourcePaths:sourceRows.length,buildFiles:files.length}));
