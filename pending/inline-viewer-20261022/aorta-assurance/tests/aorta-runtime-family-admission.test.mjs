import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const original=readFileSync(new URL('./fixtures/aorta-runtime-family-before-20261022.raw',import.meta.url),'utf8');
const candidate=readFileSync(new URL('./atlas-abdominal-aorta-us.test.ts',import.meta.url),'utf8');
const sha=value=>createHash('sha256').update(value).digest('hex');
const originalSha='0e2c98a68cd46e2845a0cd97f2c356b592684c96331315285a2004fedcce3d81';
const seams=[
  ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';",
   "import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';"],
  ['const currentSource=CURRENT_ATLAS_REVISION;',
   'const currentSource=CURRENT_ATLAS_REVISION;\nconst runtimeSources=validateCurrentAtlasDelivery().runtimeSources;'],
  ['    assert.equal(manifest.sourceCommit,currentSource);',
   '    assert.equal(manifest.sourceCommit,runtimeSources[name]);'],
];

function replaceOnce(source,from,to){
  assert.equal(source.split(from).length,2,`Declared seam must occur exactly once: ${from}`);
  return source.replace(from,to);
}
function prove(source){
  assert.equal(sha(original),originalSha,'Byte-exact canonical test preimage');
  const forward=seams.reduce((value,[from,to])=>replaceOnce(value,from,to),original);
  assert.equal(source,forward,'Candidate must contain only the declared live-runtime seams');
  const inverse=seams.reduceRight((value,[from,to])=>replaceOnce(value,to,from),source);
  assert.equal(inverse,original,'Whole historical and current test restored by exact inverse');
}

test('complete aorta test is retained with only pinned per-family live runtime admission',()=>{
  prove(candidate);
  assert.match(candidate,/assert\.equal\(manifest\.sourceCommit,runtimeSources\[name\]\)/);
  assert.match(candidate,/assert\.equal\(liveViewer\.sourceCommit,currentSource\)/);
  assert.match(candidate,/assert\.equal\(inputs\.find\(\(row:any\)=>row\.path===source\.path\)\?\.sha256,liveEntry\.sourceSha256\)/);
});

test('unknown edits, missing gates and uniform-family regressions are refused',()=>{
  for(const altered of [
    candidate+'\n// unreviewed change\n',
    candidate.replace('assert.equal(manifest.patientDataIncluded,false);',''),
    candidate.replace('assert.equal(manifest.sourceCommit,runtimeSources[name]);','assert.equal(manifest.sourceCommit,currentSource);'),
    candidate.replace('assert.equal(manifest.sourceCommit,runtimeSources[name]);',"assert.equal(manifest.sourceCommit,runtimeSources['head-neck']);"),
    candidate.replace('assert.equal(liveViewer.sourceCommit,currentSource);',''),
  ])assert.throws(()=>prove(altered),/Candidate must contain only the declared live-runtime seams/);
});
