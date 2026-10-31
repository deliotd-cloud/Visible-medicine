// Stock-discovered wrapper for the complete sealed 2026-10-23 link-menu proof.
// The original four-case source remains byte-exact in its historical website.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve,relative,sep} from 'node:path';
import {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';

const stage='F:/VisibleMedicine/staging/20261023-linked-menus-website';
const website=stage+'/website';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sealed=(path,digest)=>{const stat=lstatSync(path);assert(stat.isFile()&&!stat.isSymbolicLink(),path);const bytes=readFileSync(path);assert.equal(sha(bytes),digest,path);return bytes;};
const prep=JSON.parse(sealed(stage+'/PREPARATION.json','bc6cc94232adbdf20ed1d832483aad149bf9690c2075579dcef322ef1ea1793c'));
const source=JSON.parse(sealed(stage+'/SOURCE_BOUND.json','d570f3deb2930a5b893f3892063a10292dc7899dafffa51c07f324ac35ff7bbb'));
assert.equal(resolve(prep.website),resolve(website));
assert.equal(resolve(source.website),resolve(website));
assert.equal(prep.atlasHead,'0327b6360e18b62563265d115df2b779c9397792');
assert.equal(source.atlasHead,prep.atlasHead);
assert.equal(source.atlasTree,prep.atlasTree);
assert.equal(resolve(prep.proposal),resolve('F:/VisibleMedicine/staging/20261023-head-link-menu-keyboard/PROPOSAL.json'));
assert.equal(resolve(prep.parentReceipt),resolve('F:/VisibleMedicine/staging/20261023-ventricular-website/SOURCE_BOUND.json'));
assert.equal(source.proposalSha256,prep.proposalSha256);
assert.equal(source.parentReceiptSha256,prep.parentReceiptSha256);
const proposal=JSON.parse(sealed(prep.proposal,prep.proposalSha256));
const parent=JSON.parse(sealed(prep.parentReceipt,prep.parentReceiptSha256));
assert.equal(resolve(parent.website),resolve(prep.parentWebsite));
assert(Array.isArray(proposal.changedPaths)&&Array.isArray(proposal.addedPaths));
const sourceRow=path=>{const rows=source.sourceRows.filter(row=>row.path===path);assert.equal(rows.length,1,path);return rows[0];};
const historicalFile=path=>{assert(!/[:\\]/.test(path)&&!path.split('/').some(part=>!part||part==='.'||part==='..'));const row=sourceRow(path);const bytes=sealed(website+'/'+path,row.sha256);assert.equal(bytes.length,row.bytes,path);return bytes;};
function verifyHistoricalInputs(){
 const seen=new Set();
 for(const row of source.sourceRows){assert(!seen.has(row.path));seen.add(row.path);historicalFile(row.path);}
 return seen.size;
}
const historicalTest='tests/head-link-menu-bound-delivery.test.mjs';
assert.equal(sha(historicalFile(historicalTest)),'a22f8171463005090647ae76cf3c512d62fe08d01e71a6353bb6dfa9e12eea94');
for(const path of ['tests/current-atlas-delivery.mjs','tests/fixtures/current-atlas-delivery.json',
  'scripts/bind-clinical-review.mjs','scripts/verify-clinical-review.mjs',
  'atlas-review/integration-inputs.json','atlas-review/manifest.json',
  'public/atlas-review-viewer/manifest.json','components/HeadAtlasLearningPicker.tsx',
  'components/HeadAtlasComparisonNavigation.tsx'])historicalFile(path);
for(const row of prep.preimages){
  const rel=relative(resolve(stage),resolve(row.preserved));
  assert(rel&&!rel.startsWith('..'+sep)&&rel!=='..'&&!rel.startsWith(sep),'Preimage escapes historical stage');
  sealed(row.preserved,row.sha256);
}

test('all four original link-menu cases pass in their authenticated historical website',()=>{
  const inputs=verifyHistoricalInputs();assert(inputs>100);
  const env={...process.env,VM_WEBSITE_ROOT:website,VM_PUBLIC_PREVIEW_SOURCE_ROOT:website,
    VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas,GIT_NO_REPLACE_OBJECTS:'1'};
  for(const key of ['NODE_TEST_CONTEXT','VM_CURRENT_SOURCE_RECEIPT','VM_CURRENT_SOURCE_SHA256'])delete env[key];
  const result=spawnSync(process.execPath,['--test','--test-reporter=tap',website+'/'+historicalTest],
    {cwd:website,encoding:'utf8',windowsHide:true,timeout:120_000,maxBuffer:4_000_000,env});
  if(result.error)throw result.error;
  assert.equal(result.signal,null);assert.equal(verifyHistoricalInputs(),inputs,'Historical inputs stay exact after replay');
  const output=result.stdout??'';
  assert.equal(result.status,0,`Historical link-menu proof failed: ${output.slice(-4000)}\n${(result.stderr??'').slice(-1000)}`);
  for(const [label,value] of [['tests',4],['pass',4],['fail',0],['cancelled',0],['skipped',0],['todo',0]]){
    const matches=[...output.matchAll(new RegExp(`^# ${label} (\\d+)\\r?$`,'gm'))];
    assert.equal(matches.length,1,`One historical ${label} count`);assert.equal(Number(matches[0][1]),value);
  }
  assert.equal((output.match(/^ok \d+ - /gm)??[]).length,4,'All four original cases ran');
});

test('current c32 delivery remains separate and refuses the historical link-menu pin',()=>{
  const pin=validateCurrentAtlasDelivery();
  assert.equal(pin.source,'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3');
  assert.equal(pin.sourceTree,'d7ead7f3673ddf5c4b68db755b559b08b921eec6');
  assert(currentAtlasDeliveryRoot());
  const oldPin=JSON.parse(historicalFile('tests/fixtures/current-atlas-delivery.json'));
  assert.equal(oldPin.source,prep.atlasHead);
  assert.throws(()=>validateCurrentAtlasDelivery({pin:oldPin}));
});
