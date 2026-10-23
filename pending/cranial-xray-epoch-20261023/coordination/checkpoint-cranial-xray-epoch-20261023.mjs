// Save a test-only source-role/memory repair. Parent application stays sealed.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {saveProposal,finalizeProposal} from './source-proposal-checkpoint.mjs';
const stage='F:/VisibleMedicine/staging/20261023-cranial-xray-epoch',prep=json(stage+'/PREPARATION.json'),site=prep.website,parent=json(prep.parentReceipt);
const files=['tests/clinical-review-intracranial-arterial-xray.test.ts','tests/atlas-emitted-teaching.ts','tests/cranial-xray-current-epoch.mjs','tests/cranial-xray-current-epoch.test.mjs','tests/atlas-emitted-teaching-search.test.ts','tests/fixtures/cranial-xray-before/clinical-review-intracranial-arterial-xray.test.ts.raw','tests/fixtures/cranial-xray-before/atlas-emitted-teaching.ts.raw'];
const rows=files.map(path=>({path,bytes:read(site+'/'+path).length,sha256:sha(read(site+'/'+path))}));
const checks=['contract','feature','contract-v2','stream','stream-v2','feature-v2','types'];
const diagnostic='F:/VisibleMedicine/staging/20261023-cranial-current-gates';
const diagnosticHash='6f9fc0d9a878b22215a3090d7411c5771fd4b6115673200f32e1638b70cba1be';
function hash(p){const h=createHash('sha256'),fd=fs.openSync(p,'r'),b=Buffer.alloc(65536);try{let n;while((n=fs.readSync(fd,b,0,b.length,null)))h.update(b.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');}
function verify(){
 assert.equal(hash(prep.parentReceipt),prep.parentReceiptSha256);
 assert.equal(hash(diagnostic+'/TERMINAL_SUMMARY.json'),diagnosticHash);
 for(const r of rows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
 for(const r of prep.rows)if(!files.includes(r.path))assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
 for(const r of parent.sourceRows)assert.equal(hash(parent.website+'/'+r.path),r.sha256,'Sealed parent '+r.path);
 assert.equal(hash(parent.buildArtifacts),parent.buildArtifactsSha256);
 for(const r of json(parent.buildArtifacts).files)assert.equal(hash(parent.website+'/dist/'+r.path),r.sha256,'Sealed build '+r.path);
 for(const phase of checks){const dir=stage+'/checks/'+phase,t=json(dir+'/TERMINAL.json');assert.equal(hash(dir+'/stdout.log'),t.stdoutSha256);assert.equal(hash(dir+'/stderr.log'),t.stderrSha256);}
 for(const[phase,count]of [['contract-v2',3],['stream-v2',5],['feature-v2',1]]){const t=json(stage+'/checks/'+phase+'/TERMINAL.json');assert.equal(t.exitCode,0);assert.equal(t.counts.pass,count);assert.equal(t.counts.fail+t.counts.skipped+t.counts.cancelled,0);}
 assert.equal(json(stage+'/checks/feature/TERMINAL.json').resourceFailure,true);
 assert.equal(json(stage+'/checks/types/TERMINAL.json').exitCode,0);
 const types=json(stage+'/checks/types/RESULT.json');assert.equal(types.diagnosticCount,0);assert.equal(types.sourceFiles.length,569);for(const r of types.sourceFiles)assert.equal(hash(r.path),r.sha256);
 assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert.equal(runGit(['-C',prep.atlas,'rev-parse','HEAD']).toString().trim(),parent.atlasHead);assert.equal(runGit(['-C',prep.atlas,'status','--porcelain']).toString().trim(),'');
}
const pending='Keep the owner preview unchanged; latest full built Website remains d41eecb7, not this test-only overlay. Integrate the verified X-ray source-role/streamed-check repair in the next coherent candidate. Actual twelve-structure X-ray/Review feature case now passes at128MiB, with eight supporting cases and focused569-file types; not full release/types/browser acceptance. Next repair the actual neonatal current tour-role gates and bounded-memory execution, preserving historical51/309 versus current hamstring/renal composition and every refusal assertion. Initial omitted private-code-map fixture and corrected128MiB inbox OOM remain recorded. Keep separate ed3c8cc0 teaching draft for later integration and full71/eight roadmap, source/rights/privacy/independent-access/specialist/PACS gates; no approval/registration or normal-preview cutover.';
const localArtifacts=[[stage+'/PREPARATION.json','PREPARATION.json']];
for(const phase of checks)for(const n of fs.readdirSync(stage+'/checks/'+phase))localArtifacts.push([stage+'/checks/'+phase+'/'+n,'checks/'+phase+'/'+n]);
for(const n of fs.readdirSync(diagnostic))if(fs.statSync(diagnostic+'/'+n).isFile())localArtifacts.push([diagnostic+'/'+n,'actual-cranial-gate-diagnosis/'+n]);
const review={at:new Date().toISOString(),parentReceipt:prep.parentReceipt,parentReceiptSha256:prep.parentReceiptSha256,sourceRows:rows,
 behavior:'No application behavior changes. Original X-ray test current-source literal6d7 becomes an independently validated current delivery plus exact original6d7 tree/ancestor/four-feature-byte proof. Every original source/learner/Review/teaching/forgery/stale-revision assertion survives under a complete whole-test inverse with declared CRLF normalization.',
 memory:'Original whole-script concatenation exhausted128MiB after the source gate was corrected. New emittedTeachingSearch preserves manifested DFS order and the original joined-string search, including inter-file newline/UTF8 chunk boundaries. It rehashes all reachable scripts on every query, including after an early match; no aggregate retained script string. Original emittedTeaching implementation survives in full at its original role. The actual entire twelve-structure feature test then passes at the same128MiB cap. No larger-heap retry.',
 verification:'Nine distinct native cases across three source-bound runs: actual feature1, exact epoch/inverse/refusal support3 and bounded-search/hash/reachability/preservation support5; zero skipped/cancelled. Focused semantic types pass three affected TypeScript roots plus six original ambient declarations,569dependency files/zero diagnostics. Not full-project types or a fresh combined-nine run. An initial new inverse test added an extra newline; corrected only that test harness, preserving the first4/5run.',
 diagnosis:'Read-only worker checked real current files, not historical preimages. X-ray first gate was stale6d7 versus validated9e14. Neonatal first gate is current3c5647 regional tours versus historicalfb65. Its initial contained inbox fixture omitted three required selected.local code maps; correcting those exact inputs produced128MiBheap failure before assertions, not an authentic inbox pass/failure or clinical result. Worker stdout/stderr/summary remain F-only.',
 preserved:'All6,162parent source and1,110built-output hashes are independently retained; actual product/Review bindings, Atlas runtime/models/teaching, scans/masks, dependencies/notices, auth/entitlements and saved decisions stay unchanged. Local directory junctions are read-only inputs; no server, preview restart, installation, tab refresh or hosted publication. Separate ed3c8cc0Atlas draft is not integrated.',
 full71AndEightPreserved:true,productChanged:false,previewChanged:false,installed:false,pending};
const recipes=['prepare-cranial-xray-epoch-20261023.mjs','verify-cranial-xray-epoch-20261023.mjs','check-cranial-xray-types-20261023.mjs','checkpoint-cranial-xray-epoch-20261023.mjs'];
const c={id:'cranial-xray-epoch-20261023',root:'F:/VisibleMedicine/recovery/checkpoints/20261023-cranial-xray-epoch',stage,site,key:'pendingCranialXrayEpoch',rows,verify,review,localArtifacts,
 remoteArtifacts:[...recipes.map(p=>['coordination/'+p,path.resolve(p)]),...rows.map(r=>['tests/'+r.path,site+'/'+r.path])],
 parent:{receipt:'F:/VisibleMedicine/recovery/checkpoints/20261023-head-pan-bound-source-backup/github-backup.json',receiptSha256:'1a8898e6be43492b7fbc0d13a29d69bc9841189a72c2b9f3208171cbf088739c',repo:'F:/VisibleMedicine/history/website-work/github-head-pan-bound-20261023.git'},
 backupRepo:'F:/VisibleMedicine/history/website-work/github-cranial-xray-epoch-20261023.git',sourceIdentity:{parentReceiptSha256:prep.parentReceiptSha256,atlasHead:parent.atlasHead,atlasTree:parent.atlasTree},
 backupScope:'Inherited verified filtered source plus seven authored test/helper/whole-preimage files and four authored coordination/verification/recovery recipes. All generated binding/runtime/model/build/catalogue/pin metadata, raw resource/type/browser/coordination evidence, private code maps/data/decisions/scans/masks/identifiers and canonical ancestry stay F-only. Not whole/private/runnable off-device recovery. No application changes, installation/server/restart/refresh, public deployment, fee, permission/access/identity or approval change.',
 proof:{testOnly:true,productChanged:false,actualXrayFeatureCasePassed:true,structures:12,supportCasesPassed:8,nativeHeapMiB:128,aggregateStringOOMRetained:true,streamEquivalenceAndTamperRefusal:true,wholeOriginalTestAndHelperInverses:true,focusedTypeRoots:3,focusedTypeFiles:569,focusedTypeDiagnostics:0,fullProjectTypesPassing:false,wholeSuitePassing:false,unchangedParentSourcePaths:6162,unchangedParentBuildFiles:1110,neonatalSourceAndMemoryGatesStillOpen:true},
 milestone:'Current intracranial arterial X-ray/Review verification restored with exact historical preservation and bounded-memory emitted-content checks',pending,
 summary:{website:site,parentBuiltWebsite:parent.website,parentReceipt:prep.parentReceipt,parentReceiptSha256:prep.parentReceiptSha256,actualFeatureCasePassed:true,structures:12,supportCasesPassed:8,nativeHeapMiB:128,focusedTypeDiagnostics:0,focusedTypeFiles:569,testOnly:true,productChanged:false,fullIntegrationPending:true,neonatalGateDiagnosis:diagnostic+'/TERMINAL_SUMMARY.json',neonatalGateDiagnosisSha256:diagnosticHash}};
if(process.argv.includes('--finalize')){
 const result=finalizeProposal(c),p=json('CURRENT_CHECKPOINT.json');p.next=pending;p.activeWork.current.next=pending;p.activeWork.current.beforeFurtherWork=pending;
 const b=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(b)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',b);console.log(JSON.stringify({...result,pointerBytes:Buffer.byteLength(b)}));
}else console.log(JSON.stringify(saveProposal(c)));
