// Original producers run once in order; source handoffs are never guessed.
import {spawnSync} from 'node:child_process';import assert from 'node:assert/strict';import {json} from './seal-simple-website-successor.mjs';
const phases=process.argv.slice(2);assert(phases.length);assert(phases.every(p=>/^[a-z]+(?:-[a-z0-9]+)*$/.test(p)));
for(const phase of phases){assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.activeExecutionSessions.length,0);const r=spawnSync(process.execPath,['integrate-midfoot-website-20261023.mjs',phase],{stdio:'inherit',windowsHide:true});if(r.status!==0){process.exitCode=r.status??1;break;}}
