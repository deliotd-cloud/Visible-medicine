import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
const prior='G:/VisibleMedicine-temp/proposals/20261101-focus-delivery-assembly',root='G:/VisibleMedicine-temp/proposals/20261101-focus-website-types',cp='F:/VisibleMedicine/recovery/checkpoints/20261101-focus-website-types';
assert(!fs.existsSync(root));assert(!fs.existsSync(cp));fs.mkdirSync(root);fs.mkdirSync(root+'/tmp');fs.mkdirSync(cp);
for(const [from,name]of [['CURRENT_CHECKPOINT.json','INDEX_BEFORE.json'],['WORKSPACE_MAP.md','WORKSPACE_MAP_BEFORE.md'],['F:/VisibleMedicine/website/docs/master-plan.md','MASTER_PLAN_BEFORE.md'],['F:/VisibleMedicine/website/docs/completion-checklist.json','CHECKLIST_BEFORE.json']])fs.copyFileSync(from,cp+'/'+name,fs.constants.COPYFILE_EXCL);
const plan=json(prior+'/PLAN.json');plan.at=new Date().toISOString();plan.oldPreview={pid:59388,launcherPid:136940,workerdPid:176136,launcher:prior+'/window.mjs'};plan.purpose='Run the unchanged full website tsc command with a strict3GiB job/2304MiB heap and unchanged2GiB reserve. This is a bounded budget trial, not a proven memory ceiling. Preserve failures and restore the same installed website. No production build budget is lowered.';plan.memory={heapMiB:2304,aggregateMiB:3072,minimumMiB:5120,reserveMiB:2048};plan.executedPhases=['full-types'];
fs.writeFileSync(root+'/PLAN.json',JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
for(const name of ['window.mjs','restart.mjs','state.mjs','stop.ps1']){
 let text=fs.readFileSync(prior+'/'+name,'utf8').replaceAll(prior,root).replaceAll('F:/VisibleMedicine/recovery/checkpoints/20261101-focus-delivery-assembly',cp);
 if(name==='stop.ps1')text=text.replaceAll('74812','59388').replaceAll('187160','136940').replaceAll('46588','176136').replace('*20261101-focus-native-runtime/window.mjs*','*20261101-focus-delivery-assembly/window.mjs*');
 fs.writeFileSync(root+'/'+name,text,{flag:'wx'});
}
const runner=`import fs from 'node:fs';import assert from 'node:assert/strict';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root=${JSON.stringify(root)},attempt='G:/VisibleMedicine-temp/staging/20261101-focus-delivery/attempt-1',site=attempt+'/website';
assert(json(attempt+'/review-build-RESULT.json').passing);assert(json(attempt+'/assemble-v2-RESULT.json').passing);
const binding=json(site+'/atlas-review/integration-inputs.json');assert.equal(binding.sourceCommit,'7d3ab00f500a738d4f2d261ca6cd768e7f6ce1bc');for(const row of binding.inputs)assert.equal(hash(site+'/'+row.path),row.sha256);
const result=await guarded({site,dir:root+'/guarded',command:'node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false',heap:2304,aggregate:3072,minimum:5120,extraEnv:{TEMP:root+'/tmp',TMP:root+'/tmp'}});
fs.writeFileSync(root+'/RESULT.json',JSON.stringify(result,null,2)+'\\n',{flag:'wx'});assert(result.passing,'Full website semantic types did not pass');console.log('Full website semantic types passed.');
`;
fs.writeFileSync(root+'/run-guarded.mjs',runner,{flag:'wx'});
for(const name of ['run-guarded.mjs','window.mjs','restart.mjs','state.mjs']){const result=spawnSync(process.execPath,['--max-old-space-size=128','--check',root+'/'+name],{encoding:'utf8',windowsHide:true});assert.equal(result.status,0,result.stderr);}
fs.writeFileSync(root+'/VALIDATION_PREFLIGHT.json',JSON.stringify({at:new Date().toISOString(),recipes:['run-guarded.mjs','window.mjs','restart.mjs','stop.ps1'].map(name=>({path:root+'/'+name,sha256:hash(root+'/'+name)})),fullTypeCommandUnchanged:true,heapMiB:2304,jobCapMiB:3072,freeReserveMiB:2048,productionBuildBudgetUnchanged:true},null,2)+'\n',{flag:'wx'});
const i=json('CURRENT_CHECKPOINT.json');i.activeWork.current.pendingCatalogDelivery.currentAttempt.websiteTypes={root,planned:true};saveIndex(i);console.log(JSON.stringify({prepared:root}));
