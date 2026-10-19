// Immutable website57 delivery from verified screened parent 446d3d75.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateCurrentAtlasDelivery as validateDeliveryShape,currentAtlasDeliveryRoot as frozenAtlasRoot} from './fixtures/closed56-validator/tests/current-atlas-delivery.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fixture=new URL('./fixtures/',import.meta.url);
const site=new URL('../',import.meta.url);
const liveRoot=process.env.VM_WEBSITE_ROOT??fileURLToPath(site);
const fixed=(path,digest)=>{
 const bytes=readFileSync(new URL(path,fixture));
 assert.equal(sha(bytes),digest,'Closed57 fixture changed: '+path);
 return bytes;
};
fixed('closed56-validator/tests/current-atlas-delivery.mjs','dfcce9763cba89e6d94f6e7e75ceb59f79ca73ac0d6056552bbe00139e804d62');
fixed('closed56-validator/tests/atlas-source-repo.mjs','45be52da6f2a93fdff2276235b357d6e491385af8a84ab8e0193905f6d49f356');
export const revision57=JSON.parse(fixed('current-atlas-delivery-57.json','f65de9d27cc04e2d09aa27429dc285c077bf27d15823c9533e7f0b2158efc91c'));
assert.equal(revision57.source,'46c43ed8cf121aa046ef5bbaf6c7e67c08ae50cd');
assert.equal(revision57.sourceTree,'83720d136f899876bd947323e6552c4d3e171210');
assert.equal(revision57.reviewIntegration,'024b9d3104ee4a93bc50b6430851ea9184c3a2f95da8c133d6e302006993a902');
assert.equal(revision57.reviewSourceFiles,1531);
const documents=new Set(Object.keys(revision57.documents));
assert.equal(documents.size,12);
const inputs=JSON.parse(fixed('closed57-documents/atlas-review/integration-inputs.json',revision57.documents['atlas-review/integration-inputs.json']));
assert.equal(inputs.sourceCommit,revision57.source);
assert.equal(inputs.sha256,revision57.reviewIntegration);
assert.equal(sha(JSON.stringify(inputs.inputs)),revision57.reviewIntegration);
assert.equal(inputs.inputs.length,1661);
const oldInputs=new Map(inputs.inputs.map(row=>{
 assert(typeof row.path==='string'&&/^[A-Za-z0-9_./-]+$/.test(row.path)&&!row.path.split('/').some(part=>!part||part==='.'||part==='..'));
 assert.match(row.sha256,/^[a-f0-9]{64}$/);
 assert.notEqual(row.sha256,'0'.repeat(64));
 return [row.path,row.sha256];
}));
assert.equal(oldInputs.size,1661);
const review=JSON.parse(fixed('closed57-documents/atlas-review/manifest.json',revision57.documents['atlas-review/manifest.json']));
assert.equal(review.revision,revision57.source);
assert.equal(review.websiteIntegrationSha256,revision57.reviewIntegration);
assert.equal(review.files.length,1531);
const imported=new Map(review.files.map(row=>['atlas-review/'+row.path,row.importedSha256]));
assert.equal(imported.size,1531);
const viewer=JSON.parse(fixed('closed57-documents/public/atlas-review-viewer/manifest.json',revision57.documents['public/atlas-review-viewer/manifest.json']));
const emitted=new Map(viewer.files.map(row=>['public/atlas-review-viewer/'+row.path,row.sha256]));
assert.equal(emitted.size,46);
for(const name of ['head-neck','shoulder','lower-limb','female-pelvis']){
 const base='public/atlas-runtime/'+name+'/';
 const manifest=JSON.parse(fixed('closed57-documents/'+base+'manifest.json',revision57.documents[base+'manifest.json']));
 for(const row of manifest.files){assert(!emitted.has(base+row.path));emitted.set(base+row.path,row.sha256);}
}
const overrides=new Map([
 ['components/head-atlas.css','3edd00db77c3259e85f08243fec6a2be8ac9eb40655782fd8464a6e1aa404a3a'],
 ['components/HeadAtlasViewer.tsx','06b4c293f5931f5cd0e36471de46718c6bbf26ea3500ec24c57c4de15e476841'],
 ['atlas-review/content/body-renderer-revision.json','8db700ecc6f3c8de6877516bd5e245e7a69a7ec136d54772fd32ccc4acc723c0'],
 ['atlas-review/content/review-revisions.json','bada2a6e74703795305079207ce2209fba63ba02aa88628db48fcb4c95bbd1f5'],
 ['docs/completion-checklist.json','f66c67382703de8a11114f4bd8fc678bade67c7e67dfffed0166828d812a72d2'],
]);
for(const [path,digest] of overrides)if(path!=='docs/completion-checklist.json')assert.equal(digest,oldInputs.get(path)??imported.get(path),path+' closed57 binding');
const historicalReads=new Map([
 ['tests/fixtures/current-atlas-delivery-55.json','f15fdf3f9959504ae83e08b777def63b8157dbf954d3721dae54cc9301186e23'],
 ['tests/fixtures/current-atlas-delivery-6ba0dd43.json','dc317ee27d8e297255d77b3ad418da6066d73fd5b066074c52b88ed5473bc92b'],
 ['tests/fixtures/current-atlas-delivery-bc925194.json','f50171ac10bcf767cc29eb34cae7e873ff526a3940b03a0a59fe6d932cf01eab'],
 ['tests/fixtures/current-atlas-delivery-bc925194.txt','c3ff732333006762cecc4899bae379cb42f56ae28f6fe1e100d331f3384502fc'],
 ['tests/fixtures/current-atlas-delivery-before-head-loading.txt','cc4d8e7c8f4dbdd3afac7cfb7c01af18773a5e45d806d0bcd7e880747a9959d8'],
]);

export function readRevision57(path,{readLive=p=>readFileSync(join(liveRoot,p))}={}){
 assert(typeof path==='string'&&/^[A-Za-z0-9_./-]+$/.test(path)&&!path.split('/').some(part=>!part||part==='.'||part==='..'));
 if(documents.has(path))return fixed('closed57-documents/'+path,revision57.documents[path]);
 if(overrides.has(path)){
  const name=path==='components/HeadAtlasViewer.tsx'?'components/HeadAtlasViewer.raw':path;
  return fixed('closed57-overrides/'+name,overrides.get(path));
 }
 if(path.startsWith('public/atlas-review-viewer/')&&emitted.has(path))return fixed('closed57-viewer/'+path,emitted.get(path));
 const expected=oldInputs.get(path)??imported.get(path)??emitted.get(path)??historicalReads.get(path);
 assert(expected,'Closed57 path not bound: '+path);
 const bytes=readLive(path);
 assert(Buffer.isBuffer(bytes),'Closed57 reader must return raw bytes');
 assert.equal(sha(bytes),expected,'Closed57 input changed: '+path);
 return bytes;
}

export function validateCurrentAtlasDelivery({pin=revision57}={}){
 return validateDeliveryShape({pin,read:readRevision57});
}
export const CURRENT_ATLAS_REVISION=validateCurrentAtlasDelivery().source;
export function currentAtlasDeliveryRoot(){
 validateCurrentAtlasDelivery();
 return frozenAtlasRoot();
}
