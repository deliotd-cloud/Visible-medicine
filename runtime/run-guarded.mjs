import fs from 'node:fs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root='G:/VisibleMedicine-temp/proposals/20261101-focus-native-runtime';fs.mkdirSync(root+'/tmp',{recursive:true});
const result=await guarded({site:'G:/VisibleMedicine-temp/staging/20261101-focus-native-integration/atlas',dir:root+'/guarded',command:root+'/build-export.mjs',heap:1536,aggregate:2048,minimum:4096,extraEnv:{TEMP:root+'/tmp',TMP:root+'/tmp'}});
fs.writeFileSync(root+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));if(!result.passing)process.exitCode=1;
