import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition12-final',file=root+'/SOURCE.json',source=json(file),sha='e464d5ac847dfe8fcc1885eb0b05ad5db89ac6d84f1af0ac44dc6f2259de9a5f';
const verify=()=>{assert.equal(hash(file),sha);for(const r of source.sourceRows)assert.equal(hash(source.website+'/'+r.path),r.sha256,r.path);};verify();
const test='tests/studio-history-controller-migration.test.mjs',r=spawnSync(process.execPath,['--max-old-space-size=64','--test','--test-reporter=tap',test],{cwd:source.website,windowsHide:true,encoding:'utf8',env:{...process.env,NODE_OPTIONS:'--max-old-space-size=64',VM_WEBSITE_ROOT:source.website},maxBuffer:2e6});
verify();const log=root+'/STUDIO_FINAL.tap';fs.writeFileSync(log,(r.stdout??'')+(r.stderr??''),{flag:'wx'});
const counts={};for(const key of ['tests','pass','fail','cancelled','skipped','todo']){const matches=[...(r.stdout??'').matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];assert.equal(matches.length,1,key);counts[key]=Number(matches[0][1]);}
assert.deepEqual(counts,{tests:2,pass:2,fail:0,cancelled:0,skipped:0,todo:0});assert.equal(r.status,0);
const report={at:new Date().toISOString(),source:{path:file,sha256:sha},test,counts,exitCode:r.status,sourceUnchanged:true,heapMiB:64,log:{path:log,sha256:hash(log)},passed:true};fs.writeFileSync(root+'/STUDIO_FINAL.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
