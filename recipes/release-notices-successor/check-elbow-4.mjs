import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root='G:/VisibleMedicine-temp/staging/20261030-release-notices-successor',pin=root+'/SOURCE.json',source=json(pin),site=source.website;
const roots=['clinical-review-elbow-us-followup.test.ts'];
const verify=()=>{for(const row of source.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);};verify();
const envFile='F:/VisibleMedicine/staging/20261030-release-repair-website/HISTORICAL_ENVIRONMENT_2.json';assert.equal(hash(envFile),'bd5fc429483bc9cf7ba26ed5290b1c70bdd6e01cb74d8b9aa18b490dfae973f5');
const result=await guarded({site,dir:root+'/focused-elbow-4',command:'--test --experimental-strip-types --test-concurrency=1 '+roots.map(p=>'tests/'+p).join(' '),heap:1536,aggregate:3072,minimum:5120,extraEnv:{...json(envFile).environment,VM_CURRENT_SOURCE_RECEIPT:pin,VM_CURRENT_SOURCE_SHA256:hash(pin),VM_WEBSITE_ROOT:site,VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas,VM_PUBLIC_PREVIEW_SOURCE_ROOT:site,TEMP:root+'/tmp',TMP:root+'/tmp'}});verify();
fs.writeFileSync(root+'/FOCUSED_ELBOW-4.json',JSON.stringify({...result,source:{path:pin,sha256:hash(pin)},sourceUnchanged:true,roots},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passing:result.passing}));if(!result.passing)process.exitCode=1;
