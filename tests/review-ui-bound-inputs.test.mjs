import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
test('every streamlined native review control is bound to its exact current bytes',()=>{
 const binding=JSON.parse(read('atlas-review/integration-inputs.json'));
 const paths=['components/GroupedReviewConfirmation.tsx','lib/review-draft-autosave.ts','lib/clinical-review-fetch.ts',
  'components/HeadCtBoneDecisionForm.tsx','components/HeadCtBoneTeachingDecisionForm.tsx','components/HeadCtFacialDecisionForm.tsx',
  'components/HeadMriReviewNotes.tsx','components/HeadPairedDecisionForm.tsx','components/HeadTeachingReviewNotes.tsx',
  'components/PlexusReviewWorksheet.tsx','components/RegionalGuideReviewNotes.tsx','components/RegionalReferenceReviewNotes.tsx'];
 assert.equal(new Set(binding.inputs.map(row=>row.path)).size,binding.inputs.length,'No duplicate bound paths');
 for(const path of paths){const row=binding.inputs.find(row=>row.path===path);assert(row,'Missing current review source: '+path);assert.equal(row.sha256,sha(read(path)),path);}
 assert.equal(sha(Buffer.from(JSON.stringify(binding.inputs))),binding.sha256);
});
