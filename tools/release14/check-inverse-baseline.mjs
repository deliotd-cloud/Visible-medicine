import fs from 'node:fs';import assert from 'node:assert/strict';
const root='G:/VisibleMedicine-temp/proposals/20261031-release-fourteen-main';let code=fs.readFileSync(root+'/check-inverses.mjs','utf8');
for(const[a,b]of [
 ['20261031-release14-inverses','20261031-release14-review-admissions'],
 ['79e1fd2c00d770a75ff365ba761423b7f37bc42006b38c3eb9b0650458ed0079','8442354981c7d4146f0bfef73128f61371980756793e468710f505a5a933e472'],
 ['focused-inverses-1','focused-inverses-baseline-1'],
 ['FOCUSED_INVERSES.json','FOCUSED_INVERSES_BASELINE.json']
]){assert.equal(code.split(a).length,2,a);code=code.replace(a,b);}fs.writeFileSync(root+'/run-inverse-baseline.mjs',code,{flag:'wx'});await import('./run-inverse-baseline.mjs');
