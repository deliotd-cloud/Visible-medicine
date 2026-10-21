import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';

// Create-only independent local candidate. Never modifies the owner preview,
// databases, permissions, canonical product source or existing preserved stages.
const source='F:/VisibleMedicine/website';
const stage='F:/VisibleMedicine/staging/20261021-review-navigation-ui-candidate';
const site=stage+'/website';
const application='F:/VisibleMedicine/staging/20261021-closed54-55-provider-application';
const inputs=json(application+'/SOURCE_INPUTS_AFTER.json');
const preserved=json(application+'/PREPARATION.json').preserved;
const proposal='F:/VisibleMedicine/staging/20261021-review-navigation-guard-proposal';
const manifest=json(proposal+'/PROPOSAL.json');
assert.equal(inputs.length,5260);assert.equal(preserved.length,7);
assert(!fs.existsSync(stage),'Create-only candidate');
assert.equal(runGit(['-C',source,'rev-parse','HEAD']).toString().trim(),manifest.websiteHeadAtObservation);
process.kill(266712,0);
const verify=()=>{for(const r of [...inputs,...preserved])assert.equal(sha(read(source+'/'+r.path)),r.sha256,r.path);};verify();
const plexus=spawnSync(process.execPath,['scripts/verify-plexus-review.mjs'],{cwd:source,windowsHide:true,encoding:'utf8'});assert.equal(plexus.status,0,plexus.stderr);
for(const row of manifest.proposedPaths){assert.equal(sha(read(proposal+'/'+row.path)),row.candidateSha256);assert.equal(read(proposal+'/'+row.path).length,row.candidateBytes);if(row.preimageSha256)assert.equal(sha(read(source+'/'+row.path)),row.preimageSha256);else assert(!fs.existsSync(source+'/'+row.path));}
fs.mkdirSync(site,{recursive:true});const rows=[];
function copy(p,kind,expected){
 assert(!path.isAbsolute(p)&&!p.includes('\\')&&p.split('/').every(x=>x&&x!=='.'&&x!=='..'));
 assert(!/(^|\/)(?:\.env(?:\.[^/]*)?|\.wrangler|\.git|node_modules)(\/|$)|\.(?:sqlite|dcm|dicom|nii|nrrd)$/i.test(p));
 const from=source+'/'+p,to=site+'/'+p;assert(fs.lstatSync(from).isFile()&&!fs.lstatSync(from).isSymbolicLink());
 const bytes=read(from);if(expected)assert.equal(sha(bytes),expected,p);
 fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(to)),sha(bytes));rows.push({path:p,bytes:bytes.length,sha256:sha(bytes),kind});
}
for(const r of [...inputs,...preserved])copy(r.path,'verified-current-source',r.sha256);
const old=json('F:/VisibleMedicine/staging/20261021-source190-website/PREPARATION.json');
const extras=old.rows.filter(r=>['existing-brand-preview-local-copy','existing-local-only-private-context','existing-local-only-preview-media'].includes(r.kind));
assert.equal(extras.length,13);for(const r of extras){assert(!rows.some(n=>n.path===r.path));copy(r.path,r.kind,r.kind==='existing-local-only-private-context'?null:r.sha256);}
const inventory=json(source+'/lib/atlas-model-inventory.json');assert.equal(inventory.models.length,137);
for(const m of inventory.models)for(const p of m.paths)copy('public'+p,'licensed-registered-model-local-only',m.sha256);
assert.equal(rows.filter(r=>r.kind==='licensed-registered-model-local-only').length,144);
assert(!fs.lstatSync(source+'/node_modules').isSymbolicLink());
fs.cpSync(source+'/node_modules',site+'/node_modules',{recursive:true,errorOnExist:true,force:false,filter:from=>!['.vite','.vite-temp','.cache'].includes(path.basename(from))});
runGit(['init','-q',site]);
const common=runGit(['-C',source,'rev-parse','--git-common-dir']).toString().trim();
fs.mkdirSync(site+'/.git/objects/info',{recursive:true});fs.writeFileSync(site+'/.git/objects/info/alternates',path.resolve(source,common,'objects').replaceAll('\\','/')+'\n',{flag:'wx'});
runGit(['-C',site,'update-ref','HEAD',manifest.websiteHeadAtObservation]);runGit(['-C',site,'read-tree','HEAD']);assert.equal(runGit(['-C',site,'remote']).toString().trim(),'');
verify();process.kill(266712,0);
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),source,site,inputs:inputs.length,preserved:preserved.length,proposal,proposalSha256:sha(read(proposal+'/PROPOSAL.json')),rows,independentDependencies:true,canonicalInstalled:false,ownerPreviewUnchanged:true,privateContextsLocalOnly:true,privateDatabaseCopied:false,permissionsChanged:false,publicDeployment:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,copiedFiles:rows.length,independentDependencies:true,canonicalInstalled:false}));
