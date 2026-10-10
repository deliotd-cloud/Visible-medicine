// Exact authoring-epoch replay of the original renderer-only Review transition.
// This historical test does not claim today's teaching/lockfile stayed unchanged.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {writeFile as actualWriteFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
export const reviewEpoch='cde476ed9fd9068682e28d1f4baf21c83a43d031';
const reviewTree='4ee1d6195fa27cb457a24b32b747d91e5256a2db',before='03da432b035d1dca7cc9f3344ee2722af627d859',root=fileURLToPath(new URL('../',import.meta.url));
const git=(...args)=>execFileSync('git',['--no-replace-objects',...args],{cwd:root,windowsHide:true,maxBuffer:32e6});
assert.equal(git('rev-parse',reviewEpoch+'^{tree}').toString().trim(),reviewTree);
const directReads=new Set(['content/nested-teaching-bindings.v1.json','content/nested-review-bindings.json','content/nested-teaching.ts','lib/eye-layer-guide.ts','lib/nested-review-material.ts','LICENSES/THIRD_PARTY_NOTICES.md','package-lock.json']);
export async function readFile(path){assert(directReads.has(path),'Unlisted historical Review read');return git('show',reviewEpoch+':'+path);}
export async function historicalReviewApi(previous=false){
 assert(typeof previous==='boolean','Historical Review comparison requires a boolean');
 return exactSourceHistoryApi(reviewEpoch,'eye-layer-guide-review',previous?{'content/body-renderer-revision.json':git('show',before+':content/body-renderer-revision.json')}:{});
}
export async function writeFile(path,contents){
 assert.equal(path,'docs/nested-guided-library-review-validation.json','Unlisted historical Review report');
 assert.deepEqual(Buffer.from(contents),git('show',reviewEpoch+':'+path),'Historical report must retain its original exact evidence');
 // Keep test evidence out of the canonical current report. The runner supplies
 // an E-drive TEMP on this host; ordinary local runs use their OS temp directory.
 await actualWriteFile(join(tmpdir(),'visible-medicine-nested-guide-history-'+process.pid+'.json'),contents,{flag:'wx'});
}
