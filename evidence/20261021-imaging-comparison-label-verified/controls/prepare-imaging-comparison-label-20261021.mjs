// Main-owned mechanical copy of an authenticated, immutable local candidate.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const baseline='F:/VisibleMedicine/staging/20261021-coherent-usability-candidate';
const stage='F:/VisibleMedicine/staging/20261021-imaging-comparison-label-candidate',site=stage+'/website';
const proposalRoot='F:/VisibleMedicine/staging/20261021-comparison-accessible-label-proposal';
const proposal=json(proposalRoot+'/PROPOSAL.json'),rows=json(baseline+'/FOLLOWUP_SOURCE_INPUTS.json');
const pointer=json('CURRENT_CHECKPOINT.json'),canonical='F:/VisibleMedicine/website';
const canonicalRows=json(pointer.activeWork.sourceSnapshot),preserved=pointer.activeWork.preservedSourcePaths.map(path=>({path,bytes:read(canonical+'/'+path).length,sha256:sha(read(canonical+'/'+path))}));
assert.equal(sha(read(baseline+'/FOLLOWUP_SOURCE_INPUTS.json')),'71c75ff81550abf4b4dd3cb35551acf9acbac99575a1e56ba464cc7d5ec5b2c9');
assert.equal(rows.length,5466);assert.equal(canonicalRows.length,5267);assert.equal(preserved.length,7);
assert.equal(proposal.schema,'visible-medicine-comparison-accessible-label-proposal-v2');
assert.equal(proposal.baseline.directory,baseline+'/website');assert.equal(proposal.proposedPaths.length,2);
assert.equal(proposal.baseline.review,'15a0c1e0c4d30535fd212b06bd0b815d97ea7cd26933a6354bdcc24a35c6802e');
const guard=()=>{
 assert.equal(runGit(['-C',canonical,'rev-parse','HEAD']).toString().trim(),proposal.websiteHeadAtObservation);
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),proposal.atlasSourceAtObservation);
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','status','--porcelain']).toString().trim(),'');
 for(const r of rows)assert.equal(sha(read(baseline+'/website/'+r.path)),r.sha256,'Immutable baseline:'+r.path);
 for(const r of [...canonicalRows,...preserved])assert.equal(sha(read(canonical+'/'+r.path)),r.sha256,'Owner source:'+r.path);
 process.kill(266712,0);process.kill(240632,0);
};
const resume=process.argv[2]==='--resume-after-schema-field-failure';
guard();if(resume){assert(fs.existsSync(stage+'/STARTED.json'));assert(!fs.existsSync(stage+'/PREPARATION.json'));assert(!fs.existsSync(site+'/node_modules'));}else assert(!fs.existsSync(stage));
const space=fs.statfsSync('F:/');assert(space.bavail*space.bsize>5*1024**3);
fs.mkdirSync(site,{recursive:true});
const save=(name,v)=>fs.writeFileSync(stage+'/'+name,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
if(!resume)save('STARTED.json',{at:new Date().toISOString(),driver:process.pid,canonicalInstalled:false,ownerFormsRefreshed:false});
else save('COPY_PREFLIGHT_FAILURE.json',{at:new Date().toISOString(),session:64397,exitCode:1,toolChunk:'498f41',error:'TypeError at the independent Plexus boundary check: sourceInputs is not this packet schema. The correct presentationInputs and topologyInputs arrays were inspected before correcting the check. Copied source bytes are revalidated before resuming; no product or owner source changed.'});
const proposed=new Map(proposal.proposedPaths.map(r=>[r.path,r]));
const selected=[];
for(const r of rows){
 assert(!path.isAbsolute(r.path)&&!r.path.includes('\\')&&r.path.split('/').every(v=>v&&v!=='.'&&v!=='..'));
 assert(!/(^|\/)(?:\.env(?:\.[^/]*)?|\.wrangler|\.git|node_modules)(\/|$)|\.(?:sqlite|db|dcm|dicom|nii|nrrd)$/i.test(r.path));
 const edit=proposed.get(r.path),from=edit?proposal.candidateDirectory+'/'+r.path:baseline+'/website/'+r.path;
 if(edit){assert.equal(r.sha256,edit.preimageSha256);assert.equal(sha(read(from)),edit.candidateSha256);}
 const to=site+'/'+r.path;fs.mkdirSync(path.dirname(to),{recursive:true});
 assert(fs.lstatSync(from).isFile()&&!fs.lstatSync(from).isSymbolicLink());if(resume&&fs.existsSync(to))assert.equal(sha(read(to)),sha(read(from)));else fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);
 const bytes=read(to),expected=edit?edit.candidateSha256:r.sha256;assert.equal(sha(bytes),expected);
 selected.push({path:r.path,bytes:bytes.length,sha256:expected});
 if(edit){const pre=stage+'/preimages/'+r.path;fs.mkdirSync(path.dirname(pre),{recursive:true});if(resume&&fs.existsSync(pre))assert.equal(sha(read(pre)),r.sha256);else fs.copyFileSync(baseline+'/website/'+r.path,pre,fs.constants.COPYFILE_EXCL);}
}
assert.equal(selected.filter(r=>r.sha256!==rows.find(v=>v.path===r.path).sha256).length,2);
const plexus=json(site+'/lib/plexus-review-manifest.json');
assert(Array.isArray(plexus.presentationInputs)&&Array.isArray(plexus.topologyInputs));
assert(![...plexus.presentationInputs,...plexus.topologyInputs].some(r=>r.path==='components/ImagingAtlasShell.tsx'),'No independent Plexus presentation or topology input changes');
const dependencies=baseline+'/website/node_modules',depRoot=fs.realpathSync(dependencies);assert(!fs.lstatSync(dependencies).isSymbolicLink());
console.log(JSON.stringify({phase:'sources-copied',files:selected.length}));
fs.cpSync(dependencies,site+'/node_modules',{recursive:true,errorOnExist:true,force:false,dereference:true,filter:from=>{
 if(['.vite','.vite-temp','.cache'].includes(path.basename(from)))return false;
 if(fs.lstatSync(from).isSymbolicLink()){const real=fs.realpathSync(from);assert(real===depRoot||real.startsWith(depRoot+path.sep));}return true;
}});
runGit(['init','-q',site]);const common=runGit(['-C',canonical,'rev-parse','--git-common-dir']).toString().trim();
fs.mkdirSync(site+'/.git/objects/info',{recursive:true});fs.writeFileSync(site+'/.git/objects/info/alternates',path.resolve(canonical,common,'objects').replaceAll('\\','/')+'\n',{flag:'wx'});
runGit(['-C',site,'update-ref','HEAD',proposal.websiteHeadAtObservation]);runGit(['-C',site,'read-tree','HEAD']);assert.equal(runGit(['-C',site,'remote']).toString().trim(),'');
const atlas='F:/VisibleMedicine/staging/20261021-atlas-combined-source';assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),proposal.atlasSourceAtObservation);assert.equal(runGit(['-C',atlas,'status','--porcelain']).toString().trim(),'');fs.symlinkSync(atlas,stage+'/atlas','junction');
guard();for(const r of selected)assert.equal(sha(read(site+'/'+r.path)),r.sha256);
save('PREPARATION.json',{at:new Date().toISOString(),stage,site,baseline,baselineSnapshot:baseline+'/FOLLOWUP_SOURCE_INPUTS.json',baselineSnapshotSha256:sha(read(baseline+'/FOLLOWUP_SOURCE_INPUTS.json')),proposal:proposalRoot+'/PROPOSAL.json',proposalSha256:sha(read(proposalRoot+'/PROPOSAL.json')),source:proposal.atlasSourceAtObservation,reviewBefore:proposal.baseline.review,websiteHead:proposal.websiteHeadAtObservation,canonical,canonicalSnapshot:pointer.activeWork.sourceSnapshot,canonicalSnapshotSha256:pointer.activeWork.sourceSnapshotSha256,preserved,rows:selected,proposedPaths:proposal.proposedPaths,independentDependencies:true,privateContextsFOnly:true,privateDatabaseCopied:false,canonicalInstalled:false,ownerFormsRefreshed:false,publicDeployment:false});
console.log(JSON.stringify({prepared:stage+'/PREPARATION.json',files:selected.length,canonicalInstalled:false}));
