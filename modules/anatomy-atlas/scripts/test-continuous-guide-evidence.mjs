import assert from 'node:assert/strict';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {execFileSync} from 'node:child_process';
const baseline='840fcbf73e29a9c146a84ca8c232ca5c762c1672';
const built=await build({stdin:{contents:`export * from './lib/regional-tours';export * from './lib/guided-playback';export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';export * from './lib/body-review-api';export * from './lib/body-review-decisions';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const live=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64')),old=await exactSourceHistoryApi(baseline,'regional-tour-review');
const working=process.argv.length===3&&process.argv[2]==='--working-transition';assert(working||process.argv.length===2);
const git=args=>execFileSync('git',args,{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
let introduction,api;
if(working){assert.equal(git(['rev-parse','HEAD']),baseline);assert.equal(git(['ls-files','--others','--exclude-standard','--','lib/guided-playback.ts']),'lib/guided-playback.ts');api=live;}
else{introduction=git(['log','--diff-filter=A','--format=%H','--','lib/guided-playback.ts']).split(/\r?\n/).at(-1);assert.match(introduction,/^[a-f0-9]{40}$/);assert.equal(git(['rev-parse',introduction+'^']),baseline);git(['merge-base','--is-ancestor',introduction,'HEAD']);api=await exactSourceHistoryApi(introduction,'continuous-guided-epoch');}
assert.deepEqual(api.catalog,old.catalog);assert.deepEqual(api.regionalTours,old.regionalTours);assert.equal(api.regionalTours.length,51);
let changed=0,unchanged=0,topics=0,forged=0,stale=0,storageCalls=0;
const storage={prepare(){storageCalls++;throw Error('Refused continuous-tour request reached storage');}};
const request=value=>new Request('https://atlas.test/api/body-decisions',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_CONTINUOUS_TOUR'},body:JSON.stringify(value)});
for(const structure of api.catalog.structures){
 const a=await old.bodyReviewMaterial(structure.id),n=await api.bodyReviewMaterial(structure.id);
 assert.equal(n.approval,false);assert.deepEqual(n.source,a.source);assert.deepEqual(n.topics,a.topics);assert.deepEqual(n.reasoning,a.reasoning);assert.deepEqual(n.checklist,a.checklist);topics+=n.topics.length;
 const manual=n.guidedTours.map(({continuousPlayback,...rest})=>rest);assert.deepEqual(manual,a.guidedTours);
 assert.deepEqual(await api.parseBodyReviewResponse(n,structure.id),n);
 if(!n.guidedTours.length){assert.deepEqual(n,a);unchanged++;continue;}
 changed++;assert.notEqual(n.fingerprints.teaching,a.fingerprints.teaching);assert.notEqual(n.materialHash,a.materialHash);assert.equal(n.fingerprints.source,a.fingerprints.source);
 assert.equal(await api.parseBodyReviewResponse(a,structure.id),null);
 assert.equal(await old.parseBodyReviewResponse(n,structure.id),null,'Older review client must not hide new playback evidence');
 for(const e of n.guidedTours){
  assert.deepEqual(e.continuousPlayback,api.guidedPlaybackEvidence(e.tour.steps));
  assert.equal(e.transitionMs,1800);assert.equal(e.separation,0);
  for(const mutate of [x=>{delete x.continuousPlayback;},x=>{x.continuousPlayback.transitionMs=1;},x=>{x.continuousPlayback.stepDurationsMs[0]=1;},x=>{x.continuousPlayback.final='loop';}]){
   const bad=structuredClone(n);mutate(bad.guidedTours.find(x=>x.tour.id===e.tour.id));assert.equal(await api.parseBodyReviewResponse(bad,structure.id),null);forged++;
  }
 }
 const previous=await old.bodyReviewContext(structure.id),current=await api.bodyReviewContext(structure.id);
 const payload={catalogScope:current.catalogScope,structureId:structure.id,track:'teaching',expectedVersion:0,materialHash:previous.materialHash,revisionHash:previous.revisions.teaching,checklistVersion:current.checklistVersion,draft:api.blankBodyReview(current,'teaching')};
 assert.equal((await api.postBodyDecision(request(payload),storage)).status,409);stale++;
}
assert.deepEqual([changed,unchanged,topics],[314,790,9936]);assert.equal(storageCalls,0);
for(const structure of live.catalog.structures){const packet=await live.bodyReviewMaterial(structure.id);assert.deepEqual(await live.parseBodyReviewResponse(packet,structure.id),packet);for(const e of packet.guidedTours)assert.deepEqual(e.continuousPlayback,live.guidedPlaybackEvidence(e.tour.steps));}
console.log(JSON.stringify({verdict:'pass',baseline,introduction,working,tours:51,changedReviewPackets:changed,unchangedReviewPackets:unchanged,unchangedTopics:topics,forgedContinuousPacketsRefused:forged,staleSubmissionsRefusedBeforeStorage:stale,storageCalls,currentGuidePolicyBound:true,clinicalApproval:false,patientRegistration:false}));
