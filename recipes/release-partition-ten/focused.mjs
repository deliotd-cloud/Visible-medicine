import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition10-ready',pin=root+'/SOURCE.json',source=json(pin),site=source.website;
const sourceHash=hash(pin),verify=()=>{assert.equal(hash(pin),sourceHash);for(const row of source.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);};verify();
const roots=['tests/axillary-admission-preservation.test.mjs','tests/clinical-review-axillary-branch-xray.test.ts','tests/clinical-review-navigation.test.ts','tests/clinical-review-navigation-dialog-contract.test.mjs',
 'tests/clinical-review-shoulder-muscle-xray.test.ts','tests/complete-release-five-followups-preservation.test.mjs','tests/current-atlas-title-tour-delivery.test.mjs','tests/head-feature-roles-preservation.test.mjs',
 'tests/head-link-menu-bound-delivery.test.mjs','tests/head-pilot-delivery-role-preservation-20261021.test.mjs','tests/imaging-presentation.test.mjs','tests/partition10-font-history.test.mjs','tests/website-geist-provenance.test.mjs','tests/head-practice-exit-preservation.test.mjs'];
const result=await guarded({site,dir:root+'/focused',command:'--experimental-strip-types --test --test-concurrency=1 --test-reporter=tap '+roots.join(' '),heap:1024,aggregate:2048,minimum:4096,
 extraEnv:{...json(root+'/HISTORICAL_ENVIRONMENT.json').environment,VM_CURRENT_SOURCE_RECEIPT:pin,VM_CURRENT_SOURCE_SHA256:sourceHash,VM_WEBSITE_ROOT:site,VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas,VM_PUBLIC_PREVIEW_SOURCE_ROOT:site,TEMP:root+'/tmp',TMP:root+'/tmp'}});
verify();const output=fs.readFileSync(root+'/focused/runner.stdout.log','utf8'),counts={};
for(const key of ['tests','pass','fail','cancelled','skipped','todo']){const matches=[...output.matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];counts[key]=matches.length===1?Number(matches[0][1]):null;}
const passed=result.passing&&counts.tests>0&&counts.pass===counts.tests&&['fail','cancelled','skipped','todo'].every(key=>counts[key]===0);
fs.writeFileSync(root+'/FOCUSED_RESULT.json',JSON.stringify({...result,at:new Date().toISOString(),source:{path:pin,sha256:sourceHash},roots,counts,passed,sourceUnchanged:true,wholeSuitePassing:false,installed:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({passed,counts}));if(!passed)process.exitCode=1;
