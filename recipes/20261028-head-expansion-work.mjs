import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {clonePinnedWebsite} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/clone-pinned-website-stage-20261026.mjs';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded as small} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-small-native-task-guarded-20261025.mjs';
import {guarded as balanced} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
const stage=process.env.VM_HEAD_EXPANSION_STAGE??'F:/VisibleMedicine/staging/20261028-head-viewer-expansion',site=stage+'/website';
assert(['F:/VisibleMedicine/staging/20261028-head-viewer-expansion','F:/VisibleMedicine/staging/20261028-head-viewer-expansion-final'].includes(stage));
const parentFile='F:/VisibleMedicine/staging/20261028-current-role-repair/SOURCE_CANDIDATE.json',parentSha256='734c4b1c72ec4daf9d0ccd32e8ec9f991f3310996871fa9ef5e56b2de73a86d8';
const proposalDir='F:/VisibleMedicine/staging/20261028-head-expansion-proposal',proposalFile=proposalDir+'/PROPOSAL.json';
const phase=process.argv[2],attempt=process.argv[3]??'1';
assert(['prepare','review','seal','tests','scoped-types','types','build'].includes(phase));assert(/^[1-9][0-9]*$/.test(attempt));
const pin=p=>({path:p,sha256:hash(p)}),save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
assert.equal(hash(parentFile),parentSha256);const p=json(parentFile);
if(phase==='prepare'){
 assert.equal(hash(proposalFile),'ae8552a3e7d034869cab7587adf2d1bfb7fc299810a0590f620bf81bc1a678ed');
 const proposal=json(proposalFile);assert.equal(proposal.parentSourceCandidateSha256,parentSha256);assert(proposal.files.length>0);
 const {site:actual}=clonePinnedWebsite({stage,parentFile,parentSha256});assert.equal(actual,site);
 const authored=[];
 for(const row of proposal.files){
  assert(typeof row.path==='string'&&!row.path.includes('..')&&!path.isAbsolute(row.path));
  assert(row.path==='components/HeadAtlasLinkedModel.tsx'||row.path==='components/HeadAtlasComparisonNavigation.tsx'||row.path==='app/atlas/head-neck-3d/head-learning.css'||row.path.startsWith('tests/'),row.path);
  const from=row.proposedFile??proposalDir+'/'+row.path,to=site+'/'+row.path;
  assert(path.resolve(from).startsWith(path.resolve(proposalDir)+path.sep));assert.equal(hash(from),row.proposedSha256,row.path);
  if(row.preimageSha256)assert.equal(hash(to),row.preimageSha256,row.path);else assert(!fs.existsSync(to));
  fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);authored.push(row.path);
 }
 for(const file of ['next-env.d.ts','.next/types/routes.d.ts']){fs.mkdirSync(path.dirname(site+'/'+file),{recursive:true});if(!fs.existsSync(site+'/'+file))fs.copyFileSync(p.website+'/'+file,site+'/'+file,fs.constants.COPYFILE_EXCL);assert.equal(hash(site+'/'+file),hash(p.website+'/'+file));}
 const rows=[...new Set([...p.sourceRows.map(r=>r.path),...authored])].sort().map(file=>({path:file,bytes:fs.statSync(site+'/'+file).size,sha256:hash(site+'/'+file)}));
 for(const row of p.sourceRows)if(!authored.includes(row.path))assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
 save(stage+'/PRODUCT_INPUTS.json',{at:new Date().toISOString(),parent:pin(parentFile),proposal:pin(proposalFile),authored,sourceRows:rows,normalPreviewChanged:false});
 console.log(JSON.stringify({prepared:stage,authored}));process.exit(0);
}
const inputs=json(stage+'/PRODUCT_INPUTS.json');assert.equal(hash(proposalFile),inputs.proposal.sha256);
const reviewMutable=new Set(['atlas-review/manifest.json','atlas-review/integration-inputs.json','atlas-review/content/body-renderer-revision.json','atlas-review/content/review-revisions.json']);
const verifyInputs=(afterReview=false)=>{for(const row of inputs.sourceRows){if(afterReview&&(reviewMutable.has(row.path)||row.path.startsWith('public/atlas-review-viewer/')))continue;assert.equal(hash(site+'/'+row.path),row.sha256,row.path);}};
const sf=stage+'/SOURCE_CANDIDATE.json';
if(phase==='seal'){
 const accepted=json(stage+'/ACCEPTED.json').review;assert.equal(hash(accepted.path),accepted.sha256);assert(json(accepted.path).passing);verifyInputs(true);
 const before=json(p.website+'/atlas-review/integration-inputs.json'),after=json(site+'/atlas-review/integration-inputs.json');
 assert.equal(after.inputs.length,before.inputs.length);assert.notEqual(after.sha256,before.sha256);
 const changedInputs=[];for(let n=0;n<after.inputs.length;n++){const a=after.inputs[n],b=before.inputs[n];assert.equal(a.path,b.path);assert.equal(hash(site+'/'+a.path),a.sha256);if(a.sha256!==b.sha256){assert(inputs.authored.includes(a.path));changedInputs.push(a.path);}}
 const bm=json(p.website+'/atlas-review/manifest.json'),am=json(site+'/atlas-review/manifest.json');assert.equal(am.revision,bm.revision);assert.equal(am.files.length,bm.files.length);
 for(let n=0;n<am.files.length;n++){const a=am.files[n],b=bm.files[n];assert.equal(a.path,b.path);assert.equal(a.sourceSha256,b.sourceSha256);assert.equal(hash(site+'/atlas-review/'+a.path),a.importedSha256);if(!['content/body-renderer-revision.json','content/review-revisions.json'].includes(a.path))assert.deepEqual(a,b);}
 for(const file of ['content/body-renderer-revision.json','content/review-revisions.json']){const a=json(site+'/atlas-review/'+file),b=json(p.website+'/atlas-review/'+file);assert.equal(a.clinicalApproved,b.clinicalApproved);for(const k of ['sourceRendererSha256','sourceRevisions'])assert.deepEqual(a[k],b[k]);}
 const viewer=json(site+'/public/atlas-review-viewer/manifest.json');assert.equal(viewer.websiteIntegrationSha256,after.sha256);assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.mode,'production');
 for(const row of viewer.files)assert.equal(hash(site+'/public/atlas-review-viewer/'+row.path),row.sha256);
 assert.deepEqual(viewer.packages,json(p.website+'/public/atlas-review-viewer/manifest.json').packages);
 const fixture='tests/fixtures/current-atlas-delivery.json',beforePin=json(site+'/'+fixture),nextPin=structuredClone(beforePin);
 assert.equal(beforePin.reviewIntegration,before.sha256);nextPin.reviewIntegration=after.sha256;nextPin.viewerFiles=viewer.files.length;nextPin.viewerPackages=viewer.packages.length;
 for(const file of Object.keys(nextPin.documents))nextPin.documents[file]=hash(site+'/'+file);
 for(const file of Object.keys(nextPin.documents))if(!['atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-review-viewer/manifest.json'].includes(file))assert.equal(nextPin.documents[file],beforePin.documents[file]);
 fs.writeFileSync(site+'/'+fixture,JSON.stringify(nextPin,null,2)+'\n');inputs.authored.push(fixture);
 const paths=new Set(inputs.sourceRows.filter(r=>!r.path.startsWith('public/atlas-review-viewer/')).map(r=>r.path));
 function walk(dir,prefix){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){assert(!entry.isSymbolicLink());if(entry.isDirectory())walk(dir+'/'+entry.name,prefix+entry.name+'/');else paths.add(prefix+entry.name);}}
 walk(site+'/public/atlas-review-viewer','public/atlas-review-viewer/');
 const rows=[...paths].sort().map(file=>({path:file,bytes:fs.statSync(site+'/'+file).size,sha256:hash(site+'/'+file)}));
 save(sf,{...p,schema:'vm-head-viewer-expansion-source/1',at:new Date().toISOString(),website:site,parent:parentFile,parentSha256,proposal:pin(proposalFile),sourceRows:rows,sourcePaths:rows.length,changedPaths:inputs.authored,newPaths:inputs.authored.filter(file=>!p.sourceRows.some(r=>r.path===file)),reviewBindingSha256:after.sha256,protectedReviewInputs:after.inputs.length,viewerFiles:viewer.files.length,viewerPackages:viewer.packages.length,productChange:'Same-tab expansion of the linked head viewer preserves the existing iframe and comparison controls.',productSourceChanged:true,protectedReviewInputsChanged:true,changedReviewInputs:changedInputs,reviewRegenerated:true,historicalReplayUnchanged:undefined,installed:false,clinicalApproval:false,patientSpaceRegistration:false,normalPreviewChanged:false});
 save(stage+'/SOURCE_VERIFICATION.json',{source:pin(sf),proposal:pin(proposalFile),reviewRun:accepted,changedReviewInputs:changedInputs,sourceImportsAndApprovalsPreserved:true,sourceMasksUnchanged:true,packagesUnchanged:true,normalPreviewChanged:false,wslStopped:false});
 const i=json('CURRENT_CHECKPOINT.json');i.activeWork.current.pendingHeadViewerExpansion={source:pin(sf),state:'Isolated candidate; same-tab control implemented, focused and full checks pending',installed:false};saveIndex(i);console.log(JSON.stringify({source:pin(sf),changedReviewInputs:changedInputs}));process.exit(0);
}
const s=phase==='review'?null:json(sf),dir=stage+'/checks/'+phase+'-'+attempt;
const verify=()=>{if(s){for(const r of s.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);for(const r of s.dependencies){assert.equal(hash(r.file),r.sha256);assert.equal(hash(r.entry),r.entrySha256);}}else verifyInputs();};verify();
const pass=k=>{const r=json(stage+'/ACCEPTED.json')[k];assert.equal(hash(r.path),r.sha256);assert(json(r.path).passing);};
let command,heap=1024,aggregate=2048,minimum=4096;
const plan=phase==='tests'?json(stage+'/TEST_PLAN.json'):null;
if(phase==='review'){command='--max-old-space-size=128 '+stage+'/review-build-'+attempt+'.mjs';heap=1024;aggregate=2048;minimum=4096;fs.writeFileSync(stage+'/review-build-'+attempt+'.mjs',`import {execFileSync} from 'node:child_process';for(const file of ['scripts/bind-clinical-review.mjs','scripts/build-clinical-review-viewer.mjs','scripts/verify-clinical-review.mjs'])execFileSync(process.execPath,['--max-old-space-size=1024',file],{cwd:process.cwd(),env:process.env,stdio:'inherit',windowsHide:true});\n`,{flag:'wx'});}
if(phase==='tests')command='--max-old-space-size=1024 --experimental-strip-types --test --test-concurrency=1 --test-reporter=tap '+plan.roots.join(' ');
if(phase==='scoped-types'){
 pass('tests');const dest=stage+'/types-'+attempt;fs.mkdirSync(dest);
 const full=fs.readFileSync('F:/VisibleMedicine/staging/20261026-workbook-history-website/types-1/checker.mjs','utf8');
 const exact='const program=ts.createProgram(parsed.fileNames,{...parsed.options,...overrides}),diagnostics=ts.getPreEmitDiagnostics(program);';assert.equal(full.split(exact).length,2);
 const scoped=full.replace(exact,"const roots=[...new Set([...parsed.fileNames.filter(p=>p.endsWith('.d.ts')),site+'/components/HeadAtlasLinkedModel.tsx',site+'/components/atlas-runtime-expansion.ts'])];const program=ts.createProgram(roots,{...parsed.options,...overrides}),diagnostics=ts.getPreEmitDiagnostics(program);")
  .replace('roots:parsed.fileNames,fullProjectTypes:true,scopeExclusionsAdded:false','roots,fullProjectTypes:false,scopeExclusionsAdded:true,scope:"Head linked viewer, expansion controller, project declarations and actual transitive imports"');
 fs.writeFileSync(dest+'/checker.mjs',scoped,{flag:'wx'});command='--max-old-space-size=1024 '+dest+'/checker.mjs';
}
if(phase==='types'){pass('tests');fs.mkdirSync(stage+'/types-'+attempt);fs.copyFileSync('F:/VisibleMedicine/staging/20261026-workbook-history-website/types-1/checker.mjs',stage+'/types-'+attempt+'/checker.mjs',fs.constants.COPYFILE_EXCL);command='--max-old-space-size=3072 '+stage+'/types-'+attempt+'/checker.mjs';heap=3072;aggregate=3584;minimum=5632;}
if(phase==='build'){pass('types');const wrapper=stage+'/website-build.mjs';if(!fs.existsSync(wrapper))fs.copyFileSync('F:/VisibleMedicine/staging/20261028-head-search-comparison/website-build.mjs',wrapper,fs.constants.COPYFILE_EXCL);command='--max-old-space-size=256 '+wrapper;heap=1536;aggregate=3584;minimum=5632;}
const i=json('CURRENT_CHECKPOINT.json'),c=i.activeWork.current;assert.deepEqual(c.activeExecutionSessions,[]);assert(c.ownerWslPolicy.keepRunning&&!c.ownerPreviewPolicy.restartPermitted);c.activeExecutionSessions=[{kind:'head-viewer-expansion-'+phase,pid:process.pid,evidence:dir}];saveIndex(i);
function clear(){const latest=json('CURRENT_CHECKPOINT.json');if(latest.activeWork.current.activeExecutionSessions[0]?.pid===process.pid){latest.activeWork.current.activeExecutionSessions=[];saveIndex(latest);}}
process.once('exit',()=>{if(!fs.existsSync(dir+'/SUPERVISOR-HANDLE.json')||fs.existsSync(dir+'/PROCESS-TERMINAL.json'))clear();});
try{
 global.gc?.();const run=await(aggregate===3584?balanced:small)({site,dir,command,heap,aggregate,minimum,extraEnv:{TEMP:stage,TMP:stage,TMPDIR:stage,npm_config_cache:stage+'/npm-cache',VM_CURRENT_SOURCE_RECEIPT:sf,VM_CURRENT_SOURCE_SHA256:s?hash(sf):'',VM_WEBSITE_ROOT:site,VM_ATLAS_SOURCE_REPO:p.atlas,ATLAS_SOURCE_REPO:p.atlas}});
 if(phase==='review')verifyInputs(true);else verify();
 const log=fs.readFileSync(dir+'/runner.stdout.log','utf8'),counts=phase==='tests'?Object.fromEntries(['tests','pass','fail','cancelled','skipped','todo'].map(k=>[k,Number([...log.matchAll(new RegExp('^# '+k+' (\\d+)','gm'))].at(-1)?.[1]??-1)])):null;
 const tf=stage+'/types-'+attempt+'/TYPE_RESULT.json',types=['types','scoped-types'].includes(phase)&&fs.existsSync(tf)?json(tf):null;
 const passing=run.passing&&(!counts||(counts.tests>0&&counts.tests===counts.pass&&counts.fail+counts.cancelled+counts.skipped+counts.todo===0))&&(phase!=='types'||types?.fullProjectTypes&&types.diagnosticCount===0)&&(phase!=='scoped-types'||types?.fullProjectTypes===false&&types.diagnosticCount===0);
 save(dir+'/RESULT.json',{at:new Date().toISOString(),phase,source:s?pin(sf):pin(stage+'/PRODUCT_INPUTS.json'),run,passing,counts,roots:plan?.roots,types:types?pin(tf):null,normalPreviewChanged:false,wslStopped:false,wholeSuitePassing:false});
 if(passing){const file=stage+'/ACCEPTED.json',a=fs.existsSync(file)?json(file):{};a[phase]=pin(dir+'/RESULT.json');fs.writeFileSync(file,JSON.stringify(a,null,2)+'\n');}
 console.log(JSON.stringify({phase,passing,counts,types:types?{roots:types.roots.length,files:types.sourceFiles.length,diagnostics:types.diagnosticCount}:null,result:pin(dir+'/RESULT.json')}));process.exitCode=passing?0:1;
}finally{if(!fs.existsSync(dir+'/SUPERVISOR-HANDLE.json')||fs.existsSync(dir+'/PROCESS-TERMINAL.json'))clear();}
