import fs from 'node:fs';import assert from 'node:assert/strict';
const file='verify-studio-outline-find-v2-20261026.mjs',before='try{global.gc();const run=';let code=fs.readFileSync(file,'utf8');assert.equal(code.split(before).length,2);
fs.copyFileSync(file,'F:/VisibleMedicine/staging/20261026-studio-outline-find-v2/driver-before-admission-exit-fix.mjs.raw',fs.constants.COPYFILE_EXCL);
const handler=`// The existing memory gate exits75 before creating its job directory. Preserve
// that refusal and remove only this driver's unstarted-job index entry.
process.once('exit',exitCode=>{if(exitCode!==75||fs.existsSync(dir))return;const index=json('CURRENT_CHECKPOINT.json'),jobs=index.activeWork.current.activeExecutionSessions;if(jobs.length!==1||jobs[0].driverPid!==process.pid||jobs[0].sourceSha256!==sourceSha)return;const receipt=dir+'-ADMISSION_REFUSAL.json';fs.mkdirSync(path.dirname(receipt),{recursive:true});fs.writeFileSync(receipt,JSON.stringify({at:new Date().toISOString(),exitCode,driverPid:process.pid,sourceSha256:sourceSha,jobDirectoryAbsent:true,noGuardedProcessStarted:true,indexEntryRetired:true,normalPreviewChanged:false},null,2)+'\\n',{flag:'wx'});index.activeWork.current.activeExecutionSessions=[];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(index,null,2)+'\\n');});
`;
code=code.replace(before,handler+before);fs.writeFileSync(file,code);console.log(JSON.stringify({ready:true,unchangedMemoryGates:true,unstartedAdmissionHandleCleanup:true}));
