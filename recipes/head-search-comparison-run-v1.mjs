import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded as small} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-small-native-task-guarded-20261025.mjs';
import {guarded as balanced} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
import {saveIndex} from './state.mjs';
const root='F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes',stage='F:/VisibleMedicine/staging/20261028-head-search-comparison',site=stage+'/website',sf=stage+'/SOURCE_CANDIDATE.json';
const phase=process.argv[2],attempt=process.argv[3]??'1';assert(['seal','tests','types','build'].includes(phase));assert(/^[1-9][0-9]*$/.test(attempt));
const pin=p=>({path:p,sha256:hash(p)}),save=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n',{flag:'wx'});
if(phase==='seal'){
 const change=json(stage+'/PRODUCT_CHANGE.json'),p=json(change.parent.path);assert.equal(hash(change.parent.path),change.parent.sha256);
 const changed=change.changed,newPaths=[...change.added,'tests/head-search-comparison.test.mjs'];
 for(const r of p.sourceRows){assert.equal(hash(p.website+'/'+r.path),r.sha256);if(!changed.includes(r.path))assert.equal(hash(site+'/'+r.path),r.sha256,r.path);}
 for(const r of json(site+'/atlas-review/integration-inputs.json').inputs)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
 for(const name of ['next-env.d.ts','.next/types/routes.d.ts'])if(!fs.existsSync(site+'/'+name)){fs.mkdirSync(path.dirname(site+'/'+name),{recursive:true});fs.copyFileSync(p.website+'/'+name,site+'/'+name,fs.constants.COPYFILE_EXCL);}
 const sourceRows=[...p.sourceRows.map(r=>r.path),...newPaths].sort().map(x=>({path:x,bytes:fs.statSync(site+'/'+x).size,sha256:hash(site+'/'+x)}));
 save(sf,{schema:'vm-head-search-comparison-source/1',at:new Date().toISOString(),website:site,atlas:p.atlas,atlasHead:p.atlasHead,atlasTree:p.atlasTree,parent:change.parent.path,parentSha256:change.parent.sha256,sourceRows,sourcePaths:sourceRows.length,changedPaths:changed,newPaths,dependencies:p.dependencies,reviewBindingSha256:p.reviewBindingSha256,reviewSourceFiles:p.reviewSourceFiles,protectedReviewInputs:p.protectedReviewInputs,viewerFiles:p.viewerFiles,viewerPackages:p.viewerPackages,productChange:pin(stage+'/PRODUCT_CHANGE.json'),originalTestsRecoverable:true,testExpectationChanged:'Exact step actions additionally include the canonical comparison; modality links and all original checks remain.',protectedReviewInputsChanged:false,installed:false,clinicalApproval:false,patientSpaceRegistration:false,normalPreviewChanged:false});
 const i=json('CURRENT_CHECKPOINT.json');i.activeWork.current.beforeFurtherWork='Follow next and latestCoordination. Full prior index preserved in coordinationDiskRecovery.';saveIndex(i);
 console.log(JSON.stringify({source:pin(sf),sourcePaths:sourceRows.length}));process.exit(0);
}
const s=json(sf),dir=stage+'/checks/'+phase+'-'+attempt,acceptedFile=stage+'/ACCEPTED.json';
const verify=()=>{assert.equal(hash(s.parent),s.parentSha256);for(const r of s.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);for(const r of s.dependencies){assert.equal(hash(r.file),r.sha256);assert.equal(hash(r.entry),r.entrySha256);}};verify();
const requirePass=k=>{const a=json(acceptedFile)[k];assert.equal(hash(a.path),a.sha256);assert(json(a.path).passing);};
const roots=['tests/head-search-comparison.test.mjs','tests/guided-catalogue-compact.test.mjs','tests/guided-catalogue-real-source.test.mjs','tests/head-guided-comparison.test.ts','tests/head-guided-comparison-page.test.ts','tests/head-guided-comparison-navigation.test.ts','tests/head-learning-search-context.test.ts','tests/head-learning-library.test.ts','tests/head-learning-library-steps.test.ts','tests/head-learning-library-view-filter.test.ts','tests/head-learning-library-discovery.test.ts'];
let command,heap=1024,aggregate=2048,minimum=4096;
if(phase==='tests')command='--max-old-space-size=1024 --experimental-strip-types --test --test-reporter=tap --test-concurrency=1 '+roots.join(' ');
if(phase==='types'){requirePass('tests');fs.mkdirSync(stage+'/types-'+attempt);fs.copyFileSync('F:/VisibleMedicine/staging/20261026-workbook-history-website/types-1/checker.mjs',stage+'/types-'+attempt+'/checker.mjs',fs.constants.COPYFILE_EXCL);command='--max-old-space-size=3072 '+stage+'/types-'+attempt+'/checker.mjs';heap=3072;aggregate=3584;minimum=5632;}
if(phase==='build'){requirePass('types');const wrapper=stage+'/website-build.mjs';if(!fs.existsSync(wrapper))fs.copyFileSync('F:/VisibleMedicine/staging/20261026-workbook-history-website/website-build.mjs',wrapper,fs.constants.COPYFILE_EXCL);command='--max-old-space-size=256 '+wrapper;heap=1536;aggregate=3584;minimum=5632;}
const i=json('CURRENT_CHECKPOINT.json'),c=i.activeWork.current;assert.deepEqual(c.activeExecutionSessions,[]);assert(c.ownerWslPolicy.keepRunning&&!c.ownerPreviewPolicy.restartPermitted);
c.activeExecutionSessions=[{kind:'head-search-comparison-'+phase,pid:process.pid,evidence:dir}];saveIndex(i);
function clean(){const i=json('CURRENT_CHECKPOINT.json');if(i.activeWork.current.activeExecutionSessions[0]?.pid===process.pid){i.activeWork.current.activeExecutionSessions=[];saveIndex(i);}}
process.once('exit',()=>{if(!fs.existsSync(dir+'/SUPERVISOR-HANDLE.json'))clean();});
try{
 global.gc();const run=await(aggregate===3584?balanced:small)({site,dir,command,heap,aggregate,minimum,extraEnv:{TEMP:root,TMP:root,npm_config_cache:root+'/npm-cache',VM_CURRENT_SOURCE_RECEIPT:sf,VM_CURRENT_SOURCE_SHA256:hash(sf),VM_WEBSITE_ROOT:site,VM_ATLAS_SOURCE_REPO:s.atlas,ATLAS_SOURCE_REPO:s.atlas}});
 verify();const log=fs.readFileSync(dir+'/runner.stdout.log','utf8'),counts=phase==='tests'?Object.fromEntries(['tests','pass','fail','cancelled','skipped','todo'].map(k=>[k,Number([...log.matchAll(new RegExp('^# '+k+' (\\d+)','gm'))].at(-1)?.[1]??-1)])):null;
 const tf=stage+'/types-'+attempt+'/TYPE_RESULT.json',types=phase==='types'&&fs.existsSync(tf)?json(tf):null;
 const passing=run.passing&&(!counts||(counts.tests>=10&&counts.tests===counts.pass&&counts.fail+counts.cancelled+counts.skipped+counts.todo===0))&&(phase!=='types'||types?.fullProjectTypes&&types.diagnosticCount===0);
 save(dir+'/RESULT.json',{at:new Date().toISOString(),phase,run,passing,source:pin(sf),roots:phase==='tests'?roots:undefined,counts,types:types?pin(tf):null,allSourceExact:true,normalPreviewChanged:false,wholeStockSuitePassing:false});
 if(passing){const a=fs.existsSync(acceptedFile)?json(acceptedFile):{};a[phase]=pin(dir+'/RESULT.json');fs.writeFileSync(acceptedFile,JSON.stringify(a,null,2)+'\n');}
 console.log(JSON.stringify({result:pin(dir+'/RESULT.json'),passing,counts,types:types?{roots:types.roots.length,files:types.sourceFiles.length,diagnostics:types.diagnosticCount}:null}));process.exitCode=passing?0:1;
}finally{clean();}
