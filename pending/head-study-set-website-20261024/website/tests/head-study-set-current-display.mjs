// Exact study-set display epoch only. The complete older admission remains unchanged.
import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const parentFile='F:/VisibleMedicine/staging/20261024-native-slice-website/SOURCE_BOUND.json',proposalFile='F:/VisibleMedicine/staging/20261024-head-study-set-commit/PROPOSAL_BOUND.json';
export function assertHeadStudySetCurrentDisplay({root,manifest,binding,read=p=>readFileSync(root+'/'+p)}){
 assert.equal(sha(readFileSync(parentFile)),'53a006afac76eb558c769c83c6e36a594e3965de99b602e796a9ef48636089b6');assert.equal(sha(readFileSync(proposalFile)),'45e11123d1ab36e11a3cf42466a840907842391a31f794e532a9e0368bcbe433');
 const parent=JSON.parse(readFileSync(parentFile)),proposal=JSON.parse(readFileSync(proposalFile));
 const parentJson=p=>{const b=readFileSync(parent.website+'/'+p),row=parent.sourceRows.find(r=>r.path===p);assert(row,p);assert.equal(sha(b),row.sha256,p);return JSON.parse(b);};
 const old=parentJson('atlas-review/integration-inputs.json'),component='components/HeadAtlasViewer.tsx',componentSha=proposal.sourceRows.find(r=>r.path===component).sha256;
 assert.equal(sha(read(component)),componentSha);const expectedInputs=old.inputs.map(r=>r.path===component?{...r,sha256:componentSha}:r),integration=sha(JSON.stringify(expectedInputs));
 assert.equal(old.inputs.filter(r=>r.path===component).length,1);assert.notEqual(integration,old.sha256);assert.deepEqual(binding,{...old,sha256:integration,inputs:expectedInputs});for(const r of binding.inputs)assert.equal(sha(read(r.path)),r.sha256,r.path);
 const oldManifest=parentJson('atlas-review/manifest.json'),expectedManifest=structuredClone(oldManifest);expectedManifest.websiteIntegrationSha256=integration;
 for(const [file,kind]of [['content/body-renderer-revision.json','body'],['content/review-revisions.json','shoulder']]){
  const expected=parentJson('atlas-review/'+file);expected.websiteIntegrationSha256=integration;
  if(kind==='body')expected.sha256=sha(JSON.stringify({source:expected.sourceRendererSha256,website:integration}));
  else for(const [id,tracks]of Object.entries(expected.sourceRevisions))for(const key of ['geometry','teaching'])expected.revisions[id][key]=tracks[key]===null?null:sha(JSON.stringify({source:tracks[key],website:integration}));
  assert.deepEqual(JSON.parse(read('atlas-review/'+file)),expected);const row=expectedManifest.files.find(r=>r.path===file);assert(row);row.importedSha256=sha(read('atlas-review/'+file));
 }
 assert.deepEqual(manifest,expectedManifest);for(const r of manifest.files)assert.equal(sha(read('atlas-review/'+r.path)),r.importedSha256,r.path);
 const viewer=JSON.parse(read('public/atlas-review-viewer/manifest.json'));assert.equal(viewer.sourceCommit,manifest.revision);assert.equal(viewer.websiteIntegrationSha256,integration);assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);for(const r of viewer.files)assert.equal(sha(read('public/atlas-review-viewer/'+r.path)),r.sha256,r.path);
 return {integration,componentSha};
}
