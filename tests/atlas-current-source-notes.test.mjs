// Current delivery check; older exact-revision compact-note tests stay intact.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
const revision=CURRENT_ATLAS_REVISION;
const atlasSourceRepo=currentAtlasDeliveryRoot();
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=path=>JSON.parse(readFileSync(path,'utf8'));

test('current learner source disclosure retains all original content, safety notices and exact saved source',()=>{
  const base='public/atlas-runtime/head-neck/';
  const manifest=json(base+'manifest.json');
  assert.equal(manifest.sourceCommit,revision);
  const inputs=json(base+'source-inputs.json');
  const review=json('atlas-review/manifest.json');assert.equal(review.revision,revision);
  for(const path of ['app/source-display-notes.tsx','lib/source-display-notes.ts','app/body-explorer.tsx']){
    const bytes=execFileSync('git',['-C',atlasSourceRepo,'show',`${revision}:${path}`],{windowsHide:true,maxBuffer:16*1024*1024,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
    assert.equal(review.files.find(row=>row.path===path)?.sourceSha256,sha(bytes),path);
    const working=readFileSync(atlasSourceRepo+'/'+path);
    assert.equal(sha(Buffer.from(working.toString().replaceAll('\r\n','\n'))),sha(bytes),path);
    assert.deepEqual(inputs.filter(row=>row.path===path),[{path,sha256:sha(working)}]);
  }
  const runtime=manifest.files.filter(row=>row.path.endsWith('.js')).map(row=>{
    const bytes=readFileSync(base+row.path);assert.equal(sha(bytes),row.sha256,row.path);return bytes.toString();
  }).join('\n');
  for(const text of ['body-source-details','Source representation','separated structures',
    'Independent anatomical and clinical review pending.',
    'Display aggregate excludes the separately selectable great cardiac vein surface. Source coordinates are unchanged.',
    'Atlas, case and paid-lecture access remain independent.'])assert.ok(runtime.includes(text),text);
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])
    assert.equal(manifest[flag],false,flag);
});
