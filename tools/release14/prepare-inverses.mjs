import fs from 'node:fs';import assert from 'node:assert/strict';
const root='G:/VisibleMedicine-temp/proposals/20261031-release-fourteen-main';
let recipe=fs.readFileSync(root+'/prepare-review-admissions.mjs','utf8');
const replacements=[
 ["const parentPath='G:/VisibleMedicine-temp/staging/20261031-release14-abdominal/SOURCE.json',root='G:/VisibleMedicine-temp/staging/20261031-release14-review-admissions'","const parentPath='G:/VisibleMedicine-temp/staging/20261031-release14-review-admissions/SOURCE.json',root='G:/VisibleMedicine-temp/staging/20261031-release14-inverses'"],
 ["'ce86d67fb5f1d19de38cc6332d0d7d9a2673a883f9bfa09e2db59a389a6be5cb'","'8442354981c7d4146f0bfef73128f61371980756793e468710f505a5a933e472'"],
 ["'G:/VisibleMedicine-temp/proposals/20261031-release14-review-pin/MANIFEST.json','G:/VisibleMedicine-temp/proposals/20261031-release14-admission-epochs/MANIFEST.json'","'G:/VisibleMedicine-temp/proposals/20261031-release14-viewer-history/MANIFEST.json','G:/VisibleMedicine-temp/proposals/20261031-release14-inverse-epochs/MANIFEST.json'"],
 ['assert.equal(map.size,4)','assert.equal(map.size,7)'],
 ["schema:'vm-release-fourteen-review-admission-successor/1'","schema:'vm-release-fourteen-inverse-successor/1'"]
];for(const[a,b]of replacements){assert.equal(recipe.split(a).length,2,a);recipe=recipe.replace(a,b);}fs.writeFileSync(root+'/integrate-inverses.mjs',recipe,{flag:'wx'});await import('./integrate-inverses.mjs');
