import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261026-studio-outline-find',site=stage+'/website';
const proposal='F:/VisibleMedicine/staging/20261026-studio-outline-find-proposal';
const prep=json(stage+'/PREPARATION.json'),parent=json(prep.parent.path),patch=json(proposal+'/PATCHSET.json');
assert.equal(hash(prep.parent.path),prep.parent.sha256);
const allowed=['components/StudioCourseEditor.tsx','components/studio-workspace.css','tests/studio-course-outline-find.test.mjs'];
assert.deepEqual(patch.files.map(r=>r.path).sort(),[...allowed].sort());
fs.mkdirSync(stage+'/preimages');
for(const r of parent.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
for(const row of patch.files){
 const before=parent.sourceRows.find(r=>r.path===row.path);
 assert.equal(row.beforeSha256,before?.sha256??null,row.path);
 const file=path.resolve(proposal,row.path);assert(file.startsWith(path.resolve(proposal)+path.sep));
 assert.equal(hash(file),row.afterSha256,row.path);
 if(before)fs.copyFileSync(site+'/'+row.path,stage+'/preimages/'+row.path.replaceAll('/','--')+'.raw',fs.constants.COPYFILE_EXCL);
 fs.copyFileSync(file,site+'/'+row.path);
}
// Main review: Clear also works for whitespace-only input, and both sides of
// a title search use the same whitespace normalization.
let component=fs.readFileSync(site+'/components/StudioCourseEditor.tsx','utf8');
for(const [before,after] of [
 ['workbook.title.toLocaleLowerCase().includes(query)','workbook.title.replace(/\\s+/g, " ").toLocaleLowerCase().includes(query)'],
 ['disabled={!filtering} onClick={() => setOutlineFind','disabled={!effectiveFind.query && effectiveFind.kind === "all"} onClick={() => setOutlineFind'],
]){assert.equal(component.split(before).length,2,before);component=component.replace(before,after);}
fs.writeFileSync(site+'/components/StudioCourseEditor.tsx',component);
fs.appendFileSync(site+'/tests/studio-course-outline-find.test.mjs',`\n\ntest('whitespace-only search can still be cleared without changing the outline', () => {\n  const h = harness();\n  h.search('   ');\n  assert.match(h.text, /3 available items/);\n  assert.equal(h.find(node => node.type === 'button' && textOf(node) === 'Clear filters').props.disabled, false);\n  h.clear();\n  assert.equal(h.find(node => node.type === 'input' && node.props.type === 'search').props.value, '');\n  assert.equal(h.rows.length, 4);\n});\n`);
const old='08a1c37ef92f170015231acc96609e3bb9582ec270b0c8c242607560c6ddaf2d',now=hash(site+'/components/StudioCourseEditor.tsx');
const rebind=['tests/studio-draft-dependency-source.mjs','tests/studio-course-details-content.test.mjs','tests/studio-course-details-content-role-proof.test.mjs'];
for(const p of rebind){
 fs.copyFileSync(site+'/'+p,stage+'/preimages/'+p.replaceAll('/','--')+'.raw',fs.constants.COPYFILE_EXCL);
 let t=fs.readFileSync(site+'/'+p,'utf8');assert.equal(t.split(old).length,2,p);t=t.replace(old,now);
 if(p.endsWith('role-proof.test.mjs')){
  const oldTest='13003d7665d5a40da57bf7e60c5c820f941fa673445e29f9a03d5aed1778698a';assert.equal(t.split(oldTest).length,2);t=t.replace(oldTest,hash(site+'/tests/studio-course-details-content.test.mjs'));
  assert.equal(t.split('|08a1c|').length,2);t=t.replace('|08a1c|','|'+now.slice(0,5)+'|');
 }
 fs.writeFileSync(site+'/'+p,t);
}
const doc='docs/STUDIO_COURSE_OUTLINE_FIND.md';
fs.writeFileSync(site+'/'+doc,'# Finding course content\n\nThe course Content pane provides title search and a content-type filter. Both act only on the current course-scoped outline and keep the original saved learner positions. Filtering neither saves nor reorders the release. Generic unavailable saved positions remain visible without exposing missing or out-of-course identifiers.\n\nThe controls are temporary, course-scoped view state. Changing course resets their effective values. Clear filters restores the complete outline. The result count describes available matching content; unavailable saved positions are counted separately. Course details, add-content and release forms stay mounted, preserving their independent unsent-input protection.\n\nNo access, publication, draft persistence, server mutation, route, schema, entitlement or clinical-review policy changes. The Education response helper inherited from the parent remains inert: no media route or readiness is enabled.\n\nCurrent Studio test source identities are advanced to this exact component. The historical component, original assertions and case inventory remain byte-exact; original preimages and exact receipt ancestry are retained locally.\n',{flag:'wx'});
const changed=[...allowed.filter(p=>parent.sourceRows.some(r=>r.path===p)),...rebind];
const added=[allowed[2],doc];
for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);if(!changed.includes(r.path))assert.equal(hash(site+'/'+r.path),r.sha256,r.path);}
const bound=json(site+'/atlas-review/integration-inputs.json').inputs;
for(const p of [...changed,...added])assert(!bound.some(r=>r.path===p),p);
for(const r of bound)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
const rows=[...parent.sourceRows.map(r=>r.path),...added].sort().map(p=>({path:p,bytes:fs.statSync(site+'/'+p).size,sha256:hash(site+'/'+p)}));
const source={schema:'vm-studio-outline-find-source/1',at:new Date().toISOString(),website:site,atlas:parent.atlas,atlasHead:parent.atlasHead,atlasTree:parent.atlasTree,parent:prep.parent.path,parentSha256:prep.parent.sha256,sourceRows:rows,sourcePaths:rows.length,changedPaths:changed,addedPaths:added,dependencies:parent.dependencies,reviewBindingSha256:parent.reviewBindingSha256,reviewSourceFiles:parent.reviewSourceFiles,protectedReviewInputs:bound.length,viewerFiles:parent.viewerFiles,viewerPackages:parent.viewerPackages,proposal:{path:proposal+'/PATCHSET.json',sha256:hash(proposal+'/PATCHSET.json')},onlyApplicationChanges:allowed.slice(0,2),allOtherParentBytesExact:true,noNewDependenciesFontsModelsOrDatasets:true,noRoutesPermissionsOrMediaReadinessChanged:true,verificationPending:true,wholeSuitePassing:false,normalPreviewChanged:false,installed:false,clinicalApproval:false,patientSpaceRegistration:false};
fs.writeFileSync(stage+'/SOURCE_CANDIDATE.json',JSON.stringify(source,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({path:stage+'/SOURCE_CANDIDATE.json',sha256:hash(stage+'/SOURCE_CANDIDATE.json'),sourcePaths:rows.length,changed,added}));
