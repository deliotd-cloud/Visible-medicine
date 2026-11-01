import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
import {transformSync} from 'esbuild';

// The core GET handlers import an existing parameter-property TypeScript class.
// Compile only imported .ts modules so this focused test works under Node strip-types.
registerHooks({resolve(specifier,context,nextResolve){
 if(specifier==='server-only')return {url:'data:text/javascript,export%20%7B%7D',shortCircuit:true};
 try{return nextResolve(specifier,context);}catch(error){
  if(specifier.startsWith('.')&&!/\.[a-z]+$/i.test(specifier))return nextResolve(specifier+'.ts',context);
  throw error;
 }
},load(url,context,nextLoad){
 const result=nextLoad(url,context);
 return url.endsWith('.ts')?{...result,source:transformSync(String(result.source),{loader:'ts',format:'esm'}).code}:result;
}});
const {extraInboxCatalog,extraInboxStatuses}=await import('../lib/clinical-review-extra-inbox.ts');
const {HEAD_MANIFEST_SHA256}=await import('../lib/head-atlas-import.ts');
const {headTeachingDraftContext,blankHeadTeachingDraft}=await import('../lib/head-teaching-review-contract.ts');
const {plexusReviewTracks}=await import('../lib/plexus-review-contract.ts');
const {headLearningSequences}=await import('../lib/head-atlas-learning.ts');
const {headMriDraftContext,blankHeadMriDraft}=await import('../lib/head-mri-review-draft-contract.ts');
const {pairedDecisionContext,blankPairedDecision}=await import('../lib/head-paired-decision-contract.ts');
const {ctBoneDecisionContext,blankCtBoneDecision}=await import('../lib/head-ct-bone-decision-contract.ts');
const {ctBoneTeachingDecisionContext,blankCtBoneTeachingDecision}=await import('../lib/head-ct-bone-teaching-decision-contract.ts');
const {facialDecisionContext,blankFacialDecision}=await import('../lib/head-ct-facial-decision-contract.ts');
const {facialReviewGroupStatus}=await import('../lib/head-ct-facial-review-inbox.ts');
const {blankPlexusReview,validatePlexusReviewContext}=await import('../lib/plexus-review-decisions.ts');
const plexusManifest=(await import('../lib/plexus-review-manifest.json',{with:{type:'json'}})).default;
const opticManifest=(await import('../lib/optic-comparison-manifest.json',{with:{type:'json'}})).default;

const principalKey=JSON.stringify(['vm-website-personal-review-1','test-account','test-institution']);
const request=new Request('https://review.invalid/api/atlas-review/inbox?before=7&track=forged',{headers:{'oai-authenticated-user-id':principalKey}});
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const noRows=()=>({prepare(sql:string){assert.match(sql,/^\s*SELECT\b/i);return {bind(...args:unknown[]){assert(args.length>=5);return {all:async()=>({success:true,results:[]})};}};}});
const status=(items:Awaited<ReturnType<typeof extraInboxStatuses>>,key:string)=>items.find(item=>item.key===key)?.status;
const select=(catalog:Awaited<ReturnType<typeof extraInboxCatalog>>,key:string)=>{
 const item=catalog.find(item=>item.key===key);assert(item,key);return [item];
};
const one=async(catalog:Awaited<ReturnType<typeof extraInboxCatalog>>,key:string,db:unknown)=>status(await extraInboxStatuses(request,db as never,select(catalog,key)),key);

test('verified catalog covers independent head packets and held source scopes at real worksheet anchors',async()=>{
 const catalog=await extraInboxCatalog();
 assert.equal(new Set(catalog.map(item=>item.key)).size,catalog.length);
 const prostate=catalog.filter(item=>item.key==='schematic:prostate-zones:inspection');
 assert.equal(prostate.length,1);assert.equal(prostate[0].area,'structures');assert.equal(prostate[0].capability,'decision');
 assert.match(prostate[0].href,/^\/workspace\/atlas-review\/prostate\?revision=[a-f0-9]{64}$/);
 assert.equal(catalog.filter(item=>item.area!=='regional-learning'&&item.key!==prostate[0].key).length,58);
 assert.equal(catalog.length,64);assert.equal(catalog.filter(item=>item.area==='regional-learning').length,5);
 assert(catalog.every(item=>item.revision&&/^[a-f0-9]{64}$/.test(item.revision)));
 assert.equal(catalog.filter(item=>item.area==='head-learning').length,53);
 assert.equal(catalog.filter(item=>item.area==='source-comparisons').length,5);
 const foot=catalog.find(item=>item.key==='source:foot');assert(foot);
 assert.equal(foot.capability,'inspection-only');assert.equal(foot.href,'/workspace/atlas-review/source-comparisons/foot');
 assert.equal(foot.revision,JSON.parse(readFileSync('lib/foot-comparison-manifest.json','utf8')).revision);
 assert.equal(await one(catalog,'source:foot',{prepare(){throw Error('Inspection must not access decision storage');}}),'inspection-required');
 assert.deepEqual(catalog.filter(item=>item.key.startsWith('source:plexus')).map(item=>item.key),plexusReviewTracks.map(track=>`source:plexus-${track}`));
 assert.notEqual(catalog.find(item=>item.key==='source:plexus-topology')?.revision,catalog.find(item=>item.key==='source:plexus-presentation')?.revision);
 assert.notEqual(catalog.find(item=>item.key==='head:anatomy')?.revision,catalog.find(item=>item.key==='head:brainstem-clinical')?.revision);
 assert.notEqual(catalog.find(item=>item.key==='head:mri-comparison')?.revision,catalog.find(item=>item.key==='head:mri-learning')?.revision);
 assert.equal(catalog.filter(item=>item.key.startsWith('head:paired:')).length,7);
 assert.equal(catalog.filter(item=>item.key.startsWith('head:ct-bone:')).length,9);
 for(const concept of ['bone-left-zygomatic','bone-right-zygomatic','bone-mandible'])
  assert.equal(catalog.filter(item=>item.key===`head:ct-bone:${concept}`).length,1);
 assert.equal(catalog.filter(item=>item.key==='head:ct-facial-comparison').length,1);
 assert.equal(catalog.filter(item=>item.key==='head:ct-facial-learning').length,1);
 assert.equal(catalog.find(item=>item.key==='head:ct-facial-learning')?.capability,'inspection-only');
 assert.notEqual(catalog.find(item=>item.key==='head:ct-facial-learning')?.revision,catalog.find(item=>item.key==='head:ct-facial-comparison')?.revision);
 assert.notEqual(catalog.find(item=>item.key==='head:ct-facial-comparison')?.revision,catalog.find(item=>item.key==='head:ct-bone-comparison')?.revision);
 assert.equal(catalog.filter(item=>item.key.startsWith('head:ct-bone-teaching:')).length,6);
 assert.notEqual(catalog.find(item=>item.key==='head:ct-bone:bone-left-parietal')?.revision,catalog.find(item=>item.key==='head:ct-bone-teaching:bone-left-parietal')?.revision);
 const files=['components/HeadCtFacialComparisonReview.tsx','components/HeadAtlasTeachingReview.tsx','components/HeadMriComparisonReview.tsx','components/HeadInsulaComparisonReview.tsx','components/HeadOrbitalComparisonReview.tsx','components/HeadCtBoneComparisonReview.tsx','components/HeadImageOnlyComparisonReview.tsx','components/HeadMriAnatomyChecksReview.tsx','components/HeadAnatomyChecksReview.tsx','components/HeadTeachingReviewNotes.tsx','components/HeadMriReviewNotes.tsx',...['Cerebellar','DeepGrey','Lobar','Hippocampal','MriOnly'].map(name=>`components/Head${name}ClinicalReview.tsx`)];
 const source=[...files,'components/HeadCtFacialLearningReview.tsx','components/HeadCtFacialTeachingReview.tsx'].map(file=>readFileSync(file,'utf8')).join('\n');
 for(const item of catalog.filter(item=>item.area==='head-learning')){
  assert.match(item.href,/^\/workspace\/atlas-review\/head-learning#[a-z0-9-]+$/);
  const anchor=item.href.split('#')[1];
  const prefix=anchor.startsWith('head-ct-bone-comparison-')?'head-ct-bone-comparison-':anchor.replace(/(cortex-|orbit-|cerebellum-).*/,'');
  assert(source.includes(`id="${anchor}"`)||source.includes(`'${anchor}'`)||source.includes(`'${prefix}'`),anchor);
 }
 for(const item of catalog.filter(item=>item.area==='source-comparisons'))assert.match(item.href,/^\/workspace\/atlas-review\/source-comparisons\/(plexus|optic|disc|foot)$/);
 assert.equal(json('lib/optic-comparison-manifest.json').admissions,0);
 assert.equal(json('lib/disc-comparison-manifest.json').levelAssigned,false);
});

test('empty, failed, corrupt and stale private reads remain distinct and expose only summaries',async()=>{
 const catalog=await extraInboxCatalog(),selected=catalog.filter(item=>['head:anatomy','head:mri-only-learning','head:paired:cortex-left-insula','head:ct-bone:bone-left-parietal','head:ct-bone-teaching:bone-left-parietal','source:plexus-topology','source:optic'].includes(item.key));
 const empty=await extraInboxStatuses(request,noRows() as never,selected);
 assert.equal(status(empty,'head:anatomy'),'not-started');
 assert.equal(status(empty,'head:mri-only-learning'),'not-started');
 assert.equal(status(empty,'source:plexus-topology'),'not-started');
 assert.equal(status(empty,'head:paired:cortex-left-insula'),'not-started');
 assert.equal(status(empty,'head:ct-bone:bone-left-parietal'),'not-started');
 assert.equal(status(empty,'head:ct-bone-teaching:bone-left-parietal'),'not-started');
 assert.equal(status(empty,'source:optic'),'inspection-required');
 const failed=await extraInboxStatuses(request,{prepare(){return {bind(){return {all:async()=>({success:false,results:[]})};}};} } as never,selected);
 assert.equal(status(failed,'head:anatomy'),'unavailable');
 assert.equal(status(failed,'head:mri-only-learning'),'unavailable');
 assert.equal(status(failed,'source:plexus-topology'),'unavailable');
 assert.equal(status(failed,'head:paired:cortex-left-insula'),'unavailable');
 assert.equal(status(failed,'head:ct-bone:bone-left-parietal'),'unavailable');
 const context=await headTeachingDraftContext(HEAD_MANIFEST_SHA256);
 const saved={eventSchema:'vm-head-teaching-draft-event-1',context,version:1,savedAt:'2026-01-01T00:00:00.000Z',draft:{...blankHeadTeachingDraft(context),status:'changes-required',notes:'Correct this source wording.'}};
 const row=(payload:unknown)=>({user_id:JSON.stringify(['vm-head-teaching-personal-drafts-1',principalKey]),nested_key:JSON.stringify(['vm-head-teaching-drafts-1','ct-mri']),structure_id:'head-learning-anatomy',track:'teaching',version:1,payload:JSON.stringify(payload),saved_at:saved.savedAt});
 const synthetic=(result:unknown)=>({prepare(sql:string){assert.match(sql,/^\s*SELECT\b/i);return {bind(...args:unknown[]){assert.equal(args[1],JSON.stringify(['vm-head-teaching-drafts-1','ct-mri']));return {all:async()=>({success:true,results:[{...row(result),user_id:args[0]}]})};}};}});
 const anatomy=selected.filter(item=>item.key==='head:anatomy');
 const changed=await extraInboxStatuses(request,synthetic(saved) as never,anatomy);
 assert.equal(changed[0].status,'changes-required');
 const stale=await extraInboxStatuses(request,synthetic({...saved,context:{...context,packetRevision:'a'.repeat(64)}}) as never,anatomy);
 assert.equal(stale[0].status,'re-review');
 const corrupt=await extraInboxStatuses(request,synthetic({...saved,draft:{...saved.draft,status:'approved'}}) as never,anatomy);
 assert.equal(corrupt[0].status,'unavailable');
 const forged=await extraInboxStatuses(request,synthetic({...saved,context:{...context,packetId:'head-brainstem-clinical'}}) as never,anatomy);
 assert.equal(forged[0].status,'unavailable');
 assert(!JSON.stringify(changed).includes('Correct this source wording.'));
 assert(!JSON.stringify(changed).includes(principalKey));
 assert.deepEqual(Object.keys(changed[0]).sort(),['area','capability','href','key','revision','scopeLabel','status','title','trackLabel'].sort());
});

test('private GET families strip caller queries and retain exact server-bound account and institution namespaces',async()=>{
 const catalog=await extraInboxCatalog();
 const headKinds=[
  ['anatomy','vm-head-teaching-personal-drafts-1','vm-head-teaching-drafts-1','ct-mri','head-learning-anatomy'],
  ['brainstem-clinical','vm-head-brainstem-clinical-personal-drafts-1','vm-head-brainstem-clinical-drafts-1','ct-mri','head-brainstem-clinical'],
  ['ventricular-clinical','vm-head-ventricular-clinical-personal-drafts-1','vm-head-ventricular-clinical-drafts-1','ct-mri','head-ventricular-clinical'],
  ['cerebellar-clinical','vm-head-cerebellar-clinical-personal-drafts-1','vm-head-cerebellar-clinical-drafts-1','ct-mri','head-cerebellar-clinical'],
  ['deep-grey-clinical','vm-head-deep-grey-clinical-personal-drafts-1','vm-head-deep-grey-clinical-drafts-1','ct-mri','head-deep-grey-clinical'],
  ['lobar-clinical','vm-head-lobar-clinical-personal-drafts-1','vm-head-lobar-clinical-drafts-1','ct-mri','head-lobar-clinical'],
  ['hippocampal-clinical','vm-head-hippocampal-clinical-personal-drafts-1','vm-head-hippocampal-clinical-drafts-1','ct-mri','head-hippocampal-clinical'],
  ['mri-only-clinical','vm-head-mri-only-clinical-personal-drafts-1','vm-head-mri-only-clinical-drafts-1','mri-reference3d','head-mri-only-clinical'],
  ['mri-anatomy-checks','vm-head-mri-anatomy-checks-personal-drafts-1','vm-head-mri-anatomy-checks-drafts-1','mri-reference3d','head-mri-anatomy-checks'],
 ] as const;
 const cases:Array<{item:string;namespace:string;table:string;tuple:unknown[]}>=headKinds.map(([kind,namespace,key,variant,structure])=>({item:`head:${kind}`,namespace,table:'atlas_personal_nested_review_events',tuple:[JSON.stringify([key,variant]),structure,'teaching',2147483648]}));
 cases.push({item:'head:mri-only-learning',namespace:'vm-head-mri-personal-drafts-1',table:'atlas_personal_nested_review_events',tuple:[JSON.stringify(['vm-head-mri-drafts-1','mri']),'head-mri-only-learning','teaching',2147483648]});
 cases.push({item:'head:paired:cortex-left-insula',namespace:'vm-head-paired-personal-decisions-1',table:'atlas_personal_nested_review_events',tuple:[JSON.stringify(['vm-head-paired-decisions-1','semantic-comparison']),'cortex-left-insula','teaching',2147483648]});
 cases.push({item:'head:ct-bone:bone-left-parietal',namespace:'vm-head-ct-bone-personal-decisions-1',table:'atlas_personal_nested_review_events',tuple:[JSON.stringify(['vm-head-ct-bone-decisions-1','semantic-comparison']),'bone-left-parietal','teaching',2147483648]});
 cases.push({item:'head:ct-bone-teaching:bone-left-parietal',namespace:'vm-head-ct-bone-teaching-personal-decisions-1',table:'atlas_personal_nested_review_events',tuple:[JSON.stringify(['vm-head-ct-bone-teaching-decisions-1','teaching']),'bone-left-parietal','teaching',2147483648]});
 cases.push({item:'source:plexus-topology',namespace:'vm-schematic-personal-review-1',table:'atlas_personal_specimen_review_events',tuple:['independent-schematic:vm:schematic:brachial-plexus:right','vm:schematic:brachial-plexus:right','geometry',2147483648]});
 cases.push({item:'source:plexus-presentation',namespace:'vm-schematic-personal-review-1',table:'atlas_personal_specimen_review_events',tuple:['independent-schematic:vm:schematic:brachial-plexus:right','vm:schematic:brachial-plexus:right','teaching',2147483648]});
 for(const entry of cases){
  let calls=0;
  const db={prepare(sql:string){calls++;assert.match(sql,/^\s*SELECT\b/i);assert(sql.includes(entry.table));return {bind(...args:unknown[]){assert.deepEqual(args,[JSON.stringify([entry.namespace,principalKey]),...entry.tuple]);return {all:async()=>({success:true,results:[]})};}};}};
  assert.equal(await one(catalog,entry.item,db),'not-started',entry.item);
  assert.equal(calls,1,entry.item);
 }
 const changedInstitution=JSON.stringify(['vm-website-personal-review-1','test-account','other-institution']);
 const alternate=new Request(request.url,{headers:{'oai-authenticated-user-id':changedInstitution}});
 const isolated={prepare(){return {bind(...args:unknown[]){assert.equal(args[0],JSON.stringify(['vm-head-teaching-personal-drafts-1',changedInstitution]));assert.notEqual(args[0],JSON.stringify(['vm-head-teaching-personal-drafts-1',principalKey]));return {all:async()=>({success:true,results:[]})};}};}};
 assert.equal(status(await extraInboxStatuses(alternate,isolated as never,select(catalog,'head:anatomy')),'head:anatomy'),'not-started');
});

test('null or changed source is unavailable without reading history; inspection entries never read storage',async()=>{
 const catalog=await extraInboxCatalog();
 const forbidden={prepare(){throw Error('History should not be read.');}};
 const headItem={...select(catalog,'head:anatomy')[0],revision:null};
 const changed={...select(catalog,'source:plexus-topology')[0],revision:'0'.repeat(64)};
 assert.equal(status(await extraInboxStatuses(request,forbidden as never,[headItem]),headItem.key),'unavailable');
 assert.equal(status(await extraInboxStatuses(request,forbidden as never,[changed]),changed.key),'unavailable');
 assert.equal(await one(catalog,'head:insula-teaching',forbidden),'inspection-required');
 assert.equal(await one(catalog,'head:ct-facial-learning',forbidden),'inspection-required');
 assert.equal(await one(catalog,'source:disc',forbidden),'inspection-required');
 const original=opticManifest.purpose;
 try{
  opticManifest.purpose='tampered-source-only-packet';
  assert.equal((await extraInboxCatalog()).find(item=>item.key==='source:optic')?.revision,null);
  assert.equal(await one(catalog,'source:optic',forbidden),'unavailable');
 }finally{opticManifest.purpose=original;}
 const originalLabel=headLearningSequences[0].label;
 try{
  headLearningSequences[0].label='Tampered guided sequence';
  assert.equal((await extraInboxCatalog()).find(item=>item.key==='head:guided')?.revision,null);
  assert.equal(await one(catalog,'head:guided',forbidden),'unavailable');
 }finally{headLearningSequences[0].label=originalLabel;}
});

test('paired and CT decision stores refuse corrupt status and forged row envelopes',async()=>{
 const catalog=await extraInboxCatalog(),stamp='2026-01-01T00:00:00.000Z';
 const paired=await pairedDecisionContext(HEAD_MANIFEST_SHA256,'cortex-left-insula');
 const ctBone=await ctBoneDecisionContext(HEAD_MANIFEST_SHA256,'bone-left-parietal');
 const ctTeaching=await ctBoneTeachingDecisionContext(HEAD_MANIFEST_SHA256,'bone-left-parietal');
 const families=[
  {key:'head:paired:cortex-left-insula',context:paired,decision:blankPairedDecision(paired),schema:'vm-paired-decision-event-1',accepted:'accepted-semantic'},
  {key:'head:ct-bone:bone-left-parietal',context:ctBone,decision:blankCtBoneDecision(ctBone),schema:'vm-ct-bone-decision-event-1',accepted:'accepted-semantic'},
  {key:'head:ct-bone-teaching:bone-left-parietal',context:ctTeaching,decision:blankCtBoneTeachingDecision(ctTeaching),schema:'vm-ct-bone-teaching-decision-event-1',accepted:'accepted-teaching'},
 ];
 for(const family of families){
  const record={eventSchema:family.schema,context:family.context,version:1,savedAt:stamp,decision:family.decision};
  const db=(payload:unknown,forged=false)=>({prepare(sql:string){assert.match(sql,/^\s*SELECT\b/i);return {bind(...args:unknown[]){return {all:async()=>({success:true,results:[{user_id:args[0],nested_key:args[1],structure_id:forged?'other-scope':args[2],track:args[3],version:1,payload:JSON.stringify(payload),saved_at:stamp}]})};}};}});
  assert.equal(await one(catalog,family.key,db(record)),'in-progress',family.key);
  assert.equal(await one(catalog,family.key,db({...record,decision:{...record.decision,status:family.accepted}})),'unavailable',family.key);
  assert.equal(await one(catalog,family.key,db(record,true)),'unavailable',family.key);
 }
});

test('plexus approvals require the recorded checklist and cannot cross a forged envelope',async()=>{
 const catalog=await extraInboxCatalog(),context=validatePlexusReviewContext(plexusManifest.context),stamp='2026-01-01T00:00:00.000Z';
 const draft=blankPlexusReview(context,'topology');
 const approved={...draft,status:'approved',reviewer:'Synthetic reviewer',qualification:'Synthetic role',scope:'Educational schematic topology only.',checks:Object.fromEntries(context.checklists.topology.map(check=>[check.id,true])),evidence:[{title:'Synthetic evidence',url:'https://example.invalid/evidence',note:''}],attested:true};
 const event={...approved,eventSchema:'vm-plexus-schematic-review-event-1',context,track:'topology',version:1,savedAt:stamp,reviewedAt:stamp,revisionHash:context.revisions.topology};
 const db=(payload:unknown,forged=false)=>({prepare(sql:string){assert.match(sql,/^\s*SELECT\b/i);return {bind(...args:unknown[]){return {all:async()=>({success:true,results:[{payload:JSON.stringify(payload),specimen_key:forged?'other-specimen':args[1],structure_id:args[2],track:args[3],version:1,saved_at:stamp}]})};}};}});
 assert.equal(await one(catalog,'source:plexus-topology',db(event)),'approval-recorded');
 assert.equal(await one(catalog,'source:plexus-topology',db({...event,checks:{...event.checks,identity:false}})),'unavailable');
 assert.equal(await one(catalog,'source:plexus-topology',db(event,true)),'unavailable');
 assert.equal(await one(catalog,'source:plexus-presentation',db(event)),'unavailable');
});

test('compact facial groups remain independent, source-bound and within the existing inbox cap',async()=>{
 const catalog=await extraInboxCatalog(),groups=catalog.filter(item=>item.key.startsWith('head:ct-facial-review:'));
 assert.equal(groups.length,2);assert(catalog.length<=64);assert.notEqual(groups[0].revision,groups[1].revision);
 for(const kind of ['teaching','clinical'] as const){
  const selected=select(catalog,`head:ct-facial-review:${kind}`);
  assert.equal(selected[0].capability,'decision');assert(selected[0].href.endsWith(`#head-ct-facial-${kind}-review`));
  assert.equal(status(await extraInboxStatuses(request,noRows() as never,selected),selected[0].key),'not-started');
  const forbidden={prepare(){assert.fail('Altered group must not read history');}};
  assert.equal(status(await extraInboxStatuses(request,forbidden as never,[{...selected[0],revision:'0'.repeat(64)}]),selected[0].key),'unavailable');
 }
 assert.equal(facialReviewGroupStatus(['approval-recorded','approval-recorded','not-started']),'in-progress');
 assert.equal(facialReviewGroupStatus(['approval-recorded','approval-recorded','changes-required']),'changes-required');
 assert.equal(facialReviewGroupStatus(['approval-recorded','re-review','not-started']),'re-review');
 assert.equal(facialReviewGroupStatus(['approval-recorded','unavailable','not-started']),'unavailable');
 assert.equal(facialReviewGroupStatus(['approval-recorded']),'unavailable');
 assert.equal(facialReviewGroupStatus(['approval-recorded','approval-recorded','inspection-required']),'unavailable');
});

test('facial group acceptance requires all three newest own-kind records and never exposes history text',async()=>{
 const catalog=await extraInboxCatalog(),stamp='2026-10-16T10:00:00.000Z';
 for(const kind of ['teaching','clinical'] as const){
  const contexts=await Promise.all(['bone-left-zygomatic','bone-right-zygomatic','bone-mandible'].map(id=>facialDecisionContext(HEAD_MANIFEST_SHA256,id,kind)));
  const records=new Map(contexts.map(context=>[context.conceptId,{eventSchema:'vm-ct-facial-decision-event-1',context,version:1,savedAt:stamp,
   decision:{...blankFacialDecision(context),status:'accepted-educational',reviewer:'Synthetic reviewer',qualification:'Test fixture only',notes:'Private synthetic note never returned by inbox',checks:Object.fromEntries(context.checklist.map(c=>[c.id,true])),attested:true}}]));
  const db=(mode:'accepted'|'missing'|'correction'|'stale'|'forged-kind')=>({prepare(sql:string){assert.match(sql,/^\s*SELECT\b/i);return{bind(...args:unknown[]){
   assert.equal(args[0],JSON.stringify(['vm-head-ct-facial-personal-decisions-1',kind,principalKey]));
   assert.equal(args[1],JSON.stringify(['vm-head-ct-facial-educational-decisions-1',kind]));assert.equal(args[3],'teaching');
   const original=records.get(args[2] as never);assert(original);const payload=structuredClone(original);
   if(args[2]==='bone-mandible'){
    if(mode==='missing')return {all:async()=>({success:true,results:[]})};
    if(mode==='correction'){payload.version=2;payload.decision={...blankFacialDecision(payload.context),status:'changes-required',notes:'Synthetic correction replaces acceptance.'};}
    if(mode==='stale')payload.context.packetRevision='0'.repeat(64);
    if(mode==='forged-kind')payload.context.kind=kind==='teaching'?'clinical':'teaching';
   }
   return{all:async()=>({success:true,results:[{user_id:args[0],nested_key:args[1],structure_id:args[2],track:args[3],version:payload.version,payload:JSON.stringify(payload),saved_at:stamp}]})};
  }};}});
  const key=`head:ct-facial-review:${kind}`;
  for(const [mode,expected]of [['accepted','approval-recorded'],['missing','in-progress'],['correction','changes-required'],['stale','re-review'],['forged-kind','unavailable']] as const){
   const result=await extraInboxStatuses(request,db(mode) as never,select(catalog,key));assert.equal(status(result,key),expected);
   assert(!JSON.stringify(result).includes('Private synthetic note'));assert(!JSON.stringify(result).includes(principalKey));
  }
 }
});
