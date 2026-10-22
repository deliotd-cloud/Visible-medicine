import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {historicalInline46Read} from './historical-inline-46-epoch.mjs';
import {validateCurrentAtlasDelivery as validateStrictCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {validateHistoricalAtlasDelivery as validateCurrentAtlasDelivery} from './historical-atlas-delivery-register47.mjs';
import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const archivedRoot=path.resolve(process.env.VM_REGISTER47_WEBSITE_ROOT??'F:/VisibleMedicine/staging/20261017-posterior-fossa-website/candidate');
const read=relative=>{
 assert.match(relative,/^[A-Za-z0-9_./-]+$/);
 assert(!relative.split('/').some(part=>!part||part==='.'||part==='..'));
 return fs.readFileSync(path.join(archivedRoot,relative));
};
const json=relative=>JSON.parse(read(relative));
const oldJson=relative=>JSON.parse(historicalInline46Read(relative));
const plain=value=>JSON.parse(JSON.stringify(value));
const source='7b3e678ae4b8059aadb84459048ebd05f7abe7b9';
const tree='de883b9d6bccb3b4403256e42fabc7471e0ea8c9';
const review='245ca2015821a0715539428dbcf4e499d9807ab83a906e0ee3f03c042571bf37';
const oldReview='90b0ca07cf68301d77ac390abbc922c8eb898d5f2f690fd71f20f8c5ee118620';
const ids=['brainstem-midbrain','brainstem-pons','brainstem-medulla','brainstem-cerebellum'];
const keys=['posteriorFossaNeonatalUS2024','posteriorFossaBrainstemMorphometry','posteriorFossaUltrasoundMRI'];
assert.equal(sha(read('docs/completion-checklist.json')),'a3e61503ea5f3b16fe26eec2c738dc010256e5a65af06a9a269fbabbc3e256c2');
assert.equal(sha(read('tests/fixtures/current-atlas-delivery.json')),'1a9a62e5ec6998ccc0f68c083dcd50ef03c6f89bc8cc46a7036e6c3ba39466cf');
assert.equal(sha(read('atlas-review/integration-inputs.json')),'37ee961401e8d18bf6e595a7edf58acd49faeec8a47201fdc91747697b637104');

test('Register47 retains every original46 requirement and keeps its delivery separate',()=>{
 const old=oldJson('docs/completion-checklist.json'),now=json('docs/completion-checklist.json');
 const pin=json('tests/fixtures/current-atlas-delivery.json');
 assert.equal(sha(historicalInline46Read('tests/inline-recovery-register.test.mjs')),
  '12535c4d4c477fe886a0b68af89ba52234fc8420f1c6d8cc3523d0e318dff78e');
 assert.equal(old.revision,46);assert.equal(now.revision,47);
 assert.equal(now.items.length,71);assert.equal(now.items.filter(item=>item.scope==='optional').length,8);
 assert.deepEqual(now.items.map(item=>item.id),old.items.map(item=>item.id));
 for(const previous of old.items){
  const current=now.items.find(item=>item.id===previous.id);
  const {evidence:before,...protectedFields}=previous;
  const {evidence:after,...currentFields}=current;
  assert.deepEqual(currentFields,protectedFields,'Requirement status/scope/owner/acceptance changed: '+previous.id);
  for(const entry of before)assert(after.includes(entry),'Original evidence removed: '+previous.id+': '+entry);
 }
 assert.equal(now.baseline.atlasCommit,source);assert.equal(now.baseline.atlasTree,tree);
 assert.equal(now.baseline.reviewIntegration,review);assert.equal(now.baseline.reviewSourceFiles,1520);
 assert.equal(pin.source,source);assert.equal(pin.sourceTree,tree);
 assert.equal(pin.reviewIntegration,review);assert.equal(pin.reviewSourceFiles,1520);
 assert.equal(Object.keys(pin.documents).length,12);
 assert.deepEqual(validateCurrentAtlasDelivery({pin,read}),pin);
 const inputs=json('atlas-review/integration-inputs.json');
 assert.equal(inputs.sourceCommit,source);assert.equal(inputs.sha256,review);
 assert.equal(sha(JSON.stringify(inputs.inputs)),review);assert.equal(inputs.inputs.length,1649);
 assert.equal(new Set(inputs.inputs.map(row=>row.path)).size,1649);
 for(const row of inputs.inputs)assert.equal(sha(read(row.path)),row.sha256,'Current Review input: '+row.path);
 const manifest=json('atlas-review/manifest.json');
 assert.equal(manifest.revision,source);assert.equal(manifest.websiteIntegrationSha256,review);
 assert.equal(manifest.files.length,1520);
 for(const module of ['head-neck','shoulder','lower-limb','female-pelvis']){
  const emitted=json(`public/atlas-runtime/${module}/manifest.json`);
  assert.equal(emitted.sourceCommit,source,module);
  assert.equal(emitted.patientDataIncluded,false,module);
  assert.equal(emitted.clinicalApproved,false,module);
 }
 assert.throws(()=>validateCurrentAtlasDelivery({pin:oldJson('tests/fixtures/current-atlas-delivery.json')}));
 const shoulder='tests/atlas-shoulder-girdle-arterial-ultrasound-checks.mjs';
 const original=historicalInline46Read(shoulder).toString();
 assert.equal(original.split(oldReview).length,2,'Original shoulder helper has one old Review pin');
 assert.equal(read(shoulder).toString(),original.replace(oldReview,review),
  'Current shoulder history differs beyond the Review literal');
});

test('current schema-2 admission refuses the exact archived Register47 packet',()=>{
 const pin=json('tests/fixtures/current-atlas-delivery.json');
 assert.equal(pin.schema,'vm-current-atlas-test-delivery-1');
 assert.throws(()=>validateStrictCurrentAtlasDelivery({pin,read}),{
  code:'ERR_ASSERTION',actual:'vm-current-atlas-test-delivery-1',expected:'vm-current-atlas-test-delivery-2',
 });
});

async function nestedTeaching(historical){
 const entry=path.join(archivedRoot,'atlas-review/content/nested-teaching.ts');
 const plugins=historical?[{
  name:'closed-epoch46-review-source',setup(plugin){
   plugin.onLoad({filter:/\.(?:ts|tsx|json)$/},args=>{
    const relative=path.relative(archivedRoot,args.path).replaceAll('\\','/');
    if(!relative.startsWith('atlas-review/'))return undefined;
    return {contents:historicalInline46Read(relative),loader:path.extname(args.path).slice(1)};
   });
  },
 }]:[];
 const result=await build({entryPoints:[entry],bundle:true,write:false,platform:'node',format:'esm',plugins,logLevel:'silent'});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].contents).toString('base64'));
}

test('four scoped infant drafts reach imported Review and emitted head-neck viewer; 104 other selections retain exact inputs',async()=>{
 const sourceRoot=checkedAtlasHistoryRepo(source);
 for(const relative of ['content/nested-teaching.ts','content/posterior-fossa-ultrasound.ts']){
  const imported='atlas-review/'+relative;
  assert.deepEqual(read(imported),fs.readFileSync(path.join(sourceRoot,relative)),'Imported source mismatch: '+relative);
  const row=json('atlas-review/manifest.json').files.find(item=>item.path===relative);
  assert(row);assert.equal(sha(read(imported)),row.importedSha256,relative);
 }
 const current=await nestedTeaching(false),previous=await nestedTeaching(true);
 assert.equal(current.nestedConcepts.length,76);assert.equal(previous.nestedConcepts.length,76);
 assert.deepEqual(current.nestedConcepts.map(item=>item.id),previous.nestedConcepts.map(item=>item.id));
 assert.deepEqual(Object.keys(current.nestedTeachingReferences).filter(key=>!(key in previous.nestedTeachingReferences)),keys);
 for(const [key,value] of Object.entries(previous.nestedTeachingReferences))
  assert.deepEqual(plain(current.nestedTeachingReferences[key]),plain(value),'Prior reference changed: '+key);
 const emitted=json('public/atlas-runtime/head-neck/manifest.json');
 const oldEmitted=oldJson('public/atlas-runtime/head-neck/manifest.json');
 assert.deepEqual(emitted.nestedTargets,oldEmitted.nestedTargets,'Nested source targets/frames changed');
 assert.deepEqual(emitted.modelBundles,oldEmitted.modelBundles,'Model bundles or GLB digests changed');
 const brainstem=emitted.modelBundles.find(row=>row.url.startsWith('/models/bodyparts3d/brainstem/brainstem.glb'));
 assert(brainstem,'Protected brainstem GLB absent');
 const brainstemPath=brainstem.url.slice(1).split('?')[0];
 const brainstemFile=emitted.files.find(row=>row.path===brainstemPath);
 assert(brainstemFile);assert.equal(brainstemFile.sha256,brainstem.sha256);
 assert.equal(sha(read('public/atlas-runtime/head-neck/'+brainstemPath)),brainstem.sha256);
 assert.deepEqual(read('atlas-review/public/models/bodyparts3d/brainstem/catalog.json'),
  historicalInline46Read('atlas-review/public/models/bodyparts3d/brainstem/catalog.json'),
  'Protected brainstem catalog/frame changed');
 assert.deepEqual(read('atlas-review/content/nested-review-bindings.json'),
  historicalInline46Read('atlas-review/content/nested-review-bindings.json'),'Review source frame bindings changed');
 for(const relative of ['atlas-review/lib/nested-teaching.ts','atlas-review/lib/nested-review-material.ts'])
  assert.deepEqual(read(relative),historicalInline46Read(relative),'Review resolver changed: '+relative);
 const bindings=json('atlas-review/content/nested-review-bindings.json');
 const selections=bindings.groups.flatMap(group=>group.selections.map(row=>({study:group.study,id:row.id})));
 assert.equal(selections.length,108);
 const changedSelections=new Set([
  'vm:anatomy:body:head-neck:midline:organ:midbrain',
  'vm:anatomy:body:head-neck:midline:organ:pons',
  'vm:anatomy:body:head-neck:midline:organ:medulla-oblongata',
  'vm:anatomy:body:head-neck:midline:organ:cerebellum',
 ]);
 assert.equal(selections.filter(row=>row.study==='brainstem'&&changedSelections.has(row.id)).length,4);
 assert.equal(selections.filter(row=>!(row.study==='brainstem'&&changedSelections.has(row.id))).length,104);
 const assets=emitted.files.filter(row=>row.path.endsWith('.js'));
 const bodyAssets=assets.filter(row=>ids.every(id=>{
  const body=current.nestedConcepts.find(item=>item.id===id).imaging.ultrasound.body;
  return read('public/atlas-runtime/head-neck/'+row.path).includes(Buffer.from(body));
 }));
 assert.equal(bodyAssets.length,1,'Four draft bodies must reach one manifest-bound emitted asset');
 const asset=bodyAssets[0],assetBytes=read('public/atlas-runtime/head-neck/'+asset.path);
 assert.equal(sha(assetBytes),asset.sha256);
 assert(read('public/atlas-runtime/head-neck/index.html').includes(path.basename(asset.path)),
  'Viewer HTML does not load the teaching asset');
 for(const id of ids){
  const now=current.nestedConcepts.find(item=>item.id===id);
  const before=previous.nestedConcepts.find(item=>item.id===id);
  assert.equal(before.imaging?.ultrasound,undefined,id);
  assert.equal(now.imaging.ultrasound.readiness,'draft',id);
  assert.match(now.imaging.ultrasound.body,/neonatal|infant/i,id);
  assert.match(now.imaging.ultrasound.body,/adult/i,id);
  assert.match(now.imaging.ultrasound.body,/not|no |neither|does not/i,id);
  assert(now.imaging.ultrasound.references.every(key=>keys.includes(key)),id);
  const without=plain(now);delete without.imaging.ultrasound;
  assert.deepEqual(without,plain(before),'Other teaching changed: '+id);
  const structureByConcept={
   'brainstem-midbrain':'midbrain','brainstem-pons':'pons',
   'brainstem-medulla':'medulla-oblongata','brainstem-cerebellum':'cerebellum',
  };
  const target=emitted.nestedTargets.find(row=>row.study==='brainstem'&&row.structureId.endsWith(':'+structureByConcept[id]));
  assert(target,'Draft lacks an emitted brainstem target: '+id);
  for(const key of now.imaging.ultrasound.references){
   const reference=current.nestedTeachingReferences[key];
   assert.equal(reference.scopedToConcept,true,key);
   assert(assetBytes.includes(Buffer.from(reference.url)),'Emitted citation missing: '+key);
  }
 }
 let unchanged=0;
 for(const now of current.nestedConcepts){
  if(ids.includes(now.id))continue;
  assert.deepEqual(plain(now),plain(previous.nestedConcepts.find(item=>item.id===now.id)),
   'Unrelated nested teaching changed: '+now.id);
  unchanged++;
 }
 assert.equal(unchanged,72);
});
