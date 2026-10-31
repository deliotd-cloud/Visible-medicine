import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root='G:/VisibleMedicine-temp/staging/20261030-review-release-successor',pin=root+'/SOURCE.json',source=json(pin),site=source.website;
assert(json(root+'/FOCUSED_RESULT-1.json').passing);
const verify=()=>{for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);};verify();
const envFile='F:/VisibleMedicine/staging/20261030-release-repair-website/HISTORICAL_ENVIRONMENT_2.json';assert.equal(hash(envFile),'bd5fc429483bc9cf7ba26ed5290b1c70bdd6e01cb74d8b9aa18b490dfae973f5');
const result=await guarded({site,dir:root+'/partition-3',command:'scripts/run-website-tests.mjs --run --partition 3/32',heap:2048,aggregate:3072,minimum:5120,extraEnv:{...json(envFile).environment,VM_CURRENT_SOURCE_RECEIPT:pin,VM_CURRENT_SOURCE_SHA256:hash(pin),VM_WEBSITE_ROOT:site,VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas,VM_PUBLIC_PREVIEW_SOURCE_ROOT:site,TEMP:root+'/tmp',TMP:root+'/tmp'}});verify();
fs.writeFileSync(root+'/PARTITION_RESULT-3.json',JSON.stringify({...result,source:{path:pin,sha256:hash(pin)},sourceUnchanged:true,wholeSuitePassing:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({index:3,passing:result.passing}));if(!result.passing)process.exitCode=1;
