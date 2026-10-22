import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {restorePriorRegionalTourRole} from './regional-tour-role-inverse.mjs';

const here=dirname(fileURLToPath(import.meta.url));
const rawDir='fixtures/regional-tour-before-role-batch-20261021';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
// Complete exact permitted edits; no diff algorithm runs in this guard.
const allowed=[
  {
    "name": "clinical-review-regional-tour.test.ts",
    "sha": "2c5b470fa1bd9b427241b98ce9990539d87b592f856a6e79d12e4b0c660e6eee",
    "edits": [
      [
        "import { readFileSync } from 'node:fs';\nimport { createHash } from 'node:crypto';\nimport { atlasExactGitApi } from './atlas-exact-git-api.mjs';\n\ntest('historical 77ac milestone: all thirty regional tours retain complete source-bound review evidence', async () => {\n",
        "import { readFileSync } from 'node:fs';\nimport { createHash } from 'node:crypto';\nimport { execFileSync } from 'node:child_process';\nimport { atlasExactGitApi } from './atlas-exact-git-api.mjs';\nimport { currentAtlasDeliveryRoot } from './current-atlas-delivery.mjs';\n\ntest('historical 77ac milestone: all thirty regional tours retain complete source-bound review evidence', async () => {\n"
      ],
      [
        "  const base='public/atlas-runtime/head-neck/';\n  const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));\n  assert.equal(learner.sourceCommit,'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');\n  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));\n  for(const path of ['lib/hand-venous-tours.ts','lib/lower-venous-tour.ts','lib/regional-tours.ts','lib/tarsal-tour.ts','lib/upper-limb-bone-tour.ts','lib/chest-wall-tour.ts','lib/orbital-tour.ts','lib/intrinsic-larynx-tour.ts','lib/male-duct-tour.ts','lib/deep-brain-tour.ts','lib/subscapular-tour.ts','app/regional-guided-learning.tsx','lib/tour-camera.ts','app/fitted-camera.tsx']) {\n",
        "  const base='public/atlas-runtime/head-neck/';\n  const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));\n  assert.equal(review.revision,'190a63238eadcf906abe89dcbb6a67c88afe70b9');\n  assert.equal(learner.sourceCommit,'190a63238eadcf906abe89dcbb6a67c88afe70b9');\n  const currentRoot=currentAtlasDeliveryRoot();\n  const committed=(revision:string,path:string)=>execFileSync('git',['-C',currentRoot,'show',revision+':'+path],\n    {windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});\n  assert.deepEqual(committed(review.revision,'lib/regional-tours.ts'),\n    committed('9fba9a1e24b6669aafd48e945d55fc0939d50ab2','lib/regional-tours.ts'),'Exact 9f tour graph remains in current source');\n  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));\n  for(const path of ['lib/hand-venous-tours.ts','lib/lower-venous-tour.ts','lib/regional-tours.ts','lib/tarsal-tour.ts','lib/upper-limb-bone-tour.ts','lib/chest-wall-tour.ts','lib/orbital-tour.ts','lib/intrinsic-larynx-tour.ts','lib/male-duct-tour.ts','lib/deep-brain-tour.ts','lib/subscapular-tour.ts','app/regional-guided-learning.tsx','lib/tour-camera.ts','app/fitted-camera.tsx']) {\n"
      ],
      [
        "  const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));\n  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));\n  for(const path of ['app/regional-guided-learning.tsx','app/regional-guided-learning.css','app/body-explorer.tsx']) {\n    assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,review.files.find((f:any)=>f.path===path)?.sourceSha256,path);\n",
        "  const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));\n  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));\n  assert.equal(review.revision,'190a63238eadcf906abe89dcbb6a67c88afe70b9');\n  const currentRoot=currentAtlasDeliveryRoot();\n  const playerPath='app/regional-guided-learning.tsx';\n  const committed=(revision:string)=>execFileSync('git',['-C',currentRoot,'show',revision+':'+playerPath],\n    {windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});\n  assert.notDeepEqual(committed(review.revision),committed('9fba9a1e24b6669aafd48e945d55fc0939d50ab2'),'Later player source has its own current role');\n  assert.equal(createHash('sha256').update(committed(review.revision)).digest('hex'),\n    review.files.find((f:any)=>f.path===playerPath)?.sourceSha256);\n  for(const path of ['app/regional-guided-learning.tsx','app/regional-guided-learning.css','app/body-explorer.tsx']) {\n    assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,review.files.find((f:any)=>f.path===path)?.sourceSha256,path);\n"
      ],
      [
        "test('all structure-check hosts deliver the corrected success/retry component',()=>{\n  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));\n  const path='app/structure-quick-check.tsx';\n  const source=readFileSync('atlas-review/'+path,'utf8');\n  assert.ok(source.includes('isCorrect ? \"Practise again\" : \"Try again\"'));\n  for(const module of ['shoulder','head-neck']) {\n    const base=`public/atlas-runtime/${module}/`;\n    const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));\n    const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));\n    assert.equal(manifest.sourceCommit,'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');\n    assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,review.files.find((f:any)=>f.path===path)?.sourceSha256);\n    const js=manifest.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(base+f.path,'utf8')).join('\\n');\n",
        "test('all structure-check hosts deliver the corrected success/retry component',()=>{\n  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));\n  assert.equal(review.revision,'190a63238eadcf906abe89dcbb6a67c88afe70b9');\n  const path='app/structure-quick-check.tsx';\n  const source=readFileSync('atlas-review/'+path,'utf8');\n  assert.ok(source.includes('isCorrect ? \"Practise again\" : \"Try again\"'));\n  const currentRoot=currentAtlasDeliveryRoot();\n  const committed=(revision:string)=>execFileSync('git',['-C',currentRoot,'show',revision+':'+path],\n    {windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});\n  assert.deepEqual(committed(review.revision),committed('9fba9a1e24b6669aafd48e945d55fc0939d50ab2'),'Original 9f corrected quick-check source remains exact');\n  assert.equal(createHash('sha256').update(committed(review.revision)).digest('hex'),\n    review.files.find((f:any)=>f.path===path)?.sourceSha256);\n  for(const module of ['shoulder','head-neck']) {\n    const base=`public/atlas-runtime/${module}/`;\n    const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));\n    const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));\n    assert.equal(manifest.sourceCommit,'190a63238eadcf906abe89dcbb6a67c88afe70b9');\n    assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,review.files.find((f:any)=>f.path===path)?.sourceSha256);\n    const js=manifest.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(base+f.path,'utf8')).join('\\n');\n"
      ]
    ]
  },
  {
    "name": "clinical-review-tour-imaging.test.ts",
    "sha": "15888039d3797597e933931bd58d0555e5fb3f2269078a64c37d22952575012b",
    "edits": [
      [
        "import {atlasExactGitApi} from './atlas-exact-git-api.mjs';\nimport {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';\nimport {checkedAtlasHistoryRepo,checkedAtlasSourceRepo} from './atlas-source-repo.mjs';\nimport {inverseGuidedShoulderTour} from './shoulder-tour-guided-playback-inverse.mjs';\n\n",
        "import {atlasExactGitApi} from './atlas-exact-git-api.mjs';\nimport {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';\nimport {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';\nimport {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\nimport {inverseGuidedShoulderTour} from './shoulder-tour-guided-playback-inverse.mjs';\n\n"
      ],
      [
        "const completedEpoch='51de4546a0b33a1ce93bfec4c9c43f760bf82b4e';\nconst liveSourceEpoch='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\nconst currentSourceEpoch='87ed7e343260c7df48a40d53503f25bbfd34cfa5';\nconst atlasRoot=checkedAtlasHistoryRepo(liveSourceEpoch);\nconst atlasGit=(commit:string,path:string)=>execFileSync('git',['show',`${commit}:${path}`],{cwd:atlasRoot,windowsHide:true,maxBuffer:32e6,\n",
        "const completedEpoch='51de4546a0b33a1ce93bfec4c9c43f760bf82b4e';\nconst liveSourceEpoch='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\nconst currentSourceEpoch='190a63238eadcf906abe89dcbb6a67c88afe70b9';\nconst atlasRoot=checkedAtlasHistoryRepo(liveSourceEpoch);\nconst atlasGit=(commit:string,path:string)=>execFileSync('git',['show',`${commit}:${path}`],{cwd:atlasRoot,windowsHide:true,maxBuffer:32e6,\n"
      ],
      [
        "});\n\ntest('current 87ed imported notes and unsigned learner delivery retain exact source and renderer binding',async()=>{\n  checkedAtlasSourceRepo(currentSourceEpoch);\n  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));\n  assert.equal(review.revision,currentSourceEpoch);\n",
        "});\n\ntest('current 190 imported notes and unsigned learner delivery retain exact source and renderer binding',async()=>{\n  const currentRoot=currentAtlasDeliveryRoot();\n  const currentGit=(path:string)=>execFileSync('git',['-C',currentRoot,'show',currentSourceEpoch+':'+path],\n    {windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});\n  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));\n  assert.equal(review.revision,currentSourceEpoch);\n"
      ],
      [
        "  assert(current.regionalTours.length>0);\n  const api=await teachingApi();\n  assert.deepEqual(api.regionalTours,current.regionalTours,'Current imported tours must match bound 87ed source');\n  let unsignedTopics=0;\n  for(const tour of api.regionalTours)for(const step of tour.steps){\n    const structure=api.regionalTourStructures(api.catalog,tour).find((s:any)=>s.id===step.selectedId);assert(structure);\n    const packet=await api.bodyReviewMaterial(structure.id);assert.equal(packet.approval,false);\n    for(const tab of ['ct','mri','xray','ultrasound']){\n      const lesson=api.bodyLesson(structure,tab),topic=packet.topics.find((t:any)=>t.tab===tab);assert(topic);\n      for(const key of ['title','body','bullets','citations','note','readiness'])assert.deepEqual(lesson[key]??null,topic[key]??null);\n      unsignedTopics++;\n",
        "  assert(current.regionalTours.length>0);\n  const api=await teachingApi();\n  assert.deepEqual(api.regionalTours,current.regionalTours,'Current imported tours must match bound 190 source');\n  let unsignedTopics=0;\n  for(const tour of api.regionalTours)for(const step of tour.steps){\n    const structure=api.regionalTourStructures(api.catalog,tour).find((s:any)=>s.id===step.selectedId);assert(structure);\n    const packet=await api.bodyReviewMaterial(structure.id);assert.equal(packet.approval,false);\n    assert.deepEqual(packet,await current.bodyReviewMaterial(structure.id),'Whole current Website packet must match bound 190 source and renderer');\n    for(const tab of ['ct','mri','xray','ultrasound']){\n      const lesson=api.bodyLesson(structure,tab),topic=packet.topics.find((t:any)=>t.tab===tab);assert(topic);\n      assert.deepEqual(lesson,current.bodyLesson(structure,tab),'Current Website lesson must match bound 190 source');\n      for(const key of ['title','body','bullets','citations','note','readiness'])assert.deepEqual(lesson[key]??null,topic[key]??null);\n      unsignedTopics++;\n"
      ],
      [
        "    for(const path of ['app/tour-imaging-notes.tsx','app/tour-imaging-notes.css']){\n      const row=review.files.find((f:any)=>f.path===path);assert(row,path);\n      assert.equal(row.sourceSha256,sha(atlasGit(currentSourceEpoch,path)));\n      assert.equal(row.importedSha256,sha(readFileSync('atlas-review/'+path)));\n      assert.equal(inputs.find((i:any)=>i.path===path)?.sha256,row.sourceSha256);\n      assert.deepEqual(atlasGit(currentSourceEpoch,path),atlasGit(liveSourceEpoch,path),path+': source remains exact from 9f');\n    }\n    const js=learner.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(base+f.path,'utf8')).join('\\n');\n",
        "    for(const path of ['app/tour-imaging-notes.tsx','app/tour-imaging-notes.css']){\n      const row=review.files.find((f:any)=>f.path===path);assert(row,path);\n      assert.equal(row.sourceSha256,sha(currentGit(path)));\n      assert.equal(row.importedSha256,sha(readFileSync('atlas-review/'+path)));\n      assert.equal(inputs.find((i:any)=>i.path===path)?.sha256,row.sourceSha256);\n      assert.deepEqual(currentGit(path),atlasGit(liveSourceEpoch,path),path+': source remains exact from 9f');\n    }\n    const js=learner.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(base+f.path,'utf8')).join('\\n');\n"
      ],
      [
        "  const completed=await exactSourceHistoryApi(completedEpoch,'review-security');\n  // The original 50/304 milestone is the exact lower-venous V2 commit.\n  // Later 9f and current87ed include the separately tested posterior-calf tour.\n  const live=await exactSourceHistoryApi(lowerVenousV2Epoch,'regional-tour-security');\n  const api=await teachingApi('saved50');\n",
        "  const completed=await exactSourceHistoryApi(completedEpoch,'review-security');\n  // The original 50/304 milestone is the exact lower-venous V2 commit.\n  // Later 9f and current190 include the separately tested posterior-calf tour.\n  const live=await exactSourceHistoryApi(lowerVenousV2Epoch,'regional-tour-security');\n  const api=await teachingApi('saved50');\n"
      ]
    ]
  }
];
const currentTourSeams=[
  ["import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';",
    "import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';"],
  ["const currentSourceEpoch='190a63238eadcf906abe89dcbb6a67c88afe70b9';",
    "const currentPin=validateCurrentAtlasDelivery();\nconst currentSourceEpoch=currentPin.source;"],
  ['assert.equal(learner.sourceCommit,currentSourceEpoch);',
    'assert.equal(learner.sourceCommit,currentPin.runtimeSources[module]);'],
];
function replaceExactlyOnce(source,before,after,label){
 const first=source.indexOf(before);
 assert.notEqual(first,-1,label+' missing original seam');
 assert.equal(source.indexOf(before,first+before.length),-1,label+' ambiguous original seam');
 return source.slice(0,first)+after+source.slice(first+before.length);
}
function restoreCurrentTour(source){
 let restored=source;
 for(const [before,after] of [...currentTourSeams].reverse())
  restored=replaceExactlyOnce(restored,after,before,'current tour family');
 return restored;
}
test('all original regional tour and imaging bodies survive outside explicit role seams',()=>{
 for(const {name,sha:historicalSha,edits} of allowed){
  const original=readFileSync(join(here,rawDir,name+'.raw'));
  assert.equal(sha(original),historicalSha,name+' authenticated original bytes');
  let expected=original.toString('utf8');
  for(const [before,after] of edits)expected=replaceExactlyOnce(expected,before,after,name);
  const current=readFileSync(join(here,name));
  const withoutNewest=name==='clinical-review-tour-imaging.test.ts'
   ?Buffer.from(restoreCurrentTour(current.toString())):current;
  const candidate=name==='clinical-review-regional-tour.test.ts'?
   restorePriorRegionalTourRole(name,withoutNewest):withoutNewest;
  assert.deepEqual(candidate,Buffer.from(expected),name+' unknown assertion or behavior edit');
  if(name==='clinical-review-tour-imaging.test.ts')
   for(const [before,after] of currentTourSeams){
    const altered=replaceExactlyOnce(current.toString(),after,'X'+after.slice(1),'mutated current tour seam');
    assert.throws(()=>replaceExactlyOnce(altered,after,before,'mutated current tour inverse'));
   }
 }
});
