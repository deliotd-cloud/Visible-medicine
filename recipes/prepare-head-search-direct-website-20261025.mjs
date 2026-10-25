import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
const parentFile='F:/VisibleMedicine/staging/20261025-neonatal-current-final-website/SOURCE_CANDIDATE.json';
assert.equal(hash(parentFile),'7f105c077fa9813868dc25efd849ebb7ac20934162cc8e9d8431f540ef2fd0e4');
const parent=json(parentFile),proposal='F:/VisibleMedicine/staging/20261025-head-search-direct-proposal',patchFile=proposal+'/PATCHSET.json',patch=json(patchFile),stage='F:/VisibleMedicine/staging/20261025-head-search-direct-website',site=stage+'/website';
assert.equal(patch.sourceReceiptSha256,hash(parentFile));assert.equal(patch.sourceWebsite,parent.website);assert(!fs.existsSync(stage));
const allowed=['lib/structure-learning-search.ts','lib/atlas-structure-search.ts','app/search/page.tsx','tests/structure-learning-search.test.ts','tests/atlas-structure-search.test.mjs','tests/unified-search-concepts.test.ts','tests/related-lectures.test.ts'];
assert.deepEqual(new Set(patch.paths.map(r=>r.path)),new Set(allowed));
const inputs=json(parent.website+'/atlas-review/integration-inputs.json');assert.equal(inputs.inputs.length,1816);
for(const p of allowed)assert(!inputs.inputs.some(r=>r.path===p),'No source-bound Review input may change in this feature');
for(const r of parent.sourceRows)assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);
for(const r of patch.paths){assert.equal(hash(parent.website+'/'+r.path),r.beforeSha256);assert.equal(hash(proposal+'/'+r.path),r.afterSha256);}
const git=args=>execFileSync('git',args,{windowsHide:true,stdio:'pipe',env:{...process.env,GIT_OPTIONAL_LOCKS:'0',GIT_NO_REPLACE_OBJECTS:'1'}});
assert.equal(git(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
fs.mkdirSync(stage);git(['--no-replace-objects','clone','--shared','--no-checkout','--','F:/VisibleMedicine/website',site]);git(['-C',site,'config','--local','core.autocrlf','false']);git(['-C',site,'read-tree','HEAD']);
for(const r of parent.sourceRows){fs.mkdirSync(path.dirname(site+'/'+r.path),{recursive:true});fs.copyFileSync(parent.website+'/'+r.path,site+'/'+r.path,fs.constants.COPYFILE_EXCL);}
fs.symlinkSync(fs.realpathSync(parent.website+'/node_modules'),site+'/node_modules','junction');fs.symlinkSync(parent.atlas,stage+'/atlas','junction');
for(const p of ['next-env.d.ts','.next/types/routes.d.ts'])if(!fs.existsSync(site+'/'+p)&&fs.existsSync(parent.website+'/'+p)){fs.mkdirSync(path.dirname(site+'/'+p),{recursive:true});fs.copyFileSync(parent.website+'/'+p,site+'/'+p);}
for(const r of patch.paths)fs.copyFileSync(proposal+'/'+r.path,site+'/'+r.path);
const changed=new Map(patch.paths.map(r=>[r.path,r])),sourceRows=parent.sourceRows.map(r=>changed.has(r.path)?{path:r.path,bytes:fs.statSync(site+'/'+r.path).size,sha256:hash(site+'/'+r.path)}:{...r});
for(const r of sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
for(const p of ['lib/platform-governance.ts','lib/lecture-anatomy-reference.ts','lib/lecture-related-links.ts','lib/body-structure-search.ts','app/learn/related-anatomy/page.tsx','lib/head-atlas-links.ts','package.json','package-lock.json'])assert.equal(hash(site+'/'+p),hash(parent.website+'/'+p),p);
const source={schema:'vm-direct-head-anatomy-search-source/1',at:new Date().toISOString(),website:site,atlas:parent.atlas,atlasHead:parent.atlasHead,atlasTree:parent.atlasTree,parent:{path:parentFile,sha256:hash(parentFile)},proposal:{path:patchFile,sha256:hash(patchFile)},sourceRows,dependencies:parent.dependencies,sourcePaths:sourceRows.length,changedPaths:allowed,newPaths:[],removedPaths:[],productPaths:allowed.filter(p=>!p.startsWith('tests/')),feature:'Head structure search opens the existing source-bound3D orCT anatomy view directly; independently gated related teaching remains a separate action. Exact canonical primary/secondary pairs preserve root coalescing and nested/side distinctions.',protectedReviewInputsUnchanged:1816,publishedQueryAndAccessPolicySourceUnchanged:true,nativeModelsSourceAndLicenceChanges:false,noNewDependenciesOrExternalMedia:true,sourceSealPrecedesVerification:true,actualNewFullTypesOrProductionBuildPassed:false,installed:false,ownerPreviewChanged:false,publicDeployment:false,clinicalApproval:false,patientSpaceRegistration:false};
fs.writeFileSync(stage+'/SOURCE_CANDIDATE.json',JSON.stringify(source,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),parentReceipt:parentFile,parentReceiptSha256:hash(parentFile),parentWebsite:parent.website,patchset:{path:patchFile,sha256:hash(patchFile)},exactSevenPathsOnly:true,ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
fs.writeFileSync(stage+'/ROOTS.json',JSON.stringify([['structure-learning-search.test.ts',4],['atlas-structure-search.test.mjs',4],['unified-search-concepts.test.ts',4],['related-lectures.test.ts',17],['lecture-body-integration.test.mjs',4]],null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({source:stage+'/SOURCE_CANDIDATE.json',sha256:hash(stage+'/SOURCE_CANDIDATE.json'),sourcePaths:sourceRows.length,changed:allowed.length,protectedInputs:1816}));
