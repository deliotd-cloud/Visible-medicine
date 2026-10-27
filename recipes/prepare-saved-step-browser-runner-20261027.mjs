import fs from'node:fs';import assert from'node:assert/strict';
for(const [source,destination]of [['run-learner-history-browser-20261027.mjs','run-saved-step-browser-20261027.mjs'],['serve-learner-history-browser-20261027.mjs','serve-saved-step-browser-20261027.mjs']]){
 let s=fs.readFileSync(source,'utf8').replaceAll('learner-history','saved-step').replaceAll('20261027-saved-step/','20261027-saved-step-comparison/');
 if(source.startsWith('serve-')){
  s=s.replace("['index.html','bundle.js','bundle.css']","['index.html','bundle.js','bundle.css','destination.html']");
  const from="file=p==='/'?'index.html':p.slice(1)";assert(s.includes(from));s=s.replace(from,"file=p==='/'?'index.html':p==='/atlas/head-neck-3d'?'destination.html':p.slice(1)");
 }
 fs.writeFileSync(destination,s,{flag:'wx'});
}
