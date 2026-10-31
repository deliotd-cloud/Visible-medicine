import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-studio-outline-roundtrip',pin=root+'/SOURCE_READY.json',source=json(pin),site=source.website;
assert(json(root+'/SCOPED_TYPES2.json').passing);assert(json(root+'/FOCUSED2_RESULT.json').passing);assert(!fs.existsSync(root+'/BUILD_CHILD.json'));
const verify=()=>{for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);};verify();
const result=await guarded({site,dir:root+'/build-3',command:root+'/build-only.mjs',heap:1536,aggregate:3584,minimum:5632,extraEnv:{TEMP:root+'/tmp',TMP:root+'/tmp',VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas}});verify();
fs.writeFileSync(root+'/BUILD_RESULT3.json',JSON.stringify({...result,source:{path:pin,sha256:hash(pin)},sourceUnchanged:true,installed:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passing:result.passing}));if(!result.passing)process.exitCode=1;
