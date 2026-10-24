import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const bound = new Map([
  ['app/studio/cohorts/page.tsx','c9ff118dcf37477b11f4c793abc2bfb20cf7a3db3d5bff72abd9e23a0982e989'],
  ['app/studio/publishing/page.tsx','82522b4e4998bd17b90c952a15a191710a1b684f57813d39831889c76a1d61f3'],
  ['lib/studio-review-queue.ts','e42711ebdd5f15144ae8f382ec2a3ec9aed2a260f0e725412d22f6d4c64f8e63'],
]);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export function readPinnedStudioSource(sourceRoot, relative) {
  assert.ok(bound.has(relative), `Unbound Studio membership source: ${relative}`);
  const bytes=readFileSync(new URL(relative,sourceRoot));
  assert.equal(sha(bytes),bound.get(relative),`Studio membership source drift: ${relative}`);
  return bytes.toString('utf8');
}
export function loadPinnedReviewQueue(sourceRoot, ts) {
  // Pin both original server-page inputs before admitting their common helper.
  readPinnedStudioSource(sourceRoot,'app/studio/cohorts/page.tsx');
  readPinnedStudioSource(sourceRoot,'app/studio/publishing/page.tsx');
  const source=readPinnedStudioSource(sourceRoot,'lib/studio-review-queue.ts');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};
  new Function('require','module','exports',code)(name=>{
    throw new Error(`Unexpected executable review-queue import: ${name}`);
  },module,module.exports);
  readPinnedStudioSource(sourceRoot,'lib/studio-review-queue.ts');
  assert.deepEqual(Object.keys(module.exports).sort(),['canOfferIndependentReview','isPendingIndependentReview','partitionStudioReviewQueue'].sort());
  return Object.freeze(module.exports);
}
