import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition8-ready';
const pin='G:/VisibleMedicine-temp/staging/20261031-study-plan-release-ready/SOURCE.json',source=json(pin),site=source.website;
assert.equal(hash(pin),'aba4be7a7c7e479afb8ffd32fb4d182ad9223f321f404b92548c97e694d64436');
const verify=()=>{for(const row of source.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);};verify();
const envPath='F:/VisibleMedicine/staging/20261030-release-repair-website/HISTORICAL_ENVIRONMENT_2.json';
assert.equal(hash(envPath),'bd5fc429483bc9cf7ba26ed5290b1c70bdd6e01cb74d8b9aa18b490dfae973f5');
assert(json('G:/VisibleMedicine-temp/staging/20261031-study-plan-release-ready/RELEASE_QUEUE.json').terminal);
const result=await guarded({site,dir:root+'/cervical-diagnostic',command:'--experimental-strip-types --test --test-concurrency=1 --test-reporter=tap tests/clinical-review-cervical-disc-tour.test.ts',
  heap:1536,aggregate:3072,minimum:5120,extraEnv:{...json(envPath).environment,VM_CURRENT_SOURCE_RECEIPT:pin,VM_CURRENT_SOURCE_SHA256:hash(pin),VM_WEBSITE_ROOT:site,VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas,TEMP:root+'/tmp',TMP:root+'/tmp'}});
verify();const log=fs.readFileSync(root+'/cervical-diagnostic/runner.stdout.log','utf8');
const counts={};for(const key of ['tests','pass','fail','cancelled','skipped','todo']){const rows=[...log.matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];counts[key]=rows.length===1?Number(rows[0][1]):null;}
const passed=result.passing&&counts.tests===3&&counts.pass===3&&counts.fail===0&&counts.cancelled===0&&counts.skipped===0&&counts.todo===0;
fs.writeFileSync(root+'/CERVICAL_DIAGNOSTIC.json',JSON.stringify({...result,passing:passed,counts,source:{path:pin,sha256:hash(pin)},sourceUnchanged:true,scope:'Unchanged whole cervical root, at increased per-process and aggregate test memory. No tests removed or loosened; original failed stock result remains.',fullPartitionPassed:false,wholeSuitePassing:false,installed:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({passing:passed,counts,sourceUnchanged:true}));if(!passed)process.exitCode=1;
