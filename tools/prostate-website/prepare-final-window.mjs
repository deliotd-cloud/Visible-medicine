import fs from 'node:fs';import assert from 'node:assert/strict';
const base='G:/VisibleMedicine-temp/proposals/20261031-prostate-website',cp='F:/VisibleMedicine/recovery/checkpoints/20261031-prostate-website';
const old=base+'/build-window',dest=base+'/final-window',oldCp=cp+'/build-window',newCp=cp+'/final-window';assert(!fs.existsSync(dest));fs.mkdirSync(dest);fs.mkdirSync(newCp);
const plan=JSON.parse(fs.readFileSync(oldCp+'/PLAN.json'));plan.oldPreview={pid:181696,launcherPid:26268,workerdPid:182260,sessionId:37925};plan.at=new Date().toISOString();plan.purpose='Use previously successful full-project type-check memory budget, then build the coherent website candidate; restore same installed website.';
fs.writeFileSync(newCp+'/PLAN.json',JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(dest+'/stop.ps1',fs.readFileSync(old+'/stop.ps1','utf8').replaceAll(oldCp,newCp).replaceAll('20261031-prostate-website/test-window.mjs','20261031-prostate-website/build-window.mjs'),{flag:'wx'});
fs.writeFileSync(dest+'/restart.mjs',fs.readFileSync(old+'/restart.mjs','utf8').replaceAll(old,dest).replaceAll(oldCp,newCp),{flag:'wx'});
const wrapper=fs.readFileSync(base+'/build-window.mjs','utf8').replaceAll('/build-window/','/final-window/').replace("[['job.mjs',['native']],['refresh-native.mjs',[]],['job.mjs',['review']],['job.mjs',['validation']],['job.mjs',['types']],['job.mjs',['website']]]","[['job.mjs',['types-retry']],['job.mjs',['website']]]");
fs.writeFileSync(base+'/final-window.mjs',wrapper,{flag:'wx'});
