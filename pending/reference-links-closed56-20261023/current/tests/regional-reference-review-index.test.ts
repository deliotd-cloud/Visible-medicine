import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';
import {parseRegionalReferenceReviewIndex} from '../lib/regional-reference-review-index-contract.ts';
import {loadCatalogueTestBundle} from './disk-catalogue-test-loader.mjs';
import {referenceCatalogueDeliveryRoles} from './reference-catalogue-delivery-role.mjs';

const catalogueSource=`export {buildRegionalMri3dCatalogue} from './lib/regional-mri-3d-catalogue'; export {buildRegionalReferenceReviewIndex} from './lib/regional-reference-review-index'; export {resolveRegionalLearningReview} from './lib/regional-mri-learning-review'; export {regionalLearningRevision} from './lib/regional-mri-learning'; export {default as review} from './atlas-review/manifest.json'; export {default as learner} from './public/atlas-runtime/head-neck/manifest.json'; export {default as limb} from './public/atlas-runtime/lower-limb/manifest.json';`;
const {buildRegionalMri3dCatalogue,buildRegionalReferenceReviewIndex,resolveRegionalLearningReview,regionalLearningRevision,review,learner,limb}=await loadCatalogueTestBundle(catalogueSource,process.cwd()) as any;
const copy=<T>(value:T):T=>structuredClone(value);
const fixture=async()=>{
 const catalogue=await buildRegionalMri3dCatalogue({revision:'a'.repeat(64),region:'knee'});
 assert(catalogue?.learning?.entries?.length);
 return catalogue;
};

test('four exact popliteal source topics changed from pending to draft without inferring historical index replay',async()=>{
 const source='9fba9a1e24b6669aafd48e945d55fc0939d50ab2',currentRevision='408759d57644b05402e98a937e7cf6338b5509cf',old='2fd700948dfa10ec6b5a03c4ed4c6ff9443c387e';
 const root=checkedAtlasHistoryRepo(source),path='content/regional-teaching/leg.json';
 const git=(...args:string[])=>execFileSync('git',['-C',root,...args],{windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 assert.equal(git('rev-parse',old+':'+path).toString().trim(),'a437b17f967a2d6c303d92315936509d7c29f972');
 assert.equal(git('rev-parse',source+':'+path).toString().trim(),'5479d48cc34fa501485674db76804525d4300eb6');
 const prior=JSON.parse(git('show',old+':'+path).toString()),currentBytes=git('show',source+':'+path);
 assert.deepEqual(git('show',currentRevision+':'+path),currentBytes,'Current import retains the exact completed source topics');
 assert.deepEqual(readFileSync('atlas-review/'+path),currentBytes);
 const current=JSON.parse(currentBytes.toString()),catalogue=await fixture();
 for(const side of ['left','right'])for(const vessel of ['artery','vein']){
  const id=`vm:anatomy:body:leg:${side}:vessel:${side}-popliteal-${vessel}`;
  const find=(data:any)=>data.entries.find((entry:any)=>JSON.parse(entry.identity).id===id);
  const previous=find(prior),now=find(current);assert(previous&&now,id);
  assert.equal(previous.identity,now.identity,id+' source geometry identity');
  assert.equal(previous.lessons.xray.readiness,'pending',id);
  assert.equal(now.lessons.xray.readiness,'draft',id);
  const entry=catalogue.learning.entries.find((entry:any)=>entry.target.id===id&&entry.target.relation==='same-structure');assert(entry,id);
  const topic=entry.topics.find((topic:any)=>topic.id==='xray');assert(topic,id);
  assert.equal(topic.body,now.lessons.xray.body,id);
  assert.deepEqual(topic.references,now.lessons.xray.citations.map((url:string)=>({url,title:url})),id);
 }
 // The original 35-row 276/4 assertion and its whole-epoch 247-case receipt
 // are retained in the source-only recovery documented in release checkpoints.
 // This check replays source topics only, not a mixed old/new website graph.
});

test('canonical catalogue yields all 35 exact public draft links and honest topic totals',async()=>{
 const catalogue=await fixture(),index=await buildRegionalReferenceReviewIndex(catalogue);assert(index);
 assert.equal(index.rows.length,35);assert.equal(index.approval,false);
 const deliveryRoles=referenceCatalogueDeliveryRoles({review,learner,limb});
 assert.equal(deliveryRoles.review.revision,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert.equal(deliveryRoles.learner.sourceCommit,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert.equal(deliveryRoles.limb.sourceCommit,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
 assert.equal(catalogue.atlasRevision,review.revision);
 for(const entry of catalogue.entries)for(const target of entry.targets){
  const expectedRuntime=target.kind==='body'?learner.sourceCommit:limb.sourceCommit;
  assert.equal(target.runtimeRevision,expectedRuntime,'target binds its exact runtime family');
  assert.equal(new URL(target.href,'https://visible-medicine.invalid').searchParams.get('atlasRevision'),expectedRuntime,'public target href binds its runtime, not the Review header');
 }
 const currentMapping=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({version:1,atlasRevision:catalogue.atlasRevision,entries:catalogue.entries})))).toString('hex');
 assert.equal(catalogue.mappingRevision,currentMapping,'current mapping must bind the exact current public links');
 const legacy190Atlas='190a63238eadcf906abe89dcbb6a67c88afe70b9';
 const replayLegacyEntries=(revision:string)=>{
  const entries=structuredClone(catalogue.entries);
  for(const entry of entries)for(const target of entry.targets){
   const href=new URL(target.href,'https://visible-medicine.invalid');
   assert.equal(href.searchParams.get('atlasRevision'),target.runtimeRevision);
   assert.equal(Object.prototype.hasOwnProperty.call(target,'runtimeRevision'),true,'current runtime field is explicit before legacy replay');
   delete target.runtimeRevision;
   href.searchParams.set('atlasRevision',revision);target.href=href.pathname+href.search;
  }
  return entries;
 };
 const legacy190Entries=replayLegacyEntries(legacy190Atlas);
 const legacy190Mapping=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({version:1,atlasRevision:legacy190Atlas,entries:legacy190Entries})))).toString('hex');
 assert.notEqual(legacy190Mapping,catalogue.mappingRevision,'old 190 public-link mapping remains distinct from current Review/runtime binding');
 const historical408Atlas='408759d57644b05402e98a937e7cf6338b5509cf';
 const historical408Entries=replayLegacyEntries(historical408Atlas);
 const historical408Mapping=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({version:1,atlasRevision:historical408Atlas,entries:historical408Entries})))).toString('hex');
 assert.equal(historical408Mapping,'e99b3f131ae2e7da2d5854127c0280253339c85fdff8d71dda0aef96436e96b4','old 408 exact public-link mapping');
 // The source content and mappings are retained; only revision-bound link
 // metadata advances. Replaying that metadata at9f must preserve the exact
 // preceding mapping and teaching digests, not merely accept new totals.
 const previousAtlas='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
 const previousEntries=replayLegacyEntries(previousAtlas);
 const previousMapping=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({version:1,atlasRevision:previousAtlas,entries:previousEntries})))).toString('hex');
 assert.equal(previousMapping,'4d22913d3ac58cb122033fcf1f62bf39cabdd95772b55b54269f6f0cda23090f');
 // Preserve the immediately preceding ac714 mapping/content proof as well as9f.
 const intermediateAtlas='ac71406105da66f77115117bbab2c38428f7e5c3';
 const intermediateEntries=replayLegacyEntries(intermediateAtlas);
 const intermediateMapping=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({version:1,atlasRevision:intermediateAtlas,entries:intermediateEntries})))).toString('hex');
 assert.equal(intermediateMapping,'a7581bf14139bcabdc60b8de70768907261a340ec104013b74d8d8e57a4c39a4');
 assert.deepEqual(Object.keys(index).sort(),['approval','atlasRevision','mappingRevision','rows','schema']);
 assert.equal(index.atlasRevision,catalogue.atlasRevision);assert.equal(index.mappingRevision,catalogue.mappingRevision);
 assert.deepEqual(index.rows.reduce((sum:any,row:any)=>({draft:sum.draft+row.draftTopics,pending:sum.pending+row.pendingTopics,identity:sum.identity+row.identityTopics}),{draft:0,pending:0,identity:0}),{draft:280,pending:0,identity:0});
 for(const [side,vessel,revision,intermediateRevision,currentRevision] of [
  ['left','artery','dc2520e613b19fed6f441ab82794fe8d3d8ff135b4271a93d47e9070a946a186','6782936bdcd76591742a703f050f18f4526bcb4af1a0e0da9b370dfa4cbcb684','a3f37792be262ffa37c239b80fbdc1556786e40c8f193ce037f1fa63d46f56ca'],
  ['right','artery','56ff19e00d1b3e876db011927779894cc1489732e01ddbff8814187038b7a100','2b18c9881496c63d9175220d318362f0f0e837d9558860f808e0da00c4ff3bfd','26a00efd306cc126f7b97817721fb3871ef498e7884926d38ef08d7bd6e7c98a'],
  ['left','vein','5c8b1cd1f8d3262c05a417b8c819ec038163424dbbc3111339cca5002213a7d0','3718971a0c8db20fd39cf9340014d82db49c10567612f4678cb45cb034ffa396','ae333fe7f0c07621fde745c78652cc6725489cb3a025472df2abc5300413f105'],
  ['right','vein','f9470629b15111125377c3ed6aee904de018f67752fdc60c23e03c98c92a5c72','41c087ef22acf3c14a9437948c02a10d8a19806976c52de67b0700bfe5e42aeb','8bb4c8a00ee6a888076aaaee69b375689f344a8014b1325a6289b146a7444ad2'],
 ] as const){
  const id=`vm:anatomy:body:leg:${side}:vessel:${side}-popliteal-${vessel}`;
  const row=index.rows.find((row:any)=>row.id===id&&row.relation==='same-structure');assert(row,id);
  const teaching=catalogue.learning.entries.find((entry:any)=>entry.target.id===id&&entry.target.relation==='same-structure');assert(teaching,id);
  assert.equal(row.teachingRevision,teaching.revision,id);
  const {revision:actualRevision,...content}=teaching;
  const legacyContent=copy(content);
  assert.equal(legacyContent.target.runtimeRevision,teaching.target.runtimeRevision,id+' current learning runtime bound');
  delete legacyContent.target.runtimeRevision;
  assert.equal(await regionalLearningRevision(previousAtlas,previousMapping,legacyContent),revision,id+' preceding exact content digest');
  assert.equal(await regionalLearningRevision(intermediateAtlas,intermediateMapping,legacyContent),intermediateRevision,id+' ac714 exact content digest');
  assert.equal(await regionalLearningRevision(historical408Atlas,historical408Mapping,legacyContent),currentRevision,id+' old 408 exact content digest');
  assert.equal(await regionalLearningRevision(catalogue.atlasRevision,catalogue.mappingRevision,content),actualRevision,id+' current exact content digest');
  assert.deepEqual([row.draftTopics,row.pendingTopics,row.identityTopics],[8,0,0],id);
  const snapshot=await resolveRegionalLearningReview(Object.fromEntries(new URL(row.href,'https://visible-medicine.invalid').searchParams),catalogue);assert(snapshot,id);
  const xray=snapshot.entry.topics.find((topic:any)=>topic.id==='xray');
  assert.equal(xray?.readiness,'draft',id);assert(xray.references.length>0,id);
 }
 assert.equal(index.rows.filter((row:any)=>row.kind==='body').length,26);
 assert.equal(index.rows.filter((row:any)=>row.kind==='specimen').length,9);
 const ordered=[...index.rows].sort((a:any,b:any)=>a.label.localeCompare(b.label)||a.kind.localeCompare(b.kind)||a.side.localeCompare(b.side)||a.relation.localeCompare(b.relation));
 assert.deepEqual(index.rows,ordered);
 for(const row of index.rows){
  const url=new URL(row.href,'https://visible-medicine.invalid');
  assert.equal(url.pathname,'/workspace/atlas-review/reference-learning');
  assert.deepEqual([...url.searchParams.keys()].sort(),['atlasRevision','mappingRevision','relation','target','teachingRevision']);
  const snapshot=await resolveRegionalLearningReview(Object.fromEntries(url.searchParams),catalogue);assert(snapshot,row.id);
  assert.equal(snapshot.entry.target.label,row.label);assert.equal(snapshot.entry.target.side,row.side);
  assert.equal(snapshot.entry.target.kind,row.kind);assert.equal(snapshot.entry.target.relation,row.relation);
  assert.equal(snapshot.entry.revision,row.teachingRevision);assert(Object.isFrozen(row));
 }
 assert(Object.isFrozen(index));assert(Object.isFrozen(index.rows));
 const text=JSON.stringify(index);
 for(const field of ['mriRevision','image','annotation','sourceSide','shape_kji','offset_kji','nodeName','topics','body','notes','status','checks','sourceHash','specimenRevision'])assert(!text.includes('"'+field+'":'),field);
 assert(!text.includes(catalogue.mriRevision));
});

test('invalid or stale packet invalidates the entire index rather than producing partial or substituted links',async()=>{
 const original=await fixture();
 const mutations:[string,(value:any)=>void][]=[
  ['Atlas header',c=>{c.atlasRevision='0'.repeat(40)}],
  ['mapping header',c=>{c.mappingRevision='0'.repeat(64)}],
  ['learning header',c=>{c.learning.atlasRevision='0'.repeat(40)}],
  ['last packet digest',c=>{c.learning.entries.at(-1).revision='0'.repeat(64)}],
  ['last packet content',c=>{c.learning.entries.at(-1).topics[0].body='Altered'}],
  ['identity',c=>{c.learning.entries.at(-1).target.label='Altered'}],
  ['public mapping',c=>{c.entries[0].targets[0].sourceHash='0'.repeat(64)}],
  ['duplicate packet',c=>{c.learning.entries.push(copy(c.learning.entries[0]))}],
  ['extra private field',c=>{c.privateScan='/private/data'}],
  ['missing target',c=>{const e=c.learning.entries.at(-1);for(const r of c.entries)r.targets=r.targets.filter((t:any)=>t.id!==e.target.id||t.relation!==e.target.relation)}],
 ];
 for(const [name,mutate]of mutations){const c=copy(original);mutate(c);assert.equal(await buildRegionalReferenceReviewIndex(c),null,name);}
 for(const c of [null,undefined,{}, {...original,learning:null},{...original,learning:{...original.learning,entries:[]}}, {...original,learning:{...original.learning,entries:Array(101).fill(original.learning.entries[0])}}])assert.equal(await buildRegionalReferenceReviewIndex(c),null);
 const huge=copy(original);huge.learning.entries[0].topics[0].body='x'.repeat(2000001);assert.equal(await buildRegionalReferenceReviewIndex(huge),null);
});

test('builder owns every packet before the first digest awaits and returns detached frozen metadata',async()=>{
 const catalogue=await fixture(),expected=await buildRegionalReferenceReviewIndex(catalogue);assert(expected);
 const pending=buildRegionalReferenceReviewIndex(catalogue);
 catalogue.learning.entries.at(-1).target.label='Changed while building';
 catalogue.learning.entries[0].topics[0].body='Changed while building';
 catalogue.entries[0].targets[0].sourceHash='0'.repeat(64);
 catalogue.atlasRevision='0'.repeat(40);
 assert.deepEqual(await pending,expected);
});

test('display contract rejects inconsistent, private, unsafe, duplicated or malformed row metadata and links',async()=>{
 const valid=await buildRegionalReferenceReviewIndex(await fixture());assert(valid);
 const mutations:[string,(value:any)=>void][]=[
  ['approval',v=>{v.approval=true}],['unknown root',v=>{v.notes='private'}],
  ['Atlas revision',v=>{v.atlasRevision='bad'}],['mapping revision',v=>{v.mappingRevision='bad'}],
  ['more than 100 rows',v=>{v.rows=Array(101).fill(v.rows[0])}],
  ['duplicate row',v=>{v.rows[1]=copy(v.rows[0])}],['unknown row',v=>{v.rows[0].annotation='private'}],
  ['key mismatch',v=>{v.rows[0].key='different'}],['ID mismatch',v=>{v.rows[0].id='different'}],
  ['label blank',v=>{v.rows[0].label=' '}],['label control',v=>{v.rows[0].label='bad\u0000'}],['label bound',v=>{v.rows[0].label='a'.repeat(601)}],
  ['kind',v=>{v.rows[0].kind='scan'}],['side',v=>{v.rows[0].side='both'}],['relation',v=>{v.rows[0].relation='registered'}],
  ['teaching revision',v=>{v.rows[0].teachingRevision='0'.repeat(64)}],
  ['topic sum',v=>{v.rows[0].pendingTopics++}],['negative',v=>{v.rows[0].draftTopics=-1}],['fraction',v=>{v.rows[0].draftTopics=.5}],
  ['external',v=>{v.rows[0].href='https://example.invalid/'}],['script',v=>{v.rows[0].href='javascript:alert(1)'}],['absolute same origin',v=>{v.rows[0].href='https://visible-medicine.invalid'+v.rows[0].href}],
  ['fragment',v=>{v.rows[0].href+='#private'}],['extra query',v=>{v.rows[0].href+='&annotation=private'}],['duplicate query',v=>{v.rows[0].href+='&target='+v.rows[0].id}],
  ['different row href',v=>{v.rows[0].href=v.rows[1].href}],['long href',v=>{v.rows[0].href+='a'.repeat(2001)}],
  ['missing query',v=>{const u=new URL(v.rows[0].href,'https://visible-medicine.invalid');u.searchParams.delete('relation');v.rows[0].href=u.pathname+u.search}],
  ['query revision mismatch',v=>{const u=new URL(v.rows[0].href,'https://visible-medicine.invalid');u.searchParams.set('atlasRevision','0'.repeat(40));v.rows[0].href=u.pathname+u.search}],
 ];
 for(const [name,mutate]of mutations){const v=copy(valid);mutate(v);assert.equal(parseRegionalReferenceReviewIndex(v),null,name);}
 for(const v of [null,undefined,[],{},'invalid'])assert.equal(parseRegionalReferenceReviewIndex(v),null);
 const oversized=copy(valid);oversized.rows[0].label='x'.repeat(100001);assert.equal(parseRegionalReferenceReviewIndex(oversized),null);
 const source=copy(valid),parsed=parseRegionalReferenceReviewIndex(source);assert(parsed);source.rows[0].label='Changed later';assert.notEqual(parsed.rows[0].label,source.rows[0].label);assert(Object.isFrozen(parsed.rows[0]));
 const empty=parseRegionalReferenceReviewIndex({...valid,rows:[]});assert(empty);assert.equal(empty.rows.length,0);
});
