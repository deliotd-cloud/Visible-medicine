import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {saveProposal} from './source-proposal-checkpoint.mjs';
import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261023-fda-shoulder-ingestion';
const file=stage+'/SOURCE_BOUND.json',s=json(file),digest=hash(file),site=s.atlas;
const rows=[...s.changed,...s.added].map(p=>s.sourceRows.find(r=>r.path===p));assert(rows.every(Boolean));
const release='F:/VisibleMedicine/staging/20261023-thoracic-proof-current',r=json(release+'/SEALED_RECEIPT.json');
const parentWebsite='F:/VisibleMedicine/staging/20261023-midfoot-website',w=json(parentWebsite+'/SOURCE_BOUND.json');
const releaseReceiptHash='5a9a19f9c3a8dc90047d4cdd0483acbe3d126171d9376f1d23f840880b022aab';
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true,stdio:'pipe',maxBuffer:32e6}).trim();
function verify(){
 assert.equal(hash(file),digest);assert.equal(hash(release+'/SEALED_RECEIPT.json'),releaseReceiptHash);
 for(const p of s.sourceRows)assert.equal(hash(site+'/'+p.path),p.sha256,p.path);
 for(const p of w.sourceRows)assert.equal(hash(w.website+'/'+p.path),p.sha256,p.path);
 assert.equal(hash(parentWebsite+'/SOURCE_BOUND.json'),'02293636ab03d8631787b98d1a1c0c2d8593cdf0008f75159bc4e87fba60de16');
 for(const [p,h]of [[s.verification,s.verificationSha256],[s.inventory,s.inventorySha256],[s.acquisition,s.acquisitionSha256]])assert.equal(hash(p),h);
 for(const row of json(s.acquisition).files)assert.equal(hash(path.dirname(s.acquisition)+'/'+row.name),row.sha256);
 assert.equal(git(site,'rev-parse','HEAD'),s.head);assert.equal(git(site,'status','--porcelain'),'');
 assert.equal(git(s.parent,'rev-parse','HEAD'),s.parentHead);assert.equal(git(s.parent,'status','--porcelain'),'');
 assert.equal(hash(release+'/'+r.proposal.candidateRoot),r.proposal.candidateRootSha256);
 assert.equal(hash(release+'/'+r.proposal.forwardPatch),r.proposal.forwardPatchSha256);
 assert.equal(hash(w.website+'/tests/'+r.proposal.candidateRoot),r.baseline.originalRootSha256);
 for(const [name,h]of Object.entries(r.currentClinicalTestSha256))assert.equal(hash(w.website+'/tests/'+name+'.test.ts'),h);
 for(const [name,h]of Object.entries(r.originalClinicalFixtureSha256))assert.equal(hash(w.website+'/tests/fixtures/'+name+'-before-current190.test.ts.raw'),h);
 for(const check of r.checks)assert.equal(hash(release+'/'+check.log),check.logSha256);
 assert.match(fs.readFileSync(release+'/candidate.tap','utf8'),/# pass 4\r?\n# fail 0/);
 assert.match(fs.readFileSync(release+'/baseline.tap','utf8'),/# pass 0\r?\n# fail 4/);
 for(const [root,head]of [['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1']])assert.equal(git(root,'rev-parse','HEAD'),head);
}
const recipes=['acquire-fda-shoulder-20261023.mjs','prepare-fda-shoulder-source-20261023.mjs','inspect-fda-shoulder-20261023.mjs','seal-fda-shoulder-source-20261023.mjs','checkpoint-fda-shoulder-source-20261023.mjs'];
const localArtifacts=['PREPARED.json','SOURCE_BOUND.json','VERIFICATION.json','SOURCE_INVENTORY.json','PUBLISHER_NOTES.txt','INSPECT_BEFORE_WINDOWS_URL.mjs'].map(p=>[stage+'/'+p,p]);
localArtifacts.push([stage+'/CHECKPOINT_BEFORE_CRLF.mjs','CHECKPOINT_BEFORE_CRLF.mjs']);
for(const p of fs.readdirSync(release))if(fs.statSync(release+'/'+p).isFile())localArtifacts.push([release+'/'+p,'release-proposal/'+p]);
localArtifacts.push([s.acquisition,'public-quarantine/ACQUIRED.json']);
for(const row of json(s.acquisition).files)localArtifacts.push([path.dirname(s.acquisition)+'/'+row.name,'public-quarantine/'+row.name]);
const proof={nativeInventoryTests:21,inventoryTestFailures:0,sourceParts:7,sourceMeshElements:json(s.inventory).parts.reduce((n,p)=>n+p.elementCount,0),sourceConnectivityAndIdentitiesChecked:true,publisherCodeExecuted:false,solverRun:false,geometryExported:false,geometryAdmitted:false,constructedCartilageDistinguished:true,assemblyTransformsApplied:false,unitsOrSideInferred:false,parentAtlasFilesUnchanged:s.unchangedParentFiles,allParentWebsiteInputsUnchanged:w.sourceRows.length,thoracicPreservationProposalNativePasses:4,thoracicPreservationInitialFailures:4,thoracicWholeRootInversePass:1,thoracicClinicalSuitesRerun:false,thoracicProductAndClinicalTestsUnchanged:true,thoracicProposalInstalled:false,newRuntimeAssetsDependenciesFees:false,clinicalApproval:false,patientSpaceRegistration:false};
const pending='Keep the normal preview unchanged. Latest COMPLETE Website remains the sealed midfoot candidate 02293636 and Atlas 2ab63; the FDA branch adds source-only inventory tooling, not a rebuilt/Review-bound learner or new meshes. Next verify quadratic-tetrahedron boundary extraction and assembly transform order/units/side from primary specifications, audit generated surfaces and create a separate exact-source FDA shoulder reference without fitting it to BodyParts3D. Do not turn the constructed cartilage or muscle connectors into donor-segmented tissue. All old source holds remain. Integrate the one-file thoracic historical-preservation proposal during a future isolated Website successor, preserving exact fixtures and all product assertions; the four underlying clinical suites still require their own current run. Continue the entire71requirements/eightideas roadmap and safe independent development without awaiting clinical sign-off; no deployment, restart, new fees/access, private uploads, accepted mask edits or desktop PACS changes.';
console.log(JSON.stringify(saveProposal({id:'fda-shoulder-source-20261023',key:'pendingFdaShoulderSource',root:'F:/VisibleMedicine/recovery/checkpoints/20261023-fda-shoulder-source',stage,site,rows,verify,
 review:{at:new Date().toISOString(),decision:'Source-only ingestion tooling verified; public model remains quarantined, not learner-admitted. Thoracic test-root proposal reviewed and pending future integration.',sourceReceipt:file,sourceReceiptSha256:digest,atlasHead:s.head,atlasTree:s.tree,releaseReceipt:release+'/SEALED_RECEIPT.json',releaseReceiptSha256:releaseReceiptHash,proof,initialCheckpointFailure:'Evidence reader expected LF while native TAP used CRLF. Preimage retained; only optional CR recognition added, identical 4/0 and 0/4 count assertions retained. No source/test/log or native result changed.',limits:'No geometry conversion, clinical/side/unit validation, body or scan alignment, runtime/Review binding, build, browser, signed-in, whole-suite or release acceptance. Word notes were read as OOXML text, not visually reviewed; no installed desktop LibreOffice was used.',pending},
 localArtifacts,
 remoteArtifacts:[...recipes.map(p=>['coordination/'+p,path.resolve(p)]),...rows.map(p=>['atlas/'+p.path+(p.path.endsWith('.md')?'.raw':''),site+'/'+p.path]),...['thoracic-teaching-role-preservation.test.mjs','verify-root-patch.test.mjs','candidate-loader.mjs','derive-prior-expected.mjs'].map(p=>['release-proposal/'+p,release+'/'+p]),[ 'release-proposal/thoracic-root.preimage.raw',release+'/'+r.proposal.preimage]],
 parent:{receipt:'F:/VisibleMedicine/recovery/checkpoints/20261023-midfoot-website-source-backup/github-backup.json',receiptSha256:'93965366870cfa7022c083580b0904581de18988513b8b304e41a47a6840326e',repo:'F:/VisibleMedicine/history/website-work/github-midfoot-website-20261023.git'},
 backupRepo:'F:/VisibleMedicine/history/website-work/github-fda-shoulder-source-20261023.git',sourceIdentity:{sourceReceiptSha256:digest,atlasHead:s.head,atlasTree:s.tree,completeWebsiteUnchanged:w.atlasHead,sourceOnlyTools:true},backupScope:'Inherited independently verified filtered authored sources plus explicit new original ingestion scripts, tests, project-doc raw snapshots and thoracic preservation-root proposal. No publisher model/license/Word source, geometry, source/renderer/binding/catalogue pins, runnable generated outputs, test logs, scans, identifiers or private decisions. Full quarantine/evidence/source identity stays F-only; not whole/private/runnable off-device recovery.',proof,milestone:'Pinned CC0 FDA shoulder source inventoried with refusal tests; thoracic preservation proposal verified; preview unchanged',pending,
 summary:{atlas:site,head:s.head,tree:s.tree,sourceReceipt:file,sourceReceiptSha256:digest,nativeTests:21,sourceParts:7,geometryAdmitted:false,sourceOnlyTools:true,websiteCandidateUnchanged:true,releaseProposal:release+'/SEALED_RECEIPT.json',releaseProposalSha256:releaseReceiptHash,releaseProposalNativePasses:4,releaseProposalMainReviewed:true,releaseProposalIntegrationPending:true},
 coordinationUpdate:{currentThoracicProofAssignment:{root:release,receipt:release+'/SEALED_RECEIPT.json',receiptSha256:releaseReceiptHash,model:'gpt-6-sol',effort:'medium',nativePasses:4,initialFailures:4,mainReviewed:true,integrationPending:true,cursor:'09786c67-a526-4f3e-9592-4f73d6c47d39:35'}}
})));
