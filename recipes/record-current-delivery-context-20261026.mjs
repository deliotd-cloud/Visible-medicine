import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from './bounded-source-hash-20261026.mjs';
const base='F:/VisibleMedicine/staging/20261026-current-delivery-advance',sourceFile=base+'/SOURCE_CANDIDATE.json',sourceSha='9da49fa0b687608c86fdee92459eb3693b39426789fbe6e86595f1ff18a03e43';
assert.equal(hash(sourceFile),sourceSha);const source=json(sourceFile),parent=json(source.parent);assert.equal(hash(source.parent),source.parentSha256);
for(const r of source.sourceRows)assert.equal(hash(source.website+'/'+r.path),r.sha256,r.path);
const byPath=new Map(source.sourceRows.map(r=>[r.path,r]));
const allowed=['tests/fixtures/current-atlas-delivery.json','tests/current-atlas-delivery.test.mjs'];
assert.deepEqual(source.changedPaths,allowed);assert.deepEqual(source.deletedPaths,[]);
for(const row of parent.sourceRows)if(!allowed.includes(row.path))assert.deepEqual(byPath.get(row.path),row,row.path);
assert(source.addedPaths.every(p=>p.startsWith('tests/')||p==='docs/CURRENT_ATLAS_TEST_DELIVERY_HELP_TRANSITION.md'));
assert.equal(source.sourceRows.length,parent.sourceRows.length+8);assert.equal(source.sourceRows.length,6900);
const review=json(source.website+'/atlas-review/integration-inputs.json'),priorReview=json(parent.website+'/atlas-review/integration-inputs.json');assert.deepEqual(review,priorReview);assert.equal(review.inputs.length,1818);
for(const r of review.inputs)assert.equal(hash(source.website+'/'+r.path),r.sha256,r.path);
for(const d of source.dependencies){assert.equal(hash(d.file),d.sha256);assert.equal(hash(d.entry),d.entrySha256);}
const git=(root,args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true}).trim();
assert.equal(git(source.atlas,['rev-parse','HEAD']),source.atlasHead);assert.equal(git(source.atlas,['rev-parse','HEAD^{tree}']),source.atlasTree);assert.equal(git(source.atlas,['status','--porcelain']),'');
assert.equal(git('F:/VisibleMedicine/website',['rev-parse','HEAD']),'b953ff3f5f1891599cb6e91cb91311d9d6006270');assert.equal(git('F:/VisibleMedicine/atlas',['rev-parse','HEAD']),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
const runtimeFile=base+'/checks/admission-attempt-1/RESULT.json',runtime=json(runtimeFile);assert.equal(hash(runtimeFile),'19d37926029195fbc7c3561069d7e2bf7e68b8442a33302e3fc2f10649130f81');assert(runtime.passing);assert.equal(runtime.source.sha256,sourceSha);assert.deepEqual(runtime.counts,{tests:82,pass:82,fail:0,cancelled:0,skipped:0,todo:0});assert.equal(runtime.roots.length,7);
const pin=path=>({path,sha256:hash(path)}),controlFile='F:/VisibleMedicine/staging/20261026-bounded-campaign-controls-v2/RESULT.json',control=json(controlFile);assert(control.passingControls);assert.equal(hash(controlFile),'4dac20212a86039fd634f41f4451959a5608b4f04b425c1d98e5b00e480ab00a');
const state='F:/VisibleMedicine/staging/20261026-current-stock-campaign',plan=json(state+'/PLAN.json'),planSha='1c1ae0db4303b21284957f87e8484d4ac4f563d220ed677e6685bea54f246dba';assert.equal(hash(state+'/PLAN.json'),planSha);assert.equal(plan.stockPhysicalRootCount,1347);assert.equal(plan.execution.executedRoots.length,1346);assert.equal(plan.shards.length,18);
const diagnostic='F:/VisibleMedicine/staging/20261026-c48-stock-diagnostic/RESULT.json';assert.equal(hash(diagnostic),'0146526d1f9b8e173efe78e46a0d32187cec622dfba65af3a59fb1138dd435a7');assert.equal(json(diagnostic).counts,null);
const result={at:new Date().toISOString(),kind:'verified-current-test-context-advance-not-application-release',passingForStatedScope:true,
 source:pin(sourceFile),parent:pin(source.parent),focusedRuntime:pin(runtimeFile),counts:runtime.counts,wholeRoots:runtime.roots.length,
 scope:'Current engineering test admission advanced to the independently verified Help Review binding; original validator unchanged, prior complete source/fixture/test/metadata preserved with forward and reverse refusals. No clinical/source approval transfer.',
 productionApplicationAndAll1818ProtectedInputsByteExactToC48:true,nativeGeometryTeachingRuntimeModelsAndDependenciesUnchanged:true,
 fullConfiguredWebsiteTypes:false,stockWebsiteBuild:false,wholeStockSuitePassing:false,
 priorStockDiagnostic:{...pin(diagnostic),terminalStockReceipt:false,counts:null,controlledStoppedPartial:true,notAggregateTotals:true},
 boundedCampaign:{plan:pin(state+'/PLAN.json'),physicalRoots:1347,executedRoots:1346,importCoveredMirror:1,plannedShards:18,controls:pin(controlFile),negativeFixtureNotApplicationCases:true,passingClaim:false},
 historicalUiRoleRepair:{assessment:pin('F:/VisibleMedicine/staging/20261026-current-ui-role-proposal/ASSESSMENT.md'),state:'Read-only proposal; authentic 9e isolated replay and coupled inverse references not integrated.'},
 currentPrimaryVerifiedWebsiteUnchanged:'194dc14bf69a68edb959a1ce87d2685db17315514bf9bc823ab8686b1fa0b3db',pendingProductC48Unchanged:true,
 normalPreviewChanged:false,installedGitHeadsUnchanged:true,clinicalApproval:false,patientSpaceRegistration:false};
fs.writeFileSync(base+'/VERIFICATION_SUMMARY.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({path:base+'/VERIFICATION_SUMMARY.json',sha256:hash(base+'/VERIFICATION_SUMMARY.json'),focusedCases:82,scope:'test context only',campaignOutstanding:true}));
