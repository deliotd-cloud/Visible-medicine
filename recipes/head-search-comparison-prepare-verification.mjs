import fs from 'node:fs';import assert from 'node:assert/strict';
const prior='F:/VisibleMedicine/staging/20261028-regional-scope-recipes',root='F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes';
let state=fs.readFileSync(prior+'/state.mjs','utf8');state=state.replaceAll('20261028-regional-scope-recipes','20261028-head-search-comparison-recipes');fs.writeFileSync(root+'/state.mjs',state,{flag:'wx'});
let run=fs.readFileSync(prior+'/run.mjs','utf8');
function replace(a,b){assert.equal(run.split(a).length,2,a);run=run.replace(a,b);}
run=run.replaceAll('20261028-regional-scope-recipes','20261028-head-search-comparison-recipes').replaceAll('20261028-regional-scope-discovery','20261028-head-search-comparison').replaceAll('vm-regional-scope-discovery-source/1','vm-head-search-comparison-source/1').replaceAll("kind:'regional-scope-'","kind:'head-search-comparison-'");
replace("const changed=change.changed,newPaths=['tests/regional-scope-discovery.test.mjs'];","const changed=change.changed,newPaths=[...change.added,'tests/head-search-comparison.test.mjs'];");
replace("const roots=['tests/regional-scope-discovery.test.mjs','tests/regional-learning-catalogue.test.ts','tests/regional-learning-catalogue-ui.test.mjs','tests/regional-learning-discovery-ui.test.mjs','tests/regional-tour-entry-navigation.test.mjs','tests/regional-tour-step-delivery.test.mjs'];","const roots=['tests/head-search-comparison.test.mjs','tests/guided-catalogue-compact.test.mjs','tests/guided-catalogue-real-source.test.mjs','tests/head-guided-comparison.test.ts','tests/head-learning-discovery.test.ts'];");
fs.writeFileSync(root+'/run.mjs',run,{flag:'wx'});
console.log('Verification recipe prepared; no checks launched.');
