import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root='G:/VisibleMedicine-temp/staging/20261030-release-notices-successor',source=json(root+'/SOURCE.json'),site=source.website;
assert(json(root+'/focused-elbow-4/PROCESS-TERMINAL.json').terminalObserved,'Wait for the focused test process');
const verify=()=>{for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);};verify();
const result=await guarded({site,dir:root+'/build-1',command:root+'/build-only.mjs',heap:1536,aggregate:3072,minimum:5120,extraEnv:{TEMP:root+'/tmp',TMP:root+'/tmp',VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas}});verify();
if(result.passing)for(const name of ['native-website-react-LICENSE.txt','native-website-vinext-LICENSE.txt','native-website-supplemental-NOTICES.txt'])assert.equal(hash(site+'/dist/client/licenses/'+name),hash(site+'/public/licenses/'+name),'Exact production notice: '+name);
fs.writeFileSync(root+'/BUILD_RESULT-1.json',JSON.stringify({...result,source:{path:root+'/SOURCE.json',sha256:hash(root+'/SOURCE.json')},sourceUnchanged:true,publicNoticesInProductionOutput:result.passing},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passing:result.passing}));if(!result.passing)process.exitCode=1;
