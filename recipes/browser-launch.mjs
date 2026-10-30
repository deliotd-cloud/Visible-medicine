import fs from 'node:fs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root='G:/VisibleMedicine-temp/staging/20261029-foot-view-context-browser';fs.mkdirSync(root+'/temp',{recursive:true});
const result=await guarded({site:'G:/VisibleMedicine-temp/staging/20261029-foot-view-context/website',dir:root+'/guard',command:'--max-old-space-size=512 '+root+'/server.mjs',heap:512,aggregate:2048,minimum:4096,extraEnv:{TEMP:root+'/temp',TMP:root+'/temp'}});
fs.writeFileSync(root+'/PROCESS_RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
