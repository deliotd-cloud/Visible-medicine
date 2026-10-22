import assert from 'node:assert/strict';
import fs from 'node:fs';
import {join,dirname} from 'node:path';
import {createHash} from 'node:crypto';

const base='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
const website=base+'/website';
const sha=b=>createHash('sha256').update(b).digest('hex');
const receiptBytes=fs.readFileSync(base+'/PRODUCT_SOURCE_V6.json');
assert.equal(sha(receiptBytes),'44b20981b029abc59f4a5efcaa2c8e6a9fbddb7e2e00886c0db914646681169c');
const receipt=JSON.parse(receiptBytes);
const loaderPath='app/workspace/atlas-review/loading.tsx';
const loader=fs.readFileSync(website+'/'+loaderPath);
assert.equal(sha(loader),'ac2e48e14600448efcd5c259c39b386aab1fd672e6ea19c1d07a5c416b356415');
assert(receipt.sourceRows.some(row=>row.path===loaderPath&&row.sha256===sha(loader)),'The loading screen is intended candidate source, not an untracked test artifact');
const recorded=JSON.parse(fs.readFileSync(website+'/atlas-review/integration-inputs.json'));
assert.equal(recorded.sha256,'4db82d92f6de502a342396d290380253aff46ef754b23e6161672d40c9abce99');
let script=fs.readFileSync(website+'/scripts/bind-clinical-review.mjs','utf8');
for(const line of ["import { readFileSync, writeFileSync, readdirSync } from 'node:fs';","import { createHash } from 'node:crypto';"]){assert.equal(script.split(line).length,2);script=script.replace(line,'');}
const writes=new Map();
const read=path=>writes.has(path)?Buffer.from(writes.get(path)):fs.readFileSync(join(website,path));
new Function('readFileSync','writeFileSync','readdirSync','createHash','console',script)(read,
 (path,value)=>writes.set(path,value),(path,options)=>fs.readdirSync(join(website,path),options),createHash,{log(){}});
const allowed=['atlas-review/content/body-renderer-revision.json','atlas-review/content/review-revisions.json',
 'atlas-review/manifest.json','atlas-review/integration-inputs.json'];
assert.deepEqual([...writes.keys()].sort(),[...allowed].sort());
const next=JSON.parse(writes.get('atlas-review/integration-inputs.json'));
assert.equal(next.inputs.length,recorded.inputs.length+1);
assert.equal(recorded.inputs.length,1723);
assert.equal(next.sha256,'525f8fbe122bf6bdc15d8b89f572e49e3ac0ce09cd411b8009f67454d938a163');
const oldRows=new Map(recorded.inputs.map(row=>[row.path,row.sha256]));
assert.deepEqual(next.inputs.filter(row=>!oldRows.has(row.path)),[{path:loaderPath,sha256:sha(loader)}]);
for(const row of recorded.inputs)assert.equal(next.inputs.find(now=>now.path===row.path)?.sha256,row.sha256,row.path+': exact existing input remains');
const bodyOld=JSON.parse(fs.readFileSync(website+'/'+allowed[0])),bodyNew=JSON.parse(writes.get(allowed[0]));
assert.equal(bodyOld.sourceRendererSha256,bodyNew.sourceRendererSha256);
const shoulderOld=JSON.parse(fs.readFileSync(website+'/'+allowed[1])),shoulderNew=JSON.parse(writes.get(allowed[1]));
assert.deepEqual(shoulderOld.sourceRevisions,shoulderNew.sourceRevisions);
assert.equal(next.sourceCommit,recorded.sourceCommit);
const oldManifest=JSON.parse(fs.readFileSync(website+'/atlas-review/manifest.json'));
const newManifest=JSON.parse(writes.get('atlas-review/manifest.json'));
assert.equal(newManifest.revision,oldManifest.revision);
assert.deepEqual(newManifest.files.map(row=>row.path),oldManifest.files.map(row=>row.path));
const changedImports=newManifest.files.filter(row=>row.importedSha256!==oldManifest.files.find(old=>old.path===row.path).importedSha256).map(row=>row.path);
assert.deepEqual(changedImports,['content/body-renderer-revision.json','content/review-revisions.json']);
const stage='F:/VisibleMedicine/staging/20261022-review-loading-binding-repair';assert(!fs.existsSync(stage));fs.mkdirSync(stage);
const files=[];
for(const path of allowed){
 const before=fs.readFileSync(website+'/'+path),after=Buffer.from(writes.get(path));
 for(const[kind,bytes]of[['RAW',before],['CODE',after]]){const target=stage+'/'+kind+'/'+path;fs.mkdirSync(dirname(target),{recursive:true});fs.writeFileSync(target,bytes,{flag:'wx'});}
 files.push({path,beforeSha256:sha(before),afterSha256:sha(after),bytes:after.length});
}
const result={at:new Date().toISOString(),kind:'proposed source-binding repair from exact current binder; not a built or admitted candidate',
 sourceReceipt:base+'/PRODUCT_SOURCE_V6.json',sourceReceiptSha256:sha(receiptBytes),
 binderSha256:sha(fs.readFileSync(website+'/scripts/bind-clinical-review.mjs')),
 loader:{path:loaderPath,sha256:sha(loader)},priorReview:recorded.sha256,proposedReview:next.sha256,
 priorInputs:recorded.inputs.length,proposedInputs:next.inputs.length,changedExistingInputs:0,addedInputs:1,
 files,originalRendererAndShoulderSourceTracksUnchanged:true,currentPinChanged:false,viewerRebuilt:false,
 applied:false,buildOrNativeAcceptance:false,clinicalApproval:false,ownerPreviewChanged:false,
 requiredNext:['Wait for actual V6 native terminal; retain every diagnostic.','Create a separate exact successor candidate, not an overlay on live V6.',
  'Run real sequential source binder and production viewer/website build, preserve compatibility assets, regenerate exact strict current schema2 pin without loosening its validator.',
  'Retain the4db epoch as historical evidence and update only explicitly current-role consumer seams; preserve complete original proofs/refusals.',
  'Verify source holds, model/licence inventory, true producer idempotence, types and affected native/UI behavior. No normal preview restart/cutover until owner changes the hold.'],
 excludedFromHostedBackup:['Generated RAW/CODE metadata','private data','raw logs','scans/masks/models','canonical Git ancestry']};
fs.writeFileSync(stage+'/PROPOSED_BINDING.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,proposedReview:next.sha256,addedInput:loaderPath,existingInputsUnchanged:1723,
 rendererSourceTracksUnchanged:true,metadataOutputs:files.length,applied:false,ownerPreviewChanged:false,
 evidenceSha256:sha(fs.readFileSync(stage+'/PROPOSED_BINDING.json'))}));
