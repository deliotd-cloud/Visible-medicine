import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import test from 'node:test';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {groupedReviewConfirmation} from './grouped-review-confirmation-harness.mjs';
import {facialAwareRequire} from './head-facial-hook-loader.ts';
import {headAnatomyCheckModule} from './head-anatomy-check-loader.ts';
import {headReviewImageLinkModule} from './head-review-image-link-loader.ts';
import * as links from '../lib/head-atlas-links.ts';
import {headImageHref} from '../lib/head-atlas-navigation.ts';
import {hippocampalConcepts,hippocampalTeachingReferences} from '../atlas-review/content/hippocampal-teaching.ts';
import * as clinical from '../lib/head-hippocampal-clinical.ts';
import {HEAD_TEACHING_REVISION,headTeachingPacket} from '../lib/head-atlas-teaching.ts';
import {LOBAR_CLINICAL_REVISION,lobarClinicalPacket} from '../lib/head-lobar-clinical.ts';
import {blankHeadTeachingDraft,headTeachingDraftContext,headTeachingDraftStale,parseSavedHeadTeachingDraft} from '../lib/head-teaching-review-contract.ts';
import * as contract from '../lib/head-teaching-review-contract.ts';
import * as client from '../lib/head-teaching-review-client.ts';
import * as workingCopy from '../lib/head-review-working-copy.ts';
import * as navigationGuard from '../lib/clinical-review-navigation-guard.ts';

const require=facialAwareRequire(createRequire(import.meta.url));
const ids=['limbic-left-hippocampus','limbic-right-hippocampus'];
const sha=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const content=clinical.hippocampalClinicalContent;
const escaped=(value:string)=>value.replaceAll('&','&amp;').replaceAll("'",'&#x27;').replaceAll('"','&quot;');
const hrefAttribute=(href:string)=>`href="${escaped(href)}"`;

function compile(path:string,imports:Record<string,unknown>={}){
  const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{
    compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  }).outputText;
  const mod={exports:{} as Record<string,any>};
  new Function('require','module','exports',code)((name:string)=>imports[name]??(
    name==='./HeadAnatomyCheck'?headAnatomyCheckModule:
    name==='./HeadReviewImageLink'?headReviewImageLinkModule:
    path.startsWith('../lib/')&&name.startsWith('./head-')?require('../lib/'+name.slice(2)):
    name.startsWith('../lib/')?require(name.endsWith('.ts')?name:name+'.ts'):
    require(name)
  ),mod,mod.exports);
  return mod.exports;
}

test('hippocampal packet reuses complete existing clinical and imaging source with a separate exact revision',async()=>{
  const source=hippocampalConcepts.find(item=>item.id==='cerebral-hippocampus');
  assert(source);
  assert(source.imaging?.ct&&source.imaging.mri);
  const packet=clinical.hippocampalClinicalPacket();
  assert.equal(sha(packet),clinical.HIPPOCAMPAL_CLINICAL_REVISION);
  assert.equal(await clinical.verifiedHippocampalClinicalRevision(links.HEAD_LINK_REVISION),clinical.HIPPOCAMPAL_CLINICAL_REVISION);
  assert.equal(await clinical.verifiedHippocampalClinicalRevision('stale'),null);
  assert.equal(content.headRevision,links.HEAD_LINK_REVISION);
  assert.equal(content.status,'draft');
  for(const key of ['clinicalApproval','publicationApproval','patientRegistration'] as const)assert.equal(content[key],false);
  assert.deepEqual(content.notes.map(note=>note.conceptId),ids);
  assert.equal(content.reviewChecks.length,4);
  assert.equal(packet.bindings.length,2);
  assert.equal(content.notes[0].text,source.sections.clinical.body);
  assert.equal(content.notes[1].text,source.sections.clinical.body);
  for(const note of content.notes)assert.equal(note.caution,source.sections.pathology.body);
  assert.equal(content.imaging.CT.text,source.imaging.ct.body);
  assert.equal(content.imaging.MRI.text,source.imaging.mri.body);
  const serialized=JSON.stringify(packet.sourceTeaching);
  for(const fact of [source.sections.anatomy.body,source.sections.function.body,source.sections.clinical.body,source.sections.pathology.body,source.imaging.ct.body,source.imaging.mri.body,source.modelLimit,source.quiz.question,source.quiz.answer])assert(serialized.includes(fact),fact);
  for(const reference of Object.values(hippocampalTeachingReferences)){
    assert(serialized.includes(reference.url),reference.url);
    assert(serialized.includes(reference.title),reference.title);
  }
  assert.match(content.scope,/separate|unregistered/i);
  assert.match(content.scope,/radiologist|review/i);
  assert.match(content.scope,/memory|diagnos|patient/i);
  assert.equal(sha(headTeachingPacket()),HEAD_TEACHING_REVISION);
  assert.equal(sha(lobarClinicalPacket()),LOBAR_CLINICAL_REVISION);
  assert.doesNotMatch(JSON.stringify(packet),/data:image|\.(?:png|jpe?g|svg|webp|mp4)(?:["?])/i);
});

test('both concept bindings and each content or binding change fail closed',async()=>{
  const packet=clinical.hippocampalClinicalPacket();
  for(const [index,note] of content.notes.entries()){
    const binding=links.headConceptById(note.conceptId);
    assert(binding);
    assert.deepEqual(packet.bindings[index],binding);
    assert.equal(binding.conceptId,ids[index]);
    assert.equal(binding.headRevision,links.HEAD_LINK_REVISION);
    assert(binding.ctHref&&binding.mriHref&&binding.atlasHref);
    assert(binding.atlasHref.includes(`side=${ids[index].includes('-left-')?'left':'right'}`));
    for(const modality of ['CT','MRI'] as const){
      const item=clinical.hippocampalClinicalForConcept(note.conceptId,modality,links.HEAD_LINK_REVISION);
      assert(item);
      assert.equal(item.note,note);
      assert.deepEqual(item.binding,binding);
      assert.equal(item.imaging,content.imaging[modality]);
      assert.equal(item.revision,clinical.HIPPOCAMPAL_CLINICAL_REVISION);
      assert.equal(clinical.hippocampalClinicalForConcept(note.conceptId,modality,'stale'),null);
    }
  }
  for(const id of [...ids,'deep-left-caudate','unknown'])assert.equal(clinical.hippocampalClinicalForConcept(id,'US' as 'CT',links.HEAD_LINK_REVISION),null);
  for(const id of ['limbic-left-amygdala','cortex-left-temporal-lobe','unknown'])assert.equal(clinical.hippocampalClinicalForConcept(id,'CT',links.HEAD_LINK_REVISION),null);
  const isolated=(lookup:typeof links.headConceptById)=>compile('../lib/head-hippocampal-clinical.ts',{'./head-atlas-links.ts':{...links,headConceptById:lookup}}) as typeof clinical;
  const changed=(transform:(binding:NonNullable<ReturnType<typeof links.headConceptById>>)=>ReturnType<typeof links.headConceptById>)=>
    isolated(id=>{const binding=links.headConceptById(id);return binding&&id===ids[0]?transform(binding):binding;});
  assert.equal(await isolated(()=>null).verifiedHippocampalClinicalRevision(links.HEAD_LINK_REVISION),null);
  assert.equal(await changed(()=>links.headConceptById(ids[1])).verifiedHippocampalClinicalRevision(links.HEAD_LINK_REVISION),null);
  for(const field of ['ctHref','mriHref','atlasHref'] as const){
    assert.equal(await changed(binding=>({...binding,[field]:''})).verifiedHippocampalClinicalRevision(links.HEAD_LINK_REVISION),null,field);
    assert.equal(await changed(binding=>({...binding,[field]:'/wrong-target'})).verifiedHippocampalClinicalRevision(links.HEAD_LINK_REVISION),null,field);
  }
  assert.equal(await changed(binding=>({...binding,headRevision:'stale'})).verifiedHippocampalClinicalRevision(links.HEAD_LINK_REVISION),null);
  const mutable=isolated(links.headConceptById);
  (mutable.hippocampalClinicalContent.notes[0] as {text:string}).text+=' changed';
  assert.equal(await mutable.verifiedHippocampalClinicalRevision(links.HEAD_LINK_REVISION),null);
  for(const [label,changedPacket] of [
    ['clinical text',{...packet,content:{...content,notes:content.notes.map((note,index)=>index?note:{...note,text:note.text+' changed'})}}],
    ['pathology caution',{...packet,content:{...content,notes:content.notes.map((note,index)=>index?note:{...note,caution:note.caution+' changed'})}}],
    ['source teaching',{...packet,sourceTeaching:{...packet.sourceTeaching,probe:'changed'}}],
    ['binding',{...packet,bindings:packet.bindings.map((binding,index)=>index?binding:{...binding,ctHref:'/wrong'})}],
  ] as const)assert.notEqual(sha(changedPacket),clinical.HIPPOCAMPAL_CLINICAL_REVISION,label);
});

test('the complete source lesson, references and sided FMA identities are revision-bound',async()=>{
  const probe=async(change:(copy:{hippocampalConcepts:typeof hippocampalConcepts;hippocampalTeachingReferences:typeof hippocampalTeachingReferences})=>void)=>{
    const copy=structuredClone({hippocampalConcepts,hippocampalTeachingReferences});change(copy);
    const isolated=compile('../lib/head-hippocampal-clinical.ts',{'../atlas-review/content/hippocampal-teaching.ts':copy}) as typeof clinical;
    assert.equal(await isolated.verifiedHippocampalClinicalRevision(links.HEAD_LINK_REVISION),null);
    assert.notEqual(sha(isolated.hippocampalClinicalPacket()),clinical.HIPPOCAMPAL_CLINICAL_REVISION);
  };
  await probe(copy=>{copy.hippocampalConcepts[0].sections.anatomy.body+=' changed';});
  await probe(copy=>{copy.hippocampalConcepts[0].sections.function.body+=' changed';});
  await probe(copy=>{copy.hippocampalConcepts[0].sections.clinical.body+=' changed';});
  await probe(copy=>{copy.hippocampalConcepts[0].sections.pathology.body+=' changed';});
  await probe(copy=>{copy.hippocampalConcepts[0].imaging!.ct!.body+=' changed';});
  await probe(copy=>{copy.hippocampalConcepts[0].imaging!.mri!.body+=' changed';});
  await probe(copy=>{copy.hippocampalConcepts[0].modelLimit+=' changed';});
  await probe(copy=>{copy.hippocampalConcepts[0].quiz.answer+=' changed';});
  await probe(copy=>{copy.hippocampalTeachingReferences.hippocampalTopography.url='https://example.invalid/changed';});
  await probe(copy=>{copy.hippocampalTeachingReferences.hippocampalMRI.title+=' changed';});
  await probe(copy=>{copy.hippocampalConcepts[0].fmaIds.reverse();});
  await probe(copy=>{copy.hippocampalConcepts[0].fmaIds[0]='FMA-unrelated';});
  await probe(copy=>{copy.hippocampalConcepts[0].sections.clinical.readiness='pending';});
  await probe(copy=>{copy.hippocampalConcepts[0].imaging!.mri!.references=['missing-source'];});
  await probe(copy=>{copy.hippocampalConcepts=[];});
});

test('native CT, MRI and existing 3D render the correct side, folded cautions and unscored reflection',()=>{
  const Teaching=compile('../components/HeadAtlasTeaching.tsx').HeadAtlasTeaching;
  const Reference=compile('../components/HeadAtlasReferenceTeaching.tsx').HeadAtlasReferenceTeaching;
  for(const note of content.notes){
    for(const modality of ['CT','MRI'] as const){
      const html=renderToStaticMarkup(React.createElement(Teaching,{conceptId:note.conceptId,modality,revision:links.HEAD_LINK_REVISION}));
      for(const phrase of [note.text,note.caution,note.question,note.answer,content.imaging[modality].text,clinical.HIPPOCAMPAL_CLINICAL_REVISION])assert(html.includes(escaped(phrase)),`${note.conceptId} ${modality}: ${phrase}`);
      assert(!html.includes(escaped(content.imaging[modality==='CT'?'MRI':'CT'].text)));
      assert.match(html,/<details><summary>Clinical correlation · Draft<\/summary>/);
      assert.match(html,/<details><summary>Reveal explanation<\/summary>/);
      assert.match(html,/no score or completion recorded/);
      assert(!html.includes('checked=""'));
      assert.equal(renderToStaticMarkup(React.createElement(Teaching,{conceptId:note.conceptId,modality,revision:'stale'})),'');
    }
    const reference=renderToStaticMarkup(React.createElement(Reference,{conceptId:note.conceptId,revision:links.HEAD_LINK_REVISION}));
    for(const phrase of [note.text,note.caution,note.question,note.answer,content.imaging.CT.text,content.imaging.MRI.text,clinical.HIPPOCAMPAL_CLINICAL_REVISION])assert(reference.includes(escaped(phrase)),`${note.conceptId} 3D: ${phrase}`);
    assert.match(reference,/<details><summary>Clinical correlation &amp; imaging pitfalls · Draft<\/summary>/);
    assert.match(reference,/not spatially registered/);
    assert.match(reference,/no score or completion recorded/);
    assert(!reference.includes('checked=""'));
    assert.equal(renderToStaticMarkup(React.createElement(Reference,{conceptId:note.conceptId,revision:'stale'})),'');
  }
});

test('protected Review has exact targets and mounts corrections only on verified source',()=>{
  const Review=compile('../components/HeadHippocampalClinicalReview.tsx').HeadHippocampalClinicalReview as React.ComponentType<{revision:string;clinicalRevision:string|null;reviewNotes?:React.ReactNode}>;
  const marker=React.createElement('form',{'data-test-private-notes':'hippocampal'},'Synthetic private corrections');
  const render=(revision:string,clinicalRevision:string|null)=>renderToStaticMarkup(React.createElement(Review,{revision,clinicalRevision,reviewNotes:marker}));
  const html=render(links.HEAD_LINK_REVISION,clinical.HIPPOCAMPAL_CLINICAL_REVISION);
  assert(html.includes('id="hippocampal-clinical-review"'));
  for(const phrase of [content.scope,content.imaging.CT.text,content.imaging.MRI.text,clinical.HIPPOCAMPAL_CLINICAL_REVISION,...content.reviewChecks,content.reuse])assert(html.includes(escaped(phrase)),phrase);
  for(const note of content.notes){
    const section=html.slice(html.indexOf(`id="hippocampal-clinical-${note.conceptId}"`));
    for(const phrase of [note.text,note.caution,note.question,note.answer])assert(section.includes(escaped(phrase)),phrase);
    const binding=links.headConceptById(note.conceptId)!;
    for(const modality of ['CT','MRI'] as const){
      const href=headImageHref(modality,note.conceptId,null,links.HEAD_LINK_REVISION);
      assert(href);assert(section.includes(hrefAttribute(href)));
    }
    assert(section.includes(hrefAttribute(binding.atlasHref)));
  }
  assert.match(html,/<details id="hippocampal-clinical-corrections"><summary>Private corrections &amp; saved history<\/summary><form data-test-private-notes="hippocampal"/);
  for(const props of [{revision:'stale',clinicalRevision:clinical.HIPPOCAMPAL_CLINICAL_REVISION},{revision:links.HEAD_LINK_REVISION,clinicalRevision:'stale'},{revision:links.HEAD_LINK_REVISION,clinicalRevision:null}]){
    const unavailable=render(props.revision,props.clinicalRevision);
    assert.match(unavailable,/hippocampal clinical draft unavailable/i);
    assert.match(unavailable,/No targets have been substituted/);
    assert.doesNotMatch(unavailable,/Synthetic private corrections|<form/);
  }
  const page=readFileSync(new URL('../app/workspace/atlas-review/head-learning/page.tsx',import.meta.url),'utf8');
  assert(page.indexOf('await authorizeClinicalReview()')<page.indexOf("headTeachingDraftContext(HEAD_MANIFEST_SHA256,'hippocampal-clinical')"));
  assert.match(page,/if\(hippocampalClinicalRevision\)try\{hippocampalContext=await headTeachingDraftContext\(HEAD_MANIFEST_SHA256,'hippocampal-clinical'\)/);
  assert.match(page,/id:'hippocampal-clinical-corrections'/);
  const route=readFileSync(new URL('../app/api/atlas-review/head-hippocampal-clinical/route.ts',import.meta.url),'utf8');
  assert.match(route,/runClinicalReview\(request,guarded=>getHeadTeachingDrafts\(guarded,[^\n]*'hippocampal-clinical'\)/);
  assert.match(route,/runClinicalReview\(request,guarded=>postHeadTeachingDraft\(guarded,[^\n]*'hippocampal-clinical'\)/);
});

test('private context, history, client and working-copy identities cannot inherit another packet approval',async()=>{
  const kinds=['anatomy','brainstem-clinical','ventricular-clinical','cerebellar-clinical','deep-grey-clinical','lobar-clinical','hippocampal-clinical'] as const;
  const contexts=await Promise.all(kinds.map(kind=>headTeachingDraftContext(links.HEAD_LINK_REVISION,kind)));
  const current=contexts[6],packet=clinical.hippocampalClinicalPacket();
  assert.equal(current.packetRevision,clinical.HIPPOCAMPAL_CLINICAL_REVISION);
  assert.equal(current.catalogScope,'head-hippocampal-clinical-drafts');
  assert.equal(current.packetId,'head-hippocampal-clinical');
  assert.equal(current.checklistVersion,'head-hippocampal-clinical-draft-review-1');
  assert.deepEqual(current.conceptIds,ids);
  assert.deepEqual(current.checklist.map(check=>check.id),['wording','scan-attribution','imaging','bindings']);
  assert.deepEqual(current.checklist.map(check=>check.label),packet.content.reviewChecks);
  for(const key of ['patientRegistration','clinicalApproval','publicationApproval'] as const)assert.equal(current[key],false);
  for(const field of ['catalogScope','packetId','packetRevision'] as const)assert.equal(new Set(contexts.map(context=>context[field])).size,7);
  const draft=blankHeadTeachingDraft(current);
  const event={eventSchema:'vm-head-teaching-draft-event-1' as const,context:current,version:1,savedAt:'2026-10-11T12:00:00.000Z',draft};
  assert.deepEqual(parseSavedHeadTeachingDraft(event),event);
  for(const previous of contexts.slice(0,6))assert.equal(headTeachingDraftStale(event,previous),true);
  for(const changed of [{...current,packetRevision:'f'.repeat(64)},{...current,headRevision:'f'.repeat(64)},{...current,checklistVersion:'head-hippocampal-clinical-draft-review-2'},{...current,checklist:[...current.checklist].reverse()}])assert.equal(headTeachingDraftStale(event,changed),true);
  for(const bad of [{...current,catalogScope:contexts[5].catalogScope},{...current,packetId:contexts[5].packetId},{...current,conceptIds:[ids[0]]},{...current,conceptIds:[ids[0],ids[0]]},{...current,conceptIds:[ids[0],'limbic-left-amygdala']},{...current,clinicalApproval:true},{...current,publicationApproval:true},{...current,patientRegistration:true}])assert.throws(()=>parseSavedHeadTeachingDraft({...event,context:bad}));
  assert.throws(()=>parseSavedHeadTeachingDraft({...event,draft:{...draft,attested:true}}));
  const empty={context:current,history:[],nextBefore:null,scope:'private-to-signed-in-account-and-institution'};
  assert.deepEqual(client.parseHeadTeachingHistory(empty,current).history,[]);
  assert.throws(()=>client.parseHeadTeachingHistory({...empty,context:contexts[5]},current),client.HeadTeachingSourceChangedError);
  assert.throws(()=>client.parseHeadTeachingHistory({...empty,history:[{...event,context:contexts[5]}]},current));
  assert.throws(()=>client.parseHeadTeachingHistory({...empty,history:[event,event]},current));
  assert.deepEqual(client.confirmHeadTeachingSave({review:event},current,0,draft),event);
  for(const forged of [{...event,context:contexts[5]},{...event,version:2},{...event,draft:{...draft,notes:'different'}},{...event,draft:{...draft,attested:true}}])assert.throws(()=>client.confirmHeadTeachingSave({review:forged},current,0,draft));
  const exported=workingCopy.headTeachingWorkingCopy(current,draft,{baseVersion:null,unsavedChanges:true,saveUncertain:false,reloadRequired:false},'2026-10-11T12:00:00.000Z');
  assert.equal(exported.kind,'head-hippocampal-clinical');
  assert.deepEqual(exported.context,current);
  for(const flag of ['serverSaveConfirmed','clinicalApproval','publicationApproval','patientRegistration'] as const)assert.equal(exported[flag],false);
  assert.throws(()=>Reflect.apply(workingCopy.headTeachingWorkingCopy,null,[current,{...draft,attested:true},{baseVersion:null,unsavedChanges:true,saveUncertain:false,reloadRequired:false}]));
  const source=readFileSync(new URL('../components/HeadTeachingReviewNotes.tsx',import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
  const mod={exports:{} as {HeadTeachingReviewNotes:React.ComponentType<any>}};
  const load=(id:string)=>id==='../lib/clinical-review-navigation-guard'?navigationGuard:id==='../lib/head-review-working-copy'?workingCopy:id==='../lib/head-teaching-review-contract'?contract:id==='../lib/head-teaching-review-client'?client:id==='../lib/clinical-review-fetch'?{clinicalReviewFetch(){throw Error('SSR must not fetch');}}:id==='./GroupedReviewConfirmation'?groupedReviewConfirmation:id==='../lib/head-teaching-review-recovery'?require('../lib/head-teaching-review-recovery.ts'):id==='../lib/review-draft-autosave'?require('../lib/review-draft-autosave.ts'):id.endsWith('.css')?{}:require(id);
  new Function('require','module','exports',compiled)(load,mod,mod.exports);
  const html=renderToStaticMarkup(React.createElement(mod.exports.HeadTeachingReviewNotes,{context:current}));
  assert.match(html,/Private hippocampal clinical notes &amp; corrections/);
  assert.match(html,/Do not enter patient data/);
  assert.match(html,/Download working copy/);
  assert(html.includes(clinical.HIPPOCAMPAL_CLINICAL_REVISION.slice(0,12)));
});

test('API refuses malformed, cross-packet, stale and forged requests before storage',async()=>{
  // review-http.ts contains parameter properties: compile first for Node's strip-only loader.
  const compiled=await build({entryPoints:[resolve('lib/head-teaching-review-api.ts')],bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64')) as typeof import('../lib/head-teaching-review-api.ts');
  const current=await headTeachingDraftContext(links.HEAD_LINK_REVISION,'hippocampal-clinical');
  const other=await headTeachingDraftContext(links.HEAD_LINK_REVISION,'lobar-clinical');
  const draft=blankHeadTeachingDraft(current);
  const body={catalogScope:current.catalogScope,packetId:current.packetId,packetRevision:current.packetRevision,headRevision:current.headRevision,checklistVersion:current.checklistVersion,expectedVersion:0,draft};
  let prepares=0;
  const db={prepare(){prepares++;throw Error('Storage must not be prepared for a refused request.');}} as unknown as Pick<D1Database,'prepare'>;
  const get=(query='',user='alice')=>new Request('https://review.test/hippocampal'+query,{headers:user?{'oai-authenticated-user-id':user}:{}});
  const post=(payload:unknown,options:{user?:string;query?:string;origin?:string;contentType?:string;site?:string;raw?:string}={})=>new Request('https://review.test/hippocampal'+(options.query??''),{method:'POST',headers:{...(options.user===''?{}:{'oai-authenticated-user-id':options.user??'alice'}),origin:options.origin??'https://review.test','content-type':options.contentType??'application/json',...(options.site?{'sec-fetch-site':options.site}:{})},body:options.raw??JSON.stringify(payload)});
  for(const [request,status] of [[get('', ''),401],[get('?before=0'),400],[get('?before=2&before=3'),400],[get('?other=1'),400]] as const){
    assert.equal((await api.getHeadTeachingDrafts(request,db,links.HEAD_LINK_REVISION,'hippocampal-clinical')).status,status);
    assert.equal(prepares,0);
  }
  for(const [request,status] of [
    [post(body,{user:''}),401],[post(body,{query:'?before=1'}),400],[post({...body,extra:true}),400],
    [post({...body,catalogScope:other.catalogScope}),400],[post({...body,packetId:other.packetId}),400],
    [post({...body,packetRevision:'f'.repeat(64)}),409],[post({...body,headRevision:'f'.repeat(64)}),409],[post({...body,checklistVersion:'stale'}),409],
    [post({...body,expectedVersion:-1}),400],[post({...body,expectedVersion:1.5}),400],
    [post({...body,draft:{...draft,clinicalApproval:true}}),422],[post({...body,draft:{...draft,publicationApproval:true}}),422],
    [post({...body,draft:{...draft,patientRegistration:true}}),422],[post({...body,draft:{...draft,attested:true}}),422],
    [post(body,{origin:'https://foreign.test'}),403],[post(body,{site:'cross-site'}),403],[post(body,{contentType:'text/plain'}),415],
    [post(body,{raw:'{"broken":'}),400],[post(body,{raw:' '.repeat(32001)}),413],
  ] as const){
    assert.equal((await api.postHeadTeachingDraft(request,db,links.HEAD_LINK_REVISION,'hippocampal-clinical')).status,status,request.url);
    assert.equal(prepares,0,request.url);
  }
});
