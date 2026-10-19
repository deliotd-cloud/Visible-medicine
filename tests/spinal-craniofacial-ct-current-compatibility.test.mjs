// Separate from the unchanged 46c spinal theorem. This checks four real 2e CT introductions.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery}
 from './current-atlas-delivery.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

const before='46c43ed8cf121aa046ef5bbaf6c7e67c08ae50cd';
const introduced='2e67298f33a74ba4f45c868e10605ddd9b567af2';
const introducedTree='64776e3c967cbca29577b8db2bc01a129d31da3e';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=path=>JSON.parse(readFileSync(path));
const same=(a,b,label)=>assert.deepEqual(structuredClone(a),structuredClone(b),label);

test('four introduced craniofacial CT drafts retain exact source, Review and learner binding',async()=>{
 const delivery=validateCurrentAtlasDelivery(),atlas=currentAtlasDeliveryRoot();
 assert.equal(delivery.source,CURRENT_ATLAS_REVISION);
 const git=(...args)=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:32e6,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 assert.equal(git('rev-parse',introduced+'^{tree}').toString().trim(),introducedTree);
 assert.equal(git('rev-parse',introduced+'^').toString().trim(),before);
 assert.equal(git('merge-base',introduced,delivery.source).toString().trim(),introduced);
 const paths=['content/craniofacial-calcification-ct-pins.json',
  'content/craniofacial-calcification-ct.transition.json',
  'content/craniofacial-calcification-ct.ts','lib/craniofacial-calcification-ct.ts'];
 const review=json('atlas-review/manifest.json');
 assert.equal(review.revision,delivery.source);
 for(const path of paths){
  const first=git('show',introduced+':'+path),current=git('show',delivery.source+':'+path);
  same(current,first,path+': exact introduced Git source retained');
  if(path.endsWith('.transition.json'))continue;
  const record=review.files.find(row=>row.path===path);assert(record,path);
  assert.equal(record.sourceSha256,sha(first),path+': Review source');
  assert.equal(record.importedSha256,sha(first),path+': Review imported');
  assert.equal(sha(readFileSync('atlas-review/'+path)),sha(first),path+': Review bytes');
 }
 const pins=json('atlas-review/'+paths[0]),transition=JSON.parse(git('show',introduced+':'+paths[1]));
 assert.equal(pins.entries.length,4);
 assert.equal(transition.baseline,before);
 assert.equal(transition.pinsSha256,sha(git('show',introduced+':'+paths[0])));
 assert.equal(transition.changedPlacements,4);
 assert.equal(transition.preservedPlacements,9932);
 assert.equal(transition.geometryChanged,false);
 assert.equal(transition.clinicalApproval,false);
 same(transition.changes.map(row=>row.id),pins.entries.map(row=>row.identity.id),'Four exact pinned identities');
 const history=(await import(pathToFileURL(resolve(atlas,'scripts/exact-source-history-api.mjs')).href))
  .exactSourceHistoryApi;
 const old=await history(before,'review-security');
 const feature=await history(introduced,'review-security');
 const bundled=await build({stdin:{contents:[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
 ].join(''),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
 const catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
 const learnerBases=['public/atlas-runtime/head-neck/','public/atlas-runtime/shoulder/'];
 const emitted=learnerBases.concat('public/atlas-review-viewer/').map(base=>{
  const manifest=json(base+'manifest.json');
  assert.equal(manifest.sourceCommit,delivery.source,base);
  return emittedTeaching(base,manifest.files,true);
 });
 for(const change of transition.changes){
  assert.equal(change.tab,'ct');
  const pin=pins.entries.find(row=>row.identity.id===change.id);assert(pin,change.id);
  const structure=catalog.structures.find(row=>row.id===change.id);assert(structure,change.id);
  same(structure,pin.identity,change.id+': current source identity');
  const preimage=old.bodyLesson(structure,'ct'),atIntroduction=feature.bodyLesson(structure,'ct');
  const current=api.bodyLesson(structure,'ct');
  same(preimage,change.previous,change.id+': genuine pending predecessor');
  assert.equal(preimage.readiness,'pending');
  assert.equal(atIntroduction.readiness,'draft');
  same(current,atIntroduction,change.id+': current exact introduced draft');
  for(const text of [current.body,...current.bullets,...current.citations,current.note])
   for(const chunk of emitted)assert(chunk.includes(text)||chunk.includes(JSON.stringify(text).slice(1,-1)),
    change.id+': emitted exact teaching');
  const oldPacket=await old.bodyReviewMaterial(change.id);
  const featurePacket=await feature.bodyReviewMaterial(change.id);
  const packet=await api.bodyReviewMaterial(change.id);
  const topic=value=>value.topics.find(row=>row.tab==='ct');
  same(topic(oldPacket),{tab:'ct',...preimage},change.id+': old worksheet preimage');
  same(topic(featurePacket),{tab:'ct',...atIntroduction},change.id+': feature worksheet');
  same(topic(packet),topic(featurePacket),change.id+': current exact feature worksheet');
  assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  same(await api.parseBodyReviewResponse(packet,change.id),packet,change.id+': authentic worksheet');
  const altered=structuredClone(packet);
  topic(altered).body+=' altered';
  assert.equal(await api.parseBodyReviewResponse(altered,change.id),null,change.id+': tampered teaching refused');
 }
});
