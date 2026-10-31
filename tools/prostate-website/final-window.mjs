import fs from 'node:fs';import {execFileSync,spawnSync} from 'node:child_process';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
const root='G:/VisibleMedicine-temp/proposals/20261031-prostate-website';
execFileSync('powershell.exe',['-NoProfile','-File',root+'/final-window/stop.ps1'],{windowsHide:true,stdio:'inherit'});
try{
 const i=JSON.parse(fs.readFileSync('CURRENT_CHECKPOINT.json'));i.activeWork.current.currentInstalled.preview.state='temporarily-stopped-for-authorized-website-integration-build';saveIndex(i);
 for(const [file,args] of [['job.mjs',['types-retry']],['job.mjs',['website']]]){
  const r=spawnSync(process.execPath,[root+'/'+file,...args],{windowsHide:true,stdio:'inherit'});if(r.status!==0){console.log(JSON.stringify({stoppedAt:[file,...args],exit:r.status}));break;}
 }
}finally{await import('file:///'+root+'/final-window/restart.mjs');}
