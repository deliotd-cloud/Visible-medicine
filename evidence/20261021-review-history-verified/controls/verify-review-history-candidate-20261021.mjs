import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-review-history-candidate',p=json(stage+'/PREPARATION.json'),site=p.site;
const save=(name,value)=>fs.writeFileSync(stage+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const baselineRows=json(p.baselineSnapshot),canonicalRows=json(p.canonicalSnapshot);
assert.equal(sha(read(p.baselineSnapshot)),p.baselineSnapshotSha256);assert.equal(sha(read(p.canonicalSnapshot)),p.canonicalSnapshotSha256);
const generated=new Set(['lib/plexus-review-manifest.json','.local/plexus-review/assets.ts','atlas-review/integration-inputs.json','atlas-review/manifest.json','atlas-review/content/body-renderer-revision.json','atlas-review/content/review-revisions.json','tests/fixtures/current-atlas-delivery.json']);
function guard(){
 for(const r of baselineRows)assert.equal(sha(read(p.baselineWebsite+'/'+r.path)),r.sha256,'Immutable baseline:'+r.path);
 for(const r of [...canonicalRows,...p.preserved])assert.equal(sha(read(p.canonical+'/'+r.path)),r.sha256,'Owner:'+r.path);
 for(const r of p.rows)if(!generated.has(r.path)&&!r.path.startsWith('public/atlas-review-viewer/'))assert.equal(sha(read(site+'/'+r.path)),r.sha256,'Candidate:'+r.path);
 assert.equal(runGit(['-C',p.canonical,'rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),p.source);assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','status','--porcelain']).toString().trim(),'');process.kill(266712,0);process.kill(240632,0);
}
const retry=process.argv[2]==='--after-inverse-seam-fix';
guard();if(retry){const failed=json(stage+'/VERIFICATION_FAILURE.json');assert.equal(failed.commands.length,0);assert(!fs.existsSync(stage+'/VERIFIED.json'));}else assert(!fs.existsSync(stage+'/VERIFICATION_STARTED.json'));
save(retry?'VERIFICATION_RETRY_STARTED.json':'VERIFICATION_STARTED.json',{at:new Date().toISOString(),driver:process.pid,canonicalInstalled:false,ownerFormsRefreshed:false,reason:retry?'Exact helper inverse driver included one too few leading newlines; original failure and driver retained, product source unchanged.':null});
const commands=[];
function run(name,args){
 const log=stage+'/'+name+'.log',fd=fs.openSync(log,'wx'),at=new Date().toISOString(),start=Date.now();
 const result=spawnSync(process.execPath,args,{cwd:site,windowsHide:true,stdio:['ignore',fd,fd],env:{...process.env,VM_ATLAS_SOURCE_REPO:'F:/VisibleMedicine/atlas',GOMAXPROCS:'2',RAYON_NUM_THREADS:'1',NODE_OPTIONS:'--max-old-space-size=4096'}});fs.closeSync(fd);
 const receipt={at,args,code:result.status,signal:result.signal,error:result.error?.message??null,durationMs:Date.now()-start,log,logSha256:sha(read(log)),canonicalInstalled:false};
 if(name==='native'){receipt.counts={};for(const m of read(log).toString().matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm))receipt.counts[m[1]]=Number(m[2]);receipt.failures=[...read(log).toString().matchAll(/^not ok (\d+) - (.+)\r?$/gm)].map(m=>({number:Number(m[1]),title:m[2]}));}
 save(name+'.json',receipt);commands.push(receipt);console.log(JSON.stringify({name,code:result.status,counts:receipt.counts,durationMs:receipt.durationMs}));guard();assert.equal(result.status,0,name);assert.equal(result.signal,null);assert.equal(result.error,undefined);
 if(name==='native'){assert.equal(receipt.counts.fail,0);assert.equal(receipt.counts.skipped,0);assert.equal(receipt.counts.cancelled,0);assert(receipt.counts.pass>131);}
}
try{
 // Exact inverse retains the whole original helper, including its click handler.
 const beforeHelper=read(stage+'/preimages/lib/clinical-review-navigation-guard.ts').toString(),helper=read(site+'/lib/clinical-review-navigation-guard.ts').toString();
 assert.equal(sha(beforeHelper),p.originalHelperSha256);assert.equal(sha(helper),p.helperSha256);
 let inverse=helper;
 const remove=(from,to='')=>{assert.equal(inverse.split(from).length,2);inverse=inverse.replace(from,to);};
 const typeStart=inverse.indexOf('type ReviewNavigateEvent = '),typeEnd=inverse.indexOf('type Registration = ');assert(typeStart>=0&&typeEnd>typeStart);remove(inverse.slice(typeStart,typeEnd));
 remove('  navigation?: ReviewNavigation;\n  onNavigate?: EventListener;\n');
 const blockStart=inverse.indexOf('\n\n    // The Navigation API only offers'),blockEnd=inverse.indexOf('\n  }\n  registration.protectedCopies.add',blockStart);assert(blockStart>0&&blockEnd>blockStart);remove(inverse.slice(blockStart,blockEnd));
 remove("    if (current.navigation && current.onNavigate) current.navigation.removeEventListener('navigate', current.onNavigate);\n");assert.equal(inverse,beforeHelper);
 const role=p.pendingSourcePatch;assert.equal(sha(read(stage+'/preimages/'+role.path)),role.preimageSha256);assert.equal(read(site+'/'+role.path).toString().replace(role.after,role.before),read(stage+'/preimages/'+role.path).toString());
 const {rebindPlexusHistory}=await import(pathToFileURL(site+'/scripts/rebind-plexus-review-history.mjs'));
 const oldPacket=json(p.baselineWebsite+'/lib/plexus-review-manifest.json'),oldModule=read(p.baselineWebsite+'/.local/plexus-review/assets.ts').toString();
 const result=rebindPlexusHistory(oldPacket,oldModule,path=>read(p.baselineWebsite+'/'+path),path=>read(site+'/'+path));
 assert.equal(result.after.topologyHash,result.before.topologyHash);
 fs.writeFileSync(site+'/lib/plexus-review-manifest.json',JSON.stringify(result.packet,null,2)+'\n');fs.writeFileSync(site+'/.local/plexus-review/assets.ts',result.moduleText); // Mechanical pure-generator serialization, F-local only.
 const oldBinding=json(site+'/atlas-review/integration-inputs.json'),oldPin=json(site+'/tests/fixtures/current-atlas-delivery.json'),oldViewer=json(site+'/public/atlas-review-viewer/manifest.json');
 assert.equal(oldBinding.sha256,p.reviewBefore);assert.equal(oldBinding.inputs.length,1711);
 run('bind-review',['scripts/bind-clinical-review.mjs']);const binding=json(site+'/atlas-review/integration-inputs.json');
 assert.equal(binding.inputs.length,1711);assert.equal(binding.sourceCommit,p.source);assert.equal(sha(JSON.stringify(binding.inputs)),binding.sha256);assert.notEqual(binding.sha256,oldBinding.sha256);
 assert.deepEqual(binding.inputs,oldBinding.inputs.map(r=>r.path==='lib/clinical-review-navigation-guard.ts'?{...r,sha256:p.helperSha256}:r),'Sole normal Review presentation input extension');
 run('build-review-viewer',['scripts/build-clinical-review-viewer.mjs']);const viewer=json(site+'/public/atlas-review-viewer/manifest.json');
 assert.equal(viewer.sourceCommit,p.source);assert.equal(viewer.websiteIntegrationSha256,binding.sha256);assert.equal(viewer.files.length,46);assert.equal(viewer.packages.length,22);assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.mode,'production');assert.deepEqual(viewer.packages,oldViewer.packages);
 const pin=structuredClone(oldPin);pin.reviewIntegration=binding.sha256;for(const file of ['atlas-review/integration-inputs.json','atlas-review/manifest.json','public/atlas-review-viewer/manifest.json'])pin.documents[file]=sha(read(site+'/'+file));
 const inversePin=structuredClone(pin);inversePin.reviewIntegration=oldPin.reviewIntegration;inversePin.documents=oldPin.documents;assert.deepEqual(inversePin,oldPin);fs.writeFileSync(site+'/tests/fixtures/current-atlas-delivery.json',JSON.stringify(pin,null,2)+'\n');
 const finalRows=p.rows.filter(r=>!r.path.startsWith('public/atlas-review-viewer/')).map(r=>({path:r.path,bytes:read(site+'/'+r.path).length,sha256:sha(read(site+'/'+r.path))}));
 for(const file of ['manifest.json',...viewer.files.map(r=>r.path)]){const path='public/atlas-review-viewer/'+file,bytes=read(site+'/'+path);finalRows.push({path,bytes:bytes.length,sha256:sha(bytes)});}
 assert.equal(finalRows.length,5470);assert.equal(new Set(finalRows.map(r=>r.path)).size,5470);save('FINAL_SOURCE_INPUTS.json',finalRows);
 save('PRESENTATION_TRANSITION.json',{at:new Date().toISOString(),source:p.source,reviewBefore:oldBinding.sha256,reviewAfter:binding.sha256,reviewInputs:1711,helperBefore:p.originalHelperSha256,helperAfter:p.helperSha256,wholeOriginalHelperInverseExact:true,allOriginalClickAndBeforeUnloadHooksPreserved:true,historicalClickOnlyBindingContractWholeInverseExact:true,normalReviewSourceInputChanges:['lib/clinical-review-navigation-guard.ts'],plexusBefore:result.before,plexusAfter:result.after,plexusTopologyStudyAssetsPackagesAndChecklistsUnchanged:true,onlyPlexusHtmlRevisionQueriesChanged:true,dependenciesAndLicensingUnchanged:true,sourceSnapshot:stage+'/FINAL_SOURCE_INPUTS.json',sourceSnapshotSha256:sha(read(stage+'/FINAL_SOURCE_INPUTS.json')),canonicalInstalled:false,ownerFormsRefreshed:false,clinicalApproval:false,spatialRegistration:false});
 run('stock-review',['scripts/verify-clinical-review.mjs']);
 const prior=json('F:/VisibleMedicine/staging/20261021-review-navigation-ui-candidate/VERIFIED.json').commands.find(r=>r.args[0]==='--test').args.filter(a=>a.startsWith('tests/'));
 const roots=[...new Set([...prior,...json(p.baseline+'/VERIFIED.json').nativeRoots,'tests/clinical-review-history-guard.test.ts','tests/plexus-review-history-binding.test.mjs'])];
 run('native',['--test','--experimental-strip-types','--test-reporter=tap','--test-concurrency=1',...roots]);
 run('full-types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']);run('full-build',['node_modules/vinext/dist/cli.js','build']);
 guard();for(const r of finalRows)assert.equal(sha(read(site+'/'+r.path)),r.sha256);
 save('VERIFIED.json',{at:new Date().toISOString(),stage,site,source:p.source,review:binding.sha256,reviewBefore:oldBinding.sha256,reviewInputs:1711,sourceFiles:5470,sourceSnapshot:stage+'/FINAL_SOURCE_INPUTS.json',sourceSnapshotSha256:sha(read(stage+'/FINAL_SOURCE_INPUTS.json')),commands,nativeRoots:roots,actualNativeCounts:commands.find(r=>r.counts).counts,stockReviewPassed:true,fullProjectTypesPassed:true,fullLocalBuildPassed:true,wholeOriginalHelperInverseExact:true,allOriginalClickAndBeforeUnloadHooksPreserved:true,plexusTopologyStudyNonHtmlAssetsPackagesAndChecklistsUnchanged:true,canonicalInstalled:false,ownerFormsRefreshed:false,ownerPreviewRestarted:false,privateDatabaseCopied:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,browserAcceptancePassed:false,wholeSuitePassingClaim:false,fullGoalActive:true,limits:'Only cancelable same-document path/query traversals in NavigationAPI browsers are additionally guarded. Browser support, child/cross-origin and repeated-Back cancellation limits remain. No imperative router interception or history trapping. Supplementary real prior-click Cancel/clean-navigation evidence remains separate from new history browser acceptance.'});
 console.log(JSON.stringify({verified:stage+'/VERIFIED.json',review:binding.sha256,native:commands.find(r=>r.counts).counts,types:true,build:true,ownerUnchanged:true}));
}catch(error){save(retry?'VERIFICATION_RETRY_FAILURE.json':'VERIFICATION_FAILURE.json',{at:new Date().toISOString(),commands,error:String(error),canonicalInstalled:false,ownerFormsRefreshed:false,wholeSuitePassingClaim:false});throw error;}
