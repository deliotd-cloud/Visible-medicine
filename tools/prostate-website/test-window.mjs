import fs from 'node:fs';import {execFileSync,spawnSync} from 'node:child_process';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
const root='G:/VisibleMedicine-temp/proposals/20261031-prostate-website';
execFileSync('powershell.exe',['-NoProfile','-File',root+'/preview-window/stop.ps1'],{windowsHide:true,stdio:'inherit'});
try{
 const i=JSON.parse(fs.readFileSync('CURRENT_CHECKPOINT.json'));i.activeWork.current.currentInstalled.preview.state='temporarily-stopped-for-authorized-integration-checks';saveIndex(i);
 const r=spawnSync(process.execPath,['G:/VisibleMedicine-temp/proposals/20261031-release25-main/check.mjs'],{windowsHide:true,stdio:'inherit'});console.log(JSON.stringify({focusedCheckExit:r.status}));
}finally{await import('file:///'+root+'/preview-window/restart.mjs');}
