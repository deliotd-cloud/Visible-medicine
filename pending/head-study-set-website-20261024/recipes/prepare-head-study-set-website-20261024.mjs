import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261024-head-study-set-website',site=stage+'/website',parentFile='F:/VisibleMedicine/staging/20261024-native-slice-website/SOURCE_BOUND.json',proposalFile='F:/VisibleMedicine/staging/20261024-head-study-set-commit/PROPOSAL_BOUND.json';
assert.equal(hash(parentFile),'53a006afac76eb558c769c83c6e36a594e3965de99b602e796a9ef48636089b6');assert.equal(hash(proposalFile),'45e11123d1ab36e11a3cf42466a840907842391a31f794e532a9e0368bcbe433');
const parent=json(parentFile),proposal=json(proposalFile),pointer=json('CURRENT_CHECKPOINT.json');assert.equal(pointer.goal.status,'active');assert.equal(pointer.activeWork.current.ownerPreviewPolicy.restartPermitted,false);assert.equal(pointer.activeWork.current.activeExecutionSessions.length,0);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true,stdio:'pipe'}).trim();assert.equal(git('-C','F:/VisibleMedicine/website','rev-parse','HEAD'),'b953ff3f5f1891599cb6e91cb91311d9d6006270');assert.equal(git('-C',parent.atlas,'rev-parse','HEAD'),parent.atlasHead);assert.equal(git('-C',parent.atlas,'status','--porcelain'),'');assert(!fs.existsSync(stage));
fs.mkdirSync(stage);git('clone','--shared','--no-checkout','F:/VisibleMedicine/website',site);git('-C',site,'read-tree','HEAD');
const copy=(a,b)=>{fs.mkdirSync(path.dirname(b),{recursive:true});fs.copyFileSync(a,b,fs.constants.COPYFILE_EXCL);};
for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);const destination=path.resolve(site,r.path);assert(destination.startsWith(path.resolve(site)+path.sep));copy(parent.website+'/'+r.path,destination);}
for(const p of [...proposal.changedAuthoredPaths,...proposal.newPaths]){const r=proposal.sourceRows.find(r=>r.path===p);assert(r);assert.equal(hash(proposal.website+'/'+p),r.sha256);if(fs.existsSync(site+'/'+p))copy(site+'/'+p,stage+'/preimages/'+p+'.raw');fs.copyFileSync(proposal.website+'/'+p,site+'/'+p);}
// Preserve genuine native lifecycle fixtures. The later study-set preimage is
// separate; old exact-inverse tests must never be pointed at a new preimage.
const parentStage=path.dirname(parentFile);fs.cpSync(parentStage+'/before',stage+'/before',{recursive:true,errorOnExist:true,force:false});copy(proposal.website+'/components/HeadAtlasViewer.tsx',stage+'/study-set-component/HeadAtlasViewer.tsx');
for(const p of ['tests/fixtures/current-atlas-delivery.json','tests/adjacent-current-tour-source-role.mjs','tests/native-slice-commit-scope.test.mjs','tests/native-slice-website-composition.test.mjs','tests/native-slice-display-epoch.test.mjs'])copy(site+'/'+p,stage+'/preimages/'+p+'.raw');
fs.symlinkSync(parent.website+'/node_modules',site+'/node_modules','junction');fs.symlinkSync(parent.atlas,stage+'/atlas','junction');const routes=parent.website+'/.next/types/routes.d.ts';copy(routes,site+'/.next/types/routes.d.ts');
const generated=[];
function transform(from,to,seams){let text=fs.readFileSync(site+'/'+from,'utf8');for(const [old,next]of seams){assert.equal(text.split(old).length,2,old);text=text.replace(old,next);}assert(!fs.existsSync(site+'/'+to));fs.writeFileSync(site+'/'+to,text,{flag:'wx'});generated.push({from,to,fromSha256:hash(site+'/'+from),sha256:hash(site+'/'+to),seams});}
transform('tests/native-slice-current-display.mjs','tests/head-study-set-current-display.mjs',[
 ['// Exact new display epoch only. Native source/tour epochs are not repinned.','// Exact study-set display epoch only. The complete older admission remains unchanged.'],
 ["const parentFile='F:/VisibleMedicine/staging/20261024-regional-discovery-ui/SOURCE_BOUND.json',proposalFile='F:/VisibleMedicine/staging/20261024-native-slice-commit/PROPOSAL_BOUND.json';",`const parentFile='${parentFile}',proposalFile='${proposalFile}';`],
 ['assertNativeSliceCurrentDisplay','assertHeadStudySetCurrentDisplay'],
 ['a58bdf58304bfc74e16639ea8708463c6cdde9d94b99d73214ced179b613f958',hash(parentFile)],
 ['9bed26d92efacf0f4bc6862943cf6953bab1e30cd6474647e5fddd07ea10bd80',hash(proposalFile)]
]);
transform('tests/native-slice-website-composition.test.mjs','tests/head-study-set-website-composition.test.mjs',[
 ["const stage='F:/VisibleMedicine/staging/20261024-native-slice-website';",`const stage='${stage}';`],
 ["const parent='F:/VisibleMedicine/staging/20261024-regional-discovery-ui/website';",`const parent='${parent.website}';`],
 ["const parentReceipt='F:/VisibleMedicine/staging/20261024-regional-discovery-ui/SOURCE_BOUND.json';",`const parentReceipt='${parentFile}';`],
 ["const proposalReceipt='F:/VisibleMedicine/staging/20261024-native-slice-commit/PROPOSAL_BOUND.json';",`const proposalReceipt='${proposalFile}';`],
 ['a58bdf58304bfc74e16639ea8708463c6cdde9d94b99d73214ced179b613f958',hash(parentFile)],
 ['9bed26d92efacf0f4bc6862943cf6953bab1e30cd6474647e5fddd07ea10bd80',hash(proposalFile)]
]);
const tour=site+'/tests/adjacent-current-tour-source-role.mjs';let text=fs.readFileSync(tour,'utf8');const importOld="import {assertNativeSliceCurrentDisplay} from './native-slice-current-display.mjs';",importNew=importOld+"\nimport {assertHeadStudySetCurrentDisplay} from './head-study-set-current-display.mjs';",branchOld='  }else assertNativeSliceCurrentDisplay({root:site,manifest,binding});',branchNew="  }else if(binding.sha256==='bc4cc568418147387cfeccf649c743256a9c936279bed16cec3f7eed2712f75e')assertNativeSliceCurrentDisplay({root:site,manifest,binding});\n  else assertHeadStudySetCurrentDisplay({root:site,manifest,binding});";for(const [a,b]of [[importOld,importNew],[branchOld,branchNew]]){assert.equal(text.split(a).length,2);text=text.replace(a,b);}fs.writeFileSync(tour,text);
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),website:site,parentReceipt:parentFile,parentReceiptSha256:hash(parentFile),parentWebsite:parent.website,proposalReceipt:proposalFile,proposalReceiptSha256:hash(proposalFile),atlas:parent.atlas,atlasHead:parent.atlasHead,atlasTree:parent.atlasTree,baseSourcePaths:parent.sourceRows.length,changedAuthoredPaths:proposal.changedAuthoredPaths,newPaths:proposal.newPaths,generatedExactCurrentProofs:generated,sourceRoleSeams:[[importOld,importNew],[branchOld,branchNew]],actualRouteTypes:{from:routes,sha256:hash(routes),notAShim:true},privateModulesRemainLocal:true,previewChanged:false,installed:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,baseSourcePaths:parent.sourceRows.length,proposalPaths:proposal.changedAuthoredPaths.length+proposal.newPaths.length,ownerPreviewChanged:false}));
