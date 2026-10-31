import fs from 'node:fs';import assert from 'node:assert/strict';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261030-quick-review-regions',source=json(root+'/SOURCE.json'),site=source.website;
for(const row of source.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);assert(json(root+'/SCOPED_TYPES-2.json').passing);
const out=root+'/build-attempt-1';fs.mkdirSync(out);fs.copyFileSync('F:/VisibleMedicine/staging/20261030-release-validation/website-build.mjs',out+'/checker.mjs',fs.constants.COPYFILE_EXCL);
const result=await guarded({site,dir:root+'/build-guard-1',command:out+'/checker.mjs',heap:1536,aggregate:3584,minimum:5632,extraEnv:{TEMP:root,TMP:root,VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas}});
const changes=source.sourceRows.filter(r=>hash(site+'/'+r.path)!==r.sha256).map(r=>({path:r.path,before:r.sha256,after:hash(site+'/'+r.path)}));
fs.writeFileSync(root+'/BUILD_RESULT-1.json',JSON.stringify({...result,source:{path:root+'/SOURCE.json',sha256:hash(root+'/SOURCE.json')},changes},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passing:result.passing,changes}));if(!result.passing)process.exitCode=1;
