import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {hash,json} from './bounded-source-hash-20261026.mjs';
import {appendEvidence} from './append-checklist-evidence-20261026.mjs';
const phase=process.argv[2];assert(['seal','backup','record'].includes(phase));
const stage='F:/VisibleMedicine/staging/20261026-tongue-website',sf=stage+'/SOURCE_CANDIDATE.json',source=json(sf),site=source.website;
assert.equal(hash(sf),'e8a9c3a37a7d6671e2dfe4eb4a643efe4f0abe0824bda7e8630a8881de415a5a');
const pin=p=>({path:p,sha256:hash(p)}),save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const index=json('CURRENT_CHECKPOINT.json'),current=index.activeWork.current;
assert.deepEqual(current.activeExecutionSessions,[]);assert.equal(current.ownerPreviewPolicy.restartPermitted,false);
assert.equal(index.goal.requirements,71);assert.equal(index.goal.optionalIdeas,8);
for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
const git=(root,...args)=>execFileSync('git',['--no-replace-objects','-C',root,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}}).trim();
for(const [root,head] of [[source.atlas,source.atlasHead],['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1']])assert.equal(git(root,'rev-parse','HEAD'),head);
const vf=stage+'/VERIFICATION_SUMMARY.json';
const backupDir='F:/VisibleMedicine/recovery/checkpoints/20261026-tongue-website-source';
if(phase==='seal'){
 const checks=json(stage+'/checks/ACCEPTED.json');
 assert.deepEqual(Object.keys(checks).sort(),['content','tests','types','build'].sort());
 for(const record of Object.values(checks)){assert.equal(hash(record.path),record.sha256);const r=json(record.path);assert(r.passing);assert.equal(r.source.sha256,hash(sf));}
 const tests=json(checks.tests.path),typesResult=json(checks.types.path),types=json(typesResult.types.path),content=json(stage+'/CONTENT_QA.json');
 assert.equal(tests.roots.length,6);assert.equal(tests.counts.tests,tests.counts.pass);
 assert(types.fullProjectTypes);assert.equal(types.diagnosticCount,0);
 for(const r of types.sourceFiles)assert.equal(hash(r.path),r.sha256,r.path);
 const ts=createRequire(site+'/package.json')('typescript'),config=ts.readConfigFile(site+'/tsconfig.json',ts.sys.readFile),parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,site);
 assert(!config.error);assert.equal(parsed.errors.length,0);assert.deepEqual(parsed.fileNames.sort(),[...types.roots].sort(),'Post-build type scope exact');
 const parent=json(source.parent);assert.equal(hash(source.parent),source.parentSha256);
 for(const r of parent.sourceRows)assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);
 for(const r of parent.sourceRows.filter(r=>r.path.startsWith('tests/')&&r.path!=='tests/fixtures/current-atlas-delivery.json'))assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
 for(const d of source.dependencies){assert.equal(hash(d.file),d.sha256);assert.equal(hash(d.entry),d.entrySha256);}
 const inputs=json(site+'/atlas-review/integration-inputs.json');assert.equal(inputs.sha256,source.reviewBindingSha256);assert.equal(inputs.inputs.length,1824);
 for(const r of inputs.inputs)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
 assert(content.passing);assert.equal(content.placements,10);assert.equal(content.staleDecisionsRefusedBeforeStorage,10);assert.equal(content.tamperRefusals,35);
 const log=fs.readFileSync(path.dirname(checks.build.path)+'/runner.stdout.log','utf8');
 for(const marker of ['prebuild','verify-clinical-review.mjs','verify:atlas-delivery-policy','verify:lecture-body-catalog'])assert(log.includes(marker),'Stock hook missing: '+marker);
 const files=[];
 function walk(root,prefix=''){for(const e of fs.readdirSync(root,{withFileTypes:true})){assert(!e.isSymbolicLink());const p=prefix+e.name;if(e.isDirectory())walk(root+'/'+e.name,p+'/');else files.push({path:p,bytes:fs.statSync(root+'/'+e.name).size,sha256:hash(root+'/'+e.name)});}}
 walk(site+'/dist');files.sort((a,b)=>a.path.localeCompare(b.path));assert(files.length>1100);
 save(stage+'/BUILD_ARTIFACTS.json',{at:new Date().toISOString(),root:site+'/dist',source:pin(sf),files,localOnly:true});
 const failed=stage+'/checks/content-1';assert(!fs.existsSync(failed+'/STARTED.json'));assert.match(fs.readFileSync(failed+'/supervisor.stderr.log','utf8'),/\) expected/);
 save(vf,{schema:'vm-tongue-website-verified/1',at:new Date().toISOString(),passingForStatedScope:true,source:pin(sf),checks,
  nativeSource:source.verification.nativeSource,nativeBuild:source.verification.nativeBuild,runtimeExports:source.verification.exports,stockIntegration:source.verification.stockIntegration,
  content:pin(stage+'/CONTENT_QA.json'),focusedCounts:tests.counts,wholeRoots:tests.roots,
  fullConfiguredTypes:{...typesResult.types,allTypeInputsExactAfterBuild:true,configuredRootSetExactAfterBuild:true},stockBuild:pin(stage+'/BUILD_ARTIFACTS.json'),buildArtifacts:files.length,
  review:{inputs:1824,sha256:inputs.sha256,files:source.reviewSourceFiles,viewerFiles:54,viewerPackages:24,priorInputPathsPreserved:true,noClinicalDecisionsReadOrMigrated:true},
  initialContentLaunchFailure:{evidence:failed,diagnostic:pin(failed+'/supervisor.stderr.log'),applicationTestStarted:false,reason:'Recipe quoted a whitespace-free path inside the existing supervisor C# command string. Removed the unnecessary quotes; unchanged QA passed in attempt2. Original evidence retained.'},
  allOriginalTestsAndAssertionsPreserved:true,allPriorModelsLicencesAndPermissionsPreserved:true,sourceAndRevisionBound:true,
  wholeStockSuitePassing:false,realAccountAcceptance:false,clinicalApproval:false,patientSpaceRegistration:false,installed:false,normalPreviewChanged:false});
 console.log(JSON.stringify({verification:pin(vf),cases:tests.counts.pass,types:typesResult.types,buildArtifacts:files.length}));
}else if(phase==='backup'){
 const verified=json(vf);assert(verified.passingForStatedScope);
 const {backup,read,sha}=await import('./source-only-backup-20261019.mjs');
 assert.deepEqual([...source.authoredChangedPaths].sort(),['scripts/import-clinical-review.mjs','lib/atlas-delivery-policy.ts','scripts/check-anatomy-coverage.mjs','lib/anatomy-coverage-view.ts'].sort());
 const recipes=['prepare-tongue-runtime-exports-20261026.mjs','export-tongue-runtimes-20261026.mjs','run-tongue-runtime-exports-20261026.mjs',
  'prepare-tongue-website-recipes-20261026.mjs','prepare-tongue-website-20261026.mjs','prepare-tongue-website-stock-20261026.mjs','import-tongue-website-stock-20261026.mjs',
  'run-tongue-website-integration-20261026.mjs','generate-tongue-website-coverage-20261026.mjs','run-tongue-coverage-seams-20261026.mjs','install-tongue-website-coverage-20261026.mjs',
  'build-tongue-website-review-20261026.mjs','refresh-tongue-website-delivery-pin-20261026.mjs','seal-tongue-website-source-20261026.mjs',
  'verify-tongue-website-content-20261026.mjs','run-tongue-website-verification-20261026.mjs','finish-tongue-website-20261026.mjs'];
 const selected=[...source.authoredChangedPaths.map(p=>({path:'website/'+p,file:site+'/'+p})),...recipes.map(p=>({path:'recipes/'+p,file:path.resolve(p)}))];
 const files=selected.map(r=>{const b=read(r.file);new TextDecoder('utf8',{fatal:true}).decode(b);assert(!b.includes(0));return{...r,bytes:b.length,sha256:sha(b)}}),map=new Map(files.map(r=>[r.path,r.file]));
 const required=['F:/VisibleMedicine/recovery/checkpoints/20261026-workbook-history-source/SOURCE_SUPPLEMENT.json','F:/VisibleMedicine/recovery/checkpoints/20261026-tongue-imaging-source/SOURCE_SUPPLEMENT.json'].map(p=>{const r=json(p);assert.equal(hash(r.receipt),r.sha256);return{...pin(p),branch:r.branch,head:r.head,tree:r.tree}});
 assert(!fs.existsSync(backupDir));fs.mkdirSync(backupDir,{recursive:true});const root=backupDir+'-supplement';
 const r=backup({root,repo:'F:/VisibleMedicine/history/website-work/github-tongue-website-source-20261026.git',branch:'backup/tongue-website-source-20261026',parent:null,carryParent:false,
  files:files.map(({path,bytes,sha256})=>({path,bytes,sha256})),bytesFor:p=>read(map.get(p)),
  verifySource(){assert.equal(hash(sf),verified.source.sha256);for(const f of files)assert.equal(hash(f.file),f.sha256);assert.deepEqual(json('CURRENT_CHECKPOINT.json').activeWork.current.activeExecutionSessions,[])},
  sourceIdentity:{kind:'tongue-teaching-website-integration',sourceSha256:hash(sf),requiredPriorSourceSupplements:required},
  scope:'Selected first-party website code and integration/test recipes only. No exact anatomy source pins, medical metadata, scans, masks, assets, generated runtime, raw private proof, decisions, dependencies or canonical/native Git ancestry. Not a complete private or runnable backup.',
  proof:{changedDraftPlacements:10,focusedCases:verified.focusedCounts.pass,fullConfiguredTypes:true,productionBuild:true,oldTeachingDecisionsRefused:true,normalPreviewChanged:false,clinicalApproval:false}});
 const receipt=root+'/github-backup.json';save(backupDir+'/SOURCE_SUPPLEMENT.json',{at:new Date().toISOString(),receipt,sha256:hash(receipt),branch:r.branch,head:r.head,tree:r.tree,sourcePaths:r.sourcePaths,restoredPaths:r.restoredPaths,requiredSourceSupplements:required,wholePrivateOrRunnableBackup:false});
 console.log(JSON.stringify({sourceRecovery:pin(backupDir+'/SOURCE_SUPPLEMENT.json'),head:r.head,branch:r.branch}));
}else{
 const v=json(vf),bf=backupDir+'/SOURCE_SUPPLEMENT.json',backup=json(bf);assert(v.passingForStatedScope);assert.equal(hash(backup.receipt),backup.sha256);assert.equal(json(backup.receipt).phase,'independent-fetch-tree-bytes-and-restore-verified');
 const dir='F:/VisibleMedicine/recovery/checkpoints/20261026-tongue-website-verified';assert(!fs.existsSync(dir));fs.mkdirSync(dir,{recursive:true});
 for(const [from,to]of[['CURRENT_CHECKPOINT.json','CURRENT_INDEX_BEFORE.json'],['WORKSPACE_MAP.md','WORKSPACE_MAP_BEFORE.md'],['F:/VisibleMedicine/website/docs/master-plan.md','MASTER_PLAN_BEFORE.md'],[sf,'SOURCE_CANDIDATE_LOCAL.json'],[vf,'VERIFICATION_SUMMARY.json']])fs.copyFileSync(from,dir+'/'+to,fs.constants.COPYFILE_EXCL);
 const ledger=await appendEvidence({base:stage,verificationSha256:hash(vf),beforeRevision:254,id:'TEACH-02',expectedStatus:'open',rootKey:'tonguewebsite',
  note:'The ten tongue/genioglossus/hyoglossus CT/MRI drafts are now integrated into a coherent isolated website descendant. Actual emitted learner/review scripts and all5current worksheets contain the lessons;5old worksheets,35tampered packets and10old material/revision decisions are refused. Six complete focused roots, fullconfiguredtypes and original stockwebsitebuild pass. Review1824inputs and all4runtime source revisions are bound. Normal preview unchanged; clinical/account acceptance remains pending.',
  change:'Finished coherent website integration and focused verification of the tongue CT/MRI teaching increment. Preserved all statuses, acceptance criteria, installed preview and full71/eight roadmap.'});
 const next='Continue all71requirements/eightideas from unpublished website e8a9c3a3/native6ce2153e/Reviewaae3b4a0. Ten CT/MRI drafts are integrated, source-bound and technically verified; owner clinical review remains pending. Installedb953ff/6d7a and normal preview remain unchanged under owner policy. Whole stock release suite is not green; retain original failures/context and pursue substantive current defects or remaining source-backed gaps. Do not duplicate already-drafted100spine/hand X-ray entries or transfer decisions, alter accepted masks, change permissions, publicdeploy or touch desktopPACS.';
 const checkpoint={at:new Date().toISOString(),fullGoal:index.goal,source:pin(sf),verification:pin(vf),sourceRecovery:pin(bf),checklist:ledger,currentInstalledUnchanged:current.currentInstalled,ownerPreviewPolicy:current.ownerPreviewPolicy,normalPreviewChanged:false,clinicalApproval:false,next};
 save(dir+'/checkpoint.json',checkpoint);const saved=pin(dir+'/checkpoint.json');
 current.latestCoordination=saved;current.latestChecklistUpdate=ledger;current.latestSourceRecovery=pin(bf);
 current.latestDevelopmentSource={source:pin(sf),checkpoint:saved,kind:'verified tongue CT/MRI website integration',normalPreviewChanged:false};
 current.latestVerifiedWebsite={source:pin(sf),checkpoint:saved,verification:pin(vf),sourcePaths:source.sourcePaths,nativeHead:source.atlasHead,
  fullConfiguredTypes:true,stockProductionAndEveryHook:true,focusedNodeCases:v.focusedCounts.pass,wholeStockSuitePassing:false,signedInAcceptance:false,installed:false,normalPreviewChanged:false};
 const nativeBuild=json(source.verification.nativeBuild.path);
 current.latestNativeBuild={checkpoint:pin('F:/VisibleMedicine/recovery/checkpoints/20261026-tongue-imaging-verified/checkpoint.json'),source:source.verification.nativeSource,
  head:source.atlasHead,production:source.verification.nativeBuild,artifacts:nativeBuild.artifacts,types:nativeBuild.types,installed:false};
 current.pendingNativeWebsiteImport={stage,source:pin(sf),verification:pin(vf),phase:'Integrated and technically verified in isolated website; normal preview unchanged',live:false,reviewBound:true,viewerBuilt:true,installed:false};
 current.pendingTongueImaging={source:source.verification.nativeSource,websiteSource:pin(sf),verification:pin(vf),phase:'Native and website integration verified; clinical review pending',websiteImported:true,normalPreviewChanged:false};
 current.next=next;current.beforeFurtherWork=next;current.nextExecutionHandoff=saved;
 current.lastPriorityReassessment={at:new Date().toISOString(),checkpoint:saved,fullGoalPreserved:true,priority:'Verified teaching increment integrated; substantive remaining gaps and authentic linked-learning/role acceptance'};
 index.goal.previousTurn='progress';index.activeWork.updated=new Date().toISOString();
 const text=JSON.stringify(index,null,2)+'\n';assert(Buffer.byteLength(text)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',text);
 const prefix=`## Current: Tongue CT/MRI website integration verified — 26 October 2026\n\nTen original cited draft entries for whole tongue and bilateral genioglossus/hyoglossus now reach the isolated website's generated learner and review modules. Five current worksheets parse; five previous worksheets, 35 altered packets and ten stale teaching decisions are refused. All four runtimes and 1,824 review inputs are bound to native 6ce2153e.\n\n${v.focusedCounts.pass} cases across six complete focused roots, full configured types (${v.fullConfiguredTypes.roots} roots/${v.fullConfiguredTypes.files} files) and ${v.buildArtifacts} stock production artifacts pass. The first content test launch failed before application execution due to unnecessary recipe quoting; unchanged tests passed on the next invocation. Original evidence remains. No clinical or real-account acceptance is inferred. Checklist ${ledger.revision} preserves all71statuses/eightideas/fullacceptance. Filtered first-party code/recipes were independently fetched and restored on ${backup.branch} at ${backup.head}; private assets remain excluded. Checkpoint: ${saved.path} (${saved.sha256}). ${next}\n\n`;
 for(const p of ['WORKSPACE_MAP.md','F:/VisibleMedicine/website/docs/master-plan.md'])fs.writeFileSync(p,prefix+fs.readFileSync(p,'utf8'));
 console.log(JSON.stringify({checkpoint:saved,checklistRevision:ledger.revision,indexBytes:Buffer.byteLength(text),goal:'active',normalPreviewChanged:false}));
}
