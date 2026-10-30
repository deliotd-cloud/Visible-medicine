import fs from 'node:fs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
const root='G:/VisibleMedicine-temp/staging/20261030-review-release-continuation';
const file='CURRENT_CHECKPOINT.json',bytes=fs.readFileSync(file),index=JSON.parse(bytes);
if(!fs.existsSync(root+'/INDEX_BEFORE.json'))fs.writeFileSync(root+'/INDEX_BEFORE.json',bytes,{flag:'wx'});
index.activeWork.current.activeExecutionSessions=fs.existsSync(root+'/checks/focused-1/PROCESS-TERMINAL.json')?[]:[{sessionId:32593,supervisorPid:120500,kind:'focused release-context regression',evidence:root+'/checks/focused-1',ownerPreviewChanged:false}];
saveIndex(index);
console.log(JSON.stringify({liveJobs:index.activeWork.current.activeExecutionSessions.length}));
