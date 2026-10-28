import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
import {assertWebsiteTestHistory} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison/website/scripts/website-test-history-preflight.mjs';
import {verifyPublicPreviewAssets} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison/website/scripts/public-preview-preflight.mjs';
const stage='F:/VisibleMedicine/staging/20261028-release-context-repairs',sf=stage+'/SOURCE_CANDIDATE_V3.json',site=stage+'/website';
const sourceSha='758432a0d2836fc574bf19c61a11b28da64f606bab25586008e52dabff7c3c81';assert.equal(hash(sf),sourceSha);const s=json(sf);
const groups={
 core:['current-private-review-binding.test.mjs','atlas-delivery-access-sql-current.test.mjs','atlas-delivery-access-sql.test.mjs','viewer-notice-current.test.mjs','viewer-notice-role-integrity.test.mjs'],
 foot:['atlas-foot-notice-epoch.test.ts'],
 arterial:['arterial-delivery-role-integrity.test.mjs','arterial-history-preservation.test.mjs','atlas-a01-current-preservation.test.mjs','atlas-arterial-a01-current-delivery.test.mjs'],
 cervical:['cervical-delivery-role-integrity.test.mjs','atlas-cervical-epoch-preservation.test.mjs','cervical-history-preservation.test.mjs','atlas-cervical-a01-current-delivery.test.mjs'],
 reviewHistory:['head-pan-review-binding.test.mjs','window-drag-review-binding.test.mjs'],
 noticeHistory:['atlas-current-history-wave4-contract.test.mjs','notice-history-preservation.test.mjs','wave4-notice-digest-guard.test.mjs'],
};
const group=process.argv[2],attempt=process.argv[3]??'1';assert(Object.hasOwn(groups,group));assert(/^[1-9][0-9]*$/.test(attempt));
const roots=groups[group].map(n=>'tests/'+n),dir=stage+'/checks/'+group+'-'+attempt;
const pin=p=>({path:p,sha256:hash(p)}),save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const verify=()=>{assert.equal(hash(sf),sourceSha);for(const r of s.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);for(const r of s.dependencies){assert.equal(hash(r.file),r.sha256);assert.equal(hash(r.entry),r.entrySha256);}};
verify();const history=assertWebsiteTestHistory(site),assets=verifyPublicPreviewAssets(site);
const tmp=stage+'/temp';fs.mkdirSync(tmp,{recursive:true});Object.assign(process.env,{TEMP:tmp,TMP:tmp,TMPDIR:tmp});
const noticeConfig='F:/VisibleMedicine/staging/20261025-viewer-notice-roles-source/LOCAL_ONLY/CONFIGURATION.json';
const noticeEnv=Object.fromEntries(Object.entries(json(noticeConfig)).filter(([k])=>k.startsWith('VM_NOTICE_')));
const allowed=['VM_NOTICE_WAVE4_WEBSITE','VM_NOTICE_WAVE4_ATLAS','VM_NOTICE_ADMISSION_WEBSITE','VM_NOTICE_GUARD_WEBSITE','VM_NOTICE_LOCAL_EVIDENCE'];assert.deepEqual(Object.keys(noticeEnv).sort(),allowed.sort());for(const p of Object.values(noticeEnv))assert(fs.existsSync(p));
const historicalConfig='F:/VisibleMedicine/staging/20261028-release-repair-recipes/HISTORICAL_ENVIRONMENT_V2.json';assert.equal(hash(historicalConfig),'28a85617de56f42a7ea28d77e14456735f180838d8bdbf25f6d826334c845f1e');const historicalEnv=json(historicalConfig).environment;for(const p of Object.values(historicalEnv))assert(fs.existsSync(p));
const i=json('CURRENT_CHECKPOINT.json'),c=i.activeWork.current;assert.deepEqual(c.activeExecutionSessions,[]);assert(c.ownerWslPolicy.keepRunning&&!c.ownerPreviewPolicy.restartPermitted);
c.activeExecutionSessions=[{kind:'release-context-focused-'+group,pid:process.pid,evidence:dir,source:pin(sf)}];saveIndex(i);
function clean(){const i=json('CURRENT_CHECKPOINT.json');if(i.activeWork.current.activeExecutionSessions[0]?.pid===process.pid){i.activeWork.current.activeExecutionSessions=[];saveIndex(i);}}
process.once('exit',()=>{if(!fs.existsSync(dir+'/SUPERVISOR-HANDLE.json'))clean();});
try{
 global.gc?.();const run=await guarded({site,dir,command:'--max-old-space-size=1024 --experimental-strip-types --test --test-concurrency=1 --test-reporter=tap '+roots.join(' '),heap:1024,aggregate:group==='arterial'?3072:2048,minimum:group==='arterial'?5120:4096,extraEnv:{TEMP:tmp,TMP:tmp,TMPDIR:tmp,npm_config_cache:tmp+'/npm-cache',VM_CURRENT_SOURCE_RECEIPT:sf,VM_CURRENT_SOURCE_SHA256:sourceSha,VM_WEBSITE_ROOT:site,VM_ATLAS_SOURCE_REPO:s.atlas,ATLAS_SOURCE_REPO:s.atlas,...noticeEnv,...historicalEnv}});
 verify();assert.deepEqual(assertWebsiteTestHistory(site),history);assert.deepEqual(verifyPublicPreviewAssets(site),assets);
 const log=fs.existsSync(dir+'/runner.stdout.log')?fs.readFileSync(dir+'/runner.stdout.log','utf8'):'';
 const counts=Object.fromEntries(['tests','pass','fail','cancelled','skipped','todo'].map(k=>[k,Number([...log.matchAll(new RegExp('^# '+k+' (\\d+)','gm'))].at(-1)?.[1]??-1)]));
 const passing=run.passing&&counts.tests>=roots.length&&counts.pass===counts.tests&&counts.fail+counts.cancelled+counts.skipped+counts.todo===0;
 const failures=log.split(/\r?\n/).filter(l=>/^not ok /.test(l)).map(l=>l.replace(/^not ok \d+ - /,''));
 save(dir+'/RESULT.json',{at:new Date().toISOString(),source:pin(sf),group,roots,counts,failures,run,passing,allSourceAndDependencyBytesStable:true,history,assets,explicitHistoricalNoticeConfiguration:pin(noticeConfig),explicitHistoricalRoleConfiguration:pin(historicalConfig),productChanged:false,wholeSuitePassing:false,normalPreviewChanged:false});
 if(passing){const p=stage+'/ACCEPTED.json',a=fs.existsSync(p)?json(p):{};a[group]=pin(dir+'/RESULT.json');fs.writeFileSync(p,JSON.stringify(a,null,2)+'\n');}
 console.log(JSON.stringify({group,result:pin(dir+'/RESULT.json'),counts,passing}));process.exitCode=passing?0:1;
}finally{clean();}
