import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import * as links from '../lib/head-atlas-links.ts';
import ts from 'typescript';
import {MRI_ONLY_CLINICAL_REVISION,mriOnlyClinicalPacket} from '../lib/head-mri-only-clinical.ts';
import {HEAD_MRI_ANATOMY_CHECK_REVISION,headMriAnatomyCheckPacket} from '../lib/head-mri-anatomy-checks.ts';
import {blankHeadTeachingDraft,headTeachingDraftContext,headTeachingDraftStale,parseSavedHeadTeachingDraft,type HeadTeachingDraftContext} from '../lib/head-teaching-review-contract.ts';
import * as client from '../lib/head-teaching-review-client.ts';
import {headTeachingWorkingCopy,downloadHeadWorkingCopy} from '../lib/head-review-working-copy.ts';

const oldKinds=['anatomy','brainstem-clinical','ventricular-clinical','cerebellar-clinical','deep-grey-clinical','lobar-clinical','hippocampal-clinical'] as const;
const newKinds=['mri-only-clinical','mri-anatomy-checks'] as const;
const kinds=[...oldKinds,...newKinds] as const;
const stamp='2026-10-12T12:00:00.000Z';
const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const event=(context:HeadTeachingDraftContext,version=1)=>({eventSchema:'vm-head-teaching-draft-event-1' as const,context,version,savedAt:stamp,draft:blankHeadTeachingDraft(context)});
const body=(context:HeadTeachingDraftContext,expectedVersion=0)=>({catalogScope:context.catalogScope,packetId:context.packetId,packetRevision:context.packetRevision,headRevision:context.headRevision,checklistVersion:context.checklistVersion,expectedVersion,draft:blankHeadTeachingDraft(context)});

test('independent MRI contexts retain exact packet, checklist and concept identities',async()=>{
  const contexts=await Promise.all(kinds.map(kind=>headTeachingDraftContext(HEAD_LINK_REVISION,kind)));
  for(const field of ['catalogScope','packetId','packetRevision'] as const)assert.equal(new Set(contexts.map(context=>context[field])).size,9);
  const packets=[mriOnlyClinicalPacket(),headMriAnatomyCheckPacket()];
  const revisions=[MRI_ONLY_CLINICAL_REVISION,HEAD_MRI_ANATOMY_CHECK_REVISION];
  const ids=[['endocrine-pituitary-gland','commissure-corpus-callosum'],['limbic-left-amygdala','limbic-right-amygdala','commissure-corpus-callosum','endocrine-pituitary-gland']];
  for(const [index,kind] of newKinds.entries()){
    const context=contexts[index+7],packet=packets[index],saved=event(context);
    assert.equal(context.catalogScope,`head-${kind}-drafts`);
    assert.equal(context.packetId,`head-${kind}`);
    assert.equal(context.packetRevision,revisions[index]);
    assert.equal(digest(packet),revisions[index]);
    assert.equal(context.checklistVersion,`head-${kind}-draft-review-1`);
    assert.deepEqual(context.conceptIds,ids[index]);
    assert.deepEqual(context.checklist.map(check=>check.id),index===0?['wording','scan-attribution','imaging','bindings']:['facts','extent','comparison','exercise','revision']);
    assert.deepEqual(context.checklist.map(check=>check.label),packet.content.reviewChecks);
    assert(packet.bindings.every(binding=>binding?.mriHref&&binding.atlasHref&&!Object.hasOwn(binding,'ctHref')));
    assert.deepEqual(parseSavedHeadTeachingDraft(saved),saved);
    for(const other of contexts.filter(item=>item!==context))assert(headTeachingDraftStale(saved,other));
    for(const changed of [{packetRevision:'f'.repeat(64)},{headRevision:'f'.repeat(64)},{checklistVersion:'stale'},{checklist:[...context.checklist].reverse()},{conceptIds:[...context.conceptIds].reverse()}])assert(headTeachingDraftStale(saved,{...context,...changed}));
    for(const changed of [
      {catalogScope:contexts[0].catalogScope},{packetId:contexts[0].packetId},
      {conceptIds:context.conceptIds.slice(1)},
      {conceptIds:context.conceptIds.map(()=>context.conceptIds[0])},
      {conceptIds:[...context.conceptIds.slice(1),'limbic-left-hippocampus']},
      {checklist:[...context.checklist,{id:'approval',label:'Approve'}]},
      {clinicalApproval:true},{publicationApproval:true},{patientRegistration:true},
    ])assert.throws(()=>parseSavedHeadTeachingDraft({...saved,context:{...context,...changed}}));
    assert.throws(()=>parseSavedHeadTeachingDraft({...saved,draft:{...saved.draft,attested:true}}));
    await assert.rejects(headTeachingDraftContext('0'.repeat(64),kind));
  }
});

// Content objects are shared with the imported source. Binding arrays contain
// fresh lookup results, so those are tested separately through an isolated lookup.
// Shared-content mutations are restored before proceeding to another probe.
function leaves(value:any,path:string[]=[]):string[][]{
  return value!==null&&typeof value==='object'?Object.entries(value).flatMap(([key,item])=>leaves(item,[...path,key])):[path];
}
test('both context builders refuse every complete-source scalar mutation',async(t)=>{
  for(const [index,packet] of [mriOnlyClinicalPacket(),headMriAnatomyCheckPacket()].entries()){
    const before=digest(packet),paths=leaves(packet);
    assert(paths.some(path=>path[0]==='bindings'));
    assert(paths.some(path=>path[0]==='content'&&path[1]===(index===0?'sources':'questions')));
    if(index===1)assert(paths.some(path=>path[0]==='teachingPacket'&&path[1]==='content'&&path[2]==='sources'));
    const sharedPaths=paths.filter(path=>path[0]==='content'||path[0]==='teachingPacket'&&path[1]==='content');
    for(const path of sharedPaths){
      let parent:any=packet;
      for(const key of path.slice(0,-1))parent=parent[key];
      const key=path.at(-1)!,original=parent[key];
      try{
        parent[key]=typeof original==='string'?original+' synthetic mutation':typeof original==='boolean'?!original:typeof original==='number'?original+1:'synthetic mutation';
        await assert.rejects(headTeachingDraftContext(HEAD_LINK_REVISION,newKinds[index]),path.join('.'));
      }finally{parent[key]=original;}
    }
    assert.equal(digest(packet),before);
    assert.equal((await headTeachingDraftContext(HEAD_LINK_REVISION,newKinds[index])).packetRevision,before);
    t.diagnostic(`${newKinds[index]}: ${sharedPaths.length} shared-content scalar mutations refused; fresh binding wrappers tested separately.`);
  }
});

test('isolated MRI verifiers and context builders refuse altered exact lookup bindings',async(t)=>{
  const require=createRequire(import.meta.url);
  type Binding=NonNullable<ReturnType<typeof links.headConceptById>>;
  let changedId='',change:(binding:Binding)=>ReturnType<typeof links.headConceptById>=binding=>binding;
  const lookup=(id:string)=>{
    const binding=links.headConceptById(id);
    return binding&&id===changedId?change(binding):binding;
  };
  const overrides:Record<string,unknown>={'./head-atlas-links.ts':{...links,headConceptById:lookup}};
  const compile=(file:string)=>{
    const code=ts.transpileModule(readFileSync(resolve('lib',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    const mod={exports:{} as Record<string,any>};
    new Function('require','module','exports',code)((name:string)=>overrides[name]??require(name.startsWith('./')?resolve('lib',name):name),mod,mod.exports);
    return mod.exports;
  };
  // All four modules share the altered lookup; anatomy verification therefore
  // checks the original teaching bindings as well as the new question bindings.
  overrides['./head-mri-only-teaching.ts']=compile('head-mri-only-teaching.ts');
  const clinical=compile('head-mri-only-clinical.ts');
  overrides['./head-mri-only-clinical.ts']=clinical;
  const anatomy=compile('head-mri-anatomy-checks.ts');
  overrides['./head-mri-anatomy-checks.ts']=anatomy;
  const isolated=compile('head-teaching-review-contract.ts') as typeof import('../lib/head-teaching-review-contract.ts');
  const verifiers=[clinical.verifiedMriOnlyClinicalRevision,anatomy.verifiedHeadMriAnatomyCheckRevision];
  for(const [index,kind] of newKinds.entries()){
    const context=await isolated.headTeachingDraftContext(HEAD_LINK_REVISION,kind);
    assert.equal(await verifiers[index](HEAD_LINK_REVISION),context.packetRevision);
    let probes=0;
    for(const id of context.conceptIds){
      const binding=links.headConceptById(id)!;
      const variants:((binding:Binding)=>ReturnType<typeof links.headConceptById>)[]=[
        ()=>null,
        ()=>links.headConceptById('brainstem-pons'),
        ...Object.keys(binding).map(field=>(original:Binding)=>({...original,[field]:(original as unknown as Record<string,string>)[field]+' synthetic mutation'})),
        original=>({...original,ctHref:'/atlas/ct-head?concept=synthetic-forged-target'}),
        original=>({...original,mriHref:'/atlas/mri-head?concept=limbic-left-hippocampus'}),
        ...['structure','part','source','partSource','side','concept'].map(field=>(original:Binding)=>{
          const url=new URL(original.atlasHref,'https://review.test');url.searchParams.set(field,field==='structure'||field==='part'?'fma:synthetic-foreign-target':'synthetic-foreign-value');
          return {...original,atlasHref:url.pathname+url.search};
        }),
      ];
      for(const variant of variants){
        changedId=id;change=variant;
        try{
          assert.equal(await verifiers[index](HEAD_LINK_REVISION),null,kind+' '+id);
          await assert.rejects(isolated.headTeachingDraftContext(HEAD_LINK_REVISION,kind));
          probes++;
        }finally{changedId='';change=original=>original;}
      }
    }
    assert.equal((await isolated.headTeachingDraftContext(HEAD_LINK_REVISION,kind)).packetRevision,context.packetRevision);
    t.diagnostic(`${kind}: ${probes} altered lookup bindings refused by both verifier and context builder.`);
  }
});

test('both MRI APIs refuse malformed, foreign, stale and approval requests before storage',async()=>{
  const compiled=await build({entryPoints:[resolve('lib/head-teaching-review-api.ts')],bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64')) as typeof import('../lib/head-teaching-review-api.ts');
  let prepares=0;
  const db={prepare(){prepares++;throw Error('Refused requests must not touch storage.');}} as unknown as Pick<D1Database,'prepare'>;
  const contexts=await Promise.all(kinds.map(kind=>headTeachingDraftContext(HEAD_LINK_REVISION,kind)));
  for(const [index,kind] of newKinds.entries()){
    const context=contexts[index+7],payload=body(context);
    const post=(value:unknown,options:{user?:string;query?:string;origin?:string;type?:string;raw?:string;site?:string}={})=>new Request('https://review.test/'+kind+(options.query??''),{method:'POST',headers:{...(options.user===''?{}:{'oai-authenticated-user-id':options.user??'alice'}),origin:options.origin??'https://review.test','content-type':options.type??'application/json',...(options.site?{'sec-fetch-site':options.site}:{})},body:options.raw??JSON.stringify(value)});
    const refused:[Request,number][]=[
      [post(payload,{user:''}),401],[post(payload,{query:'?before=1'}),400],
      [post({...payload,extra:true}),400],
      ...contexts.filter(other=>other!==context).map(other=>[post(body(other)),400] as [Request,number]),
      ...[{packetRevision:'f'.repeat(64)},{headRevision:'f'.repeat(64)},{checklistVersion:'stale'}].map(patch=>[post({...payload,...patch}),409] as [Request,number]),
      ...[-1,1.5,2147483647,'0',null].map(expectedVersion=>[post({...payload,expectedVersion}),400] as [Request,number]),
      ...[{attested:true},{clinicalApproval:true},{publicationApproval:true},{patientRegistration:true},{checks:{approval:true}}].map(patch=>[post({...payload,draft:{...payload.draft,...patch}}),422] as [Request,number]),
      [post(payload,{origin:'https://foreign.test'}),403],[post(payload,{site:'cross-site'}),403],
      [post(payload,{type:'text/plain'}),415],[post(payload,{raw:'{"broken":'}),400],[post(payload,{raw:' '.repeat(32001)}),413],
    ];
    for(const [request,status] of refused){assert.equal((await api.postHeadTeachingDraft(request,db,HEAD_LINK_REVISION,kind)).status,status);assert.equal(prepares,0);}
    for(const [query,user,status] of [['','',401],['?before=0','alice',400],['?before=2&before=3','alice',400],['?other=1','alice',400]] as const){
      const request=new Request('https://review.test/'+kind+query,{headers:user?{'oai-authenticated-user-id':user}:{}});
      assert.equal((await api.getHeadTeachingDrafts(request,db,HEAD_LINK_REVISION,kind)).status,status);assert.equal(prepares,0);
    }
  }
});

test('nine real-schema histories isolate accounts, append, race, retain stale revisions and reject poisoned rows',{timeout:60000},async()=>{
  const entry=`
    import {getHeadTeachingDrafts,postHeadTeachingDraft} from './lib/head-teaching-review-api';
    import {headTeachingDraftContext,blankHeadTeachingDraft} from './lib/head-teaching-review-contract';
    import {HEAD_LINK_REVISION} from './lib/head-atlas-links';
    export default {async fetch(request,env){
      const url=new URL(request.url),kind=url.pathname.slice(1);
      if(kind==='fixture'){
        const context=await headTeachingDraftContext(HEAD_LINK_REVISION,url.searchParams.get('kind'));
        return Response.json({context,draft:blankHeadTeachingDraft(context)});
      }
      return request.method==='POST'?postHeadTeachingDraft(request,env.DB,HEAD_LINK_REVISION,kind):getHeadTeachingDrafts(request,env.DB,HEAD_LINK_REVISION,kind);
    }};`;
  const bundle=await build({stdin:{contents:entry,resolveDir:process.cwd(),sourcefile:'mri-independent-review-fixture.ts'},bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022'});
  const mf=new Miniflare(convertV4MiniflareOptions({modules:[{type:'ESModule',path:resolve('.local/mri-independent-review-fixture.mjs'),contents:bundle.outputFiles[0].text}],compatibilityDate:'2026-08-23',d1Databases:['DB'],log:new Log(LogLevel.NONE)}));
  try{
    const db=await mf.getD1Database('DB');
    for(const sql of readFileSync('drizzle/0008_solid_infant_terrible.sql','utf8').split('--> statement-breakpoint').map(value=>value.trim()).filter(Boolean))await db.prepare(sql).run();
    const contexts=await Promise.all(kinds.map(async kind=>((await (await mf.dispatchFetch('https://review.test/fixture?kind='+kind)).json()) as {context:HeadTeachingDraftContext}).context));
    const call=(kind:string,user:string|null,payload?:unknown,query='')=>mf.dispatchFetch('https://review.test/'+kind+query,{method:payload===undefined?'GET':'POST',headers:{...(user?{'oai-authenticated-user-id':user}:{}),...(payload===undefined?{}:{origin:'https://review.test','content-type':'application/json'})},...(payload===undefined?{}:{body:JSON.stringify(payload)})});
    const history=async(kind:string,user='alice',query='')=>{
      const response=await call(kind,user,undefined,query);assert.equal(response.status,200,await response.clone().text());
      assert.match(response.headers.get('Cache-Control')??'',/private, no-store/);
      return await response.json() as {context:HeadTeachingDraftContext;history:ReturnType<typeof event>[]};
    };
    for(const [index,kind] of newKinds.entries()){
      assert.equal((await call(kind,null)).status,401);
      assert.equal((await call(kind,null,body(contexts[index+7]))).status,401);
      for(const other of contexts.filter(context=>context!==contexts[index+7]))assert.equal((await call(kind,'alice',body(other))).status,400);
    }
    assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM atlas_personal_nested_review_events').first<{count:number}>())!.count,0);
    for(const [index,kind] of kinds.entries()){
      const response=await call(kind,'alice',body(contexts[index]));assert.equal(response.status,201,await response.clone().text());
      assert.match(response.headers.get('Cache-Control')??'',/private, no-store/);
    }
    const firstEvents=new Map<string,ReturnType<typeof event>>();
    for(const [index,kind] of kinds.entries()){
      const value=await history(kind);assert.deepEqual(value.context,contexts[index]);assert.deepEqual(value.history.map(item=>item.version),[1]);
      firstEvents.set(kind,value.history[0]);assert.deepEqual((await history(kind,'bob')).history,[]);
    }
    for(const [index,kind] of newKinds.entries()){
      const context=contexts[index+7];
      assert.equal((await call(kind,'alice',body(context))).status,409);
      const changed={...body(context,1),draft:{...blankHeadTeachingDraft(context),status:'changes-required',notes:'Correct this synthetic MRI teaching note.'}};
      assert.equal((await call(kind,'alice',changed)).status,201);
      const raced=await Promise.all([call(kind,'alice',{...changed,expectedVersion:2}),call(kind,'alice',{...changed,expectedVersion:2})]);
      assert.deepEqual(raced.map(response=>response.status).sort(),[201,409]);
      assert.deepEqual((await history(kind)).history.map(item=>item.version),[3,2,1]);
      assert.deepEqual((await history(kind,'alice','?before=2')).history,[firstEvents.get(kind)]);
      assert.equal((await call(kind,'bob',body(context))).status,201);
      assert.deepEqual((await history(kind,'bob')).history.map(item=>item.version),[1]);
    }
    const rows=(await db.prepare('SELECT user_id,nested_key,structure_id,track FROM atlas_personal_nested_review_events').all<{user_id:string;nested_key:string;structure_id:string;track:string}>()).results;
    assert.equal(rows.length,15);assert.equal(new Set(rows.map(row=>row.user_id)).size,11);
    assert.equal(new Set(rows.map(row=>row.nested_key)).size,9);assert.equal(new Set(rows.map(row=>row.structure_id)).size,9);
    assert.deepEqual([...new Set(rows.map(row=>row.track))],['teaching']);
    for(const [index,kind] of newKinds.entries()){
      const context=contexts[index+7],key=JSON.stringify([`vm-head-${kind}-drafts-1`,'mri-reference3d']),user=JSON.stringify([`vm-head-${kind}-personal-drafts-1`,'alice']);
      assert(rows.some(row=>row.user_id===user&&row.nested_key===key&&row.structure_id===context.packetId));
      const original=firstEvents.get(kind)!;
      const update=async(payload:unknown,savedAt=original.savedAt)=>db.prepare('UPDATE atlas_personal_nested_review_events SET payload=?,saved_at=? WHERE user_id=? AND nested_key=? AND version=1').bind(JSON.stringify(payload),savedAt,user,key).run();
      const stale={...original,context:{...original.context,packetRevision:'f'.repeat(64)}};
      await update(stale);
      const staleHistory=await history(kind,'alice','?before=2');assert.deepEqual(staleHistory.history,[stale]);assert(headTeachingDraftStale(staleHistory.history[0],context));
      for(const poison of [firstEvents.get('anatomy'),firstEvents.get(newKinds[1-index]),{...original,version:2},{...original,draft:{...original.draft,attested:true}},{...original,context:{...context,conceptIds:['limbic-left-hippocampus']}}]){
        await update(poison);
        assert.equal((await call(kind,'alice',undefined,'?before=2')).status,503);
        assert.equal((await call(kind,'alice',body(context,3))).status,503);
        assert.equal((await call(newKinds[1-index],'alice')).status,200);
      }
      await update(original,'2026-10-12T13:00:00.000Z');assert.equal((await call(kind,'alice',undefined,'?before=2')).status,503);
      await update(original);
      assert.deepEqual((await history(kind,'alice','?before=2')).history,[original]);
    }
    for(const kind of oldKinds)assert.deepEqual((await history(kind)).history,[firstEvents.get(kind)]);
  }finally{await mf.dispose();}
});

test('MRI clients and private working copies enforce independent identity and no approval',async()=>{
  const contexts=await Promise.all(kinds.map(kind=>headTeachingDraftContext(HEAD_LINK_REVISION,kind)));
  for(const context of contexts.slice(7)){
    const saved=event(context),draft=saved.draft;
    const empty={context,history:[],nextBefore:null,scope:'private-to-signed-in-account-and-institution'};
    assert.deepEqual(client.parseHeadTeachingHistory(empty,context).history,[]);
    assert.deepEqual(client.confirmHeadTeachingSave({review:saved},context,0,draft),saved);
    for(const other of contexts.filter(item=>item!==context)){
      assert.throws(()=>client.parseHeadTeachingHistory({...empty,context:other},context));
      assert.throws(()=>client.parseHeadTeachingHistory({...empty,history:[event(other)]},context));
      assert.throws(()=>client.confirmHeadTeachingSave({review:event(other)},context,0,draft));
    }
    assert.throws(()=>client.parseHeadTeachingHistory({...empty,history:[saved,saved]},context));
    for(const forged of [{...saved,version:2},{...saved,draft:{...draft,notes:'different'}},{...saved,draft:{...draft,attested:true}},{...saved,context:{...context,packetRevision:'f'.repeat(64)}}])assert.throws(()=>client.confirmHeadTeachingSave({review:forged},context,0,draft));
    const local={...draft,status:'changes-required' as const,notes:'  short\n'};
    const copy=headTeachingWorkingCopy(context,local,{baseVersion:null,unsavedChanges:true,saveUncertain:false,reloadRequired:false},stamp);
    assert.equal(copy.kind,context.packetId);assert.deepEqual(copy.context,context);assert.equal(copy.workingDraft.notes,local.notes);
    for(const flag of ['serverSaveConfirmed','clinicalApproval','publicationApproval','patientRegistration'] as const)assert.equal(copy[flag],false);
    assert.throws(()=>headTeachingWorkingCopy(context,{...draft,attested:true} as any,copy.editState,stamp));
    assert.throws(()=>headTeachingWorkingCopy({...context,conceptIds:['limbic-left-hippocampus']},draft,copy.editState,stamp));
    const original=context.conceptIds[0];
    try{context.conceptIds[0]='synthetic-local-change';assert.notDeepEqual(copy.context,context);}
    finally{context.conceptIds[0]=original;}
  }
});

test('explicit MRI working-copy downloads retain exact private identity and unfinished text',async(t)=>{
  let captured:Blob|undefined,clicked=0,removed=0;
  const anchor={href:'',download:'',hidden:false,click(){clicked++;},remove(){removed++;}};
  const documentBefore=Object.getOwnPropertyDescriptor(globalThis,'document');
  Object.defineProperty(globalThis,'document',{configurable:true,value:{createElement(tag:string){assert.equal(tag,'a');return anchor;},body:{appendChild(value:unknown){assert.equal(value,anchor);}}}});
  t.mock.method(URL,'createObjectURL',(blob:Blob)=>{captured=blob;return 'blob:synthetic-private-copy';});
  t.mock.method(URL,'revokeObjectURL',(url:string)=>assert.equal(url,'blob:synthetic-private-copy'));
  t.mock.method(globalThis,'setTimeout',((callback:()=>void)=>{callback();return 0;}) as any);
  try{
    for(const kind of newKinds){
      const context=await headTeachingDraftContext(HEAD_LINK_REVISION,kind);
      const draft={...blankHeadTeachingDraft(context),status:'changes-required' as const,notes:'  unfinished\n'};
      const copy=headTeachingWorkingCopy(context,draft,{baseVersion:null,unsavedChanges:true,saveUncertain:true,reloadRequired:true},stamp);
      downloadHeadWorkingCopy(copy);
      assert.equal(anchor.download,`visible-medicine-head-${kind}-working-copy-2026-10-12T12-00-00.000Z.json`);
      assert.equal(anchor.href,'blob:synthetic-private-copy');assert.equal(anchor.hidden,true);
      assert(captured);assert.equal(captured.type,'application/json');assert.deepEqual(JSON.parse(await captured.text()),copy);
    }
    assert.equal(clicked,2);assert.equal(removed,2);
  }finally{
    if(documentBefore)Object.defineProperty(globalThis,'document',documentBefore);else Reflect.deleteProperty(globalThis,'document');
  }
});

test('both concrete MRI routes use the existing clinical authorization guard',()=>{
  for(const kind of newKinds){
    const source=readFileSync(resolve(`app/api/atlas-review/head-${kind}/route.ts`),'utf8');
    assert.match(source,new RegExp(`runClinicalReview\\(request,guarded=>getHeadTeachingDrafts\\(guarded,[^\\n]*'${kind}'\\)`));
    assert.match(source,new RegExp(`runClinicalReview\\(request,guarded=>postHeadTeachingDraft\\(guarded,[^\\n]*'${kind}'\\)`));
    const binder=readFileSync(resolve('scripts/bind-clinical-review.mjs'),'utf8');
    assert(binder.includes(`'app/api/atlas-review/head-${kind}/route.ts'`));
  }
});
