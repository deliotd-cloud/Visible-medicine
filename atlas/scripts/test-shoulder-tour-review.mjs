import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { structures, quizQuestions } from '../app/anatomy-data.ts';
import { currentReviewDocument, reviewDocumentForDisplay, reviewDisplayPaths, shoulderTourTeachingFingerprint } from './review-revision-evidence.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
const base='80ff7f2ce56ce3cc27d4d9e6962797292585c3df';
const previous=JSON.parse(execFileSync('git',['show',`${base}:content/review-revisions.json`],{encoding:'utf8'}));
const revisions=JSON.parse(await readFile('content/review-revisions.json','utf8'));
const manifest=JSON.parse(await readFile('public/models/bodyparts3d/manifest.json','utf8'));
assert.deepEqual(revisions,await currentReviewDocument(manifest,structures,quizQuestions));
const historical=await exactSourceHistoryApi(base,'shoulder-review-baseline');
assert.deepEqual(previous,reviewDocumentForDisplay(historical.manifest,historical.structures,historical.quizQuestions,previous.display),'Pre-tour teaching and geometry reconstruct exactly from its Git source');
for(const structure of structures){
  assert.notEqual(revisions.revisions[structure.id].teaching,previous.revisions[structure.id].teaching,'New tour does not inherit old teaching approval');
  assert.notEqual(revisions.revisions[structure.id].geometry,previous.revisions[structure.id].geometry,'Changed rendering expires prior presentation approval');
  assert.equal(revisions.revisions[structure.id].imaging,null);
}
const hash=value=>createHash('sha256').update(value).digest('hex');
const text=(await readFile('lib/shoulder-tours.ts','utf8')).replace(/\r\n/g,'\n');
const policy=(await readFile('lib/guided-playback.ts','utf8')).replace(/\r\n/g,'\n');
assert(reviewDisplayPaths.includes('lib/guided-playback.ts'),'Shared playback policy is review display evidence');
assert.match(text,/continuousPlayback:\s*guidedPlaybackEvidence\(shoulderTourSteps\)/,'Continuous timing is bound to the reviewed authored steps');
assert.match(text,/durationMs:\s*12000/,'Original manual timing remains authored');
const altered=reviewDocumentForDisplay(manifest,structures,quizQuestions,revisions.display,shoulderTourTeachingFingerprint(text+'\n// material tour change',policy));
for(const structure of structures)assert.notEqual(altered.revisions[structure.id].teaching,revisions.revisions[structure.id].teaching);
const alteredPolicy=reviewDocumentForDisplay(manifest,structures,quizQuestions,revisions.display,shoulderTourTeachingFingerprint(text,policy+'\n// material playback change'));
for(const structure of structures)assert.notEqual(alteredPolicy.revisions[structure.id].teaching,revisions.revisions[structure.id].teaching,'Policy-only change expires teaching approval');
const checklist=await readFile('lib/review-workspace.ts','utf8');
assert.match(checklist,/shoulder-review-2-guided/);assert.match(checklist,/'guided-tour'/);
const panel=await readFile('app/review/review-dashboard.tsx','utf8');
for(const field of ['caption','selectedId','layer','view','fadeOthers','durationMs','references'])assert(panel.includes('step.'+field),'Review exposes '+field);
assert(panel.includes('continuousPlayback.stepDurationsMs[index]'),'Review exposes each continuous stop duration');
assert(panel.includes('continuousPlayback.transitionMs'),'Review exposes the slow camera sweep');
const priorAnatomy=execFileSync('git',['show',`${base}:app/anatomy-data.ts`],{maxBuffer:100*1024*1024});
assert.notEqual(hash(await readFile('app/anatomy-data.ts')),hash(priorAnatomy),'Current authored teaching differs from the historical baseline and requires exact-source replay');
const playbackBaseline='840fcbf73e29a9c146a84ca8c232ca5c762c1672';
const playbackParent='38f225ff2d4b6cd0f2e4434c0a2d3a759f1af875';
assert.equal(execFileSync('git',['rev-parse',playbackBaseline+'^'],{encoding:'utf8'}).trim(),playbackParent);
const epochAnatomy=commit=>execFileSync('git',['show',commit+':app/anatomy-data.ts'],{maxBuffer:100*1024*1024});
assert.equal(hash(epochAnatomy(playbackBaseline)),hash(epochAnatomy(playbackParent)),
  'Playback preserves its exact authored anatomy input');
assert.equal(hash(await readFile('app/anatomy-data.ts')),hash(epochAnatomy('7978478992f54ea68e0f53c3d195c459c7b80068')),
  'Current teaching retains the authenticated later authoring epoch');
for(const path of ['public/models/bodyparts3d/manifest.json','public/models/bodyparts3d/shoulder-right.glb']){
  const before=execFileSync('git',['show',`${base}:${path}`],{maxBuffer:100*1024*1024});
  assert.equal(hash(await readFile(path)),hash(before),'Existing source unchanged: '+path);
}
console.log(JSON.stringify({structures:structures.length,oldTeachingAndDisplayExpired:true,tourAndPolicyMutationsChangeTeaching:true,geometrySourceUnchanged:true,privateReviewsTouched:false,imagingStillAbsent:true}));
