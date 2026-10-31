import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-saved-plan-ready',pin=root+'/SOURCE.json',source=json(pin),site=source.website;
assert.equal(hash(pin),'a44a21f4c025526f39f295d9a069a55a90fd09b0ad5fb24aebc0cec597fb960d');
const verify=()=>{for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);};verify();
assert.equal(json(site+'/atlas-review/integration-inputs.json').sha256,source.review);for(const row of json(site+'/atlas-review/integration-inputs.json').inputs)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
const result=await guarded({site,dir:root+'/build-4096',command:root+'/build-child-4096.mjs',heap:2048,aggregate:4096,minimum:6144,extraEnv:{TEMP:root+'/tmp',TMP:root+'/tmp',VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas,VM_WEBSITE_DISTRIBUTION_AUDIT_DIR:root+'/audit-metadata'}});verify();
fs.writeFileSync(root+'/BUILD_RESULT_4096.json',JSON.stringify({...result,source:{path:pin,sha256:hash(pin)},sourceUnchanged:true,installed:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passing:result.passing}));if(!result.passing)process.exitCode=1;
