import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {emittedTeachingSearch} from './atlas-emitted-teaching.ts';

const root=fileURLToPath(new URL('../',import.meta.url));
const stage='F:/VisibleMedicine/staging/20261023-digital-vein-ultrasound';
const fullParent='F:/VisibleMedicine/staging/20261023-head-pan-bound/website';
const source='ed3c8cc0e99f6cf850a915d7a08de2e6489c1b6f';
const tree='0305c15be5fb58ea7729a3849bbbdb6e1e40649d';
const baseline='9e1407629bd6f85061537c9f013fd72e4543e0da';
const baseTree='9404fb39a8b08aff7ef5300d2ef963abd5639045';
const before='tests/fixtures/digital-vein-delivery-before/';
const sourcePaths=['app/body-content.ts','content/body-renderer-revision.json',
 'content/body-review-display-pins.json','content/digital-vein-ultrasound.ts',
 'content/regional-teaching/hand.json','docs/DIGITAL_VEIN_ULTRASOUND.md',
 'lib/digital-vein-ultrasound.ts','scripts/check-digital-vein-us-types.mjs',
 'scripts/test-digital-vein-ultrasound.mjs'];
const fmas=['FMA85096','FMA85097','FMA85098','FMA85099','FMA85100','FMA85101'];
const read=path=>readFileSync(resolve(root,path));
const json=path=>JSON.parse(read(path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(atlas,...args)=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:32e6,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const same=(a,b,label)=>assert.deepEqual(a,b,label);
const oldPath=path=>before+path+'.raw';
const preservedHashes={
 'scripts/import-clinical-review.mjs':'f19b8cafa9173a319348e946d7b4fc3ae1048a191d0393dc9006a9fe3ca5feb2',
 'tests/current-atlas-delivery.mjs':'52551fd5ec16154a78b94f78e0cdfbfee6a1bea629f70714f3dd5f93ccb81bb5',
 'lib/atlas-model-inventory.json':'27a2b7fbe983a2e6ca89bcc73ee8f0fde6b22135bce93bdb38749050df56c40e',
 'lib/atlas-delivery-policy.ts':'035636926739313558e4bef7111ca0c5412b525ed3bb3d4ec6b2b12f05662beb',
 'lib/lecture-body-catalog.json':'639eb6d54198c646b753e92208889ddcefb4303a483ad7ef77ad83065ad6c8f5',
};
let apiPromise;
function importedApi(){
 return apiPromise??=(async()=>{
  const {build}=createRequire(resolve(root,'package.json'))('esbuild');
  const entry=[
   "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
   "export {digitalVeinUltrasoundLesson} from './atlas-review/lib/digital-vein-ultrasound';",
   "export {digitalVeinUltrasoundTeaching} from './atlas-review/content/digital-vein-ultrasound';",
   "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
   "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
   "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  ].join('');
  const result=await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},bundle:true,
   write:false,platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].contents).toString('base64'));
 })();
}

test('current delivery has the exact nine-path source transition and no changed model or dependency',()=>{
 const pin=validateCurrentAtlasDelivery(),atlas=currentAtlasDeliveryRoot();
 assert.equal(CURRENT_ATLAS_REVISION,source);assert.equal(pin.source,source);
 assert.equal(pin.sourceTree,tree);assert.equal(git(atlas,'rev-parse','HEAD').toString().trim(),source);
 assert.equal(git(atlas,'rev-parse',`${source}^{tree}`).toString().trim(),tree);
 assert.equal(git(atlas,'rev-parse',`${baseline}^{tree}`).toString().trim(),baseTree);
 assert.equal(git(atlas,'rev-parse',`${source}^`).toString().trim(),baseline);
 same(git(atlas,'diff','--name-only',baseline,source).toString().trim().split(/\r?\n/),sourcePaths);
 const draft=jsonFromFile(stage+'/SOURCE_DRAFT.json');
 assert.equal(draft.head,source);assert.equal(draft.tree,tree);
 assert.equal(draft.base,baseline);assert.equal(draft.baseTree,baseTree);
 same(draft.sourceRows.map(row=>row.path),sourcePaths);
 for(const row of draft.sourceRows){const bytes=git(atlas,'show',`${source}:${row.path}`);
  assert.equal(bytes.length,row.bytes,row.path);assert.equal(sha(bytes),row.sha256,row.path);}
 const historical=path=>{const bytes=read(oldPath(path));
  assert.equal(sha(bytes),preservedHashes[path],`Fixed preimage: ${path}`);return bytes;};
 same(read('tests/current-atlas-delivery.mjs'),historical('tests/current-atlas-delivery.mjs'),
  'Whole validator and refusal contract unchanged');
 const importerBefore=historical('scripts/import-clinical-review.mjs').toString();
 const importerNow=read('scripts/import-clinical-review.mjs').toString();
 assert.equal(importerNow.split(source).length-1,1,'One source revision in importer');
 assert.equal(importerNow.replace(source,baseline),importerBefore,'Whole importer inverse');
 const oldInventory=JSON.parse(historical('lib/atlas-model-inventory.json'));
 const inventory=json('lib/atlas-model-inventory.json');
 same(inventory.models,oldInventory.models,'All registered model byte identities unchanged');
 assert.equal(inventory.models.length,137);
 assert.equal(inventory.models.flatMap(model=>model.paths).length,144);
 assert.equal(inventory.models.reduce((total,model)=>total+model.bytes,0),199072480);
 const expectedInventory=structuredClone(oldInventory);
 for(const module of ['shoulder','head-neck']){
  const row=expectedInventory.sources.find(item=>item.module===module);
  assert.equal(row.sourceCommit,baseline);row.sourceCommit=source;
  row.manifestSha256=sha(read(`public/atlas-runtime/${module}/manifest.json`));
 }
 same(inventory,expectedInventory,'Only two exact runtime manifest identities advance');
 const policyBefore=historical('lib/atlas-delivery-policy.ts').toString();
 const policyNow=read('lib/atlas-delivery-policy.ts').toString();
 const oldInventoryHash=sha(historical('lib/atlas-model-inventory.json'));
 const currentInventoryHash=sha(read('lib/atlas-model-inventory.json'));
 assert.equal(policyNow.split(currentInventoryHash).length-1,1,'One current private policy manifest revision');
 assert.equal(policyNow.replace(currentInventoryHash,oldInventoryHash),policyBefore,'Private audience unchanged');
 const oldLecture=JSON.parse(historical('lib/lecture-body-catalog.json'));
 const expectedLecture=structuredClone(oldLecture);
 assert.equal(expectedLecture.sourceCommit,baseline);expectedLecture.sourceCommit=source;
 same(json('lib/lecture-body-catalog.json'),expectedLecture,'Only lecture catalogue source role changes');
 const oldPin=JSON.parse(read(oldPath('tests/fixtures/current-atlas-delivery.json')));
 assert.equal(sha(read(oldPath('tests/fixtures/current-atlas-delivery.json'))),
  'e94dcf1c490f37b9cba6723fb9ef3a0ab0b872a2e3a18d29a6b1d37b8f24a9cf');
 assert.equal(oldPin.source,baseline);assert.equal(oldPin.sourceTree,baseTree);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:oldPin}),/Current delivery changed/);
 assert.equal(pin.viewerFiles,46);assert.equal(pin.viewerPackages,22);
 assert.equal(pin.runtimeSources['head-neck'],source);
 assert.equal(pin.runtimeSources.shoulder,source);
 assert.equal(pin.runtimeSources['lower-limb'],'190a63238eadcf906abe89dcbb6a67c88afe70b9');
 assert.equal(pin.runtimeSources['female-pelvis'],'190a63238eadcf906abe89dcbb6a67c88afe70b9');
 assert(!Object.hasOwn(pin,'clinicalApproval'));assert(!Object.hasOwn(pin,'userAuthorized'));
});

function jsonFromFile(path){return JSON.parse(readFileSync(path));}
test('six imported case-comparison lessons bind exact source identities and private Review packets',
 {timeout:180000},async()=>{
 const pin=validateCurrentAtlasDelivery(),atlas=currentAtlasDeliveryRoot(),api=await importedApi();
 const review=json('atlas-review/manifest.json'),inputs=json('atlas-review/integration-inputs.json');
 const catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
 const pins=json('atlas-review/content/hand-venous-imaging-pins.json');
 const selected=pins.entries.filter(row=>fmas.includes(row.identity.fmaId));
 assert.equal(selected.length,6);same(selected.map(row=>row.identity.fmaId).sort(),[...fmas].sort());
 const originalPins=git(atlas,'show',`${baseline}:content/hand-venous-imaging-pins.json`);
 same(read('atlas-review/content/hand-venous-imaging-pins.json'),originalPins);
 for(const path of ['app/body-content.ts','lib/digital-vein-ultrasound.ts',
  'content/digital-vein-ultrasound.ts','content/regional-teaching/hand.json']){
  const bytes=git(atlas,'show',`${source}:${path}`),row=review.files.find(file=>file.path===path);
  assert(row,`Review source ${path}`);
  assert.equal(row.sourceSha256,sha(bytes),path);
  assert.equal(row.importedSha256,sha(read('atlas-review/'+path)),path);
  assert.equal(row.importedSha256,row.sourceSha256,path);
  assert.equal(inputs.inputs.find(file=>file.path==='atlas-review/'+path)?.sha256,row.importedSha256,path);
 }
 const teaching=api.digitalVeinUltrasoundTeaching;
 same([...teaching.references],['https://pubmed.ncbi.nlm.nih.gov/23396654/',
  'https://www.siumb.it/files/journal/2008/6/Art4-06-08.pdf']);
 assert.match(teaching.body,/In one patient/);assert.match(teaching.body,/abnormal case, not a study of normal/);
 assert.match(teaching.bullets.join(' '),/does not identify the individual imaged finger veins/);
 assert.match(teaching.bullets.join(' '),/does not establish ultrasound visibility of the superficial or deep palmar venous arches/);
 assert.match(teaching.bullets.join(' '),/no ultrasound image, live compression, Doppler flow, patency assessment, diagnostic conclusion or acquired-image registration/);
 assert.match(teaching.note,/revision-bound radiologist review pending/);
 assert.match(teaching.note,/Atlas, imaging-case and paid-lecture access remain independent/);
 const snapshot=json('atlas-review/content/regional-teaching/hand.json');
 assert.equal(snapshot.region,'hand');same(snapshot.undefinedPaths,[]);
 const learnerBase='public/atlas-runtime/shoulder/',learner=json(learnerBase+'manifest.json');
 const parentManifestBytes=readFileSync(resolve(fullParent,learnerBase+'manifest.json'));
 assert.equal(sha(parentManifestBytes),'7d5d8fe4b9e297824a6de504fc2ed3e4c89b5d2450e7f8755df8928d2262e94c');
 const parentManifest=JSON.parse(parentManifestBytes);
 const retained=path=>/^(?:models\/|LICENSE(?:\/|$)|BUNDLED_NOTICES\.txt$|bundled-dependencies\.json$)/.test(path);
 const staticRows=manifest=>manifest.files.filter(row=>retained(row.path));
 same(staticRows(learner),staticRows(parentManifest),'Exact model, dependency and notice artifact records');
 for(const row of staticRows(learner))
  assert.equal(sha(read(learnerBase+row.path)),row.sha256,`Current protected artifact ${row.path}`);
 const learnerInputs=json(learnerBase+'source-inputs.json');
 assert.equal(learner.sourceCommit,source);assert.equal(learner.patientDataIncluded,false);
 for(const path of ['content/digital-vein-ultrasound.ts','lib/digital-vein-ultrasound.ts','content/regional-teaching/hand.json'])
  assert.equal(learnerInputs.find(row=>row.path===path)?.sha256,sha(read('atlas-review/'+path)),`Learner input ${path}`);
 const emitted=emittedTeachingSearch(resolve(root,learnerBase)+'/',learner.files);
 const visible=value=>emitted.includes(value)||emitted.includes(JSON.stringify(value).slice(1,-1));
 const titles=[];
 for(const {identity,group} of selected){
  assert.equal(group,'proper-digital-venous-detail');
  const display=catalog.structures.find(row=>row.id===identity.id);
  same(display,identity,`${identity.id}: unchanged full source identity`);
  assert.equal(identity.validation.status,'unvalidated');assert.equal(identity.validation.anatomicalReview,false);
  const lesson=api.digitalVeinUltrasoundLesson(display,'ultrasound');
  assert.equal(lesson.readiness,'draft');assert.match(lesson.title,/Ultrasound case comparison · draft$/);
  same(api.bodyLesson(display,'ultrasound'),lesson);
  same(api.bodyContent(display,'ultrasound'),((({readiness,...shown})=>shown)(lesson)));
  assert.equal(lesson.body,teaching.body);same(lesson.bullets,[...teaching.bullets]);
  same(lesson.citations,[...teaching.references]);assert.equal(lesson.note,teaching.note);
  titles.push(lesson.title);
  const row=snapshot.entries.filter(entry=>JSON.parse(entry.identity).id===identity.id);
  assert.equal(row.length,1);same(JSON.parse(row[0].identity),identity);
  same(row[0].lessons.ultrasound,lesson);
  assert.equal(api.digitalVeinUltrasoundLesson({...display,name:display.name+' changed'},'ultrasound'),undefined);
  assert.equal(api.digitalVeinUltrasoundLesson(display,'mri'),undefined);
  const packet=await api.bodyReviewMaterial(identity.id);
  assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');
  same(packet.topics.find(topic=>topic.tab==='ultrasound'),{tab:'ultrasound',...lesson});
  same(await api.parseBodyReviewResponse(packet,identity.id),packet);
  const forged=structuredClone(packet);forged.topics.find(topic=>topic.tab==='ultrasound').body+=' false';
  assert.equal(await api.parseBodyReviewResponse(forged,identity.id),null);
 }
 for(const value of [...titles,teaching.body,...teaching.bullets,...teaching.references,teaching.note])
  assert(visible(value),`Reachable learner teaching omitted ${value.slice(0,40)}`);
 const viewer=json('public/atlas-review-viewer/manifest.json');
 assert.equal(viewer.sourceCommit,source);assert.equal(viewer.mode,'production');
 assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(review.files.length,pin.reviewSourceFiles);
 assert.equal(viewer.websiteIntegrationSha256,pin.reviewIntegration);
});

test('complete original 41-case delivery contract survives only exact current admission seams',()=>{
 const original=read(oldPath('tests/current-atlas-delivery.test.mjs'));
 assert.equal(sha(original),'c5b6838122635cf1ea39521dd99d2b74bb31468e2a7bcc82c885c00ca4e26827');
 let inverse=read('tests/current-atlas-delivery.test.mjs').toString();
 const replace=(from,to,count=1)=>{assert.equal(inverse.split(from).length-1,count,`Exact admission seam ${from}`);
  inverse=inverse.split(from).join(to);};
 replace(source,baseline,3);
 replace(tree,baseTree,1);
 const pin=validateCurrentAtlasDelivery(),inputs=json('atlas-review/integration-inputs.json');
 assert.equal(pin.reviewSourceFiles,1569,'Only two new imported source files');
 assert.equal(inputs.inputs.length,1737,'Only two new Review integration inputs');
 replace('assert.equal(sourceFiles,1569);assert.equal(inputs,1737);assert(artifacts>100);',
  'assert.equal(sourceFiles,1567);assert.equal(inputs,1735);assert(artifacts>100);');
 assert.equal(inverse,original.toString(),'Every historical, hash, artifact, refusal and approval assertion survives');
});
