import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {clonePinnedWebsite} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/clone-pinned-website-stage-20261026.mjs';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
const stage='F:/VisibleMedicine/staging/20261028-saved-course-availability',parentFile='F:/VisibleMedicine/staging/20261028-release-context-repairs/SOURCE_CANDIDATE_V3.json',parentSha256='758432a0d2836fc574bf19c61a11b28da64f606bab25586008e52dabff7c3c81';
const mf='F:/VisibleMedicine/staging/20261028-course-correction-followup/MANIFEST.json';assert.equal(hash(mf),'d43572364a91731ce20f01bedef201201030167174862769c709c2dd73ceb08a');
const proposal=json(mf);assert.equal(proposal.baselineSourceSha256,parentSha256);
const {parent,site}=clonePinnedWebsite({stage,parentFile,parentSha256});const added=[],changed=[];
for(const row of proposal.files){assert.equal(hash(site+'/'+row.relativePath),row.baselineSha256);assert.equal(hash(row.preimagePath),row.baselineSha256);assert.equal(hash(row.proposalPath),row.proposalSha256);const raw='tests/fixtures/saved-course-availability-before-20261028/'+path.basename(row.relativePath)+'.raw';fs.mkdirSync(path.dirname(site+'/'+raw),{recursive:true});fs.copyFileSync(site+'/'+row.relativePath,site+'/'+raw,fs.constants.COPYFILE_EXCL);fs.copyFileSync(row.proposalPath,site+'/'+row.relativePath);added.push(raw);changed.push(row.relativePath);}
for(const r of parent.sourceRows)if(!changed.includes(r.path))assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
for(const row of json(site+'/atlas-review/integration-inputs.json').inputs)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
for(const name of ['next-env.d.ts','.next/types/routes.d.ts']){fs.mkdirSync(path.dirname(site+'/'+name),{recursive:true});if(!fs.existsSync(site+'/'+name))fs.copyFileSync(parent.website+'/'+name,site+'/'+name,fs.constants.COPYFILE_EXCL);assert.equal(hash(site+'/'+name),hash(parent.website+'/'+name));}
const sourceRows=[...parent.sourceRows.map(r=>r.path),...added].sort().map(file=>({path:file,bytes:fs.statSync(site+'/'+file).size,sha256:hash(site+'/'+file)}));
const source={...parent,schema:'vm-saved-course-availability-source/1',at:new Date().toISOString(),website:site,parent:parentFile,parentSha256,sourceRows,sourcePaths:sourceRows.length,changedPaths:changed,newPaths:added,proposal:{path:mf,sha256:hash(mf)},productChange:'Saved course with authoritative zero available workbooks shows availability and course-details destination; progress and guarded links retained.',protectedReviewInputsChanged:false,installed:false,normalPreviewChanged:false};
source.productSourceChanged=true;source.sourceChangesOnlyTests=false;
for(const key of ['proposals','preimagePaths','followup','historyInverseCorrection'])delete source[key];
const sf=stage+'/SOURCE_CANDIDATE.json';fs.writeFileSync(sf,JSON.stringify(source,null,2)+'\n',{flag:'wx'});
// Same complete regression file against the exact predecessor page; shared libraries/dependencies stay real.
const control=stage+'/baseline-control/website';fs.mkdirSync(control+'/app/my-learning',{recursive:true});fs.mkdirSync(control+'/tests');
fs.copyFileSync(parent.website+'/app/my-learning/page.tsx',control+'/app/my-learning/page.tsx',fs.constants.COPYFILE_EXCL);fs.copyFileSync(site+'/tests/my-learning-study-now-ui.test.mjs',control+'/tests/my-learning-study-now-ui.test.mjs',fs.constants.COPYFILE_EXCL);fs.copyFileSync(site+'/package.json',control+'/package.json',fs.constants.COPYFILE_EXCL);
fs.symlinkSync(site+'/lib',control+'/lib','junction');fs.symlinkSync(fs.realpathSync(site+'/node_modules'),control+'/node_modules','junction');
fs.writeFileSync(stage+'/BASELINE_CONTROL.json',JSON.stringify({website:control,pageSha256:hash(control+'/app/my-learning/page.tsx'),testSha256:hash(control+'/tests/my-learning-study-now-ui.test.mjs'),libraryRoot:site+'/lib',syntheticUserAndProgress:true,actualSavedNavigation:true,expectedNewFailure:'saved course with withdrawn last workbook names unavailability and opens course details',noDatabaseOrAccountAcceptance:true},null,2)+'\n',{flag:'wx'});
const i=json('CURRENT_CHECKPOINT.json');i.activeWork.current.pendingSavedCourseAvailability={source:{path:sf,sha256:hash(sf)},state:'Isolated UI correction prepared; baseline and focused verification pending.',productChange:source.productChange,installed:false};saveIndex(i);
console.log(JSON.stringify({source:{path:sf,sha256:hash(sf)},paths:sourceRows.length,changed,control}));
