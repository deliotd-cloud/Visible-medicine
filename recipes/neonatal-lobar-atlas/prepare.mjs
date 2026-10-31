import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-neonatal-lobar-atlas',source='F:/VisibleMedicine/atlas',atlas=root+'/atlas';
const proposal='G:/VisibleMedicine-temp/proposals/20261031-neonatal-lobar-us';
const base='c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3';
const git=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8',maxBuffer:8*1024*1024,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'}}).trim();
const resume=process.argv[2]==='resume';
assert.equal(git(source,'rev-parse','HEAD'),base);assert.equal(git(source,'status','--porcelain'),'');assert.equal(fs.existsSync(atlas),resume);
const rows=git(source,'ls-files','--stage','-z').split('\0').filter(Boolean).map(line=>{const m=/^(100644|100755) ([a-f0-9]{40}) 0\t(.+)$/.exec(line);assert(m,'Regular source files only');const p=m[3];assert(!path.isAbsolute(p)&&!p.includes('\\')&&!p.split('/').some(s=>['','.','..'].includes(s)));return {path:p,gitBlob:m[2],sha256:hash(source+'/'+p),bytes:fs.statSync(source+'/'+p).size};});
assert.equal(rows.length,6500);const free=fs.statfsSync('G:/');assert(free.bavail*free.bsize>rows.reduce((s,r)=>s+r.bytes,0)+512*1048576);
if(!resume){git(root,'clone','--shared','--no-checkout','--',source,atlas);git(atlas,'read-tree','HEAD');}
assert.equal(git(atlas,'rev-parse','HEAD'),base);
// Match the original checkout's Git newline interpretation while preserving
// every copied working-file byte. No source normalization is performed.
const autocrlf=git(source,'config','--get','core.autocrlf');assert(['true','false','input'].includes(autocrlf));git(atlas,'config','--local','core.autocrlf',autocrlf);
for(const row of rows){const dest=atlas+'/'+row.path;if(!resume){fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(source+'/'+row.path,dest,fs.constants.COPYFILE_EXCL);}assert.equal(hash(dest),row.sha256,row.path);}
assert.equal(git(atlas,'status','--porcelain'),'');
const file='content/cerebral-lobar-imaging.ts',change=json(proposal+'/CHANGE.json');assert.equal(hash(atlas+'/'+file),change.beforeSha256);assert.equal(hash(proposal+'/'+file),change.afterSha256);fs.copyFileSync(proposal+'/'+file,atlas+'/'+file);
fs.symlinkSync(fs.realpathSync(source+'/node_modules'),atlas+'/node_modules','junction');fs.mkdirSync(root+'/tmp',{recursive:true});
for(const row of rows)assert.equal(hash(source+'/'+row.path),row.sha256,row.path);assert.equal(git(source,'status','--porcelain'),'');assert.equal(git(source,'rev-parse','HEAD'),base);
fs.writeFileSync(root+'/BASELINE.json',JSON.stringify({schema:'vm-isolated-neonatal-atlas/1',at:new Date().toISOString(),root,atlas,source,sourceHead:base,sourceTree:git(source,'rev-parse','HEAD^{tree}'),sourceRows:rows,changes:[change],independentAssetCopies:true,onlyNodeModulesJunction:true,canonicalUnchanged:true,installed:false,clinicalApproval:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({atlas,files:rows.length,bytes:rows.reduce((s,r)=>s+r.bytes,0),baselineSha256:hash(root+'/BASELINE.json'),canonicalUnchanged:true}));
