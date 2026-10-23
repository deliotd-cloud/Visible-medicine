// Serial existing phase driver, retaining its real per-phase process handles/logs.
import {spawnSync} from 'node:child_process';import assert from 'node:assert/strict';import {json} from './seal-simple-website-successor.mjs';
const phases=process.argv.slice(2);assert(phases.length>0);assert(phases.every(p=>/^[a-z]+(?:-[a-z0-9]+)*$/.test(p)));
for(const phase of phases){assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.activeExecutionSessions.length,0);const r=spawnSync(process.execPath,['integrate-review-ui-website-20261023.mjs',phase],{cwd:process.cwd(),stdio:'inherit',windowsHide:true});if(r.status!==0){process.exitCode=r.status??1;break;}}
