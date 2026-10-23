// Main-owned isolated Atlas teaching/recovery; no normal Website installation.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {saveProposal,finalizeProposal} from './source-proposal-checkpoint.mjs';
const stage='F:/VisibleMedicine/staging/20261023-digital-vein-ultrasound',site=stage+'/atlas';
const base='9e1407629bd6f85061537c9f013fd72e4543e0da',baseTree='9404fb39a8b08aff7ef5300d2ef963abd5639045';
const file=stage+'/SOURCE_DRAFT.json';
const authored=['app/body-content.ts','content/digital-vein-ultrasound.ts','lib/digital-vein-ultrasound.ts','docs/DIGITAL_VEIN_ULTRASOUND.md','scripts/test-digital-vein-ultrasound.mjs','scripts/check-digital-vein-us-types.mjs'];
const generated=['content/body-renderer-revision.json','content/body-review-display-pins.json','content/regional-teaching/hand.json'];
const git=(...a)=>runGit(['-C',site,...a]).toString().trim();
const phases=['regional-generate','display-pins-generate','renderer-generate','native','regional-check','display-pins-check','renderer-check','focused-types'];
function checkEvidence(){return phases.map(name=>{
 const dir=stage+'/checks/'+name,r=json(dir+'/TERMINAL.json');assert.equal(r.exitCode,0,name);
 assert.equal(sha(read(dir+'/stdout.log')),r.stdoutSha256);assert.equal(sha(read(dir+'/stderr.log')),r.stderrSha256);
 return{phase:name,receipt:dir+'/TERMINAL.json',sha256:sha(read(dir+'/TERMINAL.json'))};
});}
if(process.argv.includes('--capture')){
 assert(!fs.existsSync(file));assert.equal(git('rev-parse','HEAD'),base);checkEvidence();
 assert.deepEqual(git('diff','--name-only').split('\n').sort(),['app/body-content.ts',...generated].sort());
 assert.deepEqual(git('ls-files','--others','--exclude-standard').split('\n').sort(),authored.filter(p=>p!=='app/body-content.ts').sort());
 const rows=[...authored,...generated].sort().map(p=>({path:p,bytes:read(site+'/'+p).length,sha256:sha(read(site+'/'+p))}));
 git('add','--',...rows.map(r=>r.path));git('commit','-m','Add source-bound finger-vein ultrasound case comparisons');assert.equal(git('status','--porcelain'),'');
 const native=read(stage+'/checks/native/stdout.log').toString(),types=JSON.parse(read(stage+'/checks/focused-types/stdout.log'));
 assert.match(native,/tests 10/);assert.match(native,/pass 10/);assert.match(native,/fail 0/);assert.match(native,/skipped 0/);assert.match(native,/cancelled 0/);
 assert.equal(types.diagnostics,0);assert.equal(types.fullProject,false);
 const receipt={at:new Date().toISOString(),atlas:site,base,baseTree,head:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD^{tree}'),sourceRows:rows,checks:checkEvidence(),
  native:{tests:10,pass:10,fail:0,skipped:0,cancelled:0,changedPlacements:6,preservedPlacements:9930,changedWorksheets:6,mutationsRefused:282,forgedPacketsRefused:30,staleRequestsRefused:18,storageCalls:0,ssrSelections:6},focusedTypes:types,
  renderer:json(site+'/content/body-renderer-revision.json').sha256,normalUltrasoundIdentityValidated:false,clinicalApproval:false,spatialRegistration:false,websiteIntegrated:false,previewChanged:false,
  latestBuiltWebsite:'F:/VisibleMedicine/staging/20261023-window-drag-bound/SOURCE_BOUND.json',latestBuiltWebsiteSha256:'b3d5ddd1ace8d5bfe7ff9ce8abba0b3fca9254de37724956970321b4eee8b03a',
  limitation:'Six editorial case-comparison placements, not six independently validated normal vein ultrasound targets. Real source/patient imaging, browser/GPU, full-project/release and Website import/runtime/Review binding/build remain separate. Original preparation and test diagnostics retained.'};
 fs.writeFileSync(file,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:file,sha256:sha(read(file)),head:receipt.head,tree:receipt.tree,types:types.sourceFiles}));
 process.exit(0);
}
const source=json(file),digest=sha(read(file));
function verify(){
 assert.equal(sha(read(file)),digest);checkEvidence();
 for(const r of source.sourceRows)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 assert.equal(git('rev-parse','HEAD'),source.head);assert.equal(git('rev-parse','HEAD^{tree}'),source.tree);assert.equal(git('status','--porcelain'),'');
 assert.equal(runGit(['-C','F:/VisibleMedicine/staging/20261023-atlas-runtime-materialized/atlas','status','--porcelain']).toString().trim(),'');
 assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert.equal(sha(read(source.latestBuiltWebsite)),source.latestBuiltWebsiteSha256);
}
const pending='Keep the current preview unchanged. Latest full built Website remains b3d5ddd1 at F:/VisibleMedicine/staging/20261023-window-drag-bound/SOURCE_BOUND.json. Isolated Atlas finger-vein case-comparison draft is verified/source-checkpointed but not imported/built into Website; preserve source/rights/privacy/independent-access/specialist/PACS gates and do not migrate decisions. Continue full71/eight roadmap: coherent source-bound integration when appropriate, wider current release/types/authenticated/browser/GPU checks and source-supported anatomy/teaching. Remaining normal-vein ultrasound and composite perineal identity evidence gaps stay explicit; not clinical or spatial completion.';
const localArtifacts=[['SOURCE_DRAFT.json','SOURCE_DRAFT.json'],['PREPARED.json','PREPARED.json'],['INITIAL_TEST_DIAGNOSTIC.json','INITIAL_TEST_DIAGNOSTIC.json'],['preimages/body-content.ts.raw','preimages/body-content.ts.raw']].map(([a,b])=>[stage+'/'+a,b]);
for(const name of phases)for(const n of fs.readdirSync(stage+'/checks/'+name))localArtifacts.push([stage+'/checks/'+name+'/'+n,'checks/'+name+'/'+n]);
for(const n of fs.readdirSync(stage+'/preparation-diagnostic'))localArtifacts.push([stage+'/preparation-diagnostic/'+n,'preparation-diagnostic/'+n]);
localArtifacts.push(['F:/VisibleMedicine/staging/20261023-digital-vein-us-evidence/FINDINGS.md','research/digital-vein-FINDINGS.md'],['F:/VisibleMedicine/staging/20261023-perineal-primary-evidence/FINDINGS.md','research/perineal-FINDINGS.md']);
for(const folder of ['20261023-teaching-batch-selection','20261023-teaching-batch-selection-clinical','20261023-teaching-batch-selection-all'])for(const n of fs.readdirSync('F:/VisibleMedicine/staging/'+folder))localArtifacts.push(['F:/VisibleMedicine/staging/'+folder+'/'+n,'selection/'+folder+'/'+n]);
const recipes=['prepare-digital-vein-us-20261023.mjs','verify-digital-vein-us-20261023.mjs','checkpoint-digital-vein-us-20261023.mjs','select-teaching-batch-20261023.mjs'];
const c={id:'digital-vein-us-20261023',root:'F:/VisibleMedicine/recovery/checkpoints/20261023-digital-vein-ultrasound',stage,site,key:'pendingDigitalVeinUltrasound',rows:source.sourceRows,verify,localArtifacts,
 review:{...source,sourceReceipt:file,sourceReceiptSha256:digest,medicalEvidence:'Main read original SIUMB society-hosted 2008 Battaglia case. Only original factual case comparison/reading links; no article assets or prose, diagnostic rule-out or treatment advice. No located primary human evidence validates normal named proper digital veins or venous arches; those limits remain explicit. Perineal composite remains held pending, not expanded into clinical facts.',
  sourcePreservation:'Actual native test hashes every pre-existing tracked path against original Git blobs except exact resolver plus three independently checked producer outputs. Whole resolver inverse restores baseline. Other9930topic placements and1098worksheets identical; six changed teaching/material hashes, source fingerprints unchanged. No geometry/source labels/bundles/licences/held identities/quiz/tour/access/CT mask change. Renderer dependency revision changes honestly; no old geometry or teaching decision migration.',
  diagnostics:'First clone inherited CRLF, rejected lock-byte comparison; huge Buffer assertion diagnostic failed. Retained representative preimages/hashes, restored exact baseline bytes only in clean owned clone, rebuilt index, verified. First new test had guessed>300mutation count (actual282) and correctly rejected unregenerated display pins; exact count replaces guess, actual producers fix stale metadata, no validator weakened. Initial tool output truncated and explicitly labelled, final raw logs complete.',
  pending,full71AndEightPreserved:true},
 remoteArtifacts:[...recipes.map(p=>['coordination/'+p,path.resolve(p)]),...authored.filter(p=>!p.endsWith('.md')).map(p=>['atlas/'+p,site+'/'+p]),['preimages/body-content.ts.raw',stage+'/preimages/body-content.ts.raw']],
 parent:{receipt:'F:/VisibleMedicine/recovery/checkpoints/20261023-window-drag-bound-source-backup/github-backup.json',receiptSha256:'3bfc33ce459e96b5bdd0a35ee23d1f1897150c8c09866c62a53c415dc66145b5',repo:'F:/VisibleMedicine/history/website-work/github-window-drag-bound-20261023.git'},
 backupRepo:'F:/VisibleMedicine/history/website-work/github-digital-vein-us-20261023.git',sourceIdentity:{atlasHead:source.head,atlasTree:source.tree,base,sourceReceiptSha256:digest},
 backupScope:'Inherited verified filtered source plus five explicitly selected Atlas source/test files, four authored coordination/selection recipes and exact resolver preimage. Generated metadata, source maps/models, raw logs/research, Markdown evidence, decisions/scans/masks/identifiers/builds and canonical history excluded. Full source/metadata recovery is local F checkpoint only; not whole/private/runnable remote backup. No Website import/preview/restart/refresh/deploy or permission/fee/approval change.',
 proof:{native:source.native,focusedTypes:source.focusedTypes,threeActualProducersChecked:true,normalVeinVisibilityValidated:false,websiteIntegrated:false,allOtherSourceBytesExact:true,clinicalApproval:false},
 milestone:'Six source-bound digital-vein ultrasound case comparisons with explicit normal-visibility limits, real producer metadata and focused verification',pending,
 summary:{atlas:site,head:source.head,tree:source.tree,receipt:file,sha256:digest,nativePass:10,focusedTypeDiagnostics:0,websiteIntegrated:false,normalUltrasoundValidated:false}};
if(process.argv.includes('--finalize')){
 const result=finalizeProposal(c),p=json('CURRENT_CHECKPOINT.json');p.next=pending;p.activeWork.current.next=pending;p.activeWork.current.beforeFurtherWork=pending;
 const text=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(text)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',text);console.log(JSON.stringify({...result,pointerBytes:Buffer.byteLength(text)}));
}else console.log(JSON.stringify(saveProposal(c)));
