import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const prior='G:/VisibleMedicine-temp/staging/20261031-release27-repaired-v2',s=json(prior+'/SOURCE.json');
assert.equal(hash(prior+'/SOURCE.json'),'f67f677019ee6b9111ec84328d0cb5cdcc5020a10e979e187d01f177bd179a35');
assert.equal(json(prior+'/partition27retry-RESULT.json').passing,false);
const stage='G:/VisibleMedicine-temp/staging/20261031-release27-repaired-v3',site=stage+'/website';assert(!fs.existsSync(stage));
const target='tests/release-epoch-composition-preservation.test.mjs',proposal='G:/VisibleMedicine-temp/proposals/20261031-release27-composition/'+target;
const before=s.sourceRows.find(r=>r.path===target).sha256;assert.equal(hash('F:/VisibleMedicine/website/'+target),before);const after=hash(proposal);assert.notEqual(before,after);
for(const r of s.sourceRows)assert.equal(hash(s.website+'/'+r.path),r.sha256,r.path);
fs.mkdirSync(stage);execFileSync('git',['clone','--shared','--no-checkout','--quiet','F:/VisibleMedicine/website',site],{windowsHide:true});execFileSync('git',['-C',site,'read-tree','HEAD'],{windowsHide:true});fs.symlinkSync(fs.realpathSync('F:/VisibleMedicine/website/node_modules'),site+'/node_modules','junction');
for(const r of s.sourceRows){const p=site+'/'+r.path;fs.mkdirSync(path.dirname(p),{recursive:true});fs.copyFileSync(s.website+'/'+r.path,p,fs.constants.COPYFILE_EXCL);}
fs.copyFileSync(proposal,site+'/'+target);assert.equal(hash(site+'/'+target),after);
const rows=s.sourceRows.map(r=>r.path===target?{path:target,sha256:after,bytes:fs.statSync(proposal).size}:r),changes=[...s.changes,{path:target,from:proposal,before,after}];
const source={...s,at:new Date().toISOString(),parent:{path:prior+'/SOURCE.json',sha256:hash(prior+'/SOURCE.json')},website:site,sourceRows:rows,changes,currentChanges:changes.map(r=>r.path),followupChangedTests:[target,'tests/notice-history-preservation.test.mjs'],previousPartition:{path:prior+'/partition27retry-RESULT.json',sha256:hash(prior+'/partition27retry-RESULT.json')},fullPartitionRerun:false};
for(const r of rows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
fs.writeFileSync(stage+'/SOURCE.json',JSON.stringify(source,null,2)+'\n',{flag:'wx'});fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),parent:source.parent,source:{path:stage+'/SOURCE.json',sha256:hash(stage+'/SOURCE.json')},newChangedTest:target,rows:rows.length,canonicalUnchanged:true},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,changedTests:changes.length,sourceHash:hash(stage+'/SOURCE.json')}));
