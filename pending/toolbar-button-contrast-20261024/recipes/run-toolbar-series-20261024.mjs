// Await real child completion between phases, even when the outer tool yields.
import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
const phases=process.argv.slice(2);assert(phases.length&&phases.every(p=>['feature','types','renderer','display','build','rendererCheck','displayCheck','regional','exportRegional'].includes(p.replace(/V[23]$/,''))));
for(const phase of phases){const r=spawnSync(process.execPath,['run-toolbar-button-contrast-20261024.mjs',phase],{cwd:process.cwd(),windowsHide:true,stdio:'inherit'});if(r.status!==0){process.exitCode=r.status??1;break;}}
