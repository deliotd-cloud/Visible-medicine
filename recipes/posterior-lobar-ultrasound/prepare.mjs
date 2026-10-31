import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-posterior-lobar-us',source='G:/VisibleMedicine-temp/staging/20261031-neonatal-lobar-atlas/atlas',atlas=root+'/atlas';
const git=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8',maxBuffer:8*1024*1024,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'}}).trim();
const head='2c80143a1c7332173dd83a92a637b3ef9a729098';assert.equal(git(source,'rev-parse','HEAD'),head);assert.equal(git(source,'status','--porcelain'),'');assert(!fs.existsSync(atlas));
const rows=git(source,'ls-files','--stage','-z').split('\0').filter(Boolean).map(line=>{const m=/^(100644|100755) ([a-f0-9]{40}) 0\t(.+)$/.exec(line);assert(m);const p=m[3];assert(!path.isAbsolute(p)&&!p.includes('\\')&&!p.split('/').some(s=>['','.','..'].includes(s)));return {path:p,gitBlob:m[2],sha256:hash(source+'/'+p),bytes:fs.statSync(source+'/'+p).size};});
assert.equal(rows.length,6501);const free=fs.statfsSync('G:/');assert(free.bavail*free.bsize>rows.reduce((s,r)=>s+r.bytes,0)+512*1048576);
git(root,'clone','--shared','--no-checkout','--',source,atlas);git(atlas,'read-tree','HEAD');
const autocrlf=git(source,'config','--get','core.autocrlf');assert(['true','false','input'].includes(autocrlf));git(atlas,'config','--local','core.autocrlf',autocrlf);
for(const row of rows){const dest=atlas+'/'+row.path;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(source+'/'+row.path,dest,fs.constants.COPYFILE_EXCL);assert.equal(hash(dest),row.sha256,row.path);}
assert.equal(git(atlas,'status','--porcelain'),'');fs.symlinkSync(fs.realpathSync(source+'/node_modules'),atlas+'/node_modules','junction');fs.mkdirSync(root+'/tmp',{recursive:true});
for(const row of rows)assert.equal(hash(source+'/'+row.path),row.sha256,row.path);
fs.writeFileSync(root+'/BASELINE.json',JSON.stringify({at:new Date().toISOString(),root,atlas,source,sourceHead:head,sourceTree:git(source,'rev-parse','HEAD^{tree}'),sourceRows:rows,independentAssetCopies:true,canonicalUnchanged:true,installed:false,clinicalApproval:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({atlas,files:rows.length,baselineSha256:hash(root+'/BASELINE.json')}));
