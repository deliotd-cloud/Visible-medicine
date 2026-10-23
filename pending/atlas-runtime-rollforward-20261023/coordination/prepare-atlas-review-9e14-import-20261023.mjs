// Main-owned bounded source import; writes only to a fresh F-drive staging root.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261023-atlas-review-9e14-import',site=root+'/website';
const materialized='F:/VisibleMedicine/staging/20261023-atlas-runtime-materialized/MATERIALIZED.json';
assert.equal(sha(read(materialized)),'2ad32ac583cf72d59abdcefabbfe03d79ddf5378aaec825067d6dc60748bfa2f');
const native=json(materialized),previous='F:/VisibleMedicine/staging/20261022-atlas-teaching-website-composition/website';
const name='scripts/import-clinical-review.mjs',oldSource=previous+'/'+name;
assert.equal(sha(read(oldSource)),'d1985571c8ab0f155cfe4143ad602a35506ea2ebbfb7dba9003a0faa8a790681');
assert.equal(runGit(['-C',native.atlas,'rev-parse','HEAD']).toString().trim(),native.head);
assert.equal(runGit(['-C',native.atlas,'status','--porcelain']).toString().trim(),'');
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
const pwsh='C:/Users/delio/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe';
const observe=()=>JSON.parse(execFileSync(pwsh,['-NoProfile','-NonInteractive','-Command',"$vmOs=Get-CimInstance Win32_OperatingSystem; [pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');freePhysicalKiB=$vmOs.FreePhysicalMemory;freeCommitKiB=$vmOs.FreeVirtualMemory}|ConvertTo-Json -Compress"],{encoding:'utf8',windowsHide:true}));
if(process.argv.includes('--prepare')){
 assert(!fs.existsSync(root));fs.mkdirSync(root);fs.mkdirSync(site+'/scripts',{recursive:true});
 fs.copyFileSync(oldSource,site+'/'+name,fs.constants.COPYFILE_EXCL);
 fs.copyFileSync(oldSource,root+'/import-clinical-review.before.mjs.raw',fs.constants.COPYFILE_EXCL);
 fs.symlinkSync('F:/VisibleMedicine/website/node_modules',site+'/node_modules','junction');
 const old=json(previous+'/atlas-review/manifest.json'),sourceBytes=old.files.reduce((n,r)=>n+fs.statSync(previous+'/atlas-review/'+r.path).size,0);
 assert.equal(old.files.length,1567);assert(sourceBytes<36*1024*1024);
 const prep={at:new Date().toISOString(),website:site,atlas:native.atlas,atlasHead:native.head,atlasTree:native.tree,materialized,materializedSha256:sha(read(materialized)),originalImporter:oldSource,originalImporterSha256:sha(read(oldSource)),originalReview:previous+'/atlas-review/manifest.json',originalReviewSha256:sha(read(previous+'/atlas-review/manifest.json')),originalImportedBytes:sourceBytes,observation:observe(),scope:'One existing exact Git-tree source importer in a new thin harness. No full host app, runtime, viewer, model export or decision storage is present. Importer may receive only its one exact source-commit change; preserve its whole original code and adapters. The actual128MiB source import is separate from heavy native/build checks.',previewChanged:false,installed:false};
 fs.writeFileSync(root+'/PREPARATION.json',JSON.stringify(prep,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/PREPARATION.json',originalImporterSha256:prep.originalImporterSha256,sourceBytes,previewChanged:false}));
}else{
 const prep=json(root+'/PREPARATION.json'),source=read(site+'/'+name).toString(),before=read(root+'/import-clinical-review.before.mjs.raw');
 const old="const revision = '7978478992f54ea68e0f53c3d195c459c7b80068';",now="const revision = '9e1407629bd6f85061537c9f013fd72e4543e0da';";
 assert.equal(source.split(now).length,2);assert.equal(source.includes(old),false);
 assert.deepEqual(Buffer.from(source.replace(now,old)),before,'Complete importer source and every original adapter remains exact');
 assert.equal(sha(before),prep.originalImporterSha256);assert(!fs.existsSync(site+'/atlas-review'));
 const observation=observe();assert(observation.freeCommitKiB>4*1024*1024);
 const args=['--max-old-space-size=128',name,native.atlas],out=fs.createWriteStream(root+'/import.stdout.log',{flags:'wx'}),err=fs.createWriteStream(root+'/import.stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,args,{cwd:site,windowsHide:true,env:{...process.env,NODE_OPTIONS:'--max-old-space-size=128',GOMAXPROCS:'2',RAYON_NUM_THREADS:'1',GIT_NO_REPLACE_OBJECTS:'1',GIT_TERMINAL_PROMPT:'0'},stdio:['ignore','pipe','pipe']});
 child.stdout.pipe(out);child.stderr.pipe(err);
 fs.writeFileSync(root+'/STARTED.json',JSON.stringify({at:new Date().toISOString(),pid:child.pid,coordinatorPid:process.pid,args,importerSha256:sha(Buffer.from(source)),heapMiB:128,observation,previewChanged:false},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({phase:'source-import-running',pid:child.pid,heapMiB:128,source:native.head}));
 const outcome=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:error.message}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await Promise.all([out,err].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
 const terminal={at:new Date().toISOString(),...outcome,args,importerSha256:sha(Buffer.from(source)),wholeOriginalImporterInverse:true,stdoutSha256:sha(read(root+'/import.stdout.log')),stderrSha256:sha(read(root+'/import.stderr.log')),atlas:native.atlas,source:native.head,heapMiB:128,observation,previewChanged:false,installed:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false};
 fs.writeFileSync(root+'/TERMINAL.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/TERMINAL.json',...outcome,source:native.head}));process.exitCode=outcome.code===0?0:1;
}
