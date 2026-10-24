import {spawnSync} from 'node:child_process';import assert from 'node:assert/strict';
for(const args of [['test-toolbar-website-20261024.mjs','tests'],['check-toolbar-website-types-20261024.mjs'],['run-toolbar-website-series-20261024.mjs','prebuild','build','verifyFinal']]){const r=spawnSync(process.execPath,args,{stdio:'inherit',windowsHide:true});assert.equal(r.status,0,args.join(' '));}
