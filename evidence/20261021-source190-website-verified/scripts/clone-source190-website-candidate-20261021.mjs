import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const original='F:/VisibleMedicine/staging/20261020-combined-website-ui/website';
const atlas='F:/VisibleMedicine/staging/20261021-atlas-combined-source',stage='F:/VisibleMedicine/staging/20261021-source190-website',site=stage+'/website';
const inputs=json('F:/VisibleMedicine/staging/20261021-plexus-historical-eol-retry/source-inputs-after.json');assert.equal(inputs.length,5087);
const prior=json(path.dirname(original)+'/PREPARATION.json');
const resume=process.argv.slice(2).join(' ')==='--resume';assert.equal(process.argv.length,resume?3:2);
if(resume){assert(fs.existsSync(site)&&!fs.existsSync(stage+'/PREPARATION.json'));assert(!fs.existsSync(site+'/node_modules')&&!fs.existsSync(site+'/.git'));}
else assert(!fs.existsSync(stage));
for(const row of inputs)assert.equal(sha(read(original+'/'+row.path)),row.sha256,row.path);
assert.equal(runGit(['-C',original,'rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),'190a63238eadcf906abe89dcbb6a67c88afe70b9');
const runtime=json('F:/VisibleMedicine/staging/20261021-four-module-admission-v2/RESULT.json');assert(runtime.passed);
// The original copy manifest predates the exact later18-input plexus presentation
// rebind. Admit its current local-only module only through the native verifier,
// pinned current manifest and exact before/after module bytes; never repin blindly.
const plexusManifestSha='b09b4b8ad4adbe33efecbfe5c01b2778a05cc5abbe600e385d9da9be3d621fc2';
assert.equal(sha(read(original+'/lib/plexus-review-manifest.json')),plexusManifestSha);
const moduleSha=sha(read(original+'/.local/plexus-review/assets.ts'));assert.equal(moduleSha,'c0e960bd831e9cb82659e0ecb903b3c5f47eb44ba03e8ca8f6752b7f4dfa4a75');
const verified=spawnSync(process.execPath,['scripts/verify-plexus-review.mjs'],{cwd:original,windowsHide:true,encoding:'utf8',maxBuffer:2e6});assert.equal(verified.status,0,verified.stderr);
assert.equal(sha(read(original+'/lib/plexus-review-manifest.json')),plexusManifestSha);assert.equal(sha(read(original+'/.local/plexus-review/assets.ts')),moduleSha);
const generated=p=>p.startsWith('atlas-review/')||p.startsWith('public/atlas-review-viewer/')||p.startsWith('public/atlas-runtime/');
const copied=[];fs.mkdirSync(site,{recursive:true});
function copy(from,p,expected,kind){
 assert(!path.isAbsolute(p)&&!p.includes('\\')&&p.split('/').every(s=>s&&s!=='.'&&s!=='..'));
 const to=path.resolve(site,p);assert(to.startsWith(path.resolve(site)+path.sep));
 const stat=fs.lstatSync(from);assert(stat.isFile()&&!stat.isSymbolicLink());
 const bytes=read(from);if(expected)assert.equal(sha(bytes),expected,p);
 fs.mkdirSync(path.dirname(to),{recursive:true});if(fs.existsSync(to)){assert(resume);assert.equal(sha(read(to)),sha(bytes),'Unrelated partial destination:'+p);}else fs.writeFileSync(to,bytes,{flag:'wx'});assert.equal(sha(read(to)),sha(bytes));
 copied.push({path:p,bytes:bytes.length,sha256:sha(bytes),kind});
}
if(resume){
 const expected=new Set([...inputs.filter(r=>!generated(r.path)),...prior.rows.filter(r=>!generated(r.path)&&r.kind!=='existing-registered-model')].map(r=>r.path));
 function audit(dir,prefix=''){for(const name of fs.readdirSync(dir)){const from=dir+'/'+name,stat=fs.lstatSync(from);assert(!stat.isSymbolicLink());if(stat.isDirectory())audit(from,prefix+name+'/');else assert(expected.has(prefix+name),'Unknown partial clone file:'+prefix+name);}}audit(site);
 fs.writeFileSync(stage+'/RETAINED_INITIAL_COPY_REFUSAL.json',JSON.stringify({reason:'Old preparation module pin was historical16-input plexus state;current18-input module refused before copying. Native current verifier plus exact current manifest/module hashes now required. No original source or owner editor changed.',oldModuleSha256:'c9c6fbcb71502709b87fefee105bde32cce51cdf88065ec550caa6d8a665bec6',currentManifestSha256:plexusManifestSha,currentModuleSha256:moduleSha,nativeVerifierPassed:true,partialFilesChecked:true},null,2)+'\n',{flag:'wx'});
}
for(const row of inputs)if(!generated(row.path))copy(original+'/'+row.path,row.path,row.sha256,'verified-selected-current-source');
const seen=new Set(copied.map(r=>r.path));
for(const row of prior.rows){
 if(seen.has(row.path)||generated(row.path)||row.kind==='existing-registered-model')continue;
 assert(['verified-selected-source','existing-brand-preview-local-copy','existing-local-only-private-context','existing-local-only-preview-media'].includes(row.kind));
 copy(original+'/'+row.path,row.path,row.path==='.local/plexus-review/assets.ts'?moduleSha:row.sha256,row.kind);seen.add(row.path);
}
for(const item of runtime.exports){
 const manifest=json(item.target+'/manifest.json');assert.equal(sha(read(item.target+'/manifest.json')),item.manifestSha256);assert.equal(manifest.sourceCommit,runtime.commit);
 for(const row of manifest.files)copy(item.target+'/'+row.path,'public/atlas-runtime/'+item.kind+'/'+row.path,row.sha256,'stock-source190-runtime-export');
 copy(item.target+'/manifest.json','public/atlas-runtime/'+item.kind+'/manifest.json',item.manifestSha256,'stock-source190-runtime-manifest');
}
// No writable dependency/cache junctions into the preserved485candidate or owner UI.
assert(!fs.lstatSync(original+'/node_modules').isSymbolicLink());
fs.cpSync(original+'/node_modules',site+'/node_modules',{recursive:true,errorOnExist:true,force:false,filter:from=>!['.vite','.vite-temp','.cache'].includes(path.basename(from))});
runGit(['init','-q',site]);
const common=runGit(['-C',original,'rev-parse','--git-common-dir']).toString().trim();
const objects=path.resolve(original,common,'objects');assert(fs.statSync(objects).isDirectory());
fs.mkdirSync(site+'/.git/objects/info',{recursive:true});fs.writeFileSync(site+'/.git/objects/info/alternates',objects.replaceAll('\\','/')+'\n',{flag:'wx'});
runGit(['-C',site,'update-ref','HEAD','b953ff3f5f1891599cb6e91cb91311d9d6006270']);runGit(['-C',site,'read-tree','HEAD']);assert.equal(runGit(['-C',site,'remote']).toString().trim(),'');
for(const row of inputs)assert.equal(sha(read(original+'/'+row.path)),row.sha256,'Original485candidate unchanged:'+row.path);
const prep={stage,site,atlas,original,at:new Date().toISOString(),sourceCommit:runtime.commit,sourceTree:runtime.tree,closedOriginalInputs:inputs.length,rows:copied,
 sourceOriginalPreserved:true,rawHistoryLocalOnly:true,independentDependencyCopy:true,runtimeSource190Copied:true,stockReviewImported:false,localPlexusModule:{manifestSha256:plexusManifestSha,moduleSha256:moduleSha,nativeVerifierPassed:true,notUploaded:true},canonicalInstalled:false,ownerPreviewUnchanged:true,clinicalApproval:false,publicDeployment:false};
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(prep,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(stage+'/ORIGINAL_485_INPUTS.json',JSON.stringify(inputs,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,site,source:runtime.commit,copiedFiles:copied.length,closedOriginalInputs:inputs.length,stockReviewImported:false,canonicalInstalled:false}));
