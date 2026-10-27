import fs from'node:fs';import assert from'node:assert/strict';
for(const[source,destination]of [['run-learner-history-browser-20261027.mjs','run-review-filter-browser-20261027.mjs'],['serve-learner-history-browser-20261027.mjs','serve-review-filter-browser-20261027.mjs']]){
 let s=fs.readFileSync(source,'utf8').replaceAll('learner-history','review-filter').replaceAll('20261027-review-filter/','20261027-review-filter-scroll/');
 if(source.startsWith('serve-')){assert(s.includes("p==='/'?"));s=s.replace("p==='/'?","(p==='/'||p==='/workspace/clinical-review-inbox')?");}
 fs.writeFileSync(destination,s,{flag:'wx'});
}
