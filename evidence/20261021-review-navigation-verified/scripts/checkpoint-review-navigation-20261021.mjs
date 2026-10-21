import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {backup,read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-review-destination-application';
const prep=json(stage+'/PREPARATION.json'),site=prep.site;
const oldStage='F:/VisibleMedicine/staging/20261021-source190-website';
const originalPrep=json(oldStage+'/PREPARATION.json');
const old=json(oldStage+'/SOURCE_INPUTS_AFTER.json');assert.equal(old.length,5095);
const changedPaths=['app/layout.tsx','components/SiteHeader.tsx','components/SiteFrame.tsx',
 'tests/siteframe-focus-lifecycle.test.mjs','tests/workspace-utilities-dismissal.test.mjs',
 'tests/desktop-workspace-simplification.test.ts','tests/atlas-region-picker.test.ts','tests/disc-comparison.test.ts',
 'tests/header-session.test.ts','tests/header-workspace-destination.test.mjs','tests/clinical-review-wayfinding.test.mjs'];
const history=json(stage+'/HISTORY_ADMISSION.json');
const added=['lib/review-destination.ts','tests/review-destination.test.mjs','tests/review-navigation-render.test.mjs',
 ...history.changes.filter(r=>r.beforeSha256===null).map(r=>r.path)];
assert.equal(added.length,8);assert.equal(new Set(added).size,8);
const allowed=new Set(changedPaths),rows=[],changes=[];
for(const row of old){
 const b=read(site+'/'+row.path),digest=sha(b);
 if(digest!==row.sha256){assert(allowed.has(row.path),'Unexpected input drift: '+row.path);assert.equal(sha(read(stage+'/preimages/'+row.path)),row.sha256);changes.push({path:row.path,beforeSha256:row.sha256,sha256:digest});}
 rows.push({path:row.path,bytes:b.length,sha256:digest});
}
assert.deepEqual(changes.map(r=>r.path).sort(),changedPaths.slice().sort());
for(const p of added){assert(!old.some(r=>r.path===p));const s=fs.lstatSync(site+'/'+p);assert(s.isFile()&&!s.isSymbolicLink());const b=read(site+'/'+p);rows.push({path:p,bytes:b.length,sha256:sha(b)});}
rows.sort((a,b)=>a.path.localeCompare(b.path));assert.equal(rows.length,5103);
// Both extra manual-loader repairs must restore their exact whole preimages.
for(const name of ['atlas-region-picker','disc-comparison']){
 const p='tests/'+name+'.test.ts',s=read(site+'/'+p).toString();
 const line=name==='atlas-region-picker'?"    '../lib/review-destination': reviewDestination,\n":"  id==='../lib/review-destination'?reviewDestination:\n";
 const normalized=s.replaceAll('\r\n','\n'),restored=normalized.replace("import * as reviewDestination from '../lib/review-destination.ts';\n",'').replace(line,'');
 assert.equal(restored,read(stage+'/preimages/'+p).toString().replaceAll('\r\n','\n'));
}
const headerStage='F:/VisibleMedicine/staging/20261021-header-session-contract-proposal';
const headerManifest=json(headerStage+'/MANIFEST.json');
// These production byte pins were observed by the worker before the production
// build completed; only test inputs changed after that build.
for(const [p,digest]of Object.entries(headerManifest.currentExactFixtures))assert.equal(sha(read(site+'/'+p.replace(/\.raw$/,''))),digest);
const labels=['REVIEW_NAVIGATION_ALL_CURRENT_HISTORY','REVIEW_NAVIGATION_FINAL_TYPES','REVIEW_NAVIGATION_BUILD'];
const receipts=labels.map(label=>{const r=json(stage+'/'+label+'.json');assert.equal(r.code,0,label);assert.equal(r.signal,null);assert.equal(sha(read(r.log)),r.logSha256);return r;});
assert(receipts[0].footer.includes('ℹ tests 138')&&receipts[0].footer.includes('ℹ pass 138')&&receipts[0].footer.includes('ℹ skipped 0'));
const histStage='F:/VisibleMedicine/staging/20261021-review-navigation-historical-proof';
const historic=json(histStage+'/ORIGINAL_HEADER_SESSION.json');assert.equal(historic.code,0);assert.equal(sha(read(historic.log)),historic.logSha256);assert(historic.footer.includes('ℹ pass 6'));
assert.equal(sha(read(headerStage+'/historical/tests/header-session.test.ts')),headerManifest.originalTest.sha256);
const binding=json(site+'/atlas-review/integration-inputs.json');assert.equal(binding.sha256,prep.review);assert.equal(binding.inputs.length,1710);
for(const row of binding.inputs)assert.equal(sha(read(site+'/'+row.path)),row.sha256,'Bound Review input changed: '+row.path);
process.env.VM_ATLAS_SOURCE_REPO=prep.atlas;
const delivery=await import(pathToFileURL(site+'/tests/current-atlas-delivery.mjs'));assert.equal(delivery.validateCurrentAtlasDelivery().source,prep.source);
const verify=()=>{
 for(const row of rows)assert.equal(sha(read(site+'/'+row.path)),row.sha256,row.path);
 for(const row of json(oldStage+'/ORIGINAL_485_INPUTS.json'))assert.equal(sha(read(originalPrep.original+'/'+row.path)),row.sha256,'Closed485: '+row.path);
 assert.equal(runGit(['-C',prep.atlas,'rev-parse','HEAD']).toString().trim(),prep.source);
 assert.equal(runGit(['-C',prep.atlas,'status','--porcelain=v1','--untracked-files=all']).toString().trim(),'');
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'98d7f17e2d120b031633e59e47fc50c82d44b2d0');
 assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 assert.equal(json('F:/VisibleMedicine/website/atlas-review/integration-inputs.json').sha256,'b2bd971b5bfefdd0760f8f3c8785e372276e15dac9cc293ac8fde4cdfb7dcb54');
};verify();
const root='F:/VisibleMedicine/recovery/checkpoints/20261021-review-navigation-verified';assert(!fs.existsSync(root));fs.mkdirSync(root);
const selected=[];
function copy(from,p){const b=read(from),to=root+'/'+p;assert(!/\.(?:glb|dcm|nii|sqlite|db)$/i.test(p)&&!p.includes('/.local/'));fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,b,{flag:'wx'});assert.equal(sha(read(to)),sha(b));selected.push({path:p,bytes:b.length,sha256:sha(b)});}
for(const row of changes){copy(site+'/'+row.path,'website/'+row.path);copy(stage+'/preimages/'+row.path,'preimages/'+row.path);}
for(const p of added)copy(site+'/'+p,'website/'+p);
for(const p of ['PREPARATION.json','HARNESS_ADMISSION.json','HISTORY_ADMISSION.json','REVIEW_NAVIGATION_TYPES.json',...labels.map(l=>l+'.json')])copy(stage+'/'+p,'evidence/'+p);
copy(histStage+'/ORIGINAL_HEADER_SESSION.json','evidence/ORIGINAL_HEADER_SESSION.json');
for(const p of ['PREPARATION.json','ORIGINAL_HEADER_SESSION.json'])copy(histStage+'/'+p,'historical-header-proof/'+p);
for(const p of ['package.json','MANIFEST.json','historical/tests/header-session.test.ts','historical/lib/public-route-focus.ts',
 'historical/app/layout.tsx','historical/components/SiteHeader.tsx','historical/components/SiteFrame.tsx'])copy(headerStage+'/'+p,'historical-header-proposal/'+p);
copy('F:/VisibleMedicine/staging/20261021-nav-history-contract-proposal/MANIFEST.md','evidence/NAV_HISTORY_PROPOSAL.md');
for(const p of ['OBSERVATION.json','STOPPED.json'])copy('F:/VisibleMedicine/staging/20261021-source190-desktop-qa/'+p,'evidence/desktop/'+p);
copy(oldStage+'/ROOT_TEACHING_COUNTS.json','evidence/ROOT_TEACHING_COUNTS.json');
for(const p of ['launch-source190-desktop-qa-20261021.mjs','freeze-source190-desktop-observation-20261021.mjs',
 'prepare-review-destination-admission-20261021.mjs','admit-review-navigation-harness-20261021.mjs',
 'admit-review-navigation-history-20261021.mjs','checkpoint-review-navigation-20261021.mjs','measure-source190-teaching-counts-20261021.mjs'])copy(p,'scripts/'+p);
fs.writeFileSync(stage+'/SOURCE_INPUTS_AFTER_NAV.json',JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
const result={at:new Date().toISOString(),stage,site,source:prep.source,review:prep.review,namedInputs:5103,changedExisting:changes,newSourcePaths:added,
 progress:'Request-scoped direct Clinical Review for authorized reviewers in public switcher and Studio/context bar;Administration secondary,unavailable/anonymous fallback Workspace. Embedded lesson/editor toolbars retain defaultfalse. Only UI booleans reach clients,actual destination guards and independent Atlas/case/lecture access unchanged. All11existing edits scoped;all other5095inputs and original4855087inputs preserved. All1710Review inputs and4source190runtimes remain coherent.',
 verification:{currentAndHistoricalCases:138,currentAndHistoricalPass:138,skipped:0,wholeOriginalHeaderCases:6,wholeOriginalHeaderPass:6,productionBuild:true,freshTypes:true,productionBytesUnchangedAfterBuild:true,all1710ReviewBindingInputsPreserved:true,allOtherOldInputsPreserved:true,allOriginal485InputsPreserved:true,originalFullFailureBaseline:144,fullSuitePass:false},
 sourceOnlyRecovery:true,canonicalInstalled:false,ownerPreviewUnchanged:true,ownerFormsRefreshed:false,authenticationChanged:false,permissionsGranted:false,privateStateCopied:false,loadedModelAcceptance:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,fullGoalActive:true,
 desktop:'Actual1280x720isolated QA shows compact layout but protected model503. Agent QA tab closed/owned3002stopped;owner3000untouched. No storage bypass/account grant/private-state copy. Actual loaded-model acceptance remains open.',
 limits:'Targeted tests/types/production build are not a fresh full-suite,clinical/rights/spatial/browser or hosted release. Initial four type diagnostics retained; explicit boolean return and fail-closed embedded default resolve them. Whole historical tests replay against exact pre-change owned source;current behavior asserted separately. Earlier144full-suite failures remain recorded,not subtracted or waived.',
 next:'Preserve current owner session. Native private model binding setup and loaded-model/camera/tour acceptance remain to verify. Continue highest-value saved roadmap,semantic CT/MRI/3D comparison and source-backed drafts without awaiting clinical signoff;no patient-space synchronization claim.'};
fs.writeFileSync(stage+'/FINAL_NAVIGATION.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});copy(stage+'/FINAL_NAVIGATION.json','evidence/FINAL_NAVIGATION.json');
const parentRoot='F:/VisibleMedicine/recovery/checkpoints/20261021-source190-website-verified-v2-backup';
const parent=json(parentRoot+'/github-backup.json');assert(parent.sourceBackupVerified);assert.equal(parent.head,'773002c5b3cef91f9a68cc60bfa974c698971daf');
const oldFiles=json(parentRoot+'/remote-source-restored/.source-backup/manifest.json').files;
const values=new Map(oldFiles.map(row=>{const b=read(parentRoot+'/remote-source-restored/'+row.path);assert.equal(sha(b),row.sha256);return[row.path,b];}));
for(const row of selected)values.set('evidence/20261021-review-navigation-verified/'+row.path,read(root+'/'+row.path));
backup({root:root+'-backup',repo:'F:/VisibleMedicine/history/website-work/github-review-navigation-20261021.git',branch:'backup/review-navigation-20261021',
 files:[...values].map(([path,b])=>({path,bytes:b.length,sha256:sha(b)})).sort((a,b)=>a.path.localeCompare(b.path)),bytesFor:p=>values.get(p),verifySource:verify,
 sourceIdentity:{atlas:prep.source,review:prep.review,websiteInputCount:5103},parent:parent.head,parentTree:parent.tree,parentRepo:parentRoot+'/independent-readback.git',
 proof:{focusedPassed:138,wholeOriginalHeaderPassed:6,freshTypes:true,productionBuild:true,all1710ReviewInputsPreserved:true,canonicalInstalled:false},
 scope:'Selected owned navigation production/test source,exact preimages,whole owned historical UI/test fixtures and small metadata/proof/control scripts on previously filtered ancestry. Encoded fixtures decode only to4hash-verified owned UI/test preimages;no data-image/model encoding. No scans/masks/identifiers/private records/private manifests or modules/model geometry/full runtime/dist/node_modules/raw canonical Git ancestry/browser pixels/DOM. Not a complete runnable/private-data backup,clinical/spatial or hosted release.'});
const remote=json(root+'-backup/github-backup.json');
const checkpoint={...result,selectedFiles:selected,backup:{receipt:root+'-backup/github-backup.json',receiptSha256:sha(read(root+'-backup/github-backup.json')),head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths}};
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(checkpoint,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),selected:selected.length,backup:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths}));
