import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

test('cranial vault guide retains six exact source surfaces in learner and Review evidence',async()=>{
  const base='public/atlas-runtime/head-neck/';
  const learner=json(base+'manifest.json');
  const review=json('atlas-review/manifest.json');
  assert.match(learner.sourceCommit,/^[a-f0-9]{40}$/);
  assert.equal(review.revision,learner.sourceCommit);
  assert.equal(learner.patientDataIncluded,false);

  const inputs=json(base+'source-inputs.json');
  for(const path of ['lib/cranial-vault-tour.ts','content/cranial-vault-tour-pins.json','lib/regional-tours.ts']){
    const input=inputs.find((file:{path:string})=>file.path===path);
    const imported=review.files.find((file:{path:string})=>file.path===path);
    assert(input&&imported,path);
    assert.equal(imported.sourceSha256,input.sha256,path);
    assert.equal(sha(readFileSync('atlas-review/'+path)),input.sha256,path);
  }
  const pins=json('atlas-review/content/cranial-vault-tour-pins.json');
  assert.equal(sha(JSON.stringify(pins)),'2aa5a042cc29d1125e5419ac1eac4c9d43eda493bcc390e6a415dff6a09c2c64');
  assert.equal(pins.baseline,'4624f82b6c517767238da9c31daf5d8c7fbe7d8b');
  assert.equal(pins.tourRevision,'cranial-vault-tour-20261011-r1');
  assert.deepEqual(pins.entries.map((entry:{fmaId:string;id:string;bundle:string})=>[entry.fmaId,entry.id,entry.bundle]),[
    ['FMA52734','vm:anatomy:body:head-neck:midline:bone:frontal-bone','head-neck-skeleton'],
    ['FMA52788','vm:anatomy:body:head-neck:right:bone:right-parietal-bone','head-neck-skeleton'],
    ['FMA52738','vm:anatomy:body:head-neck:right:bone:right-temporal-bone','head-neck-skeleton'],
    ['FMA52735','vm:anatomy:body:head-neck:midline:bone:occipital-bone','head-neck-skeleton'],
    ['FMA52739','vm:anatomy:body:head-neck:left:bone:left-temporal-bone','head-neck-skeleton'],
    ['FMA52789','vm:anatomy:body:head-neck:left:bone:left-parietal-bone','head-neck-skeleton'],
  ]);
  assert.deepEqual(pins.contextEntries,[]);
  assert.deepEqual(pins.bundles.map((bundle:{id:string;sha256:string;bytes:number})=>
    [bundle.id,bundle.sha256,bundle.bytes]),[
    ['head-neck-skeleton','c1b950c82fd76e69cf153757ca275a6bd27fd25d74d3fd24259b15f9172a39d4',2355384],
  ]);
  assert(pins.entries.every((entry:{validation:{status:string;anatomicalReview:boolean}})=>
    entry.validation.status==='unvalidated'&&!entry.validation.anatomicalReview));

  const compiled=await build({stdin:{contents:"export {cranialVaultTour} from './atlas-review/lib/cranial-vault-tour';export {bodyReviewMaterial,bodyReviewSummaries} from './atlas-review/lib/body-review-material';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {contentTabs} from './atlas-review/lib/content-types';export {sourceCanonical} from './atlas-review/lib/body-source-additions';export {default as rawCatalog} from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  const catalog=api.bodyDisplayCatalog(api.rawCatalog);
  assert.equal(catalog.structures.length,1104);
  assert.equal(api.bodyReviewSummaries.length,1104);
  assert.equal(api.contentTabs.length,9);
  assert.equal(api.bodyReviewSummaries.length*api.contentTabs.length,9936);
  for(const entry of pins.entries){
    const found=catalog.structures.filter((structure:{id:string;fmaId:string})=>
      structure.id===entry.id||structure.fmaId===entry.fmaId);
    assert.deepEqual(found,[entry],entry.fmaId);
  }
  assert.deepEqual(catalog.bundles.filter((bundle:{id:string})=>bundle.id==='head-neck-skeleton'),pins.bundles);
  assert.deepEqual(catalog.coordinateSystem,pins.coordinateSystem);
  assert.equal(catalog.sourceVersion,pins.sourceVersion);
  assert.equal(catalog.license,pins.license);

  const tour=api.cranialVaultTour;
  const ids=pins.entries.map((entry:{id:string})=>entry.id);
  assert.equal(tour.id,'cranial-vault-orientation');
  assert.equal(tour.revision,pins.tourRevision);
  assert.equal(tour.status,'draft');
  assert.equal(tour.region,'head-neck');
  assert.deepEqual(tour.contextIds,[]);
  assert.equal(tour.steps.length,6);
  assert.deepEqual(tour.steps.map((step:{selectedId:string})=>step.selectedId),ids);
  assert.deepEqual(tour.steps.map((step:{view:string})=>step.view),
    ['anterior','right','right','posterior','left','left']);
  assert.deepEqual(tour.steps.map((step:{frameIds:string[]})=>step.frameIds),Array.from({length:6},()=>ids));
  assert.deepEqual(tour.requiredDisplayBundles,Object.fromEntries(ids.map((id:string)=>[id,'head-neck-skeleton'])));
  for(const term of [/exterior source surfaces/i,/skull base/i,/sutures/i,/foramina/i,/subparts/i,/patient spatial registration/i,/radiologist sign-off/i])
    assert.match(tour.limitations,term);
  const learnerJs=learner.files.filter((file:{path:string})=>file.path.endsWith('.js')).map((file:{path:string;sha256:string})=>{
    const bytes=readFileSync(base+file.path);
    assert.equal(sha(bytes),file.sha256,file.path);
    return new TextDecoder().decode(bytes);
  }).join('\n');
  for(const step of tour.steps){
    assert(learnerJs.includes(step.caption),step.id);
    assert.deepEqual(step.references,['https://openstax.org/books/anatomy-and-physiology-2e/pages/7-2-the-skull']);
    assert.equal(step.durationMs,14000);
    assert.equal(step.fadeOthers,true);
  }

  const bounds={min:[0,1,2].map(axis=>Math.min(...pins.entries.map((entry:{bounds:{min:number[]}})=>entry.bounds.min[axis]))),
    max:[0,1,2].map(axis=>Math.max(...pins.entries.map((entry:{bounds:{max:number[]}})=>entry.bounds.max[axis])))};
  for(const entry of pins.entries){
    const packet=wire(await api.bodyReviewMaterial(entry.id));
    assert(packet,entry.id);
    assert.equal(packet.approval,false);
    assert.equal(packet.status,'worksheet-not-submitted');
    assert.equal(packet.topics.length,9);
    assert.deepEqual(packet.source.structure,entry);
    assert.deepEqual(packet.source.bundle,pins.bundles[0]);
    const sourceScope={schema:'vm-body-review-worksheet-1',kind:packet.kind,structureId:entry.id};
    assert.equal(packet.fingerprints.source,sha(api.sourceCanonical({scope:sourceScope,source:packet.source})));
    const evidence=packet.guidedTours.filter((item:{tour:{id:string}})=>item.tour.id===tour.id);
    assert.equal(evidence.length,1,entry.id);
    assert.deepEqual(evidence[0].tour,wire(tour));
    assert.deepEqual(evidence[0].structures,pins.entries);
    assert.deepEqual(evidence[0].bundles,pins.bundles);
    assert.deepEqual(evidence[0].coordinateSystem,pins.coordinateSystem);
    assert.equal(evidence[0].sourceVersion,pins.sourceVersion);
    assert.deepEqual(evidence[0].frame,bounds);
    assert.deepEqual(evidence[0].stepFrames,Array.from({length:6},()=>bounds));
    assert.equal(evidence[0].transitionMs,1800);
    assert.equal(evidence[0].transition,'quintic-orbit');
    assert.equal(evidence[0].separation,0);
    assert.equal(evidence[0].patientRegistered,undefined);
    assert.deepEqual(await api.parseBodyReviewResponse(packet,entry.id),packet);
    for(const change of ['old-packet','caption','source','frame','revision','registration','forged-approval']){
      const altered=wire(packet);
      const guided=altered.guidedTours.find((item:{tour:{id:string}})=>item.tour.id===tour.id);
      if(change==='old-packet')altered.guidedTours.splice(altered.guidedTours.indexOf(guided),1);
      if(change==='caption')guided.tour.steps[0].caption='Altered';
      if(change==='source')guided.structures[0].sources[0].sha256='0'.repeat(64);
      if(change==='frame')guided.stepFrames[0].max[0]+=0.1;
      if(change==='revision')guided.tour.revision='foreign-revision';
      if(change==='registration')guided.patientRegistered=true;
      if(change==='forged-approval')altered.approval=true;
      assert.equal(await api.parseBodyReviewResponse(altered,entry.id),null,`${entry.id}: ${change}`);
    }
  }
});
