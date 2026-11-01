import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {transform} from 'esbuild';
import {runInNewContext} from 'node:vm';
import {webcrypto} from 'node:crypto';
import {createRequire} from 'node:module';

const read=p=>JSON.parse(fs.readFileSync(p));
const snapshot=read('docs/anatomy-coverage/index.json');
const manifest=read('atlas-review/manifest.json');
const compiled=await transform(fs.readFileSync('lib/anatomy-coverage-view.ts','utf8'),{loader:'ts',format:'cjs',target:'es2022'});
const mod={exports:{}};
runInNewContext(compiled.code,{module:mod,exports:mod.exports,require:createRequire(import.meta.url),crypto:webcrypto,TextEncoder,structuredClone});
const {projectCoverageView}=mod.exports;

test('the current renal teaching source projects the unchanged anatomical coverage honestly',async()=>{
  const view=await projectCoverageView(snapshot,manifest);
  assert(view,'Exact current source and imported teaching must be admitted');
  assert.equal(view.sourceRevision,manifest.revision);
  assert.equal(view.counts.root,snapshot.scopedCounts.root.rootRepresentations);
  assert.equal(view.counts.nested,snapshot.scopedCounts.nested.nestedSelections);
  for(const key of ['expectedCurriculumInventoried','clinicalApprovalAsserted','anatomicalCompletenessProven'])assert.equal(snapshot.assessment[key],false);
});

test('missing, stale, duplicated or modified renal teaching cannot inherit the coverage binding',async()=>{
  const p='content/renal-venous-xray.ts';
  assert(manifest.files.some(f=>f.path===p));
  const variants=[
    {...manifest,revision:'0'.repeat(40)},
    {...manifest,files:manifest.files.filter(f=>f.path!==p)},
    {...manifest,files:[...manifest.files,manifest.files.find(f=>f.path===p)]},
    ...['sourceSha256','importedSha256'].map(key=>({...manifest,files:manifest.files.map(f=>f.path===p?{...f,[key]:'0'.repeat(64)}:f)})),
  ];
  for(const m of variants)assert.equal(await projectCoverageView(snapshot,m),null);
  assert.equal(await projectCoverageView({...snapshot,assessment:{...snapshot.assessment,clinicalApprovalAsserted:true}},manifest),null);
});
