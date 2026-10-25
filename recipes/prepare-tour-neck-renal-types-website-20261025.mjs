import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {hash,json} from './seal-simple-website-successor.mjs';
import {memoryGate} from './native-website-integration-stage-20261025.mjs';
const memory=memoryGate(2048),stage='F:/VisibleMedicine/staging/20261025-tour-neck-renal-types-website',site=stage+'/website';
const parentFile='F:/VisibleMedicine/staging/20261025-tour-neck-renal-website/SOURCE_CANDIDATE.json',patchRoot='F:/VisibleMedicine/staging/20261025-tour-reading-type-compatibility';
assert(!fs.existsSync(stage));assert.equal(hash(parentFile),'c2172562233a7c3c64985d7fc75a6b6eb4df7be3c2682e437c97978b067f04ce');
assert.equal(hash(patchRoot+'/PATCHSET.json'),'7cef8e440ab4be846f2936fad30bb258c2591b7bcc3683da1e5f6937578c3f47');
const parent=json(parentFile),patch=json(patchRoot+'/PATCHSET.json'),rows=new Map(parent.sourceRows.map(r=>[r.path,r]));
for(const r of parent.sourceRows)assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);
fs.mkdirSync(site,{recursive:true});fs.cpSync(parent.website+'/.git',site+'/.git',{recursive:true,errorOnExist:true,force:false,dereference:false});
for(const r of parent.sourceRows){const to=site+'/'+r.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(parent.website+'/'+r.path,to,fs.constants.COPYFILE_EXCL);}
for(const r of patch.files){assert(r.path.startsWith('tests/')&&!r.path.includes('..'));assert.equal(rows.get(r.path)?.sha256,r.beforeSha256);assert.equal(hash(patchRoot+'/'+r.path),r.afterSha256);fs.copyFileSync(patchRoot+'/'+r.path,site+'/'+r.path);rows.set(r.path,{path:r.path,bytes:fs.statSync(site+'/'+r.path).size,sha256:hash(site+'/'+r.path)});}
assert.equal(rows.size,6830);for(const r of rows.values())assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);if(!r.path.startsWith('tests/'))assert.equal(hash(site+'/'+r.path),r.sha256,'Unchanged application/generated source');}
for(const d of parent.dependencies){assert.equal(hash(d.file),d.sha256);assert.equal(hash(d.entry),d.entrySha256);}
fs.symlinkSync(fs.realpathSync(parent.website+'/node_modules'),site+'/node_modules','junction');fs.symlinkSync(parent.atlas,stage+'/atlas','junction');
fs.mkdirSync(site+'/.next/types',{recursive:true});fs.copyFileSync(parent.website+'/.next/types/routes.d.ts',site+'/.next/types/routes.d.ts',fs.constants.COPYFILE_EXCL);
fs.cpSync(path.dirname(parentFile)+'/before',stage+'/before',{recursive:true,errorOnExist:true,force:false,dereference:false});
const config=json(path.dirname(parentFile)+'/LOCAL_TEST_CONFIGURATION.json');
Object.assign(config.environment,{VM_WEBSITE_ROOT:site,VM_ATLAS_SOURCE_REPO:parent.atlas,ATLAS_SOURCE_REPO:parent.atlas,VM_CERVICAL_LOCAL_EVIDENCE_ROOT:stage+'/cervical-child-evidence'});
fs.mkdirSync(stage+'/cervical-child-evidence');fs.writeFileSync(stage+'/LOCAL_TEST_CONFIGURATION.json',JSON.stringify(config,null,2)+'\n',{flag:'wx'});
const result={...parent,at:new Date().toISOString(),website:site,parent:parentFile,parentSha256:hash(parentFile),sourceRows:[...rows.values()].sort((a,b)=>a.path.localeCompare(b.path)),
 proposals:[...parent.proposals,{path:patchRoot+'/PATCHSET.json',sha256:hash(patchRoot+'/PATCHSET.json')}],changedPaths:patch.files.map(r=>r.path),addedPaths:[],
 focusedChecksPending:true,focusedInterpretation:'Parent proofs remain bound to parent bytes; this successor changes five UTF-8 expressions in three tests and needs focused8case and complete fresh type/build checks. The full parent strict result5diagnostics is retained; no source/app/fixture assertion was removed.',
 freshStrictOrBuildForThisSource:false,wholeSuitePassing:false,installed:false,ownerPreviewChanged:false};
fs.writeFileSync(stage+'/SOURCE_CANDIDATE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({at:result.at,memory,parent:parentFile,parentSha256:hash(parentFile),source:stage+'/SOURCE_CANDIDATE.json',sourceSha256:hash(stage+'/SOURCE_CANDIDATE.json'),sourcePaths:6830,patchset:{path:patchRoot+'/PATCHSET.json',sha256:hash(patchRoot+'/PATCHSET.json')},applicationAndGeneratedSourceUnchanged:true,noPreviousBuildCopied:true,ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({source:stage+'/SOURCE_CANDIDATE.json',sha256:hash(stage+'/SOURCE_CANDIDATE.json'),sourcePaths:6830,testExpressionsChanged:5,installed:false}));
