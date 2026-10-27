import fs from'node:fs';
for(const[source,destination]of [['run-learner-history-browser-20261027.mjs','run-course-preview-browser-20261027.mjs'],['serve-learner-history-browser-20261027.mjs','serve-course-preview-browser-20261027.mjs']]){
 const s=fs.readFileSync(source,'utf8').replaceAll('learner-history','course-preview').replaceAll('20261027-course-preview/','20261027-course-preview-focus/');fs.writeFileSync(destination,s,{flag:'wx'});
}
