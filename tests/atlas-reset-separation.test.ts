import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';

test('original Reset separation source pin remains in its immutable website delivery',()=>{
  const epoch='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
  const historical=(path:string)=>execFileSync('git',['--no-replace-objects','show',`${epoch}:${path}`]);
  const review=JSON.parse(historical('atlas-review/manifest.json').toString());
  const learner=JSON.parse(historical('public/atlas-runtime/head-neck/manifest.json').toString());
  assert.equal(review.revision,'88cea927d48729769b96ad8fe680b0872b7e6687');
  assert.equal(learner.sourceCommit,'88cea927d48729769b96ad8fe680b0872b7e6687');
  const entry=review.files.find((f:any)=>f.path==='app/body-explorer.tsx');
  assert.equal(entry.sourceSha256,'2dad1c22dfec424db6a4cdf578cb4f9cafe6a0e3295f95ed7d3318976aa62dc0');
  assert.equal(createHash('sha256').update(historical('atlas-review/app/body-explorer.tsx')).digest('hex'),entry.importedSha256);
});

test('learner and review deliver Reset separation correction without restoring removed anatomy', () => {
  const review = JSON.parse(readFileSync('atlas-review/manifest.json', 'utf8'));
  const learner = JSON.parse(readFileSync('public/atlas-runtime/head-neck/manifest.json', 'utf8'));
  const inputs = JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json', 'utf8'));
  const atlasRoot=currentAtlasDeliveryRoot();
  assert.equal(review.revision,CURRENT_ATLAS_REVISION);
  assert.equal(learner.sourceCommit,CURRENT_ATLAS_REVISION);
  const entry = review.files.find((f: any) => f.path === 'app/body-explorer.tsx');
  const committed=execFileSync('git',['--no-replace-objects','-C',atlasRoot,'show',`${CURRENT_ATLAS_REVISION}:app/body-explorer.tsx`]);
  assert.equal(entry.sourceSha256,createHash('sha256').update(committed).digest('hex'));
  assert.equal(inputs.find((f: any) => f.path === entry.path)?.sha256, entry.sourceSha256);
  const source = readFileSync('atlas-review/' + entry.path, 'utf8');
  assert.equal(createHash('sha256').update(source).digest('hex'), entry.importedSha256);
  const handler = source.match(/function resetView\(\) \{([\s\S]*?)\n  \}/)?.[1];
  assert(handler);
  for (const setter of ['setShowOrigins', 'setAnchorSkeleton']) assert(handler.includes(setter + '(false)'));
  assert(handler.includes('setRegionalFraming(true)'));
  assert(handler.includes('setExplode(0)'));
  assert.doesNotMatch(handler, /\b(?:setSystems|setDissection|setSelected|setSide|setIllustrated|dispatchDissection)\(/);
  for (const flag of ['patientDataIncluded', 'clinicalApproved', 'imagingConnection', 'standaloneReviewConnection']) assert.equal(learner[flag], false);
});
