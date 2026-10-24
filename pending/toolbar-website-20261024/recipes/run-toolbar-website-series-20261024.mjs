import {spawnSync} from 'node:child_process';import assert from 'node:assert/strict';
for(const phase of process.argv.slice(2)){const r=spawnSync(process.execPath,['run-toolbar-website-20261024.mjs',phase],{stdio:'inherit',windowsHide:true});assert.equal(r.status,0,'Phase failed: '+phase);}
