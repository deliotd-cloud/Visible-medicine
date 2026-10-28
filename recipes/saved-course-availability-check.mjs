import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded as small} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-small-native-task-guarded-20261025.mjs';
import {guarded as balanced} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
const stage='F:/VisibleMedicine/staging/20261028-saved-course-availability',root=stage+'-recipes',site=stage+'/website',sf=stage+'/SOURCE_CANDIDATE_V2.json';
assert.equal(hash(sf),'84c0d3ad118013118678922f38103bf3c22fd7ebfacd4bf78d9f6db09a53a63c');
const phase=process.argv[2],attempt=process.argv[3]??'1';assert(['baseline','tests','types','build'].includes(phase));assert(/^[1-9][0-9]*$/.test(attempt));
const pin=p=>({path:p,sha256:hash(p)}),save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'}),s=json(sf),dir=stage+'/checks/'+phase+'-'+attempt,acceptedFile=stage+'/ACCEPTED.json';
const verify=()=>{assert.equal(hash(s.parent),s.parentSha256);for(const r of s.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);for(const r of s.dependencies){assert.equal(hash(r.file),r.sha256);assert.equal(hash(r.entry),r.entrySha256);}};verify();
const requirePass=k=>{const a=json(acceptedFile)[k];assert.equal(hash(a.path),a.sha256);assert(json(a.path).passing);};
const roots=['tests/my-learning-study-now-ui.test.mjs','tests/my-learning-navigation.test.ts','tests/my-learning-availability.test.mjs','tests/course-entry-retirement.test.mjs','tests/course-resume-authority.test.mjs','tests/course-study-now-metrics.test.mjs'];
let cwd=site,command,heap=1024,aggregate=2048,minimum=4096;
if(phase==='baseline'){const b=json(stage+'/BASELINE_CONTROL.json');cwd=b.website;assert.equal(hash(cwd+'/app/my-learning/page.tsx'),b.pageSha256);assert.equal(hash(cwd+'/'+roots[0]),b.testSha256);command='--max-old-space-size=1024 --experimental-strip-types --test --test-reporter=tap --test-concurrency=1 '+roots[0];}
if(phase==='tests'){requirePass('baseline');command='--max-old-space-size=1024 --experimental-strip-types --test --test-reporter=tap --test-concurrency=1 '+roots.join(' ');}
if(phase==='types'){requirePass('tests');fs.mkdirSync(stage+'/types-'+attempt);fs.copyFileSync('F:/VisibleMedicine/staging/20261026-workbook-history-website/types-1/checker.mjs',stage+'/types-'+attempt+'/checker.mjs',fs.constants.COPYFILE_EXCL);command='--max-old-space-size=3072 '+stage+'/types-'+attempt+'/checker.mjs';heap=3072;aggregate=3584;minimum=5632;}
if(phase==='build'){requirePass('types');const wrapper=stage+'/website-build.mjs';if(!fs.existsSync(wrapper))fs.copyFileSync('F:/VisibleMedicine/staging/20261028-head-search-comparison/website-build.mjs',wrapper,fs.constants.COPYFILE_EXCL);command='--max-old-space-size=256 '+wrapper;heap=1536;aggregate=3584;minimum=5632;}
const i=json('CURRENT_CHECKPOINT.json'),c=i.activeWork.current;assert.deepEqual(c.activeExecutionSessions,[]);assert(c.ownerWslPolicy.keepRunning&&!c.ownerPreviewPolicy.restartPermitted);c.activeExecutionSessions=[{kind:'saved-course-availability-'+phase,pid:process.pid,evidence:dir}];saveIndex(i);
function clean(){const i=json('CURRENT_CHECKPOINT.json');if(i.activeWork.current.activeExecutionSessions[0]?.pid===process.pid){i.activeWork.current.activeExecutionSessions=[];saveIndex(i);}}
try{
 global.gc();const run=await(aggregate===3584?balanced:small)({site:cwd,dir,command,heap,aggregate,minimum,extraEnv:{TEMP:root,TMP:root,TMPDIR:root,npm_config_cache:root+'/npm-cache',VM_CURRENT_SOURCE_RECEIPT:sf,VM_CURRENT_SOURCE_SHA256:hash(sf),VM_WEBSITE_ROOT:cwd,VM_ATLAS_SOURCE_REPO:s.atlas,ATLAS_SOURCE_REPO:s.atlas}});
 verify();const log=fs.readFileSync(dir+'/runner.stdout.log','utf8'),counts=['baseline','tests'].includes(phase)?Object.fromEntries(['tests','pass','fail','cancelled','skipped','todo'].map(k=>[k,Number([...log.matchAll(new RegExp('^# '+k+' (\\d+)','gm'))].at(-1)?.[1]??-1)])):null;
 const tf=stage+'/types-'+attempt+'/TYPE_RESULT.json',types=phase==='types'&&fs.existsSync(tf)?json(tf):null;
 const expectedBaseline=phase==='baseline'&&run.process?.terminalObserved&&!run.process.interrupted&&run.process.exitCode===1&&counts.tests===6&&counts.pass===5&&counts.fail===1&&counts.cancelled+counts.skipped+counts.todo===0&&log.includes('not ok 5 - saved course with withdrawn last workbook names unavailability and opens course details');
 const passing=phase==='baseline'?expectedBaseline:run.passing&&(!counts||(counts.tests>=6&&counts.tests===counts.pass&&counts.fail+counts.cancelled+counts.skipped+counts.todo===0))&&(phase!=='types'||types?.fullProjectTypes&&types.diagnosticCount===0);
 save(dir+'/RESULT.json',{at:new Date().toISOString(),phase,run,passing,expectedBaselineFailure:expectedBaseline,source:pin(sf),roots:['baseline','tests'].includes(phase)?(phase==='baseline'?[roots[0]]:roots):undefined,counts,types:types?pin(tf):null,allSourceExact:true,normalPreviewChanged:false,browserAcceptance:false,wholeStockSuitePassing:false});
 if(passing){const a=fs.existsSync(acceptedFile)?json(acceptedFile):{};a[phase]=pin(dir+'/RESULT.json');fs.writeFileSync(acceptedFile,JSON.stringify(a,null,2)+'\n');}
 console.log(JSON.stringify({result:pin(dir+'/RESULT.json'),passing,counts,types:types?{roots:types.roots.length,files:types.sourceFiles.length,diagnostics:types.diagnosticCount}:null}));process.exitCode=passing?0:1;
}finally{clean();}
