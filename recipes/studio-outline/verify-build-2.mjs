import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-studio-outline-roundtrip',pin=root+'/SOURCE_READY.json',source=json(pin),site=source.website;assert(json(root+'/FOCUSED2_RESULT.json').passing);assert(json('G:/VisibleMedicine-temp/staging/20261031-release-partition6-final/release-run-2/RELEASE_QUEUE.json').terminal);
const verify=()=>{for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);};
for(const job of [{name:'types-2',command:root+'/types-2.mjs',heap:1536,aggregate:3072,minimum:5120},{name:'build',command:root+'/build-only.mjs',heap:1536,aggregate:4096,minimum:6144}]){
 verify();const result=await guarded({site,dir:root+'/'+job.name,command:job.command,heap:job.heap,aggregate:job.aggregate,minimum:job.minimum,extraEnv:{TEMP:root+'/tmp',TMP:root+'/tmp',VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas}});verify();fs.writeFileSync(root+'/'+job.name.toUpperCase()+'_RESULT.json',JSON.stringify({...result,source:{path:pin,sha256:hash(pin)},sourceUnchanged:true,installed:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({job:job.name,passing:result.passing}));if(!result.passing){process.exitCode=1;break;}
}
