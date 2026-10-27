import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from './bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261027-tour-duration-website',prep=json(stage+'/PREPARATION.json'),parent=json(prep.parent.path),site=prep.website;
const changed=['components/RegionalLearningCatalogue.tsx','lib/regional-learning-catalogue.ts','lib/regional-learning-discovery.ts'].sort(),added=['tests/regional-tour-duration.test.mjs'];
assert.equal(hash(prep.parent.path),prep.parent.sha256);
assert.equal(prep.parent.sha256,'434f6c2530fd5eae4a73afd775194848410471df22ce9bb97c80f8763dd9468a');
for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);if(!changed.includes(r.path))assert.equal(hash(site+'/'+r.path),r.sha256,r.path);}
const input=json(site+'/atlas-review/integration-inputs.json');assert.equal(input.sha256,parent.reviewBindingSha256);for(const r of input.inputs)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
for(const d of parent.dependencies){assert.equal(hash(d.file),d.sha256);assert.equal(hash(d.entry),d.entrySha256);}
const ambient=[];for(const p of ['.next/types/routes.d.ts','next-env.d.ts']){const origin=parent.website+'/'+p,target=site+'/'+p;assert(fs.existsSync(origin));fs.mkdirSync(path.dirname(target),{recursive:true});if(!fs.existsSync(target))fs.copyFileSync(origin,target,fs.constants.COPYFILE_EXCL);assert.equal(hash(target),hash(origin));ambient.push({path:p,sha256:hash(target),copiedFrom:origin});}
const git=(root,...args)=>execFileSync('git',['--no-replace-objects','-C',root,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}}).trim();
for(const [root,head]of [['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'],[prep.atlas,parent.atlasHead]])assert.equal(git(root,'rev-parse','HEAD'),head);
const sourceRows=[...parent.sourceRows.map(r=>r.path),...added].sort().map(p=>({path:p,bytes:fs.statSync(site+'/'+p).size,sha256:hash(site+'/'+p)}));
const source={schema:'vm-tour-duration-website-source/1',at:new Date().toISOString(),website:site,atlas:prep.atlas,atlasHead:parent.atlasHead,atlasTree:parent.atlasTree,parent:prep.parent.path,parentSha256:prep.parent.sha256,sourceRows,sourcePaths:sourceRows.length,changedPaths:changed,addedPaths:added,removedPaths:[],dependencies:parent.dependencies,reviewBindingSha256:input.sha256,reviewSourceFiles:parent.reviewSourceFiles,protectedReviewInputs:input.inputs.length,viewerFiles:parent.viewerFiles,viewerPackages:parent.viewerPackages,verification:parent.verification,ambientTypeInputs:ambient,allOtherSourceExact:true,allExistingTestsUnchanged:true,allReviewInputsAndRuntimeBytesUnchanged:true,sourceSealPrecedesVerification:true,installed:false,normalPreviewChanged:false,clinicalApproval:false};
fs.writeFileSync(stage+'/SOURCE_CANDIDATE.json',JSON.stringify(source,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({paths:sourceRows.length,changed,added,sha256:hash(stage+'/SOURCE_CANDIDATE.json')}));
