import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root='G:/VisibleMedicine-temp/staging/20261029-complete-selfchecks-generation-v2';
const sha=b=>createHash('sha256').update(b).digest('hex');
let source=fs.readFileSync(root+'/launch-contained.mjs','utf8');
assert.equal(sha(Buffer.from(source)),'c543f2d9fc6b3244e322d462a353d118f7675b3eaaf361c6adae596631af746b');
assert(!fs.existsSync(root+'/GENERATOR.lock')&&!fs.existsSync(root+'/regional-write'));
const anchor="const root='"+root+"';";assert.equal(source.split(anchor).length,2);
source=source.replace(anchor,anchor+`
// Record this launch's terminal status without keeping an extra shell or Node
// wrapper alive. Source checks, native job limits and admission are unchanged.
const launchStartedAt=new Date().toISOString();
const launchTerminal=root+'/LAUNCH_TERMINAL-'+Date.now()+'-'+process.pid+'.json';
process.once('exit',code=>fs.writeFileSync(launchTerminal,JSON.stringify({schema:'vm-generator-launch-terminal/1',pid:process.pid,startedAt:launchStartedAt,endedAt:new Date().toISOString(),exitCode:code,profile:process.argv[1],profileSha256:hash(process.argv[1])},null,2)+'\\n',{flag:'wx'}));
`);
fs.writeFileSync(root+'/launch-contained-v3.mjs',source,{flag:'wx'});
console.log(JSON.stringify({path:root+'/launch-contained-v3.mjs',sha256:sha(Buffer.from(source)),limitsUnchanged:true,backgroundLauncherOnly:true}));
