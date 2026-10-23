// Main-owned source-bound successor recovery. Does not install or launch it.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {saveProposal,finalizeProposal} from './source-proposal-checkpoint.mjs';

const stage='F:/VisibleMedicine/staging/20261023-head-pan-bound',site=stage+'/website';
const file=stage+'/SOURCE_BOUND.json',digest='d41eecb7d72f96eaa52b4ac494646e58cbd075f32ad337b26d309ff277fa1d2a';
assert.equal(sha(read(file)),digest);
const source=json(file),parent=json(source.parentReceipt),history='tests/fixtures/head-pan-binding-before/';
const thinCheckpoint='F:/VisibleMedicine/recovery/checkpoints/20261023-head-pan-interruption/checkpoint.json';
function hash(p){const h=createHash('sha256'),fd=fs.openSync(p,'r'),b=Buffer.alloc(65536);try{let n;while((n=fs.readSync(fd,b,0,b.length,null)))h.update(b.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');}
const authored=['components/HeadAtlasViewer.tsx','tests/head-slice-keyboard.test.ts','tests/head-slice-zoom.test.ts','tests/head-pan-interruption.test.ts','tests/head-pan-source-transition.test.ts','tests/current-ui-delivery-transition.test.mjs','tests/window-drag-review-binding.test.mjs','tests/head-pan-current-admission.mjs','tests/head-pan-review-binding.test.mjs'];
const rows=authored.map(p=>source.sourceRows.find(r=>r.path===p));assert(rows.every(Boolean));
function verify(){
 assert.equal(hash(file),digest);assert.equal(hash(source.parentReceipt),source.parentReceiptSha256);
 assert.equal(hash(thinCheckpoint),'3ac17f3dca58b9c18f1291907e56caf537703dc794864c3dc60d22bb25925db0');
 assert.equal(source.sourcePaths,6162);assert.equal(source.nativeCasesPassed,96);
 for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,'Current source '+r.path);
 assert.equal(hash(source.buildArtifacts),source.buildArtifactsSha256);
 for(const r of json(source.buildArtifacts).files)assert.equal(hash(site+'/dist/'+r.path),r.sha256,'Current output '+r.path);
 for(const r of parent.sourceRows)assert.equal(hash(parent.website+'/'+r.path),r.sha256,'Parent source '+r.path);
 for(const r of json(parent.buildArtifacts).files)assert.equal(hash(parent.website+'/dist/'+r.path),r.sha256,'Parent output '+r.path);
 for(const r of source.checks){const dir=stage+'/checks/'+r.phase;assert.deepEqual(json(dir+'/TERMINAL.json'),r);assert.equal(hash(dir+'/stdout.log'),r.stdoutSha256);assert.equal(hash(dir+'/stderr.log'),r.stderrSha256);assert.equal(r.exitCode,r.expectedExit);}
 for(const [root,head]of [['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'],['F:/VisibleMedicine/staging/20261023-digital-vein-ultrasound/atlas','ed3c8cc0e99f6cf850a915d7a08de2e6489c1b6f']])assert.equal(runGit(['-C',root,'rev-parse','HEAD']).toString().trim(),head);
 assert.equal(runGit(['-C',source.atlas,'rev-parse','HEAD']).toString().trim(),source.atlasHead);
 assert.equal(runGit(['-C',source.atlas,'rev-parse','HEAD^{tree}']).toString().trim(),source.atlasTree);
 assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
}
const pending='Keep the owner preview unchanged: no installation, restart, tab refresh or repeated request. Latest coherent Website is F:/VisibleMedicine/staging/20261023-head-pan-bound/SOURCE_BOUND.json d41eecb7: 6,162 inputs, 1,735 bound Review inputs, 96 targeted cases and actual prebuild/production builds pass. The pan component has exact source-bound integration; no decisions migrated. Keep separate ed3c8cc0 teaching draft for later coherent integration. Continue full 71/eight roadmap; full-project/component semantic typing remains resource-failed, wider release/current feature gates/authenticated/GPU/native-pointer and clinical acceptance remain open. Preserve source/rights/privacy/independent-entitlement/specialist/PACS gates; semantic comparison is not patient-space registration.';
const localArtifacts=['SOURCE_BOUND.json','PREPARATION.json','CAPTURE.json','BUILD_ARTIFACTS.json'].map(p=>[stage+'/'+p,p]);
for(const r of source.preimages)localArtifacts.push([site+'/'+r.preserved,'preimages/'+r.path+'.raw']);
for(const r of source.checks)for(const n of fs.readdirSync(stage+'/checks/'+r.phase))localArtifacts.push([stage+'/checks/'+r.phase+'/'+n,'checks/'+r.phase+'/'+n]);
localArtifacts.push([thinCheckpoint,'prior-pan/checkpoint.json']);
for(const n of ['STARTED.json','TERMINAL.json','stdout.log','stderr.log'])localArtifacts.push(['F:/VisibleMedicine/staging/20261023-head-pan-interruption/checks/focused-types/'+n,'prior-pan/focused-types/'+n]);
const review={...source,sourceRows:undefined,sourceReceipt:file,sourceReceiptSha256:digest,
 integration:'Only the exact HeadAtlasViewer presentation hash changes among all 1,735 bound inputs. Source commit/tree, binder and contrast-drag helper stay exact. Stale verification refuses the changed component before actual rebind/viewer production build and Review verification. Body/shoulder presentation revisions recompute from unchanged source revisions and the new Website hash. No saved decision was read or migrated.',
 contracts:'96 focused native cases pass with zero skips/cancellations. Includes 38 pan/keyboard/zoom/viewport/source-transition cases, the unchanged 41-case delivery contract, three earlier UI transition checks, six contrast-binding checks and eight exact pan-binding checks. The actual delivery validator stays byte-exact. Prior test adaptations have complete whole-file inverses; only the captured pin and explicit exact pan presentation role change.',
 preservation:'6,162 named source paths and 1,110 independently hashed production outputs. Atlas source/learner modules, model paths, teaching, lecture catalogue, packages, notices and access inputs remain unchanged. Protected Review viewer retains 46 files/22 exact packages and no personal records. Obsolete viewer chunks are replaced only in the fresh staging copy; prior complete source/build bytes survive.',
 limits:'Production build passes with chunk-size, plugin timing and route-classification warnings retained. The prior component semantic overlay and full-project type checks exhausted 384 MiB before diagnostics; no semantic pass or blind heap escalation. Existing synthetic real-React pan probes use a pointer-capture test double, not native trusted-pointer, authenticated full Website, scan/GPU or clinical acceptance. Full release/current feature gates remain open.',
 pending,previewChanged:false,installed:false,full71AndEightPreserved:true};
const recipes=['bind-head-pan-candidate-20261023.mjs','checkpoint-head-pan-bound-20261023.mjs'];
const c={id:'head-pan-bound-20261023',root:'F:/VisibleMedicine/recovery/checkpoints/20261023-head-pan-bound',stage,site,key:'latestWebsiteCandidate',rows,verify,review,localArtifacts,
 remoteArtifacts:[...recipes.map(p=>['coordination/'+p,path.resolve(p)]),...rows.map(r=>['candidate/'+r.path,site+'/'+r.path]),...['tests/current-ui-delivery-transition.test.mjs','tests/window-drag-review-binding.test.mjs'].map(p=>['preimages/'+p+'.raw',site+'/'+history+p+'.raw'])],
 parent:{receipt:'F:/VisibleMedicine/recovery/checkpoints/20261023-head-pan-interruption-source-backup/github-backup.json',receiptSha256:'1328b2ceba89985e546793b0cce51cd2c6ecac31b2c9b9c6c3afe1987532e834',repo:'F:/VisibleMedicine/history/website-work/github-head-pan-interruption-20261023.git'},
 backupRepo:'F:/VisibleMedicine/history/website-work/github-head-pan-bound-20261023.git',sourceIdentity:{sourceReceiptSha256:digest,atlasHead:source.atlasHead,atlasTree:source.atlasTree},
 backupScope:'Inherited independently verified filtered source plus two authored composition/recovery recipes, nine selected authored component/test files and two authored whole-test preimages. All generated Review/viewer/runtime/model/build/catalogue/pin/revision metadata, private data/decisions/scans/masks/identifiers, browser media, raw logs and type evidence stay F-only. Not whole/private/runnable off-device recovery. No installation/server/restart/refresh/public deployment, fees, authentication/entitlement/permission change or clinical/spatial approval.',
 proof:{sourcePaths:6162,reviewInputs:1735,reviewSourceFiles:1567,onlyBoundInputDelta:'components/HeadAtlasViewer.tsx',staleBindingRefused:true,wholeTestInversesVerified:true,targetedNativeCasesPassed:96,zeroSkipsOrCancellations:true,viewerFiles:46,viewerPackages:22,actualPrebuildPassed:true,actualProductionBuildPassed:true,buildFiles:1110,privateDecisionsReadOrMigrated:false,fullProjectTypesPassing:false,nativeTrustedPointerAcceptance:false,authenticatedAcceptance:false},
 milestone:'Native image pan fix composed into a source-bound production-built Website/Review successor, with the running preview unchanged',pending,
 summary:{website:site,sourceReceipt:file,sourceReceiptSha256:digest,sourcePathsTotal:6162,atlas:source.atlas,atlasHead:source.atlasHead,atlasTree:source.atlasTree,reviewInputs:1735,reviewBindingSha256:source.reviewBindingSha256,reviewSourceFiles:1567,viewerFiles:46,viewerPackages:22,targetedNativeCasesPassed:96,actualPrebuildPassed:true,actualProductionBuildPassed:true,buildManifest:source.buildArtifacts,buildManifestSha256:source.buildArtifactsSha256,buildFiles:1110,fullProjectTypesAndAuthenticatedAcceptancePending:true,fullReleasePending:true,previewChanged:false,installed:false}};
if(process.argv.includes('--finalize')){
 const result=finalizeProposal(c),p=json('CURRENT_CHECKPOINT.json');p.next=pending;p.activeWork.current.next=pending;p.activeWork.current.beforeFurtherWork=pending;
 Object.assign(p.activeWork.current.pendingHeadPanInterruption,{reviewBindingAndIntegrationPending:false,composedInto:file});
 p.activeWork.updated=new Date().toISOString();const b=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(b)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',b);console.log(JSON.stringify({...result,pointerBytes:Buffer.byteLength(b)}));
}else console.log(JSON.stringify(saveProposal(c)));
