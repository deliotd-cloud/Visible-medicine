import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root='G:/VisibleMedicine-temp/staging/20261030-website-distribution-audit',pin=root+'/SOURCE-2.json',source=json(pin),site=source.website;
const roots=['website-distribution-inventory.test.mjs','source-credits.test.mjs','head-atlas-import.test.ts'];
const verify=()=>{for(const row of source.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);};verify();
const result=await guarded({site,dir:root+'/focused-final',command:'--test --experimental-strip-types --test-concurrency=1 '+roots.map(p=>'tests/'+p).join(' '),heap:768,aggregate:2048,minimum:4096,extraEnv:{TEMP:root+'/tmp',TMP:root+'/tmp'}});verify();
fs.writeFileSync(root+'/FOCUSED_FINAL.json',JSON.stringify({...result,source:{path:pin,sha256:hash(pin)},sourceUnchanged:true,roots},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passing:result.passing}));if(!result.passing)process.exitCode=1;
