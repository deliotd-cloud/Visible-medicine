import fs from 'node:fs';import assert from 'node:assert/strict';
const base='G:/VisibleMedicine-temp/proposals/20261031-prostate-website',cp='F:/VisibleMedicine/recovery/checkpoints/20261031-prostate-website';
const old=base+'/preview-window',dest=base+'/build-window',oldCp=cp+'/preview-window',newCp=cp+'/build-window';assert(!fs.existsSync(dest));fs.mkdirSync(dest);fs.mkdirSync(newCp);
const plan=JSON.parse(fs.readFileSync(oldCp+'/PLAN.json'));plan.oldPreview={pid:85476,launcherPid:102220,workerdPid:124996,sessionId:20868};plan.at=new Date().toISOString();plan.purpose='Build a consistent prostate website candidate from exact committed LF source, validate and restore the same installed website.';
fs.writeFileSync(newCp+'/PLAN.json',JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(dest+'/stop.ps1',fs.readFileSync(old+'/stop.ps1','utf8').replaceAll(oldCp,newCp).replaceAll('20261031-prostate-zones/temporary-final-window.mjs','20261031-prostate-website/test-window.mjs'),{flag:'wx'});
fs.writeFileSync(dest+'/restart.mjs',fs.readFileSync(old+'/restart.mjs','utf8').replaceAll(old,dest).replaceAll(oldCp,newCp),{flag:'wx'});
