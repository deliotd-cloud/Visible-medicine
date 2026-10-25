// Source-only copy-on-write successor; fresh proof belongs to the new receipt.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';import {memoryGate} from './native-website-integration-stage-20261025.mjs';
const configFile=process.argv[2];assert(configFile&&path.isAbsolute(configFile));const c=json(configFile);assert.equal(c.schema,'vm-scoped-source-successor/1');
assert.equal(hash(c.parent.path),c.parent.sha256);assert.equal(hash(c.patchset.path),c.patchset.sha256);
const parent=json(c.parent.path),patch=json(c.patchset.path),stage=path.resolve(c.stage),site=stage+'/website',patchRoot=path.dirname(c.patchset.path);
assert(stage.startsWith(path.resolve('F:/VisibleMedicine/staging')+path.sep));assert(!fs.existsSync(stage));assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
const memory=memoryGate(2048),changes=patch.installableFiles;assert(Array.isArray(changes)&&changes.length>0&&changes.length<=5);assert.equal(new Set(changes.map(r=>r.path)).size,changes.length);
const rows=new Map(parent.sourceRows.map(r=>[r.path,r]));
const bound=json(parent.website+'/atlas-review/integration-inputs.json').inputs;
for(const r of changes){assert(c.allowedPaths.includes(r.path));assert(!r.path.includes('..')&&!path.isAbsolute(r.path)&&!r.path.includes('\\'));
 assert.equal(rows.get(r.path)?.sha256??null,r.beforeSha256);assert.equal(hash(patchRoot+'/'+r.path),r.afterSha256);
 assert(!bound.some(b=>b.path===r.path),'Changed protected Review input requires a separate rebind: '+r.path);}
assert.deepEqual(new Set(changes.map(r=>r.path)),new Set(c.allowedPaths));
for(const r of parent.sourceRows)assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);
fs.mkdirSync(site,{recursive:true});fs.cpSync(parent.website+'/.git',site+'/.git',{recursive:true,errorOnExist:true,force:false,dereference:false});
for(const r of parent.sourceRows){const to=site+'/'+r.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(parent.website+'/'+r.path,to,fs.constants.COPYFILE_EXCL);}
for(const r of changes){const to=site+'/'+r.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(patchRoot+'/'+r.path,to);assert.equal(hash(to),r.afterSha256);rows.set(r.path,{path:r.path,bytes:fs.statSync(to).size,sha256:hash(to)});}
for(const r of rows.values())assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
for(const r of parent.sourceRows)assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);
for(const d of parent.dependencies){assert.equal(hash(d.file),d.sha256);assert.equal(hash(d.entry),d.entrySha256);}
fs.symlinkSync(fs.realpathSync(parent.website+'/node_modules'),site+'/node_modules','junction');fs.symlinkSync(parent.atlas,stage+'/atlas','junction');
if(fs.existsSync(parent.website+'/.next/types/routes.d.ts')){fs.mkdirSync(site+'/.next/types',{recursive:true});fs.copyFileSync(parent.website+'/.next/types/routes.d.ts',site+'/.next/types/routes.d.ts',fs.constants.COPYFILE_EXCL);}
const parentStage=path.dirname(c.parent.path);if(fs.existsSync(parentStage+'/before'))fs.cpSync(parentStage+'/before',stage+'/before',{recursive:true,errorOnExist:true,force:false,dereference:false});
const local=json(parentStage+'/LOCAL_TEST_CONFIGURATION.json');Object.assign(local.environment,{VM_WEBSITE_ROOT:site,VM_ATLAS_SOURCE_REPO:parent.atlas,ATLAS_SOURCE_REPO:parent.atlas,VM_CERVICAL_LOCAL_EVIDENCE_ROOT:stage+'/cervical-child-evidence'});
fs.mkdirSync(stage+'/cervical-child-evidence');fs.writeFileSync(stage+'/LOCAL_TEST_CONFIGURATION.json',JSON.stringify(local,null,2)+'\n',{flag:'wx'});
for(const [root,head]of [[parent.atlas,parent.atlasHead],['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1']])assert.equal(execFileSync('git',['--no-replace-objects','-C',root,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(),head);
const result={schema:'vm-unpublished-source-candidate/3',at:new Date().toISOString(),website:site,atlas:parent.atlas,atlasHead:parent.atlasHead,atlasTree:parent.atlasTree,
 parent:c.parent.path,parentSha256:c.parent.sha256,patchset:c.patchset,reviewBindingSha256:parent.reviewBindingSha256,reviewSourceFiles:parent.reviewSourceFiles,viewerFiles:parent.viewerFiles,viewerPackages:parent.viewerPackages,
 dependencies:parent.dependencies,sourcePaths:rows.size,sourceRows:[...rows.values()].sort((a,b)=>a.path.localeCompare(b.path)),changedPaths:changes.filter(r=>r.beforeSha256!==null).map(r=>r.path),addedPaths:changes.filter(r=>r.beforeSha256===null).map(r=>r.path),
 applicationChangesFromInstalledRemain:parent.applicationChangesFromInstalledRemain??parent.applicationChanged,protectedReviewInputsChanged:false,constructionNote:c.reason,
 focusedChecksPending:true,freshStrictOrBuildForThisSource:false,wholeSuitePassing:false,physicalBrowserAcceptancePending:true,installed:false,ownerPreviewChanged:false,privateStateCopied:false};
fs.writeFileSync(stage+'/SOURCE_CANDIDATE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({at:result.at,memory,configuration:{path:configFile,sha256:hash(configFile)},parent:c.parent,patchset:c.patchset,source:{path:stage+'/SOURCE_CANDIDATE.json',sha256:hash(stage+'/SOURCE_CANDIDATE.json')},sourcePaths:rows.size,changedPaths:result.changedPaths,addedPaths:result.addedPaths,noPreviousBuildCopied:true,protectedReviewBindingAndInputBytesPreserved:true,ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({source:stage+'/SOURCE_CANDIDATE.json',sha256:hash(stage+'/SOURCE_CANDIDATE.json'),sourcePaths:rows.size,changed:result.changedPaths.length,added:result.addedPaths.length,noPreviousBuildCopied:true,ownerPreviewChanged:false}));
