import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {saveProposal} from './source-proposal-checkpoint.mjs';import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261024-guided-review-completeness',file=stage+'/PROOF_BOUND.json',digest=process.argv[2];
assert.equal(digest,'58f9008850632b65a0919114fe59c1acab82ac862132f68c0af9c6f1645b8960');assert.equal(hash(file),digest);
const s=json(file),rows=s.newPaths.map(p=>s.sourceRows.find(r=>r.path===p)),site=s.website;
const historical='F:/VisibleMedicine/staging/20261024-adjacent-native-execution',worker=json(historical+'/RECEIPT.json');
function verify(){
 assert.equal(hash(file),digest);assert.equal(hash(s.parentReceipt),s.parentReceiptSha256);
 for(const row of s.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
 for(const row of s.evidence)assert.equal(hash(stage+'/'+row.path),row.sha256,row.path);
 assert.equal(hash(s.historicalAdjacentAudit),s.historicalAdjacentAuditSha256);
 for(const row of worker.files)assert.equal(hash(historical+'/website/'+row.path),row.currentSha256,row.path);
 const p=json('CURRENT_CHECKPOINT.json');assert.equal(p.activeWork.current.ownerPreviewPolicy.restartPermitted,false);assert.equal(p.activeWork.current.activeExecutionSessions.length,0);
 assert.equal(p.activeWork.current.latestWebsiteCandidate.sourceReceipt,s.parentReceipt,'Test-only evidence does not replace the complete Website candidate');
 for(const[at,head]of [[s.atlas,s.atlasHead],['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1']])assert.equal(execFileSync('git',['-C',at,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true,stdio:'pipe'}).trim(),head);
 assert.equal(execFileSync('git',['-C',s.atlas,'status','--porcelain'],{encoding:'utf8',windowsHide:true,stdio:'pipe'}).trim(),'');
}
const artifacts=new Map();const add=(from,to)=>{assert(!artifacts.has(to),to);artifacts.set(to,from);};
add(file,'PROOF_BOUND.json');for(const r of s.evidence)add(stage+'/'+r.path,r.path);
for(const name of ['RECEIPT.json','FINAL_VALIDATION.json','MAIN_REVIEW.json','REALIZE.json'])add(historical+'/'+name,'historical-proposal/'+name);
for(const row of worker.files)add(historical+'/website/'+row.path,'historical-proposal/website/'+row.path);
for(const row of worker.scripts)add(historical+'/'+row.path,'historical-proposal/scripts/'+row.path);
const walk=(dir,prefix)=>{for(const row of fs.readdirSync(dir,{withFileTypes:true})){assert(!row.isSymbolicLink());if(row.isDirectory())walk(dir+'/'+row.name,prefix+row.name+'/');else add(dir+'/'+row.name,prefix+row.name);}};
walk(historical+'/runs','historical-proposal/runs/');
for(const name of ['SHARED_HELPER_REVIEW.md','SHOULDER_PROVENANCE.md'])add('F:/VisibleMedicine/staging/20261024-adjacent-main-audit/'+name,'audit/'+name);
const earlier='F:/VisibleMedicine/recovery/checkpoints/20261021-four-modules-verified';
for(const name of ['checkpoint.json','evidence/COMMITTED.json','evidence/module-manifests/shoulder.json'])add(earlier+'/'+name,'independent-shoulder/'+name);
const recipes=['prepare-guided-review-proof-20261024.mjs','run-guided-review-proof-20261024.mjs','audit-adjacent-result-20261024.mjs','seal-guided-review-proof-20261024.mjs','compact-guide-proof-index-20261024.mjs','checkpoint-guided-review-proof-20261024.mjs','finish-guided-review-proof-20261024.mjs'];
for(const name of recipes)add(path.resolve(name),'recipes/'+name);
const remote=[...rows.map(row=>['website/'+row.path,site+'/'+row.path]),
 ...worker.files.filter(row=>!row.path.endsWith('.json.raw')).map(row=>['historical-proposal/'+row.path,historical+'/website/'+row.path]),
 ...recipes.map(name=>['recipes/'+name,path.resolve(name)])];
assert.equal(remote.length,31);
const proof={currentAtlas:s.atlasHead,currentTree:s.atlasTree,inheritedSourcePaths:6496,totalSourcePaths:6498,newTestPaths:2,
 actualImportedClosureFiles:1127,focusedCases:2,structures:1104,guidedStructures:320,guidePlacements:414,
 omissionsRejectedWithRecomputedTransportHashes:414,independentMutationRefusals:69,allInheritedSourceExact:true,productSourceChanges:false,
 historicalSource:s.historicalSource,historicalRoots:16,historicalCases:37,historicalProposalIntegrated:false,
 independentShoulderFixtureProvenanceVerified:true,workerFullHelperClosureSealsAtExecutionUnavailable:true,
 newTypesBuildBrowserPerformed:false,normalPreviewChanged:false,clinicalApproval:false,patientSpaceRegistration:false};
const pending='Keep current preview unchanged. Full71/eight goal remains active. Latest complete application stays Website40fd40cb/Atlas5f3/Reviewdc88d72f; current isolated2-test proof supplements guide completeness and authenticates source-specific Review refusal, not an installation. Main audited all24Release Reliability test edits/16roots37historical cases at genuine5e75, plus independent190a shoulder export provenance; those24edits are not yet integrated/current5f3 acceptance, and original per-run helper closures were not sealed. Preserve every historical theorem/inverse and mutation refusal when composing a later successor; do not infer107historic failures/3host skips resolved. Continue source-backed anatomy/teaching, linked CT/MRI/3D learning/assessment and uncluttered desktop Website/Studio/Review. A useful independent next item is keeping quiz next/score reachable with expanded source disclosures on short desktops. Keep clinical/private-study/AT/performance/full-release and console gates open; semantic comparison is not patient-space registration. No normal restart/install/tab refresh/repeated cutover question, public deployment, fees, access widening, private uploads, accepted-mask or desktop PACS changes. Do not stall independent work for clinical sign-off.';
const result=saveProposal({id:'guided-review-proof-20261024',key:'pendingGuidedReviewCompleteness',root:'F:/VisibleMedicine/recovery/checkpoints/20261024-guided-review-completeness',stage,site,rows,verify,
 review:{at:new Date().toISOString(),decision:'Retain the genuine historical Release Reliability evidence with explicit limits; add independent complete-membership and rehashed-omission refusal proof against the latest imported Atlas.',sourceReceipt:file,sourceReceiptSha256:digest,proof,
 limits:'Tests only, every6496inherited source byte unchanged. Two new native cases execute1127real imported files, all1104current worksheets and53tours/317steps. Expected guide membership is derived from the complete authenticated source tour bank, not supplied packets; old helper/theorems are byte-unchanged. First attempt mistook esbuild\'s declared export-only <stdin> bridge for application input; only that exact synthetic entry is exempted, all real files remain pinned. Scope audit initially found9retained keyboard-test child evidence files; each exact script/expected failing result was authenticated instead of ignoring .local. Historical16-root/37-case reports are independently log/source checked, not rerun at current5f3. All24worker edits remain isolated. No new production build/type/browser or clinical/private/access/registration approval.',pending},
 localArtifacts:[...artifacts.entries()].map(([to,from])=>[from,to]),remoteArtifacts:remote,
 parent:{receipt:'F:/VisibleMedicine/recovery/checkpoints/20261024-upper-vascular-website-source-backup/github-backup.json',receiptSha256:'872fe112e6916a06f91baeb4731ee3620305b9cf77b996bb197d193696bb396f',repo:'F:/VisibleMedicine/history/website-work/github-upper-vascular-website-20261024.git'},
 backupRepo:'F:/VisibleMedicine/history/website-work/github-guided-review-proof-20261024.git',
 sourceIdentity:{applicationSourceReceiptSha256:s.parentReceiptSha256,proofReceiptSha256:digest,atlasHead:s.atlasHead,atlasTree:s.atlasTree,normalPreviewChanged:false},
 backupScope:'Inherited5954independently verified filtered authored-source paths plus31explicit current/historical test-code and recipe paths. No removals. Generated metadata including two190aJSON.raw fixtures, models, scans, private references/decisions, raw logs, Review/build/dependency state and coordination documents remain F-local. Historical test-code selection is not integration or runnable off-device recovery. Not a whole/private/runnable backup.',proof,
 milestone:'Current guided Review completeness and historical regression-result audit',pending,
 coordinationUpdate:{cursor:'09786c67-a526-4f3e-9592-4f73d6c47d39:56',adjacentNativeAudit:{receipt:stage+'/ADJACENT_AUDIT.json',sha256:s.historicalAdjacentAuditSha256,historicalSource:s.historicalSource,roots:16,cases:37,mainSourceAuditCompleted:true,currentSourceIntegrationPending:true}},
 summary:{sourceReceipt:file,sourceReceiptSha256:digest,applicationSourceReceipt:s.parentReceipt,applicationSourceReceiptSha256:s.parentReceiptSha256,currentAtlas:s.atlasHead,currentCases:2,structures:1104,guidedStructures:320,guidePlacements:414,rehashOmissionRefusals:414,otherMutationRefusals:69,historicalProposalIntegrated:false,fullReleasePending:true}});
console.log(JSON.stringify(result));
