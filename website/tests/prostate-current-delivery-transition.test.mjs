import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const website=process.env.VM_WEBSITE_ROOT;
const sourcePath=process.env.VM_CURRENT_SOURCE_RECEIPT;
const sourceSha256=process.env.VM_CURRENT_SOURCE_SHA256;
assert(website&&sourcePath&&/^[a-f0-9]{64}$/.test(sourceSha256??''),'Explicit installed website and sealed source digest required');
const contractPath='F:/VisibleMedicine/recovery/checkpoints/20261031-prostate-website/INSTALLATION_CONTRACT.json';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const bytes=p=>fs.readFileSync(p);
const json=p=>JSON.parse(bytes(p));
test('prostate installed Atlas delivery advances only current pins and retains prior source proof',()=>{
  const authenticate=(content,digest)=>{assert.equal(sha(content),digest,'Exact successor source digest');const parsed=JSON.parse(content);assert(Array.isArray(parsed.sourceRows));return parsed;};
  const receiptBytes=bytes(sourcePath);
  const receipt=authenticate(receiptBytes,sourceSha256),contract=json(contractPath);
  assert.equal(path.resolve(receipt.website),path.resolve(website));
  assert.equal(receipt.atlasHead,contract.source);assert.equal(receipt.review,contract.review);
  assert.throws(()=>authenticate(receiptBytes,'0'.repeat(64)),'Stale or forged source digest refused');
  assert.throws(()=>authenticate(Buffer.from('{invalid'),sha(Buffer.from('{invalid'))),'Malformed source refused');
  const predecessorBytes=bytes('F:/VisibleMedicine/recovery/checkpoints/20261031-prostate-website/SOURCE.json');
  assert.equal(sha(predecessorBytes),'69748f41a0cabd199180be76d6466dd1594921f381357cb4e61c6662b5edfc33');
  assert.equal(JSON.parse(predecessorBytes).sourceRows.length,7413,'Original installed source remains exact');
  const priorPath=path.join(here,'fixtures/prostate-preimage/current-atlas-delivery.json.raw');
  assert.equal(sha(bytes(priorPath)),'6bdc60742e68447e991ce7451525941106ce1c96e1f6d11acaf81432ff006d9e');
  const prior=json(priorPath),pin=json(path.join(here,'fixtures/current-atlas-delivery.json'));
  assert(receipt.sourceRows.length>=7413,'Successor retains or extends source rows');
  assert.equal(contract.source,pin.source);assert.equal(contract.tree,pin.sourceTree);
  assert.equal(contract.review,pin.reviewIntegration);
  assert.equal(pin.runtimeSources['head-neck'],pin.source);
  for(const name of ['shoulder','lower-limb','female-pelvis'])assert.equal(pin.runtimeSources[name],prior.runtimeSources[name]);
  assert.equal(pin.reviewSourceFiles,1655);assert.equal(pin.viewerFiles,58);assert.equal(pin.viewerPackages,24);
  assert.deepEqual(Object.keys(pin.documents).sort(),Object.keys(prior.documents).sort());
  for(const [relative,digest] of Object.entries(pin.documents)){
    const row=receipt.sourceRows.find(x=>x.path===relative);
    assert(row,relative);assert.equal(row.sha256,digest,relative);
    assert.equal(sha(bytes(path.join(website,relative))),digest,relative);
  }
  assert.notEqual(prior.documents['public/atlas-review-viewer/manifest.json'],pin.documents['public/atlas-review-viewer/manifest.json']);
  const review=json(path.join(website,'atlas-review/manifest.json'));
  const inputs=json(path.join(website,'atlas-review/integration-inputs.json'));
  const viewer=json(path.join(website,'public/atlas-review-viewer/manifest.json'));
  const inventory=json(path.join(website,'lib/atlas-model-inventory.json'));
  assert.equal(review.revision,pin.source);assert.equal(review.files.length,pin.reviewSourceFiles);
  assert.equal(review.websiteIntegrationSha256,pin.reviewIntegration);
  assert.equal(inputs.sourceCommit,pin.source);assert.equal(inputs.sha256,pin.reviewIntegration);
  assert.equal(sha(Buffer.from(JSON.stringify(inputs.inputs))),pin.reviewIntegration);
  assert.equal(viewer.sourceCommit,pin.source);assert.equal(viewer.websiteIntegrationSha256,pin.reviewIntegration);
  assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);
  assert.equal(viewer.files.length,pin.viewerFiles);assert.equal(viewer.packages.length,pin.viewerPackages);
  assert.equal(inventory.models.length,137);
  assert.equal(inventory.models.flatMap(x=>x.paths).length,144);
  assert.equal(inventory.models.reduce((n,x)=>n+x.bytes,0),199072480);
  for(const name of ['head-neck','shoulder','lower-limb','female-pelvis']){
    const base='public/atlas-runtime/'+name+'/';
    const manifest=json(path.join(website,base,'manifest.json'));
    assert.equal(manifest.sourceCommit,pin.runtimeSources[name]);
    assert.equal(manifest.patientDataIncluded,false);
    for(const key of ['clinicalApproved','standaloneReviewConnection','imagingConnection'])
      assert(manifest[key]===false||manifest[key]===undefined,key+':'+name);
    const entry=inventory.sources.find(x=>x.module===name);assert(entry);
    assert.equal(entry.sourceCommit,pin.runtimeSources[name]);
    assert.equal(entry.manifestSha256,pin.documents[base+'manifest.json']);
  }
});