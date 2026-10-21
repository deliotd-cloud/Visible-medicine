import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const source='F:/VisibleMedicine/website',stage='F:/VisibleMedicine/staging/20261021-coherent-usability-candidate',site=stage+'/website';
const parent='F:/VisibleMedicine/staging/20261021-review-navigation-ui-candidate/website';
const nav=json('F:/VisibleMedicine/recovery/checkpoints/20261021-review-navigation-candidate-verified/checkpoint.json');
const workbook='F:/VisibleMedicine/staging/20261021-workbook-table-semantics-proposal',w=json(workbook+'/PROPOSAL.json');
const pointer=json('CURRENT_CHECKPOINT.json'),inputs=json(pointer.activeWork.sourceSnapshot),preserved=pointer.activeWork.preservedSourcePaths.map(path=>({path,bytes:read(source+'/'+path).length,sha256:sha(read(source+'/'+path))}));
assert.equal(inputs.length,5267);assert.equal(preserved.length,7);assert.equal(sha(read(workbook+'/PROPOSAL.json')),'85928f807f559201872e1592688019494aee5de826a4c150b16a86530227bb99');
assert.equal(nav.actualNativeCounts.pass,131);assert(nav.fullTypesPassed&&nav.fullLocalBuildPassed);assert.equal(nav.canonicalInstalled,false);
assert.equal(nav.review,'15a0c1e0c4d30535fd212b06bd0b815d97ea7cd26933a6354bdcc24a35c6802e');
const verify=()=>{assert.equal(runGit(['-C',source,'rev-parse','HEAD']).toString().trim(),w.websiteHeadAtObservation);assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),w.source);assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','status','--porcelain']).toString().trim(),'');for(const r of [...inputs,...preserved])assert.equal(sha(read(source+'/'+r.path)),r.sha256,r.path);for(const r of nav.selectedSourceFiles)assert.equal(sha(read(parent+'/'+r.path)),r.sha256,r.path);process.kill(266712,0);process.kill(240632,0);};
verify();assert(!fs.existsSync(stage));const space=fs.statfsSync('F:/');assert(space.bavail*space.bsize>5*1024**3,'At least5GiB free for independent staging');
const binding=json(parent+'/atlas-review/integration-inputs.json');assert.equal(binding.sha256,nav.review);assert.equal(binding.inputs.length,1711);for(const r of binding.inputs)assert.equal(sha(read(parent+'/'+r.path)),r.sha256,r.path);
const viewer=json(parent+'/public/atlas-review-viewer/manifest.json');assert.equal(viewer.websiteIntegrationSha256,nav.review);assert.equal(viewer.files.length,46);for(const r of viewer.files)assert.equal(sha(read(parent+'/public/atlas-review-viewer/'+r.path)),r.sha256,r.path);
const choices=new Map([...inputs,...preserved].map(r=>[r.path,{...r,from:source+'/'+r.path,kind:'current-canonical-source'}]));
const set=(p,from,kind,expected)=>{const b=read(from);if(expected)assert.equal(sha(b),expected,p);choices.set(p,{path:p,bytes:b.length,sha256:sha(b),from,kind});};
// Retain the newest canonical test-only changes; overlay only proven UI inputs.
for(const r of nav.selectedSourceFiles)set(r.path,parent+'/'+r.path,'verified-navigation-candidate-source',r.sha256);
for(const r of inputs.filter(r=>r.path.startsWith('atlas-review/')))set(r.path,parent+'/'+r.path,'unchanged-stock-navigation-review-output');
// Stock viewer filenames are content-addressed: use its proven46-file inventory,
// not the canonical viewer's older generated names. Retire map entries only;
// neither preserved source tree is edited or deleted.
const viewerPaths=new Set(['manifest.json',...viewer.files.map(r=>r.path)].map(p=>'public/atlas-review-viewer/'+p));
const retiredViewerPaths=[...choices.keys()].filter(p=>p.startsWith('public/atlas-review-viewer/')&&!viewerPaths.has(p));
for(const p of [...choices.keys()].filter(p=>p.startsWith('public/atlas-review-viewer/')))choices.delete(p);
set('public/atlas-review-viewer/manifest.json',parent+'/public/atlas-review-viewer/manifest.json','unchanged-stock-navigation-viewer-manifest');
for(const r of viewer.files)set('public/atlas-review-viewer/'+r.path,parent+'/public/atlas-review-viewer/'+r.path,'unchanged-stock-navigation-viewer-file',r.sha256);
set('lib/plexus-review-manifest.json',parent+'/lib/plexus-review-manifest.json','verified-presentation-only-private-manifest','bf7c40d7f2ffa2e6b57efb65441f128d737453dd709d3d39b80242c0c54f2891');
const prep=json('F:/VisibleMedicine/staging/20261021-review-navigation-ui-candidate/PREPARATION.json');
for(const r of prep.rows.filter(r=>r.kind!=='verified-current-source'))set(r.path,parent+'/'+r.path,r.kind,r.path==='.local/plexus-review/assets.ts'?'7b887626086d37445c4cea36bf77463275b97cd96528b9269cfca92a888ba394':r.sha256);
const supplement=json('F:/VisibleMedicine/staging/20261021-review-navigation-ui-candidate/SUPPLEMENTAL_LOCAL_COPY.json');for(const r of supplement.rows)if(!choices.has(r.path))set(r.path,parent+'/'+r.path,'unchanged-supporting-source',r.sha256);
for(const r of w.proposedPaths){if(r.preimageSha256)assert.equal(choices.get(r.path)?.sha256,r.preimageSha256);else assert(!choices.has(r.path));set(r.path,workbook+'/candidate/'+r.path,'staged-workbook-semantics',r.candidateSha256);}
fs.mkdirSync(site,{recursive:true});
const save=(name,value)=>fs.writeFileSync(stage+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
save('STARTED.json',{at:new Date().toISOString(),driver:process.pid,source:w.source,canonicalReview:w.review,candidateReview:nav.review,canonicalInstalled:false,ownerFormsRefreshed:false});
for(const r of choices.values()){
 assert(!path.isAbsolute(r.path)&&!r.path.includes('\\')&&r.path.split('/').every(v=>v&&v!=='.'&&v!=='..'));
 assert(!/(^|\/)(?:\.env(?:\.[^/]*)?|\.wrangler|\.git|node_modules)(\/|$)|\.(?:sqlite|db|dcm|dicom|nii|nrrd)$/i.test(r.path));
 assert(fs.lstatSync(r.from).isFile()&&!fs.lstatSync(r.from).isSymbolicLink());
 const to=site+'/'+r.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(r.from,to,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(to)),r.sha256,r.path);
}
console.log(JSON.stringify({phase:'sources-copied',files:choices.size,canonicalInstalled:false}));
const dependencies=parent+'/node_modules',dependencyRoot=fs.realpathSync(dependencies);assert(!fs.lstatSync(dependencies).isSymbolicLink());
fs.cpSync(dependencies,site+'/node_modules',{recursive:true,errorOnExist:true,force:false,dereference:true,filter:from=>{if(['.vite','.vite-temp','.cache'].includes(path.basename(from)))return false;if(fs.lstatSync(from).isSymbolicLink()){const real=fs.realpathSync(from);assert(real===dependencyRoot||real.startsWith(dependencyRoot+path.sep),'Dependency symlink must stay in dependency closure');}return true;}});
runGit(['init','-q',site]);const common=runGit(['-C',source,'rev-parse','--git-common-dir']).toString().trim();fs.mkdirSync(site+'/.git/objects/info',{recursive:true});fs.writeFileSync(site+'/.git/objects/info/alternates',path.resolve(source,common,'objects').replaceAll('\\','/')+'\n',{flag:'wx'});runGit(['-C',site,'update-ref','HEAD',w.websiteHeadAtObservation]);runGit(['-C',site,'read-tree','HEAD']);assert.equal(runGit(['-C',site,'remote']).toString().trim(),'');
const atlasTarget='F:/VisibleMedicine/staging/20261021-atlas-combined-source';assert.equal(runGit(['-C',atlasTarget,'rev-parse','HEAD']).toString().trim(),w.source);assert.equal(runGit(['-C',atlasTarget,'status','--porcelain']).toString().trim(),'');fs.symlinkSync(atlasTarget,stage+'/atlas','junction');
verify();for(const r of choices.values())assert.equal(sha(read(site+'/'+r.path)),r.sha256);
save('PREPARATION.json',{at:new Date().toISOString(),site,stage,source,atlas:atlasTarget,atlasReferenceReadOnly:true,sourceCommit:w.source,canonicalReview:w.review,review:nav.review,currentSourceSnapshot:pointer.activeWork.sourceSnapshot,currentSourceSnapshotSha256:pointer.activeWork.sourceSnapshotSha256,preserved,rows:[...choices.values()],canonicalControlledInputs:5267,canonicalPreservedInputs:7,newestCanonicalTestOnlyBatchesRetained:true,retiredViewerPaths,reviewBaseline:nav.candidateStage,reviewBaselineCheckpoint:'F:/VisibleMedicine/recovery/checkpoints/20261021-review-navigation-candidate-verified/checkpoint.json',workbookProposal:workbook,workbookProposalSha256:sha(read(workbook+'/PROPOSAL.json')),independentDependencyCopy:true,privateContextsFOnly:true,privateDatabaseCopied:false,canonicalInstalled:false,ownerFormsRefreshed:false,publicDeployment:false});
console.log(JSON.stringify({prepared:stage+'/PREPARATION.json',files:choices.size,independentDependencies:true,canonicalInstalled:false}));
