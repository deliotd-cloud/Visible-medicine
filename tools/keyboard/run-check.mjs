import fs from 'node:fs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root='G:/VisibleMedicine-temp/proposals/20261031-prostate-keyboard';
const result=await guarded({site:'F:/VisibleMedicine/atlas',dir:root+'/guarded-check',command:root+'/check.mjs',heap:1024,aggregate:2048,minimum:4096});
fs.writeFileSync(root+'/GUARDED_CHECK.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));if(!result.passing)process.exitCode=1;
