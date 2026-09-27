import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { structures, quizQuestions } from '../app/anatomy-data.ts';
import { currentReviewDocument, reviewDocumentForDisplay } from './review-revision-evidence.mjs';
const base='80ff7f2ce56ce3cc27d4d9e6962797292585c3df';
const previous=JSON.parse(execFileSync('git',['show',`${base}:content/review-revisions.json`],{encoding:'utf8'}));
const revisions=JSON.parse(await readFile('content/review-revisions.json','utf8'));
const manifest=JSON.parse(await readFile('public/models/bodyparts3d/manifest.json','utf8'));
assert.deepEqual(revisions,await currentReviewDocument(manifest,structures,quizQuestions));
assert.deepEqual(previous,reviewDocumentForDisplay(manifest,structures,quizQuestions,previous.display),'Pre-tour teaching and geometry reconstruct exactly');
for(const structure of structures){
  assert.notEqual(revisions.revisions[structure.id].teaching,previous.revisions[structure.id].teaching,'New tour does not inherit old teaching approval');
  assert.notEqual(revisions.revisions[structure.id].geometry,previous.revisions[structure.id].geometry,'Changed rendering expires prior presentation approval');
  assert.equal(revisions.revisions[structure.id].imaging,null);
}
const hash=value=>createHash('sha256').update(value).digest('hex');
const text=(await readFile('lib/shoulder-tours.ts','utf8')).replace(/\r\n/g,'\n');
const altered=reviewDocumentForDisplay(manifest,structures,quizQuestions,revisions.display,hash(text+'\n// material tour change'));
for(const structure of structures)assert.notEqual(altered.revisions[structure.id].teaching,revisions.revisions[structure.id].teaching);
const checklist=await readFile('lib/review-workspace.ts','utf8');
assert.match(checklist,/shoulder-review-2-guided/);assert.match(checklist,/'guided-tour'/);
const panel=await readFile('app/review/review-dashboard.tsx','utf8');
for(const field of ['caption','selectedId','layer','view','fadeOthers','durationMs','references'])assert(panel.includes('step.'+field),'Review exposes '+field);
for(const path of ['app/anatomy-data.ts','public/models/bodyparts3d/manifest.json','public/models/bodyparts3d/shoulder-right.glb']){
  const before=execFileSync('git',['show',`${base}:${path}`],{maxBuffer:100*1024*1024});
  assert.equal(hash(await readFile(path)),hash(before),'Existing source unchanged: '+path);
}
console.log(JSON.stringify({structures:structures.length,oldTeachingAndDisplayExpired:true,tourMutationChangesTeaching:true,sourceUnchanged:true,privateReviewsTouched:false,imagingStillAbsent:true}));
