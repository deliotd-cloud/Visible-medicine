import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {hash,json} from './seal-simple-website-successor.mjs';

const stage='F:/VisibleMedicine/staging/20261025-head-search-guest-core-final-website';
const sourceFile=stage+'/SOURCE_CANDIDATE.json';
assert.equal(hash(sourceFile),'078a315d863ce312d0d3cd28ab4464407ea2a57a9234762cbb5c2c3014400255');
const source=json(sourceFile),baselineFile='F:/VisibleMedicine/staging/20261025-head-search-core-order-website/SOURCE_CANDIDATE.json';
assert.equal(hash(baselineFile),'0794f90c818a9e8fb9f885750d0fe4b1c7d4277fd1cd6299c60acd36af2c91b3');
const baseline=json(baselineFile),prior=new Map(baseline.sourceRows.map(r=>[r.path,r.sha256]));
for(const r of source.sourceRows)assert.equal(hash(source.website+'/'+r.path),r.sha256,r.path);
for(const d of source.dependencies){assert.equal(hash(d.file),d.sha256);assert.equal(hash(d.entry),d.entrySha256);}
const changed=source.sourceRows.filter(r=>r.sha256!==prior.get(r.path)).map(r=>r.path);
const expected=['lib/institution-operations.ts','lib/platform-governance.ts','tests/atlas-structure-search.test.mjs','tests/guest-core-prerequisites-source.mjs','tests/guest-core-prerequisites.test.mjs','tests/public-search-bootstrap.test.mjs','tests/rate-limit-atomic.test.mjs'];
assert.deepEqual(new Set(changed),new Set(expected));
for(const p of prior.keys())assert(source.sourceRows.some(r=>r.path===p),'Removed '+p);
assert.equal(source.sourceRows.length,6859);
const {invertGuestCorePrerequisites}=await import(pathToFileURL(source.website+'/tests/guest-core-prerequisites-source.mjs'));
for(const p of expected.filter(p=>p.startsWith('lib/')))assert.equal(invertGuestCorePrerequisites(fs.readFileSync(source.website+'/'+p,'utf8'),p),fs.readFileSync(baseline.website+'/'+p,'utf8'));
const ref=(p,sha)=>{if(sha)assert.equal(hash(p),sha);return {path:p,sha256:hash(p)};};
const receipts={
  wholeTests:ref(stage+'/checks/search-whole-roots-attempt-1/RESULT.json','1ed89ab8e3e083688578d117fa852ffb688a6ac6adfa3213cfe686e3cb521584'),
  fullTypes:ref(stage+'/checks/types-full-attempt-1/RESULT.json','3e5047f4da564a11d1e11d6ebda30fafc7f94ac69491dd30013f911a04aea845'),
  production:ref(stage+'/checks/build-attempt-1/RESULT.json','25a4987e2f0a866bd30ea320bbf9defb97f0d18fd71e2c05bb834939f620def2'),
  freshGuestApiProbes:ref('F:/VisibleMedicine/staging/20261025-guest-api-negative-v3-suite/RESULT.json'),
};
for(const r of Object.values(receipts)){const d=json(r.path);assert.equal(d.passing,true);assert.equal(d.source.sha256,hash(sourceFile));}
const tests=json(receipts.wholeTests.path);assert.equal(tests.expectedWholeCases,51);assert.equal(tests.rows.length,9);
for(const r of tests.rows){assert.equal(r.counts.tests,r.expected);assert.equal(r.counts.pass,r.expected);assert.equal(r.counts.fail+r.counts.skipped+r.counts.cancelled+r.counts.todo,0);}
const types=json(receipts.fullTypes.path).typeResult;assert.equal(hash(types.path),types.sha256);assert.equal(types.diagnostics,0);
for(const r of json(types.path).sourceFiles)assert.equal(hash(r.path),r.sha256,r.path);
const build=json(receipts.production.path).artifacts;assert.equal(hash(build.path),build.sha256);assert.equal(build.files,1142);
for(const r of json(build.path).files)assert.equal(hash(source.website+'/dist/'+r.path),r.sha256,r.path);
const probes=json(receipts.freshGuestApiProbes.path);assert.equal(probes.sequential,true);assert.equal(probes.cases.length,2);
const comparisonEvidence=ref('F:/VisibleMedicine/staging/20261025-guest-negative-probes-v2-suite/RESULT.json','62f44aafc445bf3b7e4f09adc3a7e80ab4499ee14fc634ed8de6f4fe8e162295');
const comparison=json(comparisonEvidence.path);assert.equal(comparison.passing,false);assert.equal(comparison.cases.length,2);
const [control,certificate]=comparison.cases;
assert.equal(control.mode,'control');assert.equal(certificate.mode,'cert');assert.equal(certificate.controlComparison.exactCounts,false);
const controlCounts=control.firstRequest.firstLineCounts,certificateCounts=certificate.firstRequest.firstLineCounts;
assert.deepEqual(Object.keys(certificateCounts),Object.keys(controlCounts));
for(const [line,count]of Object.entries(certificateCounts))assert(count<=controlCounts[line],'Additional certificate exception: '+line);
const framework404Comparison={evidence:comparisonEvidence,exactCountsEqual:false,observedErrorKindsEqual:true,certificateHasNoMoreOccurrencesOfAnyObservedKind:true,controlExceptions:control.firstRequest.exceptions.length,certificateExceptions:certificate.firstRequest.exceptions.length,unresolved:true,limitation:'The independent Atlas404 has six inspector exceptions and certificate404 has five: the same not-found, RSC and stream error kinds, with one fewer generic RSC exception. These nonzero errors remain unresolved. The strict exact-count suite is retained failed; only the guest-core prerequisite criteria are verified.'};
const actualCases=[control,certificate,...probes.cases];
const syntheticCounts=[];
for(const [i,mode]of ['control','cert','embed','pilot'].entries()){
  const c=actualCases[i];assert.equal(c.mode,mode);assert.equal(c.firstRequest.passing,true);assert.equal(c.firstRequest.storageError,false);
  if(mode==='embed'||mode==='pilot')assert.equal(c.firstRequest.unexpectedCount,0);
  assert.equal(c.firstRequest.response.status,{control:404,cert:404,embed:503,pilot:422}[mode]);
  assert.equal(c.firstRequest.source.sha256,hash(sourceFile));assert.equal(c.firstRequest.build.sha256,receipts.production.sha256);
  assert.equal(c.cleanup.code,0);assert(c.driverTerminal);assert.equal(c.cleanupReceipt.remainingOwned,0);assert.equal(c.cleanupReceipt.listeners,0);assert.equal(c.cleanupReceipt.inspectorListeners,0);
  assert.equal(c.handle.privateStateCopied,false);assert.equal(c.handle.ownerPreviewChanged,false);
  assert.deepEqual(json(c.stage+'/FIRST_REQUEST.json'),c.firstRequest);
  if(mode==='control')continue;
  const files=[];const walk=p=>{for(const e of fs.readdirSync(p,{withFileTypes:true})){assert(!e.isSymbolicLink());if(e.isDirectory())walk(p+'/'+e.name);else if(e.name.endsWith('.sqlite'))files.push(p+'/'+e.name);}};
  walk(c.stage+'/local-state/v3/d1');const databases=files.filter(p=>!p.endsWith('/metadata.sqlite'));assert.equal(databases.length,1,'Exactly one owned synthetic D1 database');
  const db=new DatabaseSync(databases[0],{readOnly:true});
  try{
    const tables=new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r=>r.name));
    assert(tables.has('users')&&tables.has('courses')&&tables.has('pilot_applications'));
    const count=Number(db.prepare('SELECT count(*) AS n FROM pilot_applications').get().n);assert.equal(count,0);
    syntheticCounts.push({mode,pilotApplications:count,requiredCoreAndPlatformTablesPresent:true});
  }finally{db.close();}
}
const inputs=json(source.website+'/atlas-review/integration-inputs.json');assert.equal(inputs.inputs.length,1816);
for(const r of inputs.inputs)assert.equal(hash(source.website+'/'+r.path),r.sha256,r.path);
for(const p of ['db/bootstrap.ts','db/platform.ts','lib/public-education-search.ts','lib/lecture-anatomy-reference.ts','lib/lecture-related-links.ts','app/api/institutions/pilot/route.ts','app/api/embed/session/route.ts','app/certificates/[code]/page.tsx','package.json','package-lock.json'])assert.equal(hash(source.website+'/'+p),hash(baseline.website+'/'+p),p);
for(const [repo,head]of [['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'],[source.atlas,'27b341001718b7d5bb4f45aad0c8d8784e287c3b']])assert.equal(execFileSync('git',['-C',repo,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(),head);
const originalFailure=ref('F:/VisibleMedicine/staging/20261025-head-search-guest-baseline-preview/FIRST_REQUEST.json','aa053b87eab078f97ea2e73ca769c94702b59f23dc96fb1caeff519f94388cb7');
assert(json(originalFailure.path).exceptions.some(x=>/D1_ERROR|no such table/i.test(x.description)));
const testFailure=ref('F:/VisibleMedicine/staging/20261025-head-search-guest-core-website/checks/search-whole-roots-attempt-1/RESULT.json','366b2bfe9c42c0fd25f84f2a25c28dc5f52fff7efffc0a3601bcb749860944d8');
assert.equal(json(testFailure.path).passing,false);
const index=json('CURRENT_CHECKPOINT.json');assert.deepEqual(index.activeWork.current.activeExecutionSessions,[]);assert.equal(index.activeWork.current.ownerPreviewPolicy.restartPermitted,false);
const result={schema:'vm-guest-core-final-verification/1',at:new Date().toISOString(),passing:true,passingScope:'Guest-core prerequisite ordering and unchanged negative guest responses; not general404 rendering or full-suite reliability.',source:ref(sourceFile),baseline:ref(baselineFile),sourcePaths:6859,exactChangedPaths:changed,receipts,wholeCurrentRoots:9,wholeCurrentCases:51,fullTypeRoots:types.roots,fullTypeFiles:types.files,diagnostics:0,actualStockProductionArtifacts:1142,completeBothProductionModuleInversesVerified:true,allOtherSqlJwtAccessPublicationRateAlgorithmAndRouteBytesPreserved:true,all1816ProtectedReviewInputsPreserved:true,nativeModelsLicencesDependenciesAndOtherFrontendBytesPreserved:true,coreAndPlatformSchemaInitializerSourcesUnchanged:true,anonymousUserProvisioningNotIntroduced:true,actualFreshNegativeRequests:{certificateNotFound:true,embedWithoutSecret503:true,emptyPilot422:true,schemaErrors:0,embedAndPilotUnexpectedExceptions:0,syntheticCounts},framework404Comparison,retainedFirstOverstrict404Observer:ref('F:/VisibleMedicine/staging/20261025-guest-negative-probes-suite/RESULT.json'),retainedMinifiedErrorNameObserverFailure:ref('F:/VisibleMedicine/staging/20261025-guest-api-negative-suite/RESULT.json'),observerCorrection:'Accept a valid minified JavaScript class name with the exact existing error message, exact negative HTTP/body contract, and zero D1 or other-message exceptions; fresh v3 state/probes executed. No production change for observer repair.',retainedOriginalCertificateColdD1Failure:originalFailure,retainedFirst50Pass1TestRoleFailure:testFailure,originalSearchMissingSeamRefusalStillAsserted:true,ownedProbeProcessesClosed:true,realApplicationsEmailsTokensIdentitiesOrPrivateStateUsed:false,ownerPreviewChanged:false,installed:false,publicDeployment:false,clinicalApproval:false,patientSpaceRegistration:false,fullStockSuitePassing:false,original316StockFailuresAnd3SkipsUnadjusted:true,fullSignedInPaidImageGeometryOrClinicalAcceptance:false,requirements:71,optionalIdeas:8};
fs.writeFileSync(stage+'/VERIFICATION_SUMMARY.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({verification:stage+'/VERIFICATION_SUMMARY.json',sha256:hash(stage+'/VERIFICATION_SUMMARY.json'),wholeCases:51,fullTypeRoots:types.roots,fullTypeFiles:types.files,stockArtifacts:1142,freshGuestRequests:3}));
