import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-cerebral-detail-ultrasound-atlas',site=root+'/atlas',baseline=json(root+'/BASELINE.json');
const expected=['content/cerebral-detail-ultrasound.ts','content/hippocampal-teaching.ts','content/nested-teaching.ts','scripts/cerebral-detail-ultrasound-history.mjs','scripts/test-cerebral-detail-ultrasound.mjs','scripts/validate-cerebral-lobar-imaging.mjs','scripts/validate-hippocampal-teaching.mjs','scripts/validate-nested-teaching.mjs'].sort();
const git=(dir,...args)=>execFileSync('git',['-C',dir,...args],{encoding:'utf8',windowsHide:true,maxBuffer:4e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'}}).trim();
assert.equal(git(site,'rev-parse','HEAD'),baseline.sourceHead);assert.equal(git(baseline.source,'status','--porcelain'),'');
assert.equal(git('F:/VisibleMedicine/atlas','rev-parse','HEAD'),'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3');
const added=git(site,'ls-files','--others','--exclude-standard').split('\n').filter(Boolean);
assert.deepEqual(added.sort(),['content/cerebral-detail-ultrasound.ts','scripts/cerebral-detail-ultrasound-history.mjs','scripts/test-cerebral-detail-ultrasound.mjs']);
const changed=[];const sourceRows=[];
for(const row of baseline.sourceRows){assert.equal(hash(baseline.source+'/'+row.path),row.sha256,row.path);const sha256=hash(site+'/'+row.path);if(sha256!==row.sha256)changed.push(row.path);sourceRows.push({path:row.path,sha256,bytes:fs.statSync(site+'/'+row.path).size});}
for(const path of added){changed.push(path);sourceRows.push({path,sha256:hash(site+'/'+path),bytes:fs.statSync(site+'/'+path).size});}
assert.deepEqual(changed.sort(),expected);assert.equal(sourceRows.length,6504);git(site,'diff','--check');
const authoredFiles=expected.map(path=>sourceRows.find(row=>row.path===path));
for(const path of expected)execFileSync(process.execPath,['--experimental-strip-types','--check',site+'/'+path],{windowsHide:true,stdio:'pipe'});
const prepared={schema:'vm-cerebral-detail-atlas-preparation/1',at:new Date().toISOString(),site,base:{head:baseline.sourceHead,tree:baseline.sourceTree,receipt:{path:root+'/BASELINE.json',sha256:hash(root+'/BASELINE.json')}},authoredFiles,sourceRows,syntaxChecks:8,parentUnchanged:true,canonicalUnchanged:true,installed:false,generated:false,runtimeValidated:false,clinicalApproval:false,reviewImpactPending:true,minimumTestMiB:4096,corrections:['History inverse explicitly rejects duplicate concepts; two additional negative cases (20 total).','Original hippocampal epoch modality absence is independently checked alongside current draft.'],verificationRecipe:{path:root+'/verify-ready.mjs',sha256:hash(root+'/verify-ready.mjs')}};
fs.writeFileSync(root+'/SOURCE_PREPARED.json',JSON.stringify(prepared,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({prepared:{path:root+'/SOURCE_PREPARED.json',sha256:hash(root+'/SOURCE_PREPARED.json')},authoredFiles:8,sourceFiles:6504,syntaxChecks:8,runtimeValidated:false}));
