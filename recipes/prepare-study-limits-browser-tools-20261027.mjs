import fs from 'node:fs';
for(const [from,to] of [['run-review-filter-browser-20261027.mjs','run-study-limits-browser-20261027.mjs'],['serve-review-filter-browser-20261027.mjs','serve-study-limits-browser-20261027.mjs']]){
 const text=fs.readFileSync(from,'utf8').replaceAll('20261027-review-filter-scroll','20261027-study-comparison-limits').replaceAll('build-review-filter-browser-20261027.mjs','build-study-limits-browser-20261027.mjs').replaceAll('review-filter-browser-build','study-limits-browser-build').replaceAll('synthetic-review-filters','synthetic-study-limits');fs.writeFileSync(to,text,{flag:'wx'});
}
