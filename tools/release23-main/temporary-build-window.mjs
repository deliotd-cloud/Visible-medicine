import fs from 'node:fs';import {spawn,execFileSync} from 'node:child_process';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
const root='G:/VisibleMedicine-temp/proposals/20261031-release23-main',cp='F:/VisibleMedicine/recovery/checkpoints/20261031-release23-progress/preview-window';
execFileSync('powershell.exe',['-NoProfile','-File',root+'/preview-window/stop.ps1'],{windowsHide:true,stdio:'inherit'});
try {
 const i=JSON.parse(fs.readFileSync('CURRENT_CHECKPOINT.json'));i.activeWork.current.currentInstalled.preview.state='temporarily-stopped-for-authorized-check';i.activeWork.current.temporaryPreviewWindow.state='build-running-restore-in-finally';saveIndex(i);
 const child=spawn(process.execPath,['--max-old-space-size=128',root+'/build-head-final.mjs'],{windowsHide:true,stdio:'inherit'});fs.writeFileSync(cp+'/BUILD_STARTED.json',JSON.stringify({at:new Date().toISOString(),wrapperPid:process.pid,coordinatorPid:child.pid},null,2)+'\n',{flag:'wx'});
 const result=await new Promise(resolve=>{child.once('error',error=>resolve({error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});fs.writeFileSync(cp+'/BUILD_TERMINAL.json',JSON.stringify({at:new Date().toISOString(),...result},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({buildResult:result,restartingSameWebsite:true}));
} finally {
 await import('file:///'+root+'/preview-window/restart.mjs');
}
