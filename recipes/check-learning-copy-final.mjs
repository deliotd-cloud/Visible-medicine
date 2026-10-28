import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded as small} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-small-native-task-guarded-20261025.mjs';
import {guarded as balanced} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
const stage='F:/VisibleMedicine/staging/20261028-structure-learning-copy-final',root=stage+'-recipes',sf=stage+'/SOURCE_CANDIDATE.json',sourceSha='8a3b202eead0253d4d019673f3278b86e8ee8b52122dc695e41c7bd6b1f1284b';
const phase=process.argv[2],attempt=process.argv[3]??'1';assert(['tests','types','build'].includes(phase));assert(/^[1-9][0-9]*$/.test(attempt));
const s=json(sf),site=s.website,dir=stage+'/checks/'+phase+'-'+attempt,acceptedFile=stage+'/ACCEPTED.json',pin=path=>({path,sha256:hash(path)}),save=(path,value)=>fs.writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const verify=()=>{assert.equal(hash(sf),sourceSha);for(const r of s.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);for(const d of s.dependencies){assert.equal(hash(d.file),d.sha256);assert.equal(hash(d.entry),d.entrySha256);}};verify();
const i=json('CURRENT_CHECKPOINT.json'),c=i.activeWork.current;assert.deepEqual(c.activeExecutionSessions,[]);assert.equal(c.latestDevelopmentSource.source.sha256,sourceSha);assert(c.ownerWslPolicy.keepRunning&&!c.ownerPreviewPolicy.restartPermitted);
const pass=k=>{const ref=json(acceptedFile)[k];assert.equal(hash(ref.path),ref.sha256);assert(json(ref.path).passing);};
const roots=['tests/body-structure-guides.test.mjs','tests/related-lectures.test.ts','tests/lecture-tour-journey.test.ts'];
let command,heap=512,aggregate=1024,minimum=3072;
if(phase==='tests')command='--max-old-space-size=512 --experimental-strip-types --test --test-reporter=tap --test-concurrency=1 '+roots.join(' ');
if(phase==='types'){pass('tests');fs.mkdirSync(stage+'/types-'+attempt);fs.copyFileSync('F:/VisibleMedicine/staging/20261026-workbook-history-website/types-1/checker.mjs',stage+'/types-'+attempt+'/checker.mjs',fs.constants.COPYFILE_EXCL);command='--max-old-space-size=3072 '+stage+'/types-'+attempt+'/checker.mjs';heap=3072;aggregate=3584;minimum=5632;}
if(phase==='build'){pass('types');const wrapper=stage+'/website-build.mjs';if(!fs.existsSync(wrapper))fs.copyFileSync('F:/VisibleMedicine/staging/20261028-head-search-comparison/website-build.mjs',wrapper,fs.constants.COPYFILE_EXCL);command='--max-old-space-size=256 '+wrapper;heap=1536;aggregate=3584;minimum=5632;}
c.activeExecutionSessions=[{kind:'structure-learning-copy-'+phase,pid:process.pid,evidence:dir}];saveIndex(i);
function clear(){const latest=json('CURRENT_CHECKPOINT.json');if(latest.activeWork.current.activeExecutionSessions[0]?.pid===process.pid){latest.activeWork.current.activeExecutionSessions=[];saveIndex(latest);}}
process.once('exit',()=>{if(!fs.existsSync(dir+'/SUPERVISOR-HANDLE.json')||fs.existsSync(dir+'/PROCESS-TERMINAL.json'))clear();});
try{
 global.gc?.();const run=await(aggregate===3584?balanced:small)({site,dir,command,heap,aggregate,minimum,extraEnv:{TEMP:root,TMP:root,TMPDIR:root,npm_config_cache:root+'/npm-cache',VM_CURRENT_SOURCE_RECEIPT:sf,VM_CURRENT_SOURCE_SHA256:sourceSha,VM_WEBSITE_ROOT:site,VM_ATLAS_SOURCE_REPO:s.atlas,ATLAS_SOURCE_REPO:s.atlas}});verify();
 const log=fs.readFileSync(dir+'/runner.stdout.log','utf8');const counts=phase==='tests'?Object.fromEntries(['tests','pass','fail','cancelled','skipped','todo'].map(k=>[k,Number([...log.matchAll(new RegExp('^# '+k+' (\\d+)','gm'))].at(-1)?.[1]??-1)])):null;
 const tf=stage+'/types-'+attempt+'/TYPE_RESULT.json',types=phase==='types'&&fs.existsSync(tf)?json(tf):null;
 const passing=run.passing&&(!counts||(counts.tests>=3&&counts.tests===counts.pass&&counts.fail+counts.cancelled+counts.skipped+counts.todo===0))&&(phase!=='types'||types?.fullProjectTypes&&types.diagnosticCount===0);
 save(dir+'/RESULT.json',{at:new Date().toISOString(),source:pin(sf),phase,roots:phase==='tests'?roots:undefined,run,passing,counts,types:types?pin(tf):null,allSourceExact:true,normalPreviewChanged:false,wslStopped:false,wholeSuitePassing:false,browserAcceptance:false});
 if(passing){const a=fs.existsSync(acceptedFile)?json(acceptedFile):{};assert(!a[phase]);a[phase]=pin(dir+'/RESULT.json');fs.writeFileSync(acceptedFile,JSON.stringify(a,null,2)+'\n');}
 console.log(JSON.stringify({result:pin(dir+'/RESULT.json'),passing,counts}));process.exitCode=passing?0:1;
}finally{if(!fs.existsSync(dir+'/SUPERVISOR-HANDLE.json')||fs.existsSync(dir+'/PROCESS-TERMINAL.json'))clear();}
