import fs from 'node:fs';import assert from 'node:assert/strict';
const base='G:/VisibleMedicine-temp/proposals/20261031-prostate-website',cp='F:/VisibleMedicine/recovery/checkpoints/20261031-prostate-website';
const old='G:/VisibleMedicine-temp/proposals/20261031-prostate-zones/final-window',dest=base+'/preview-window',oldCp='F:/VisibleMedicine/recovery/checkpoints/20261031-prostate-zones/final-window',newCp=cp+'/preview-window';
assert(!fs.existsSync(dest));fs.mkdirSync(dest,{recursive:true});fs.mkdirSync(newCp,{recursive:true});
const plan=JSON.parse(fs.readFileSync(oldCp+'/PLAN.json'));plan.oldPreview={pid:115716,launcherPid:138852,workerdPid:30976,sessionId:60002};plan.at=new Date().toISOString();plan.purpose='Run focused reference/history repairs and assemble source-bound prostate website candidate; restore identical installed preview.';
fs.writeFileSync(newCp+'/PLAN.json',JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(dest+'/stop.ps1',fs.readFileSync(old+'/stop.ps1','utf8').replaceAll(oldCp,newCp).replaceAll('20261031-prostate-zones/temporary-build-window.mjs','20261031-prostate-zones/temporary-final-window.mjs'),{flag:'wx'});
fs.writeFileSync(dest+'/restart.mjs',fs.readFileSync(old+'/restart.mjs','utf8').replaceAll(old,dest).replaceAll(oldCp,newCp),{flag:'wx'});
console.log('Temporary preview window prepared; same-version restart in finally.');
