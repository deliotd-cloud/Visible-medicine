import fs from'node:fs';import assert from'node:assert/strict';import{hash,json}from'./bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261027-course-preview-focus',sf=stage+'/SOURCE_CANDIDATE.json',s=json(sf),parent=json(s.parent);assert.equal(hash(s.parent),s.parentSha256);
for(const r of s.sourceRows)assert.equal(hash(s.website+'/'+r.path),r.sha256,r.path);for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);if(!s.changedPaths.includes(r.path))assert.equal(hash(s.website+'/'+r.path),r.sha256,r.path);}
const read=(root,p)=>fs.readFileSync(root+'/'+p,'utf8').replaceAll('\r\n','\n');
const old=read(parent.website,'components/StudioCourseEditor.tsx'),current=read(s.website,'components/StudioCourseEditor.tsx');
const originalDraft='  const draftRelease = releases.find((release) => release.courseId === course.id && ["draft", "changes-requested"].includes(release.status));';
const start=current.indexOf('  const courseReleases ='),end=current.indexOf('  const releaseRecoveryState=',start);assert(start>0&&end>start);
let inverse=current.slice(0,start)+originalDraft+'\n'+current.slice(end);
const a='<section id="course-preview"',b='    <section id="course-review"';const c1=inverse.indexOf(a),c2=inverse.indexOf(b,c1),o1=old.indexOf(a),o2=old.indexOf(b,o1);assert(c1>0&&c2>c1&&o1>0&&o2>o1);
inverse=inverse.slice(0,c1)+old.slice(o1,o2)+inverse.slice(c2);assert.equal(inverse,old,'Only release projection and Preview markup change; hooks, forms, navigation/recovery exact.');
const inputs=json(s.website+'/atlas-review/integration-inputs.json');assert.equal(inputs.inputs.length,1835);for(const r of inputs.inputs)assert.equal(hash(s.website+'/'+r.path),r.sha256,r.path);
fs.writeFileSync(stage+'/CONTENT_QA.json',JSON.stringify({at:new Date().toISOString(),passing:true,source:{path:sf,sha256:hash(sf)},onlyCoursePreviewMarkupAndProjectionChanged:true,formsHooksNavigationAndRecoveryExact:true,allOriginalTestsExact:true,allOtherSourceExact:true,all1835ProtectedReviewInputsExact:true,normalPreviewChanged:false,privateDataChanged:false},null,2)+'\n',{flag:'wx'});console.log('Course preview source boundaries verified.');
