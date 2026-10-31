import fs from 'node:fs';import assert from 'node:assert/strict';
const base='G:/VisibleMedicine-temp/proposals/20261031-prostate-website',cp='F:/VisibleMedicine/recovery/checkpoints/20261031-prostate-website';
const old=base+'/final-window',dest=base+'/website-window',oldCp=cp+'/final-window',newCp=cp+'/website-window';assert(!fs.existsSync(dest));fs.mkdirSync(dest);fs.mkdirSync(newCp);
const plan=JSON.parse(fs.readFileSync(oldCp+'/PLAN.json'));plan.oldPreview={pid:48116,launcherPid:52728,workerdPid:56520,sessionId:45114};plan.at=new Date().toISOString();plan.purpose='Complete stock website build using a 4 GiB bounded native job and 2 GiB system reserve; restore identical installed version.';
fs.writeFileSync(newCp+'/PLAN.json',JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(dest+'/stop.ps1',fs.readFileSync(old+'/stop.ps1','utf8').replaceAll(oldCp,newCp).replaceAll('20261031-prostate-website/build-window.mjs','20261031-prostate-website/final-window.mjs'),{flag:'wx'});
fs.writeFileSync(dest+'/restart.mjs',fs.readFileSync(old+'/restart.mjs','utf8').replaceAll(old,dest).replaceAll(oldCp,newCp),{flag:'wx'});
fs.writeFileSync(base+'/website-window.mjs',fs.readFileSync(base+'/final-window.mjs','utf8').replaceAll('/final-window/','/website-window/').replace("[['job.mjs',['types-retry']],['job.mjs',['website']]]","[['job.mjs',['website-final']]]"),{flag:'wx'});
