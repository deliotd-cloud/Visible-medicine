import assert from 'node:assert/strict';
import test from 'node:test';
import {parseRegionalReferenceReviewIndex} from '../lib/regional-reference-review-index-contract.ts';
import {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {loadCatalogueTestBundle} from './disk-catalogue-test-loader.mjs';

const catalogueSource=`export {buildRegionalMri3dCatalogue} from './lib/regional-mri-3d-catalogue'; export {buildRegionalReferenceReviewIndex} from './lib/regional-reference-review-index'; export {resolveRegionalLearningReview} from './lib/regional-mri-learning-review'; export {regionalLearningRevision} from './lib/regional-mri-learning'; export {default as review} from './atlas-review/manifest.json'; export {default as learner} from './public/atlas-runtime/head-neck/manifest.json'; export {default as limb} from './public/atlas-runtime/lower-limb/manifest.json';`;
const {buildRegionalMri3dCatalogue,buildRegionalReferenceReviewIndex,resolveRegionalLearningReview,regionalLearningRevision,review,learner,limb}=await loadCatalogueTestBundle(catalogueSource,process.cwd()) as any;
const copy=<T>(value:T):T=>structuredClone(value);
const fixture=async()=>{
 const catalogue=await buildRegionalMri3dCatalogue({revision:'a'.repeat(64),region:'knee'});
 assert(catalogue?.learning?.entries?.length);
 return catalogue;
};
const digest=async(value:unknown)=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)))).toString('hex');

test('current catalogue exposes exactly 35 source-bound public reference rows with derived readiness and links',async()=>{
 const pin=validateCurrentAtlasDelivery();currentAtlasDeliveryRoot();
 // The strict validator binds the checked-in current pin to actual clean source and manifests.
 const catalogue=await fixture(),index=await buildRegionalReferenceReviewIndex(catalogue);assert(index);
 assert.equal(review.revision,pin.source);assert.equal(learner.sourceCommit,pin.runtimeSources['head-neck']);assert.equal(limb.sourceCommit,pin.runtimeSources['lower-limb']);
 assert.equal(catalogue.atlasRevision,review.revision);
 for(const entry of catalogue.entries)for(const target of entry.targets){
  const runtime=target.kind==='body'?learner.sourceCommit:limb.sourceCommit;
  assert.equal(target.runtimeRevision,runtime,'Exact current runtime family');
  assert.equal(new URL(target.href,'https://visible-medicine.invalid').searchParams.get('atlasRevision'),runtime,'Public target URL binds its runtime');
 }
 const mapping=await digest({version:1,atlasRevision:catalogue.atlasRevision,entries:catalogue.entries});
 assert.equal(catalogue.mappingRevision,mapping);
 assert.equal(catalogue.learning.atlasRevision,catalogue.atlasRevision);
 assert.equal(catalogue.learning.mappingRevision,mapping);
 assert.equal(index.schema,'vm-regional-reference-teaching-index-1');assert.equal(index.approval,false);
 assert.equal(index.atlasRevision,catalogue.atlasRevision);assert.equal(index.mappingRevision,mapping);
 assert.equal(index.rows.length,35);assert.equal(catalogue.learning.entries.length,35);
 assert.equal(index.rows.filter((row:any)=>row.kind==='body').length,26);
 assert.equal(index.rows.filter((row:any)=>row.kind==='specimen').length,9);
 const ordered=[...index.rows].sort((a:any,b:any)=>a.label.localeCompare(b.label)||a.kind.localeCompare(b.kind)||a.side.localeCompare(b.side)||a.relation.localeCompare(b.relation));
 assert.deepEqual(index.rows,ordered);
 const totals={draft:0,pending:0,identity:0},seen=new Set<string>();
 for(const row of index.rows){
  assert(!seen.has(row.key),'One public row per target and relation');seen.add(row.key);
  const matches=catalogue.learning.entries.filter((entry:any)=>entry.target.id===row.id&&entry.target.relation===row.relation);
  assert.equal(matches.length,1,row.id);const teaching=matches[0];
  assert.equal(row.key,JSON.stringify([row.id,row.relation]));
  for(const field of ['id','label','kind','side','relation'])assert.equal(row[field],teaching.target[field],field+': '+row.id);
  assert.equal(teaching.topics.length,8,row.id);
  const counts={draft:teaching.topics.filter((topic:any)=>topic.readiness==='draft').length,
   pending:teaching.topics.filter((topic:any)=>topic.readiness==='pending').length,
   identity:teaching.topics.filter((topic:any)=>topic.readiness==='identity-only').length};
  assert.deepEqual([row.draftTopics,row.pendingTopics,row.identityTopics],[counts.draft,counts.pending,counts.identity],row.id);
  totals.draft+=counts.draft;totals.pending+=counts.pending;totals.identity+=counts.identity;
  const {revision,...content}=teaching;
  assert.equal(await regionalLearningRevision(catalogue.atlasRevision,mapping,content),revision,row.id);
  assert.equal(row.teachingRevision,revision,row.id);
  const url=new URL(row.href,'https://visible-medicine.invalid');
  assert.equal(url.origin,'https://visible-medicine.invalid');assert.equal(url.pathname,'/workspace/atlas-review/reference-learning');assert.equal(url.hash,'');
  assert.deepEqual([...url.searchParams.keys()].sort(),['atlasRevision','mappingRevision','relation','target','teachingRevision']);
  assert.equal(url.searchParams.get('target'),row.id);assert.equal(url.searchParams.get('relation'),row.relation);
  assert.equal(url.searchParams.get('atlasRevision'),pin.source);assert.equal(url.searchParams.get('mappingRevision'),mapping);
  assert.equal(url.searchParams.get('teachingRevision'),revision);
  const snapshot=await resolveRegionalLearningReview(Object.fromEntries(url.searchParams),catalogue);assert(snapshot,row.id);
  assert.deepEqual(snapshot.entry,teaching,row.id);assert(Object.isFrozen(row));
 }
 assert.equal(seen.size,35);
 assert.deepEqual(index.rows.reduce((sum:any,row:any)=>({draft:sum.draft+row.draftTopics,pending:sum.pending+row.pendingTopics,identity:sum.identity+row.identityTopics}),{draft:0,pending:0,identity:0}),totals);
 assert.equal(totals.draft+totals.pending+totals.identity,35*8);
 assert(Object.isFrozen(index));assert(Object.isFrozen(index.rows));
 const publicText=JSON.stringify(index);
 for(const field of ['mriRevision','image','annotation','sourceSide','shape_kji','offset_kji','nodeName','topics','body','notes','status','checks','sourceHash','specimenRevision'])assert(!publicText.includes('"'+field+'":'),field);
 assert(!publicText.includes(catalogue.mriRevision));
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
