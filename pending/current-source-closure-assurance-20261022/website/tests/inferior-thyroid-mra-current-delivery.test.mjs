import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import test from 'node:test';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {beforeNeckXrayBody,beforeNeckXraySnapshot} from './tongue-palate-neck-history.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const before='6036a7a59dcc1fd75eee4a23af34ca2a568d86b6';
const current='87ed7e343260c7df48a40d53503f25bbfd34cfa5';
const currentSource='2381efe43b75f8a7fb768a069eecd7268c508dac';
const preNeck='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
const sourcePath='content/arterial-evidence-limits.ts';
const read=path=>readFileSync(resolve(root,path));
const json=path=>JSON.parse(read(path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(atlas,...args)=>execFileSync('git',['-C',atlas,...args],{
 windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const equal=(left,right,label)=>assert.deepEqual(structuredClone(left),structuredClone(right),label);

let fixture;
async function setup(){
 if(fixture)return fixture;
 const pin=validateCurrentAtlasDelivery();
 assert.equal(CURRENT_ATLAS_REVISION,currentSource);
 assert.equal(pin.source,currentSource);
 assert.equal(pin.sourceTree,'db21ed3dee259c390878450b3495468996a3af85');
 const atlas=currentAtlasDeliveryRoot();
 assert.equal(git(atlas,'rev-parse',`${before}^{commit}`).toString().trim(),before);
 assert.equal(git(atlas,'merge-base',before,current).toString().trim(),before);
 assert.equal(git(atlas,'rev-parse',`${current}^{tree}`).toString().trim(),'bfcfa898ace1d25083f21b681274c5bc816564d7');
 assert.equal(git(atlas,'merge-base',current,currentSource).toString().trim(),current);
 assert.equal(git(atlas,'rev-parse',`${currentSource}^{tree}`).toString().trim(),pin.sourceTree);
 const {exactSourceHistoryApi}=await import(pathToFileURL(resolve(atlas,'scripts/exact-source-history-api.mjs')).href);
 const old=await exactSourceHistoryApi(before,'review-security');
 const now=await exactSourceHistoryApi(current,'review-security');
 const currentGit=await exactSourceHistoryApi(currentSource,'review-security');
 const requireSite=createRequire(resolve(root,'package.json'));
 const {build}=requireSite('esbuild');
 const entry=[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  "export {contentTabs} from './atlas-review/lib/content-types';",
  "export {arterialEvidenceLimitLesson} from './atlas-review/lib/arterial-evidence-limits';",
  "export {arterialEvidenceLimits} from './atlas-review/content/arterial-evidence-limits';",
  "export {structures} from './atlas-review/app/anatomy-data';",
  "export {dissectionProfiles} from './atlas-review/app/dissection-data';",
  "export {regionalTours} from './atlas-review/lib/regional-tours';",
 ].join('');
 const built=await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const imported=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
 // The fixed review-security history profile intentionally exports the resolver,
 // not this topic object. Compile that object independently from exact Git bytes;
 // do not expand the source helper or use the imported object as its own oracle.
 const committedTopics=await build({stdin:{contents:git(atlas,'show',`${current}:${sourcePath}`).toString(),loader:'ts'},
  bundle:false,write:false,format:'esm',platform:'node'});
 const sourceTopics=await import('data:text/javascript;base64,'+Buffer.from(committedTopics.outputFiles[0].text).toString('base64'));
 fixture={pin,atlas,old,now,currentGit,imported,sourceTopics};return fixture;
}

test('exact historical87 MRA source reaches current2381 Review with separate runtime identities and no widened clearance',async()=>{
 const {atlas,pin}=await setup();
 const review=json('atlas-review/manifest.json');
 assert.equal(review.revision,currentSource);
 assert.equal(review.files.length,pin.reviewSourceFiles);
 assert.deepEqual(pin.runtimeSources,{
  'head-neck':currentSource,
  shoulder:'190a63238eadcf906abe89dcbb6a67c88afe70b9',
  'lower-limb':'190a63238eadcf906abe89dcbb6a67c88afe70b9',
  'female-pelvis':'190a63238eadcf906abe89dcbb6a67c88afe70b9',
 });
 const committed=git(atlas,'show',`${current}:${sourcePath}`);
 assert.equal(sha(committed),'b746ada70e8f96906cb30289cd2649530f380f942f69b34fbf5e370282c21c24');
 assert.deepEqual(git(atlas,'show',`${currentSource}:${sourcePath}`),committed,
  'Historical MRA source is retained byte-exact in current Atlas');
 assert.deepEqual(read(`atlas-review/${sourcePath}`),committed);
 const row=review.files.find(file=>file.path===sourcePath);
 assert.ok(row);
 assert.equal(row.sourceSha256,sha(committed));
 assert.equal(row.importedSha256,sha(committed));
 for(const path of ['content/arterial-evidence-limits-pins.json',
  'lib/arterial-evidence-limits.ts','app/body-content.ts']){
  const currentBytes=git(atlas,'show',`${currentSource}:${path}`);
  const sourceRow=review.files.find(file=>file.path===path);
  assert.ok(sourceRow,`Current Review source ${path}`);
  assert.deepEqual(read(`atlas-review/${path}`),currentBytes,`Exact current import ${path}`);
  assert.equal(sourceRow.sourceSha256,sha(currentBytes),path);
  assert.equal(sourceRow.importedSha256,sha(currentBytes),path);
  if(path!=='app/body-content.ts')
   assert.deepEqual(currentBytes,git(atlas,'show',`${current}:${path}`),`Historical MRA source retained: ${path}`);
 }
 const neckBody=git(atlas,'show',`${currentSource}:app/body-content.ts`);
 const preNeckBody=git(atlas,'show',`${preNeck}:app/body-content.ts`);
 beforeNeckXrayBody(neckBody,preNeckBody);
 let currentBody=preNeckBody.toString();
 for(const added of [
  "import {dentalMriLesson} from '../lib/dental-mri';\n",
  "import { colicArteryUltrasoundLesson } from '../lib/colic-artery-ultrasound';\n",
  '  const dentalMri=dentalMriLesson(s,tab);\n  if(dentalMri)return dentalMri;\n',
  '  const colicUltrasound = colicArteryUltrasoundLesson(s, tab);\n  if (colicUltrasound) return colicUltrasound;\n',
 ]){
  assert.equal(currentBody.split(added).length,2,`One exact later authored branch: ${added}`);
  currentBody=currentBody.replace(added,'');
 }
 assert.deepEqual(Buffer.from(currentBody),git(atlas,'show',`${current}:app/body-content.ts`),
  'Entire current body lesson dispatcher reverses through neck, dental and colic epochs to historical87');
 const currentNeck=git(atlas,'show',`${currentSource}:content/regional-teaching/head-neck.json`);
 const preNeckSnapshot=git(atlas,'show',`${preNeck}:content/regional-teaching/head-neck.json`);
 beforeNeckXraySnapshot(currentNeck,preNeckSnapshot);
 const pinBytes=git(atlas,'show',`${current}:content/arterial-evidence-limits-pins.json`);
 assert.deepEqual(read('atlas-review/content/arterial-evidence-limits-pins.json'),pinBytes);
 assert.deepEqual(git(atlas,'show',`${currentSource}:content/arterial-evidence-limits-pins.json`),pinBytes);
 assert.deepEqual(pinBytes,git(atlas,'show',`${before}:content/arterial-evidence-limits-pins.json`));
 const selected=JSON.parse(pinBytes).entries.filter(row=>row.family==='inferiorThyroidMri');
 assert.deepEqual(selected.map(row=>[row.identity.laterality,row.identity.fmaId,row.tab]),
  [['left','FMA10680','mri'],['right','FMA10697','mri']]);
 for(const row of selected){
  assert.equal(row.identity.validation.status,'unvalidated');
  assert.equal(row.identity.validation.anatomicalReview,false);
 }
 for(const module of ['head-neck','shoulder','lower-limb','female-pelvis']){
  const manifest=json(`public/atlas-runtime/${module}/manifest.json`);
  assert.equal(manifest.sourceCommit,pin.runtimeSources[module]);
  assert.equal(manifest.patientDataIncluded,false);
  for(const field of ['clinicalApproved','standaloneReviewConnection','imagingConnection'])
   assert(manifest[field]===false||manifest[field]===undefined,`${module}:${field}`);
 }
 const viewer=json('public/atlas-review-viewer/manifest.json');
 assert.equal(viewer.sourceCommit,currentSource);
 assert.equal(viewer.mode,'production');
 assert.equal(viewer.personalRecordsIncluded,false);
});

test('only two pending MRI lessons change; 9934 source lessons, identity and geometry remain exact',async()=>{
 const {atlas,old,now,currentGit,imported,sourceTopics}=await setup();
 const raw=JSON.parse(git(atlas,'show',`${before}:public/models/bodyparts3d/full-body/catalog.json`));
 const currentRaw=JSON.parse(git(atlas,'show',`${current}:public/models/bodyparts3d/full-body/catalog.json`));
 equal(currentRaw,raw,'Catalog source bytes and geometry unchanged');
 const oldCatalog=old.bodyDisplayCatalog(raw),catalog=now.bodyDisplayCatalog(currentRaw);
 const liveRaw=JSON.parse(git(atlas,'show',`${currentSource}:public/models/bodyparts3d/full-body/catalog.json`));
 const liveCatalog=currentGit.bodyDisplayCatalog(liveRaw);
 equal(catalog,oldCatalog,'Identity and geometry unchanged');
 equal(liveCatalog,catalog,'Current identity and geometry remain the same');
 equal(imported.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json')),liveCatalog,
  'Current imported identity and geometry');
 // The later renal source guard changes one revision label, not tour content.
 // Restore that single authenticated field before the complete historical check.
 const renalId='renal-organs-arteries-orientation';
 const currentTours=structuredClone(currentGit.regionalTours);
 const renal=currentTours.filter(tour=>tour.id===renalId),oldRenal=now.regionalTours.filter(tour=>tour.id===renalId);
 assert.equal(renal.length,1);assert.equal(oldRenal.length,1);
 const renalPins=JSON.parse(git(atlas,'show',`${currentSource}:content/renal-tour-pins.json`));
 assert.equal(renalPins.tourRevision,'renal-organs-arteries-orientation-20261022-source-bound-draft');
 assert.equal(renal[0].revision,renalPins.tourRevision);
 assert.equal(oldRenal[0].revision,'renal-organs-arteries-orientation-v1');
 renal[0].revision=oldRenal[0].revision;
 const currentPreserved={...currentGit,regionalTours:currentTours};
 for(const key of ['structures','dissectionProfiles','regionalTours','contentTabs']){
  equal(now[key],old[key],`Unchanged source ${key}`);
  equal(currentPreserved[key],now[key],`Current ${key} unchanged since historical MRA introduction outside the exact renal revision field`);
  equal(imported[key],currentGit[key],`Current imported ${key}`);
 }
 assert.equal(catalog.structures.length,1104);
 assert.equal(now.contentTabs.length,9);
 const pins=json('atlas-review/content/arterial-evidence-limits-pins.json');
 const selected=pins.entries.filter(row=>row.family==='inferiorThyroidMri');
 assert.equal(selected.length,2);
 const selectedIds=new Set(selected.map(row=>row.identity.id));
 assert.equal(selectedIds.size,2);
 const topic=sourceTopics.arterialEvidenceLimits.inferiorThyroidMri;
 equal(imported.arterialEvidenceLimits.inferiorThyroidMri,topic,'Exact source lesson text');
 assert.match(topic.body,/selected cases do not establish routine visibility/);
 assert.match(topic.body,/right-sided course through thyroid tissue/);
 assert.match(topic.body,/left-sided aneurysms/);
 assert.match(topic.bullets.join(' '),/Neither report establishes normal-vessel detection rates/);
 assert.match(topic.note,/revision-bound radiologist sign-off remain pending/);
 let changed=0,preserved=0;
 for(const structure of catalog.structures)for(const tab of now.contentTabs){
  const previous=old.bodyLesson(structure,tab),next=now.bodyLesson(structure,tab);
  equal(imported.bodyLesson(structure,tab),currentGit.bodyLesson(structure,tab),
   `${structure.id}/${tab} current imported`);
  if(tab==='mri'&&selectedIds.has(structure.id)){
   assert.notDeepEqual(next,previous);
   assert.equal(next.readiness,'pending');
   equal(next,{...previous,title:`${structure.name} · ${topic.title} · evidence pending`,
    body:topic.body,bullets:[...topic.bullets],citations:[...topic.citations],note:topic.note},
    `${structure.id} exact pending MRA change`);
   changed++;
  }else{equal(next,previous,`${structure.id}/${tab} preserved`);preserved++;}
 }
 equal([changed,preserved],[2,9934],'Two source changes and 9934 preserved lessons');
 for(const row of selected){
  const structure=catalog.structures.find(item=>item.id===row.identity.id);
  equal(structure,row.identity,'Selected full identity');
  equal(currentGit.bodyLesson(structure,'mri'),now.bodyLesson(structure,'mri'),
   'Historical pending MRA lesson remains the exact current lesson');
  equal(imported.arterialEvidenceLimitLesson(structure,'mri'),currentGit.bodyLesson(structure,'mri'));
  assert.equal(imported.arterialEvidenceLimitLesson({...structure,foreign:true},'mri'),undefined);
  assert.equal(imported.arterialEvidenceLimitLesson(structure,'ct'),undefined);
 }
});
