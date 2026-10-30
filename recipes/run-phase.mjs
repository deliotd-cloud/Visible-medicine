import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {guarded as small} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-small-native-task-guarded-20261025.mjs';
import {guarded as balanced} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';

const phase=process.argv[2];assert(['import','inventory','lecture','coverage','review','pin'].includes(phase));
const stage='G:/VisibleMedicine-temp/staging/20261030-native-runtime-integration';
const coordination='C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2';
assert.equal(process.cwd().toLowerCase().replaceAll('\\','/'),coordination.toLowerCase());
assert(fs.existsSync(stage+'/WEBSITE_PREPARATION.json'));
const dir=stage+'/supervision/'+phase+'-attempt-'+(['inventory','review'].includes(phase)?'2':'1');
const command='--max-old-space-size=256 '+fileURLToPath(new URL('./stock-steps.mjs',import.meta.url)).replaceAll('\\','/')+' '+phase;
const guard=phase==='review'?balanced:small;
const result=await guard({site:coordination,dir,command,heap:phase==='review'?1024:384,aggregate:phase==='review'?3072:2048,minimum:phase==='review'?5120:4096,extraEnv:{TEMP:stage+'/temp',TMP:stage+'/temp',TMPDIR:stage+'/temp',npm_config_cache:stage+'/temp/npm-cache'}});
const receipt=stage+'/checks/'+phase+'-attempt-'+(['inventory','review'].includes(phase)?'2':'1')+'/RESULT.json';
assert(result.passing&&fs.existsSync(receipt)&&JSON.parse(fs.readFileSync(receipt,'utf8')).passing,'Preserve supervisor and phase logs for review');
console.log(JSON.stringify({phase,passing:true,supervision:dir,receipt}));
