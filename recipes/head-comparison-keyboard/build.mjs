import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root='G:/VisibleMedicine-temp/staging/20261030-head-comparison-followup',pin=root+'/AUTHORED_SOURCE.json',source=json(pin),site=source.website;assert(json(root+'/FOCUSED_RESULT-1.json').passing);
for(const row of source.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
const result=await guarded({site,dir:root+'/build-2',command:root+'/build-child.mjs',heap:1536,aggregate:3584,minimum:5632,extraEnv:{TEMP:root+'/tmp',TMP:root+'/tmp',VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas}});
fs.writeFileSync(root+'/BUILD_RESULT-2.json',JSON.stringify({...result,source:{path:pin,sha256:hash(pin)}},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passing:result.passing}));if(!result.passing)process.exitCode=1;
