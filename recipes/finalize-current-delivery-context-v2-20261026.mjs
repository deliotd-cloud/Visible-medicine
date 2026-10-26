// Correct only the evidence-root name; preserve the initial refused ledger attempt.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
import {hash,json} from './bounded-source-hash-20261026.mjs';
const base=path.resolve('F:/VisibleMedicine/staging/20261026-current-delivery-advance'),failed=path.resolve(base,'checklist-progress'),archive=path.resolve(base,'checklist-progress-initial-refusal');
for(const p of [failed,archive])assert(p.startsWith(base+path.sep));
assert(!fs.existsSync(failed+'/RESULT.json'));assert(!fs.existsSync(archive));assert.equal(json('F:/VisibleMedicine/website/docs/completion-checklist.json').revision,240);
assert.equal(hash('F:/VisibleMedicine/website/docs/completion-checklist.json'),hash(failed+'/CHECKLIST_BEFORE.json'));
assert.equal(hash('F:/VisibleMedicine/website/docs/completion-checklist.md'),hash(failed+'/CHECKLIST_BEFORE.md'));
const source='finalize-current-delivery-context-20261026.mjs',target='finalize-current-delivery-context-v2-run-20261026.mjs',before="rootKey:'currentcontextoct26'",after="rootKey:'currentcontextoct'",original=fs.readFileSync(source,'utf8');
assert.equal(original.split(before).length,2);const corrected=original.replace(before,after);assert.equal(corrected.replace(after,before),original);assert(!fs.existsSync(target));
fs.renameSync(failed,archive);fs.writeFileSync(target,corrected,{flag:'wx'});
fs.writeFileSync(base+'/CHECKLIST_ROOT_CORRECTION.json',JSON.stringify({at:new Date().toISOString(),originalRecipe:{path:source,sha256:hash(source)},correctedRecipe:{path:target,sha256:hash(target)},inverseByteEquality:true,correction:'Evidence root grammar is letters only; use currentcontextoct. No checklist rules, values or acceptances changed.',initialRefusalPreserved:archive},null,2)+'\n',{flag:'wx'});
await import(pathToFileURL(fs.realpathSync(target)));
