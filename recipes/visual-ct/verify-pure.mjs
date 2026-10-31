import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-visual-ct-guidance',file=root+'/SOURCE_PREPARED.json',source=json(file);assert.equal(hash(file),'08c9969078304afe207bf82eff237c630a9f2f9bd1e21ef5e0ffd85cf1ea1006');
const verify=()=>{for(const r of source.sourceRows)assert.equal(hash(source.site+'/'+r.path),r.sha256,r.path);};verify();
const env={...process.env,NODE_OPTIONS:'--max-old-space-size=64',TEMP:root+'/tmp',TMP:root+'/tmp'};
const syntax=[];for(const r of source.authoredFiles.filter(r=>/\.(mjs|ts)$/.test(r.path))){const result=spawnSync(process.execPath,['--experimental-strip-types','--check',r.path],{cwd:source.site,env,windowsHide:true,encoding:'utf8'});assert.equal(result.status,0,result.stderr);syntax.push({path:r.path,sha256:r.sha256,status:result.status});}
const result=spawnSync(process.execPath,['--experimental-strip-types','--test','--test-reporter=tap','scripts/test-nested-visual-ct-guidance.mjs'],{cwd:source.site,env,windowsHide:true,encoding:'utf8',maxBuffer:2e6});
const log=root+'/PURE_CHECKS.tap';fs.writeFileSync(log,(result.stdout??'')+(result.stderr??''),{flag:'wx'});verify();
const counts={};for(const k of ['tests','pass','fail','cancelled','skipped','todo']){const matches=[...(result.stdout??'').matchAll(new RegExp('^# '+k+' (\\d+)\\r?$','gm'))];assert.equal(matches.length,1,k);counts[k]=Number(matches[0][1]);}
assert.equal(result.status,0);assert.deepEqual(counts,{tests:3,pass:3,fail:0,cancelled:0,skipped:0,todo:0});
const report={at:new Date().toISOString(),source:{path:file,sha256:hash(file)},passed:true,counts,syntax,heapMiB:64,sourceUnchanged:true,runtimeValidation:false,clinicalApproval:false,installed:false,log:{path:log,sha256:hash(log)}};fs.writeFileSync(root+'/PURE_CHECKS.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({counts,syntax:syntax.length,source:report.source,runtimeValidation:false}));
