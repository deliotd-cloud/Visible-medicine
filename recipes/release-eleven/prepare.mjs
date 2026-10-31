import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition11-repairs',site=root+'/website';
const previous='G:/VisibleMedicine-temp/staging/20261031-release-partition10-final';
const pin=previous+'/SOURCE.json';
assert.equal(hash(pin),'cf3faf8f249686f28885eafe388e1d834608f09e9fd59bda49d133963d19c7a2');
const queue=json(previous+'/RELEASE_QUEUE.json');assert(queue.terminal);assert.deepEqual(queue.completed.map(r=>[r.index,r.passing]),[[10,true],[11,false]]);
const parent=json(pin);assert(!fs.existsSync(site));
for(const row of parent.sourceRows){
 assert.equal(hash(parent.website+'/'+row.path),row.sha256,row.path);
 const dest=site+'/'+row.path;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(parent.website+'/'+row.path,dest,fs.constants.COPYFILE_EXCL);
 assert.equal(hash(dest),row.sha256,row.path);
}
fs.symlinkSync(fs.realpathSync(parent.website+'/node_modules'),site+'/node_modules','junction');
fs.symlinkSync(parent.atlas,root+'/atlas','junction');fs.mkdirSync(root+'/tmp',{recursive:true});
const git=(...args)=>execFileSync('git',['-C',site,...args],{encoding:'utf8',windowsHide:true}).trim();
git('init','--quiet');
fs.writeFileSync(site+'/.git/objects/info/alternates',execFileSync('git',['-C','F:/VisibleMedicine/website','rev-parse','--path-format=absolute','--git-path','objects'],{encoding:'utf8'}).trim().replaceAll('\\','/')+'\n',{flag:'wx'});
git('update-ref','HEAD',parent.websiteHead);git('read-tree','HEAD');
const inputs=json(site+'/atlas-review/integration-inputs.json');assert.equal(inputs.sha256,parent.review);
for(const row of inputs.inputs)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
for(const name of ['SOURCE.json','HISTORICAL_ENVIRONMENT.json'])fs.copyFileSync(previous+'/'+name,root+'/'+(name==='SOURCE.json'?'PARENT_SOURCE.json':name),fs.constants.COPYFILE_EXCL);
const out={at:new Date().toISOString(),parent:{path:pin,sha256:hash(pin)},website:site,copiedFiles:parent.sourceRows.length,review:inputs.sha256,allInputsUnchanged:true,installed:false};
fs.writeFileSync(root+'/PREPARED.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(out));
