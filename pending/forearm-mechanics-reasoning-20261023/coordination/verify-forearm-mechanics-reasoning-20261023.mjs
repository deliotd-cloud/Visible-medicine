import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
for(const phase of ['practice-v2','types','holds','geometry','requirements','requirementsCheck','rendererCheck','snapshot']){const result=spawnSync(process.execPath,['run-forearm-mechanics-reasoning-20261023.mjs',phase],{cwd:process.cwd(),stdio:'inherit',windowsHide:true});assert.equal(result.status,0,phase);}
