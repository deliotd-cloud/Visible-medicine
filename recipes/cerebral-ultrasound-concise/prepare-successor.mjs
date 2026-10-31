import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const previous='G:/VisibleMedicine-temp/staging/20261031-cerebral-detail-ultrasound-atlas',root='G:/VisibleMedicine-temp/staging/20261031-cerebral-ultrasound-concise',site=root+'/atlas';
const prepared=json(previous+'/SOURCE_PREPARED.json'),state=json(previous+'/VERIFICATION_STATE.json');
assert(state.terminal&&state.state==='failed');assert.equal(state.failure.index,10);assert.equal(state.completed.length,10);assert(!fs.existsSync(root));
const rows=prepared.sourceRows.map(r=>{const expected=state.generated[r.path]??r.sha256;assert.equal(hash(prepared.site+'/'+r.path),expected,r.path);return {...r,sha256:expected,bytes:fs.statSync(prepared.site+'/'+r.path).size};});
const parent={schema:'vm-failed-cerebral-detail-source/1',at:new Date().toISOString(),site:prepared.site,prepared:{path:previous+'/SOURCE_PREPARED.json',sha256:hash(previous+'/SOURCE_PREPARED.json')},state:{path:previous+'/VERIFICATION_STATE.json',sha256:hash(previous+'/VERIFICATION_STATE.json')},sourceRows:rows,base:prepared.base,authoredFiles:prepared.authoredFiles,passed:false,installed:false};
fs.writeFileSync(previous+'/SOURCE_FAILED.json',JSON.stringify(parent,null,2)+'\n',{flag:'wx'});
for(const r of rows){const dest=site+'/'+r.path;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(prepared.site+'/'+r.path,dest,fs.constants.COPYFILE_EXCL);assert.equal(hash(dest),r.sha256,r.path);}
fs.symlinkSync(fs.realpathSync(prepared.site+'/node_modules'),site+'/node_modules','junction');fs.mkdirSync(root+'/tmp');
const git=(...args)=>execFileSync('git',['-C',site,...args],{encoding:'utf8',windowsHide:true}).trim();git('init','--quiet');
const objects=execFileSync('git',['-C',prepared.site,'rev-parse','--path-format=absolute','--git-path','objects'],{encoding:'utf8',windowsHide:true}).trim().replaceAll('\\','/');
fs.writeFileSync(site+'/.git/objects/info/alternates',objects+'\n',{flag:'wx'});git('update-ref','HEAD',prepared.base.head);git('read-tree','HEAD');
fs.copyFileSync(previous+'/BASELINE.json',root+'/BASELINE.json',fs.constants.COPYFILE_EXCL);
fs.copyFileSync(previous+'/SOURCE_FAILED.json',root+'/PARENT_SOURCE.json',fs.constants.COPYFILE_EXCL);
const baseline=json(root+'/BASELINE.json');baseline.root=root;baseline.atlas=site;fs.writeFileSync(root+'/BASELINE.json',JSON.stringify(baseline,null,2)+'\n');
const out={at:new Date().toISOString(),site,parent:{path:previous+'/SOURCE_FAILED.json',sha256:hash(previous+'/SOURCE_FAILED.json')},files:rows.length,base:prepared.base,clinicalApproval:false,installed:false};
fs.writeFileSync(root+'/PREPARED.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(out));
