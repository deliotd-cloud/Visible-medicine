import fs from 'node:fs';import assert from 'node:assert/strict';
const root='G:/VisibleMedicine-temp/proposals/20261031-release-fourteen-main';let code=fs.readFileSync(root+'/check-review-admissions.mjs','utf8');
for(const[a,b]of [
 ['20261031-release14-review-admissions','20261031-release14-inverses'],
 ['8442354981c7d4146f0bfef73128f61371980756793e468710f505a5a933e472','79e1fd2c00d770a75ff365ba761423b7f37bc42006b38c3eb9b0650458ed0079'],
 ['focused-review-admissions-1','focused-inverses-1'],
 ['tests/current-private-review-binding.test.mjs tests/clinical-review-colic-arterial-xray.test.ts tests/clinical-review-femoral-venous-xray.test.ts','tests/elbow-us-followup-preservation.test.mjs tests/forearm-xray-preservation.test.mjs tests/head-practice-exit-later-viewer.test.mjs tests/keyboard-teaching-source-role.test.mjs tests/release-diagnostic-context-inverse.test.mjs tests/release-epoch-composition-preservation.test.mjs'],
 ['FOCUSED_REVIEW_ADMISSIONS.json','FOCUSED_INVERSES.json']
]){assert.equal(code.split(a).length,2,a);code=code.replace(a,b);}fs.writeFileSync(root+'/check-inverses.mjs',code,{flag:'wx'});await import('./check-inverses.mjs');
