// Immutable feature-era expectations. Never advance these with current delivery.
import assert from 'node:assert/strict';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';
export {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery};

export const historicalNonregionalAtlasSources = Object.freeze([
  {module:'shoulder',sourceCommit:'ed74d3e7c96501f21434f76e136c12a11493c020',manifestSha256:'f6986836e8088ad178bc4297997bd5cb91fdef2941c4cb4db496b3cf4ded350b',modelPaths:1},
  {module:'female-pelvis',sourceCommit:'a10496da94d9d054306bbc48e5ae9c98239d82b5',manifestSha256:'c481ea764e4d9ccb469d29507550cb8f72de966c3c9ef77acfa0b99b925e7815',modelPaths:2},
  {module:'lower-limb',sourceCommit:'a10496da94d9d054306bbc48e5ae9c98239d82b5',manifestSha256:'dea24b3bc4ddd50d81d89524c600883896383ce9c2a76f8fd39f3e8f0aba909d',modelPaths:5},
].map(source=>Object.freeze(source)));

// Only the closed shared delivery pin can admit the current source and manifests.
// The original module order and per-module model-path counts remain invariant.
export function currentNonregionalSources(){
  const pin=validateCurrentAtlasDelivery();
  return historicalNonregionalAtlasSources.map(({module,modelPaths})=>({
    module,sourceCommit:pin.source,
    manifestSha256:pin.documents[`public/atlas-runtime/${module}/manifest.json`],modelPaths,
  }));
}

export const currentNonregionalAtlasSources=Object.freeze(currentNonregionalSources().map(source=>Object.freeze(source)));

export function assertCurrentNonregionalSources(sources: unknown){
  assert.deepEqual(sources,currentNonregionalSources(),'Nonregional sources must match the exact current delivery and original model-path counts');
}

// Current source admission is independent of immutable website export replay.
export function assertCurrentAtlasInput(inputs: {path:string;sha256:string}[],path:string){
  assert.match(path,/^(?:app|content|lib)\/[A-Za-z0-9_./-]+$/);
  assert(!path.split('/').some(part=>!part||part==='.'||part==='..'),'Safe source path');
  const rows=inputs.filter(row=>row.path===path);
  assert.equal(rows.length,1,path+': exactly one current source input');
  const pin=validateCurrentAtlasDelivery(),atlas=currentAtlasDeliveryRoot();
  const digest=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const committed=(revision:string)=>execFileSync('git',['show',`${revision}:${path}`],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  assert.equal(rows[0].sha256,digest(committed(pin.source)),path+': exact current committed source');
  const website=fileURLToPath(new URL('../',import.meta.url));
  const review=JSON.parse(readFileSync(website+'atlas-review/manifest.json','utf8'));
  assert.equal(review.revision,pin.source);
  const imported=review.files.filter((row:{path:string})=>row.path===path);
  assert.equal(imported.length,1,path+': exactly one Review import');
  assert.equal(imported[0].sourceSha256,rows[0].sha256,path+': Review source binding');
  assert.equal(imported[0].importedSha256,digest(readFileSync(website+'atlas-review/'+path)),path+': Review bytes');
}

const historicalExports=Object.freeze({
  routed:Object.freeze({website:'f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6',source:'88cea927d48729769b96ad8fe680b0872b7e6687',manifest:'eaaf8eb1d53dc3728e07a5f3497a4a7c8018afdf0838f5b90a313282d77a2381',inputs:'5fdbdf5a788b90de0a8bbefcf0e68ce3e28bab14a2bf946d655ddb41089448c8'}),
  navigation:Object.freeze({website:'440bfade45f4a330665eea2539f3a7b7dff82e1b',source:'8b809ca6d8c70afc824acd41dbbf4d10df138fcd',manifest:'19c415a794ef852357d8b5f1be5951e2f553354b7e073b9e5bfea8313398498b',inputs:'92db5571257a462c5e17c2384df0ddd095f5b1f8d974eccf766b446dcd1c3cea'}),
});

// Each admitted epoch is an actual website export, not an arbitrary matching blob.
export function assertHistoricalAtlasInputs(expected: Record<string,string>,epoch:keyof typeof historicalExports='routed'){
  assert(Object.hasOwn(historicalExports,epoch),'Unadmitted historical export');
  assert(Object.keys(expected).length>0,'Historical source inputs are required');
  for(const [path,sha256] of Object.entries(expected)){
    assert.match(path,/^(?:app|content|lib)\/[A-Za-z0-9_./-]+$/);
    assert(!path.split('/').some(part=>!part||part==='.'||part==='..'),'Safe historical source path');
    assert.match(sha256,/^[a-f0-9]{64}$/);
  }
  const identity=historicalExports[epoch];
  const website=fileURLToPath(new URL('../',import.meta.url));
  const saved=(path:string)=>execFileSync('git',['show',`${identity.website}:${path}`],{cwd:website,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  const digest=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=saved('public/atlas-runtime/head-neck/manifest.json');
  assert.equal(digest(bytes),identity.manifest,'Exact historical export manifest');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,identity.source);
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false,flag);
  const inputBytes=saved('public/atlas-runtime/head-neck/source-inputs.json');
  assert.equal(digest(inputBytes),identity.inputs,'Exact historical export source-input document');
  const inputs=JSON.parse(inputBytes.toString()),atlas=checkedAtlasHistoryRepo(identity.source);
  for(const [path,sha256] of Object.entries(expected)){
    assert.deepEqual(inputs.filter((row:{path:string})=>row.path===path),[{path,sha256}],path+': immutable saved export input');
    const source=execFileSync('git',['show',`${identity.source}:${path}`],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
    assert.equal(digest(source),sha256,path+': exact committed historical source');
  }
}
