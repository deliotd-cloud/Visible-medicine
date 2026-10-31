import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const root='G:/VisibleMedicine-temp/proposals/20261031-prostate-keyboard',canonical='F:/VisibleMedicine/atlas';
const steps=[
 ['types',['node_modules/typescript/lib/tsc.js','-p',root+'/atlas/tsconfig.prostate-qa.json']],
 ['keyboard-and-zones',['--import','tsx','--test','--test-reporter=tap','scripts/test-camera-keyboard.mjs','scripts/test-camera-keyboard-zoom.mjs',root+'/atlas/scripts/test-prostate-zones.mjs']],
];
const results=[];
for(const [name,args] of steps){
 const result=spawnSync(process.execPath,args,{cwd:canonical,encoding:'utf8',maxBuffer:4*1024*1024,env:process.env});
 fs.writeFileSync(root+'/'+name+'.log',(result.stdout||'')+(result.stderr||''));
 results.push({name,exitCode:result.status,error:result.error?.message,log:root+'/'+name+'.log'});
 console.log(JSON.stringify(results.at(-1)));
 if(result.status!==0)break;
}
fs.writeFileSync(root+'/CHECKS.json',JSON.stringify({at:new Date().toISOString(),results,allPassed:results.length===steps.length&&results.every(r=>r.exitCode===0)},null,2)+'\n');
if(results.length!==steps.length||results.some(r=>r.exitCode!==0))process.exitCode=1;
