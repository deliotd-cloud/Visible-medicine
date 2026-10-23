// Run the remaining bounded checks once, serially, retaining every terminal log.
import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261023-midfoot-reasoning';
assert.equal(json(stage+'/checks/native/TERMINAL.json').code,0,'Resolve the retained native failure before broad checks');
for(const phase of ['pins','practice','baseline','types','regional','holds','requirements','requirements-check','build','renderer-check','snapshot']){
 const r=spawnSync(process.execPath,['run-midfoot-reasoning-20261023.mjs',phase],{stdio:'inherit',windowsHide:true});
 assert.equal(r.status,0,phase);
}
const r=spawnSync(process.execPath,['verify-midfoot-reasoning-20261023.mjs'],{stdio:'inherit',windowsHide:true});assert.equal(r.status,0,'Whole-file and worksheet preservation');
