// Proposed static composition theorem for main's freshly exported successor.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {assertPancreaticUsCurrentSource,assertPancreaticUsCurrentDisplay}
 from './pancreatic-us-current-source-role.mjs';
import {emittedTeachingSearch} from './atlas-emitted-teaching.ts';

const stage='F:/VisibleMedicine/staging/20261024-pancreatic-us-website';
const site=stage+'/website';
const parent='F:/VisibleMedicine/staging/20261024-review-pager-website/website';
const native='F:/VisibleMedicine/staging/20261024-pancreatic-venous-us-draft/atlas';
const oldNative='F:/VisibleMedicine/staging/20261024-toolbar-button-contrast/atlas';
const source='6e810b188dde401f6c19a970928f316a479696df';
const prior='b8ec59eeb0ec554b86d7ce01be992967e203b6a5';
const tree='90afe5163dbd9386aa37c93d525fa4c70e8c1b9e';
const oldTree='777e90bcf7448bf530ce381f401d71739b0019c5';
const read=(root,p)=>readFileSync(root+'/'+p);
const json=(root,p)=>JSON.parse(read(root,p));
const sha=b=>createHash('sha256').update(b).digest('hex');
const id='vm:anatomy:body:abdomen:unspecified:vessel:pancreaticoduodenal-vein';
const selected=e=>JSON.parse(e.identity).id===id;

test('captured source and original current-delivery validator bind all exports',()=>{
 assertPancreaticUsCurrentSource({atlasRoot:native,sourceCommit:source});
 const result=assertPancreaticUsCurrentDisplay({root:site});
 const capture=json(stage,'CAPTURE.json');
 assert.equal(result.integration,capture.binding);
 assert.equal(result.inputs,capture.inputs);assert.equal(result.sourceFiles,capture.sourceFiles);
 const stale=json(parent,'tests/fixtures/current-atlas-delivery.json');
 assert.equal(stale.source,prior);assert.notDeepEqual(stale,capture.pin);
});

test('the complete parent tour helper survives only one declared early role import and branch',()=>{
 const receipt=json('F:/VisibleMedicine/staging/20261024-review-pager-website','SOURCE_BOUND.json');
 const before=read(parent,'tests/adjacent-current-tour-source-role.mjs');
 assert.equal(sha(before),receipt.sourceRows.find(r=>r.path==='tests/adjacent-current-tour-source-role.mjs').sha256);
 const now=read(site,'tests/adjacent-current-tour-source-role.mjs').toString();
 const addedImport="import {assertPancreaticUsCurrentSource,assertPancreaticUsCurrentDisplay} from './pancreatic-us-current-source-role.mjs';\n";
 const branch=` if(sourceCommit==='${source}'){
  const pin=validateCurrentAtlasDelivery();assert.equal(pin.source,sourceCommit);
  assertPancreaticUsCurrentSource({atlasRoot,sourceCommit});
  assertPancreaticUsCurrentDisplay({root:site,manifest:JSON.parse(readFileSync(site+'/atlas-review/manifest.json')),binding:JSON.parse(readFileSync(site+'/atlas-review/integration-inputs.json'))});
  return {sha256:'b1a1bc9d9d80b84d4d98aed1aaa08aa4e9d7313e58bdd40f3b8a10ea0bab215d',gitBlob:'3c5647f29383ba5699b6d387ff528f6b0f8f57b9',oldSha256:'88f195fd9dbfcd4033a5012eeb760f358cca16da7f48cbca8671ef92c69bea97',oldGitBlob:'fb65a9c68d8753fc1789c7e6281e36c2889e0136'};
 }
`;
 assert.equal(now.split(addedImport).length,2);assert.equal(now.split(branch).length,2);
 assert.equal(now.replace(addedImport,'').replace(branch,''),before.toString());
});

test('every original current-delivery assertion survives only the declared source, tree and actual count seams',()=>{
 const receipt=json('F:/VisibleMedicine/staging/20261024-review-pager-website','SOURCE_BOUND.json');
 const before=read(parent,'tests/current-atlas-delivery.test.mjs');
 assert.equal(sha(before),receipt.sourceRows.find(r=>r.path==='tests/current-atlas-delivery.test.mjs').sha256);
 const capture=json(stage,'CAPTURE.json');
 let inverse=read(site,'tests/current-atlas-delivery.test.mjs').toString();
 inverse=inverse.replaceAll(source,prior).replace(tree,oldTree);
 const currentCount=`assert.equal(sourceFiles,${capture.sourceFiles});assert.equal(inputs,${capture.inputs});assert(artifacts>100);`;
 const oldCount='assert.equal(sourceFiles,1604);assert.equal(inputs,1807);assert(artifacts>100);';
 assert.equal(inverse.split(currentCount).length,2,'One exact fresh count assertion');
 inverse=inverse.replace(currentCount,oldCount);
 assert.equal(inverse,before.toString(),'All earlier historical delivery assertions survive');
});

test('one source-bound US lesson changes while sibling and all other abdomen lessons remain exact',()=>{
 const before=json(oldNative,'content/regional-teaching/abdomen.json');
 const after=json(native,'content/regional-teaching/abdomen.json');
 const imported=json(site,'atlas-review/content/regional-teaching/abdomen.json');
 assert.deepEqual(imported,after);
 assert.equal(before.entries.length,after.entries.length);
 const a=before.entries.filter(selected),b=after.entries.filter(selected);
 assert.equal(a.length,1);assert.equal(b.length,1);
 assert.deepEqual(b[0].identity,a[0].identity);
 assert.deepEqual(Object.keys(b[0].lessons),Object.keys(a[0].lessons));
 for(const [tab,lesson] of Object.entries(a[0].lessons))if(tab!=='ultrasound')
  assert.deepEqual(b[0].lessons[tab],lesson,tab);
 assert.equal(b[0].lessons.ultrasound.readiness,'draft');
 assert.deepEqual(b[0].lessons.ultrasound.citations,['https://pubmed.ncbi.nlm.nih.gov/8470571/']);
 assert.match(b[0].lessons.ultrasound.body,/selected because the pancreatic head was well seen/);
 assert.match(b[0].lessons.ultrasound.body,/does not give an unselected population detection rate/);
 assert.match(b[0].lessons.ultrasound.bullets.join(' '),/40% overall/);
 assert.match(b[0].lessons.ultrasound.note,/radiologist review pending/);
 const beforeRest=before.entries.filter(e=>!selected(e));
 const afterRest=after.entries.filter(e=>!selected(e));
 assert.deepEqual(afterRest,beforeRest,'All other abdomen teaching remains exact');
 const sourceIdentity=JSON.parse(b[0].identity);
 assert.equal(sourceIdentity.fmaId,'FMA15398');
 assert.equal(sourceIdentity.validation.status,'unvalidated');
 assert.equal(sourceIdentity.validation.anatomicalReview,false);
 assert.deepEqual(sourceIdentity.sources.map(s=>s.file),['FJ3545','FJ3646','FJ3655']);
});

test('the learner export carries the draft, while review queue, Studio, model and access source remain intact',()=>{
 const base=site+'/public/atlas-runtime/head-neck/';
 const manifest=json(base,'manifest.json');
 const search=emittedTeachingSearch(base,manifest.files);
 assert.equal(manifest.sourceCommit,source);
 assert(search.includes('50 consecutive subjects selected because the pancreatic head was well seen'));
 assert(search.includes('Doppler demonstrated venous flow in 40% overall'));
 const stable=['components/ClinicalReviewInbox.tsx','lib/clinical-review-inbox-contract.ts',
  'lib/clinical-review-fetch.ts','components/clinical-review-inbox.css',
  'lib/clinical-review-server.ts','lib/clinical-review-access.ts',
  'components/StudioNavigation.tsx','scripts/bind-clinical-review.mjs',
  'package-lock.json','lib/head-atlas-import.ts'];
 for(const path of stable)assert.deepEqual(read(site,path),read(parent,path),path);
 const previous=json(parent,'lib/atlas-model-inventory.json');
 const current=json(site,'lib/atlas-model-inventory.json');
 assert.deepEqual(current.models,previous.models);
 assert.equal(current.models.length,137);
 assert.deepEqual(current.sources.map(({sourceCommit,manifestSha256,...rest})=>rest),
  previous.sources.map(({sourceCommit,manifestSha256,...rest})=>rest));
});

test('the complete earlier Review-pager theorem retains every assertion through two authenticated import seams',()=>{
 const before=read(parent,'tests/review-pager-website-composition.test.mjs');
 assert.equal(sha(before),'35ba1237ac60dc89b1bc4812e66525f85a6879fb9e8671883308d12018755547');
 let now=read(site,'tests/review-pager-website-composition.test.mjs').toString();
 for(const[from,to]of [
  ["{assertReviewPagerCurrentDisplay,isReviewPagerUiRoot} from './pancreatic-us-review-pager-history.mjs'","{assertReviewPagerCurrentDisplay,isReviewPagerUiRoot} from './review-pager-ui-source-role.mjs'"],
  ["{assertCurrentTourSource} from './pancreatic-us-review-pager-history.mjs'","{assertCurrentTourSource} from './adjacent-current-tour-source-role.mjs'"],
 ]){assert.equal(now.split(from).length,2);now=now.replace(from,to);}
 assert.equal(now,before.toString());
});
