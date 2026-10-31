import fs from 'node:fs';import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-head-focus-font-verified';
const result=await guarded({site:root+'/website',dir:root+'/review-build-1',command:'scripts/build-clinical-review-viewer.mjs',heap:1024,aggregate:2048,minimum:4096,extraEnv:{TEMP:root+'/tmp',TMP:root+'/tmp'}});
fs.writeFileSync(root+'/REVIEW_BUILD_RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passing:result.passing}));if(!result.passing)process.exitCode=1;
