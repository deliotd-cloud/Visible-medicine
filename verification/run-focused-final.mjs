import fs from 'node:fs';import assert from 'node:assert/strict';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
import {json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261101-focus-delivery/attempt-1',p=json(root+'/PREPARATION.json');
const result=await guarded({site:root+'/website',dir:root+'/checks/focused-final',command:'G:/VisibleMedicine-temp/proposals/20261101-focus-delivery-assembly/focused-final.mjs',heap:1024,aggregate:2048,minimum:4096,extraEnv:{VM_ATLAS_SOURCE_REPO:p.native,ATLAS_SOURCE_REPO:p.native,VM_CATALOG_DELIVERY_ATTEMPT:root,TEMP:root+'/tmp',TMP:root+'/tmp'}});
fs.writeFileSync(root+'/focused-final-RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});assert(result.passing,'Focused final checks failed');console.log('All focused delivery and review inbox groups passed.');
