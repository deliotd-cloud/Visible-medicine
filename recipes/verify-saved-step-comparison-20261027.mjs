import fs from'node:fs';import assert from'node:assert/strict';import{hash,json}from'./bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261027-saved-step-comparison',sf=stage+'/SOURCE_CANDIDATE.json',s=json(sf),p=json(s.parent),site=s.website;
assert.equal(hash(s.parent),s.parentSha256);
for(const r of s.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
for(const r of p.sourceRows){assert.equal(hash(p.website+'/'+r.path),r.sha256,r.path);if(!s.changedPaths.includes(r.path))assert.equal(hash(site+'/'+r.path),r.sha256,r.path);}
const read=(root,p)=>fs.readFileSync(root+'/'+p,'utf8');
let inverse=read(site,'components/HeadLearningBookmark.tsx').replace('\n  // Only the imaging viewer supplies its modality and in-view resume callback.\n  // Keep that scan open when comparing the saved step with the separate 3D Atlas.\n  const preserveScan=!!modality&&!!onOpenCurrent;','');
inverse=inverse.replace('<a href={navigation.current.atlasHref} target={preserveScan?\'_blank\':undefined} rel={preserveScan?\'noopener noreferrer\':undefined} aria-label={`Open saved ${navigation.label} step in the 3D Atlas${preserveScan?\' in a new tab\':\'\'}`}>3D{preserveScan?\' (new tab)\':\'\'}</a>','<a href={navigation.current.atlasHref} aria-label={`Open saved ${navigation.label} step in the 3D Atlas`}>3D</a>');
assert.equal(inverse,read(p.website,'components/HeadLearningBookmark.tsx'));
assert(read(site,'tests/head-learning-bookmark-ui.test.ts').startsWith(read(p.website,'tests/head-learning-bookmark-ui.test.ts')));
// Check the three existing contexts explicitly; no parent or generated-module edits.
assert(read(site,'components/HeadAtlasGuidedLearning.tsx').includes('<HeadLearningBookmark position={position} modality={modality} onOpenCurrent={openSavedStep}/>'));
assert(read(site,'components/HeadAtlasLearningLibrary.tsx').includes('<HeadLearningBookmark/>'));
assert(read(site,'components/HeadAtlasLearningNavigation.tsx').includes('<HeadLearningBookmark position={position}/>'));
const inputs=json(site+'/atlas-review/integration-inputs.json');assert.equal(inputs.inputs.length,1835);for(const r of inputs.inputs)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
fs.writeFileSync(stage+'/CONTENT_QA.json',JSON.stringify({at:new Date().toISOString(),passing:true,source:{path:sf,sha256:hash(sf)},onlyBookmarkTargetAndAccessibleTextChanged:true,allExistingAssertionsPreserved:true,all1835ProtectedInputsExact:true,allOtherSourceExact:true,parentProductionBuildPending:true,privateDataChanged:false,normalPreviewChanged:false},null,2)+'\n',{flag:'wx'});console.log('Source, navigation, revision and protected runtime boundaries verified.');
