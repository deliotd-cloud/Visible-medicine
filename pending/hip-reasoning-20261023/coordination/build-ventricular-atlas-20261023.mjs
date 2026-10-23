// Run the complete existing package build, without npm shell or extra side effects.
import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
assert.equal(JSON.parse(fs.readFileSync('package.json')).scripts.build,'node scripts/regional-teaching-snapshots.mjs --check && npm run reviews:revisions && npm run body-reviews:revisions && node scripts/generate-nested-review-bindings.mjs --check && vinext build && node scripts/compress-model-delivery.mjs && node scripts/exclude-source-recovery.mjs');
for(const args of [['scripts/regional-teaching-snapshots.mjs','--check'],['scripts/review-revisions.mjs'],['scripts/body-renderer-revisions.mjs'],['scripts/generate-nested-review-bindings.mjs','--check'],['node_modules/vinext/dist/cli.js','build'],['scripts/compress-model-delivery.mjs'],['scripts/exclude-source-recovery.mjs']]){
 console.log(JSON.stringify({buildStep:args}));const r=spawnSync(process.execPath,['--max-old-space-size=256',...args],{cwd:process.cwd(),env:{...process.env,NODE_OPTIONS:'--max-old-space-size=256',RAYON_NUM_THREADS:'1',GOMAXPROCS:'2'},stdio:'inherit',windowsHide:true});assert.equal(r.status,0,args.join(' '));
}
