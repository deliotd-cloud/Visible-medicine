import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition5',source=json(root+'/SOURCE.json'),site=source.website;
const verify=()=>{for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);};verify();
const result=await guarded({site,dir:root+'/focused-1',command:root+'/check-only.mjs',heap:2048,aggregate:3584,minimum:5632,extraEnv:{TEMP:root+'/tmp',TMP:root+'/tmp',VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas}});verify();
fs.writeFileSync(root+'/FOCUSED_RESULT-1.json',JSON.stringify({...result,source:{path:root+'/SOURCE.json',sha256:hash(root+'/SOURCE.json')},sourceUnchanged:true,installed:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passing:result.passing}));if(!result.passing)process.exitCode=1;
