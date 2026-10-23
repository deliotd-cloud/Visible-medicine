// Retain both failed source-role lookups and the complete unweakened inverse.
import fs from 'node:fs';import assert from 'node:assert/strict';import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261023-midfoot-website',path='tests/carpal-reasoning-current-delivery.test.mjs',beforeFile=stage+'/worker-tests/carpal.first-combined.raw',afterFile=stage+'/website/'+path;
const before=fs.readFileSync(beforeFile,'utf8'),after=fs.readFileSync(afterFile,'utf8'),record=json(stage+'/worker-tests/transition-receipt.json').records.find(r=>r.path===path);assert.equal(hash(beforeFile),record.afterSha256);
const inserted=`// Resolve the intermediate parent from its descendant checkout, not from
// the earlier carpal introduction repository which cannot contain that commit.
const previousCurrentGit = path => execFileSync('git', ['show', previousCurrentSource + ':' + path], {
  cwd: currentSourceRoot, windowsHide: true, maxBuffer: 32e6,
  env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'},
});
`;
const edits=[['});\nconst parentReceiptBytes', '});\n'+inserted+'const parentReceiptBytes'],['git(previousCurrentSource, path)','previousCurrentGit(path)'],["git(previousCurrentSource, 'lib/reasoning-questions.ts')","previousCurrentGit('lib/reasoning-questions.ts')"]];
let forward=before,inverse=after;for(const[a,b]of edits){assert.equal(forward.split(a).length,2);forward=forward.replace(a,b);}for(const[a,b]of edits.toReversed()){assert.equal(inverse.split(b).length,2);inverse=inverse.replace(b,a);}assert.equal(forward,after);assert.equal(inverse,before);
const p={at:new Date().toISOString(),path,beforeFile,beforeSha256:hash(beforeFile),afterSha256:hash(afterFile),after,edits,wholeOriginalWorkerOutputInverse:true,classification:'Test-only future-parent commit requested in older carpal introduction checkout. Resolve that parent from current descendant checkout; no product, fixture, source, hash, count or assertion change.',failedRun:stage+'/checks/tests/TERMINAL.json',failedRunSha256:hash(stage+'/checks/tests/TERMINAL.json'),bindingUnaffected:!json(stage+'/website/atlas-review/integration-inputs.json').inputs.some(r=>r.path===path)};
fs.writeFileSync(stage+'/MAIN_TEST_REPAIR.json',JSON.stringify(p,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({path,wholeInverse:true,bindingUnaffected:p.bindingUnaffected}));
