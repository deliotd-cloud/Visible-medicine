import fs from 'node:fs';import {execFileSync,spawnSync} from 'node:child_process';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
const root='G:/VisibleMedicine-temp/proposals/20261031-release26-main';
execFileSync('powershell.exe',['-NoProfile','-File',root+'/window/stop.ps1'],{windowsHide:true,stdio:'inherit'});
try{const i=JSON.parse(fs.readFileSync('CURRENT_CHECKPOINT.json'));i.activeWork.current.currentInstalled.preview.state='temporarily-stopped-for-authorized-final-release26-checks';saveIndex(i);const r=spawnSync(process.execPath,['--max-old-space-size=192',root+'/final-focused.mjs'],{windowsHide:true,stdio:'inherit'});console.log(JSON.stringify({focusedCheckExit:r.status}));}
finally{await import('file:///'+root+'/window/restart.mjs');}
