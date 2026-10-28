import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
const root='F:/VisibleMedicine/staging/20261028-saved-course-availability',old=root+'/SOURCE_CANDIDATE.json';assert.equal(hash(old),'a68b4414800c1fe866ffb7e6d5d089c8b7a70b13e53010328992ac5e466959b5');const s=json(old);for(const r of s.sourceRows)assert.equal(hash(s.website+'/'+r.path),r.sha256);
for(const key of ['proposals','preimagePaths','followup','historyInverseCorrection'])delete s[key];
s.schema='vm-saved-course-availability-source/2';s.productSourceChanged=true;s.sourceChangesOnlyTests=false;s.supersedesReceipt={path:old,sha256:hash(old),reason:'Correct inherited test-only classification; no source bytes changed.'};
const file=root+'/SOURCE_CANDIDATE_V2.json';fs.writeFileSync(file,JSON.stringify(s,null,2)+'\n',{flag:'wx'});const i=json('CURRENT_CHECKPOINT.json');i.activeWork.current.pendingSavedCourseAvailability.source={path:file,sha256:hash(file)};saveIndex(i);console.log(JSON.stringify({source:{path:file,sha256:hash(file)}}));
