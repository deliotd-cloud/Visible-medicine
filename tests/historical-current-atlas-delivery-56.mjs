// Immutable website56 delivery, extracted from verified source-only backup 988e053.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {checkedHistoricalWebsiteRoot} from './historical-website-root.mjs';
import {validateCurrentAtlasDelivery as validateDeliveryShape,currentAtlasDeliveryRoot as frozenAtlasRoot} from './fixtures/closed56-validator/tests/current-atlas-delivery.mjs';
import {checkedAtlasHistoryRepo} from './fixtures/closed56-validator/tests/atlas-source-repo.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fixture=new URL('./fixtures/',import.meta.url);
const fixed=(path,digest)=>{
 const bytes=readFileSync(new URL(path,fixture));
 assert.equal(sha(bytes),digest,'Closed56 fixture changed: '+path);
 return bytes;
};
fixed('closed56-validator/tests/current-atlas-delivery.mjs','dfcce9763cba89e6d94f6e7e75ceb59f79ca73ac0d6056552bbe00139e804d62');
fixed('closed56-validator/tests/atlas-source-repo.mjs','45be52da6f2a93fdff2276235b357d6e491385af8a84ab8e0193905f6d49f356');
fixed('closed56-validator/tests/fixtures/current-atlas-delivery.json','3aedc6660613d5913d7e033dbe8f1395c147a58dda633089cc3f650652343e15');
export const revision56=JSON.parse(fixed('current-atlas-delivery-56.json','3aedc6660613d5913d7e033dbe8f1395c147a58dda633089cc3f650652343e15'));
export const oldWebsiteRoot=checkedHistoricalWebsiteRoot(56,revision56);
assert.equal(revision56.source,'46c43ed8cf121aa046ef5bbaf6c7e67c08ae50cd');
assert.equal(revision56.sourceTree,'83720d136f899876bd947323e6552c4d3e171210');
assert.equal(revision56.reviewIntegration,'b4db62ff56037c1ca251e32256afd470f6e155ca3f563d1d1db86b6ec9c6d916');
assert.equal(revision56.reviewSourceFiles,1531);
const documents=new Set(Object.keys(revision56.documents));
assert.equal(documents.size,12);
const inputs=JSON.parse(fixed('closed56-documents/atlas-review/integration-inputs.json',revision56.documents['atlas-review/integration-inputs.json']));
assert.equal(inputs.sourceCommit,revision56.source);
assert.equal(inputs.sha256,revision56.reviewIntegration);
assert.equal(sha(JSON.stringify(inputs.inputs)),revision56.reviewIntegration);
assert.equal(inputs.inputs.length,1661);
const oldInputs=new Map(inputs.inputs.map(row=>{
 assert(typeof row.path==='string'&&/^[A-Za-z0-9_./-]+$/.test(row.path)&&!row.path.split('/').some(part=>!part||part==='.'||part==='..'));
 assert.match(row.sha256,/^[a-f0-9]{64}$/);
 assert.notEqual(row.sha256,'0'.repeat(64));
 return [row.path,row.sha256];
}));
assert.equal(oldInputs.size,1661);
const review=JSON.parse(fixed('closed56-documents/atlas-review/manifest.json',revision56.documents['atlas-review/manifest.json']));
assert.equal(review.revision,revision56.source);
assert.equal(review.websiteIntegrationSha256,revision56.reviewIntegration);
assert.equal(review.files.length,1531);
const imported=new Map(review.files.map(row=>['atlas-review/'+row.path,row.importedSha256]));
assert.equal(imported.size,1531);
const viewer=JSON.parse(fixed('closed56-documents/public/atlas-review-viewer/manifest.json',revision56.documents['public/atlas-review-viewer/manifest.json']));
const emitted=new Map(viewer.files.map(row=>['public/atlas-review-viewer/'+row.path,row.sha256]));
assert.equal(emitted.size,46);
for(const name of ['head-neck','shoulder','lower-limb','female-pelvis']){
 const base='public/atlas-runtime/'+name+'/';
 const manifest=JSON.parse(fixed('closed56-documents/'+base+'manifest.json',revision56.documents[base+'manifest.json']));
 for(const row of manifest.files){assert(!emitted.has(base+row.path));emitted.set(base+row.path,row.sha256);}
}
const overrides=new Map([
 ['components/head-atlas.css','214fbad37e04a7ecd371c073ffb13c36cbcb5eccb208201a314bc6f0d0fdfb15'],
 ['atlas-review/content/body-renderer-revision.json','5b63f10e735a6b67df99cf3aeab732709c36d99c0026a2f792364e42f3e67d8a'],
 ['atlas-review/content/review-revisions.json','411a96d7f5513c5011068ad2c514ce323441b6ab0c1942474dcee2535c3fa760'],
 ['docs/completion-checklist.json','bea990316afd84427c500d32c01f3cb89e6ba3c5626ce19be803e5e9c014d920'],
]);
for(const [path,digest] of overrides)if(path!=='docs/completion-checklist.json')assert.equal(digest,oldInputs.get(path)??imported.get(path),path+' closed56 binding');
const historicalReads=new Map([
 ['tests/fixtures/current-atlas-delivery-55.json','f15fdf3f9959504ae83e08b777def63b8157dbf954d3721dae54cc9301186e23'],
 ['tests/fixtures/current-atlas-delivery-6ba0dd43.json','dc317ee27d8e297255d77b3ad418da6066d73fd5b066074c52b88ed5473bc92b'],
 ['tests/fixtures/current-atlas-delivery-bc925194.json','f50171ac10bcf767cc29eb34cae7e873ff526a3940b03a0a59fe6d932cf01eab'],
 ['tests/fixtures/current-atlas-delivery-bc925194.txt','c3ff732333006762cecc4899bae379cb42f56ae28f6fe1e100d331f3384502fc'],
]);

export function readRevision56(path,{readLive=p=>readFileSync(join(oldWebsiteRoot,p))}={}){
 assert(typeof path==='string'&&/^[A-Za-z0-9_./-]+$/.test(path)&&!path.split('/').some(part=>!part||part==='.'||part==='..'));
 if(documents.has(path))return fixed('closed56-documents/'+path,revision56.documents[path]);
 if(overrides.has(path))return fixed('closed56-overrides/'+path,overrides.get(path));
 if(path==='components/HeadAtlasViewer.tsx'){
  const bytes=fixed('closed56-inputs/components/HeadAtlasViewer.raw','06b4c293f5931f5cd0e36471de46718c6bbf26ea3500ec24c57c4de15e476841');
  assert.equal(sha(bytes),oldInputs.get(path),path+' closed56 binding');
  return bytes;
 }
 if(path.startsWith('public/atlas-review-viewer/')&&emitted.has(path))return fixed('closed56-viewer/'+path,emitted.get(path));
 const expected=oldInputs.get(path)??imported.get(path)??emitted.get(path)??historicalReads.get(path);
 assert(expected,'Closed56 path not bound: '+path);
 const bytes=readLive(path);
 assert(Buffer.isBuffer(bytes),'Closed56 reader must return raw bytes');
 assert.equal(sha(bytes),expected,'Closed56 input changed: '+path);
 return bytes;
}

export function validateCurrentAtlasDelivery({pin=revision56}={}){
 return validateDeliveryShape({pin,read:readRevision56});
}
export const CURRENT_ATLAS_REVISION=validateCurrentAtlasDelivery().source;
// Git-only replay of the exact historical commit. The archived delivery bytes
// above remain the authority for Review; this does not validate a live checkout.
export function historicalAtlasGitRoot(){
 validateCurrentAtlasDelivery();
 return checkedAtlasHistoryRepo(revision56.source);
}
export function currentAtlasDeliveryRoot(){
 validateCurrentAtlasDelivery();
 // This closed delivery still validates a real clean historical HEAD/tree.
 // Never pass the active current checkout off as the archived source.
 const previous=process.env.VM_ATLAS_SOURCE_REPO;
 try{
  process.env.VM_ATLAS_SOURCE_REPO=process.env.VM_CLOSED_ATLAS_46C_SOURCE??'F:/VisibleMedicine/staging/20261020-closed46c-atlas-source';
  return frozenAtlasRoot();
 }finally{
  if(previous===undefined)delete process.env.VM_ATLAS_SOURCE_REPO;
  else process.env.VM_ATLAS_SOURCE_REPO=previous;
 }
}
