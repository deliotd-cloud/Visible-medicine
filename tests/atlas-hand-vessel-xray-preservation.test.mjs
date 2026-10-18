import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import test from 'node:test';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const original=readFileSync(new URL('./fixtures/atlas-hand-vessel-xray.original.mjs',import.meta.url));
const proposal=readFileSync(new URL('./fixtures/atlas-hand-vessel-xray.admitted-e49120.mjs.raw',import.meta.url));
const current=readFileSync(new URL('./atlas-hand-vessel-xray.test.mjs',import.meta.url));
const archiveBytes=readFileSync(new URL('./fixtures/hand-vessel-xray-589-delivery-archive-v3.json',import.meta.url));
const originalSha='1d575db1efe1e23fdfd891eabe122cc9950e8624caed480e69908b9e24bbc6b4';
const reviewedPostimageSha='e49120c67a1ca2f8f9cc424c63ca10073e2079b005fc21bdf582774212b19f8e';
const rendererPostimageSha='ed22f7d0c5ce9668e7af669b965206f9acdba54c79c48997b91e43bbaeed5f13';
const archiveSha='422e4ccfeb1f440a31fb6a1cf218c9171b0cc0471d66911d2cafdb51e7934904';

test('exact original and reviewed postimage retain the executable historical and current proofs',()=>{
  assert.equal(sha(original),originalSha);
  assert.equal(sha(proposal),reviewedPostimageSha);
  const source=proposal.toString();
  for(const assertion of [
    'same(worksheet,await sourceApi.bodyReviewMaterial',
    'same(after,sourceApi.bodyLesson',
    'historical emitted limitation',
    '589-to-7b inherited X-ray teaching',
    '589-to-7b Review X-ray topic',
    'assert.equal(compared,9936)',
    '[36,9892,36,8,8,9928]',
    'assert.equal(sha(bytes),row.sha256',
    'historicalInputBytes(input)',
    'reconstructed input normalizes to exact 589 Git',
    'assert.equal(historicalInputRows,2797',
    'tampered.topics.find',
  ])assert(source.includes(assertion),`Missing reviewed proof: ${assertion}`);
  assert(!/\btest\.(?:skip|todo|only)\s*\(/.test(source));
});

function verifyRendererTransform(bytes){
  const candidate=bytes.toString(),before=proposal.toString();
  assert.equal(sha(bytes),rendererPostimageSha);
  const block=(begin,end)=>{
    const start=candidate.indexOf(begin),finish=candidate.indexOf(end,start+begin.length);
    assert(start>=0&&finish>start,`Missing renderer block ${begin}`);
    assert.equal(candidate.indexOf(begin,start+1),-1,`Repeated renderer block ${begin}`);
    return candidate.slice(start,finish);
  };
  const renderer=block("  const rendererPath='content/body-renderer-revision.json';\n",'  for(const row of pins.entries){\n');
  const compared=block('    assert(context&&sourceContext,row.identity.id);\n','    assert.equal(context.revisions.imaging,null);\n');
  const stale=block('  const staleId=pins.entries[0].identity.id;\n','\n});\n')+'\n';
  assert.equal(sha(renderer),'1a9f78bd9e9d694fe6f113a7e5129e53c14eae2f5d51b1d17d721cbc9cb99366');
  assert.equal(sha(compared),'8c83451c57972ce6b15976e0ba70097bbe713dd70ca49e74116e423a5e8be18a');
  assert.equal(sha(stale),'cff161096c525944181df3ef7032e29b866de0ad617785db0483befb29885f56');
  const replaceOne=(text,old,value)=>{
    assert(text.includes(old),`Missing old block ${old.slice(0,50)}`);
    assert.equal(text.indexOf(old),text.lastIndexOf(old),`Repeated old block ${old.slice(0,50)}`);
    return text.replace(old,value);
  };
  const oldImport="  const built=await build({stdin:{contents:siteEntry,resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});\n";
  const addedImport="  const decisionEntry=siteEntry+\"export {postBodyDecision} from './atlas-review/lib/body-review-api';\";\n";
  let expected=replaceOne(before,oldImport,addedImport+oldImport.replace('contents:siteEntry','contents:decisionEntry'));
  const oldLoop='  for(const row of pins.entries){\n    const worksheet=await api.bodyReviewMaterial(row.identity.id);';
  const at=expected.lastIndexOf(oldLoop);
  assert(at>=0);
  expected=expected.slice(0,at)+renderer+expected.slice(at);
  expected=replaceOne(expected,'    same(context,sourceContext);\n',compared);
  const oldEnd='    assert.equal(context.revisions.imaging,null);\n  }\n});\n';
  expected=replaceOne(expected,oldEnd,'    assert.equal(context.revisions.imaging,null);\n  }\n'+stale+'});\n');
  assert.equal(candidate,expected,'Only reviewed renderer-bound current context/import blocks may change');
  assert.match(compared,/same\(importedShared,sourceShared/);
  assert.match(compared,/same\(importedOtherRevisions,sourceOtherRevisions/);
  assert.match(compared,/assert\.equal\(importedGeometry,geometryRevision/);
  assert.match(compared,/assert\.equal\(sourceGeometry,geometryRevision/);
  assert.match(stale,/assert\.equal\(staleResponse.status,409/);
}

test('current renderer frame is exactly reviewed and tampering is rejected',()=>{
  assert.equal(sha(proposal),reviewedPostimageSha);
  verifyRendererTransform(current);
  for(const [label,old,value] of [
    ['renderer','18b87b4b19f5d89b9716f02c7d5fe25a88f0b55ed8a4884d92968291811f245e','0'.repeat(64)],
    ['source','4ecf2aceca0aabe20989601e708c71169a551b5e82e17bb60540d080cb157439','1'.repeat(64)],
    ['assertion','assert.equal(importedGeometry,geometryRevision(context,importedHash));','assert.notEqual(importedGeometry,geometryRevision(context,importedHash));'],
  ]){
    const text=current.toString();assert(text.includes(old),label);
    assert.throws(()=>verifyRendererTransform(Buffer.from(text.replace(old,value))),label);
  }
});

test('historical archive contains exactly the closed documents, imported source and emitted code',()=>{
  assert.equal(sha(archiveBytes),archiveSha);
  const archive=JSON.parse(archiveBytes),records=new Map();
  assert.equal(archive.schema,'vm-hand-vessel-xray-589-delivery-archive-3');
  assert.equal(archive.source,'589263554141ba94548f9073327d4e51674bc33b');
  for(const row of archive.records){
    assert(!records.has(row.path),row.path);
    assert(!/\.(?:glb|dcm|nii|nii\.gz|jpe?g|webp)$/i.test(row.path),row.path);
    if(/\.png$/i.test(row.path))
      assert(['source-input-reconstruction/public/brand/visible-medicine-lockup-dark.png',
        'source-input-reconstruction/public/brand/visible-medicine-lockup-light.png'].includes(row.path),row.path);
    const bytes=gunzipSync(Buffer.from(row.gzipBase64,'base64'));
    assert.equal(sha(bytes),row.sha256,row.path);records.set(row.path,bytes);
  }
  const review=JSON.parse(records.get('atlas-review/manifest.json'));
  assert.equal(review.files.length,1511);
  const modules=['head-neck','shoulder','lower-limb','female-pelvis'];
  const code=modules.flatMap(region=>{
    const base=`public/atlas-runtime/${region}/`;
    const manifest=JSON.parse(records.get(base+'manifest.json'));
    assert.equal(manifest.sourceCommit,archive.source);
    return manifest.files.filter(row=>/\.(?:js|css|html)$/.test(row.path)).map(row=>{
      const path=base+row.path,bytes=records.get(path);assert(bytes,path);
      assert.equal(bytes.length,row.bytes,path);assert.equal(sha(bytes),row.sha256,path);
      return path;
    });
  });
  assert.equal(code.length,71);
  const inputs=archive.sourceInputReconstruction;
  assert.equal(inputs.length,1504);
  assert.equal(new Set(inputs.map(row=>row.path)).size,inputs.length);
  const currentDerived=inputs.filter(row=>row.kind==='current-clean-7b-checkout-manifest-hash-match; not observed 589 checkout');
  assert.equal(currentDerived.length,3);
  assert.deepEqual(currentDerived.map(row=>row.path).sort(),[
    'LICENSES/bodyparts3d-license-evidence.html','lib/didanix-atlas-adapter.ts','lib/imaging-sync.ts']);
  for(const row of currentDerived){
    assert.equal(row.recordPath,`source-input-reconstruction/${row.path}`);
    assert.equal(sha(records.get(row.recordPath)),row.declaredSha256,row.path);
  }
  assert.deepEqual([...records.keys()].sort(),[
    ...Object.keys(archive.documents),...review.files.map(row=>`atlas-review/${row.path}`),
    ...code,...inputs.flatMap(row=>row.recordPath?[row.recordPath]:[]),
    'tests/atlas-hand-vessel-xray.original.mjs',
  ].sort());
  for(const row of review.files){
    const bytes=records.get(`atlas-review/${row.path}`);assert(bytes,row.path);
    assert.equal(sha(bytes),row.importedSha256,row.path);
  }
  assert.deepEqual(records.get('tests/atlas-hand-vessel-xray.original.mjs'),original);
});
