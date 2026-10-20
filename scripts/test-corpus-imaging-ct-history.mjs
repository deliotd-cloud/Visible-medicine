import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {beforeCorpusImagingCt} from './corpus-imaging-ct-history.mjs';
import pins from '../content/corpus-imaging-ct.pins.json' with {type:'json'};
import transition from '../content/corpus-imaging-ct.transition.json' with {type:'json'};

const sha=b=>createHash('sha256').update(b).digest('hex'),hash=v=>sha(JSON.stringify(v));
const parent='87ed7e343260c7df48a40d53503f25bbfd34cfa5';
const ctx=await contentContext(),api=ctx.api,catalog=api.bodyDisplayCatalog(ctx.catalog);
const old=await exactSourceHistoryApi(parent,'review-security');
const compiled=await build({stdin:{contents:"export * from './lib/body-review-api.ts';export * from './lib/body-review-context.ts';export * from './lib/body-review-decisions.ts';export {regionalTours} from './lib/regional-tours.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const security=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const identity=pins.entries[0].identity,id=identity.id;
const snapshot=a=>catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(tab=>[tab,a.bodyLesson(s,tab)]))}));
const shown=lesson=>{const{readiness:_,...content}=lesson;return content;};
const git=path=>execFileSync('git',['show',parent+':'+path],{windowsHide:true,maxBuffer:16e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});

test('exact CT source and sole topic/export delta preserve all other teaching and geometry',async()=>{
  assert.equal(pins.parentCommit,parent);
  assert.equal(execFileSync('git',['rev-parse',parent+'^{tree}'],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim(),pins.parentTree);
  assert.equal(sha(readFileSync(pins.sourcePath)),pins.sourceCatalogSha256);
  assert.equal(sha(readFileSync('public/models/bodyparts3d/full-body/catalog.json')),pins.rawCatalogSha256);
  const bytes=readFileSync('public'+new URL(pins.bundle.url,'https://local.invalid').pathname);
  assert.equal(bytes.length,pins.bundle.bytes);assert.equal(sha(bytes),pins.bundle.sha256);
  assert.equal(identity.fmaId,'FMA19617');assert.deepEqual(identity.sources.map(s=>s.file),['FJ3133']);
  assert.equal(catalog.structures.length,1104);assert.equal(ctx.catalog.structures.length,1022);
  assert.equal(hash(catalog),pins.displayCatalogHash);assert.deepEqual(catalog,old.bodyDisplayCatalog(ctx.catalog));
  assert.equal(hash(api.structures),pins.shoulderStructuresHash);assert.equal(hash(api.dissectionProfiles),pins.recipesHash);
  assert.deepEqual(api.structures,old.structures);assert.deepEqual(api.dissectionProfiles,old.dissectionProfiles);assert.deepEqual(security.regionalTours,old.regionalTours);
  const before=snapshot(old),after=snapshot(api);assert.equal(hash(before),pins.allLessonsBeforeHash);assert.equal(hash(after),transition.allLessonsAfterHash);
  const changes=[];for(let i=0;i<after.length;i++)for(const tab of api.contentTabs)if(hash(after[i].sections[tab])!==hash(before[i].sections[tab]))changes.push({id:after[i].id,tab});
  assert.deepEqual(changes,[{id,tab:'ct'}]);assert.equal(after.length*api.contentTabs.length-changes.length,9935);
  assert.deepEqual(old.bodyLesson(identity,'ct'),pins.entries[0].previous.ct);assert.equal(old.bodyLesson(identity,'ct').readiness,'pending');
  assert.deepEqual(api.bodyLesson(identity,'ct'),transition.entries[0].current);
  const records=api.bodyContentRecords(catalog),previous=old.bodyContentRecords(catalog),registry=new Map([...ctx.shoulder,...records].map(r=>[r.representationScope+'|'+r.id,r]));
  const validate=await contentValidator(registry);let changedRecords=0;
  for(let i=0;i<records.length;i++){
    assert(validate(records[i]));if(records[i].id!==id){assert.deepEqual(records[i],previous[i]);continue;}
    changedRecords++;const a=structuredClone(records[i]),b=structuredClone(previous[i]);assert.deepEqual(a.content.ct,transition.entries[0].current);a.content.ct=b.content.ct;assert.deepEqual(a,b);
    assert.equal(a.validation.clinicalApproval,'not-included');for(const value of Object.values(a.validation.materialRevisions))assert.equal(value,null);
  }assert.equal(changedRecords,1);
  const target=records.find(r=>r.id===id);
  for(const change of [r=>r.meshBindings[0].assetSha256='0'.repeat(64),r=>r.validation.clinicalApproval='approved',r=>r.validation.materialRevisions.imaging='0'.repeat(64)]){const bad=structuredClone(target);change(bad);assert.throws(()=>validate(bad));}
});

test('CT helper rejects altered/foreign identities and preserves MRI/US with detached draft arrays',()=>{
  function leaves(value,path=[]){return value&&typeof value==='object'?Object.entries(value).flatMap(([k,v])=>leaves(v,[...path,k])):[path];}
  let refused=0;for(const path of leaves(identity)){
    const bad=structuredClone(identity);let at=bad;for(const k of path.slice(0,-1))at=at[k];const key=path.at(-1),value=at[key];at[key]=typeof value==='string'?value+'-foreign':typeof value==='number'?value+1:typeof value==='boolean'?!value:'foreign';
    assert.equal(api.corpusImagingLesson(bad,'ct'),undefined);refused++;
  }
  for(const key of Object.keys(identity)){const bad=structuredClone(identity);delete bad[key];assert.equal(api.corpusImagingLesson(bad,'ct'),undefined);refused++;}
  for(const change of [s=>s.foreign=true,s=>s.sources=[],s=>s.sources.push({...s.sources[0]}),s=>s.anchor.reverse()]){const bad=structuredClone(identity);change(bad);assert.equal(api.corpusImagingLesson(bad,'ct'),undefined);refused++;}
  assert.equal(refused,56,'33 pinned identity leaves, 19 removals and four structural mutations');
  for(const s of catalog.structures)for(const tab of [...api.contentTabs,'foreign'])if(s.id!==id||!['ct','mri','ultrasound'].includes(tab))assert.equal(api.corpusImagingLesson(s,tab),undefined);
  for(const tab of ['mri','ultrasound'])assert.deepEqual(api.corpusImagingLesson(identity,tab),old.bodyLesson(identity,tab));
  const lesson=api.corpusImagingLesson(identity,'ct'),clean=structuredClone(lesson);lesson.bullets.push('foreign');lesson.citations[0]='https://foreign.invalid';assert.deepEqual(api.corpusImagingLesson(identity,'ct'),clean);
  assert.deepEqual(api.bodyContent(identity,'ct'),shown(clean));assert.equal(clean.readiness,'draft');assert(clean.note.includes('paid-lecture access remain independent'));assert(clean.note.includes('No patient registration, scan or clinical approval'));
  assert.deepEqual(clean.citations,['https://doi.org/10.3390/app11031006','https://training.seer.cancer.gov/anatomy/reproductive/male/penis.html']);
  assert(clean.bullets.some(b=>b.includes('22 men')&&b.includes('not evidence that routine CT')));assert(clean.bullets.some(b=>b.includes('did not measure')&&b.includes('study-specific limitation')));assert(clean.bullets.some(b=>b.includes('no glans')&&b.includes('not a CT segmentation')));
});

test('all review packets retain source/checklist scope, with one teaching-only material change',async()=>{
  let changed=0;for(const s of catalog.structures){const now=await api.bodyReviewMaterial(s.id),previous=await old.bodyReviewMaterial(s.id);assert.equal(now.approval,false);assert.equal(now.status,'worksheet-not-submitted');if(s.id!==id){assert.deepEqual(now,previous);continue;}changed++;
    assert.deepEqual(now.fingerprints,transition.reviewAfter);assert.deepEqual(previous.fingerprints,transition.reviewBefore);assert.equal(now.materialHash,transition.reviewAfterMaterialHash);assert.equal(previous.materialHash,transition.reviewBeforeMaterialHash);
    assert.notEqual(now.fingerprints.teaching,previous.fingerprints.teaching);assert.equal(now.fingerprints.source,previous.fingerprints.source);assert.equal(now.fingerprints.checklist,previous.fingerprints.checklist);
    const changedTopics=now.topics.filter((topic,index)=>hash(topic)!==hash(previous.topics[index]));assert.deepEqual(changedTopics.map(t=>t.tab),['ct']);
    const copy=structuredClone(now);copy.topics=previous.topics;copy.fingerprints=previous.fingerprints;copy.materialHash=previous.materialHash;assert.deepEqual(copy,previous);
  }assert.equal(changed,1);
});

test('strict CT reversal restores exact parent and rejects missing helpers, source and teaching substitutions',()=>{
  const before=beforeCorpusImagingCt(api,ctx.catalog);assert.equal(beforeCorpusImagingCt(before,ctx.catalog),before);assert.deepEqual(snapshot(before),snapshot(old));assert.deepEqual(api.bodyLesson(identity,'ct'),transition.entries[0].current);
  const lesson=before.bodyLesson(identity,'ct');lesson.bullets.push('foreign');assert.deepEqual(before.bodyLesson(identity,'ct'),pins.entries[0].previous.ct);
  for(const value of [undefined,null,()=>({...transition.entries[0].current,body:'foreign'})])assert.throws(()=>beforeCorpusImagingCt({...api,corpusImagingLesson:value},ctx.catalog));
  const omitted={...api};delete omitted.corpusImagingLesson;assert.throws(()=>beforeCorpusImagingCt(omitted,ctx.catalog));assert.throws(()=>beforeCorpusImagingCt(Object.create(api),ctx.catalog));
  for(const field of ['sourceVersion','license','credit','coordinateSystem']){const bad=structuredClone(catalog);bad[field]='foreign';assert.throws(()=>beforeCorpusImagingCt({...api,bodyDisplayCatalog:()=>bad},ctx.catalog));}
  for(const change of [c=>c.structures=c.structures.filter(s=>s.id!==id),c=>c.structures.push({...identity}),c=>c.structures.find(s=>s.id===id).anchor[0]++,c=>c.bundles=c.bundles.filter(b=>b.id!==pins.bundle.id),c=>c.bundles.push({...pins.bundle}),c=>c.bundles.find(b=>b.id===pins.bundle.id).sha256='foreign']){const bad=structuredClone(catalog);change(bad);assert.throws(()=>beforeCorpusImagingCt({...api,bodyDisplayCatalog:()=>bad},ctx.catalog));}
  assert.throws(()=>beforeCorpusImagingCt({...api,bodyLesson:(s,t)=>s.id===id&&t==='ct'?{...api.bodyLesson(s,t),body:'foreign'}:api.bodyLesson(s,t)},ctx.catalog));assert.throws(()=>beforeCorpusImagingCt({...api,bodyContent:()=>({body:'foreign'})},ctx.catalog));
  const bad=structuredClone(identity);bad.anchor[0]++;assert.throws(()=>before.bodyLesson(bad,'ct'));
  const kept=pins.entries[0].identity.name;try{pins.entries[0].identity.name+='foreign';assert.throws(()=>beforeCorpusImagingCt(api,ctx.catalog));}finally{pins.entries[0].identity.name=kept;}
  const saved=transition.entries[0].current.body;try{transition.entries[0].current.body+='foreign';assert.throws(()=>beforeCorpusImagingCt(api,ctx.catalog));}finally{transition.entries[0].current.body=saved;}
});

test('original MRI/US artifacts and every legacy validator assertion retain exact parent bytes',()=>{
  for(const path of ['content/corpus-imaging-pins.json','content/corpus-imaging.transition.json','scripts/corpus-imaging-history.mjs','scripts/pin-corpus-imaging.mjs'])assert.deepEqual(readFileSync(path),git(path),path+' unchanged');
  const importLine="import {exactSourceHistoryApi} from './exact-source-history-api.mjs';\n";
  const added="// Original MRI/US assertions retain their closed helper; the CT extension has its own current-source suite.\nconst {corpusImagingLesson:lesson}=await exactSourceHistoryApi('87ed7e343260c7df48a40d53503f25bbfd34cfa5','corpus-imaging-legacy');";
  const original="const compiled=await build({stdin:{contents:\"export * from './lib/corpus-imaging';\",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});\nconst {corpusImagingLesson:lesson}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));";
  const current=readFileSync('scripts/validate-corpus-imaging.mjs','utf8');assert(current.includes(importLine)&&current.includes(added));assert.deepEqual(Buffer.from(current.replace(importLine,'').replace(added,original)),git('scripts/validate-corpus-imaging.mjs'));
  const xrayOld='const ctx=await contentContext(),api=ctx.api,catalog=api.bodyDisplayCatalog(ctx.catalog);';
  const xrayNew="// Completed X-ray assertions replay their exact parent; the CT suite checks current source independently.\nconst ctx=await contentContext(),api=await exactSourceHistoryApi('87ed7e343260c7df48a40d53503f25bbfd34cfa5','corpus-xray-v2-legacy'),catalog=api.bodyDisplayCatalog(ctx.catalog);";
  const xray=readFileSync('scripts/test-corpus-spongiosum-xray-v2.mjs','utf8');assert(xray.includes(xrayNew));assert.deepEqual(Buffer.from(xray.replace(xrayNew,xrayOld)),git('scripts/test-corpus-spongiosum-xray-v2.mjs'));
  const mraOld="const live=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));";
  const mraNew="// Completed MRA assertions replay their exact parent; the CT suite checks current source independently.\nconst live=await exactSourceHistoryApi('87ed7e343260c7df48a40d53503f25bbfd34cfa5','inferior-thyroid-mra-legacy');";
  const mra=readFileSync('scripts/test-inferior-thyroid-mra-evidence.mjs','utf8');assert(mra.includes(mraNew));assert.deepEqual(Buffer.from(mra.replace(mraNew,mraOld)),git('scripts/test-inferior-thyroid-mra-evidence.mjs'));
});

test('exact legacy export profiles resolve original MRI/US, X-ray and MRA helpers',async()=>{
  const imaging=await exactSourceHistoryApi(parent,'corpus-imaging-legacy');assert.equal(imaging.corpusImagingLesson(identity,'ct'),undefined);
  for(const tab of ['mri','ultrasound'])assert.deepEqual(imaging.corpusImagingLesson(identity,tab),old.bodyLesson(identity,tab));
  const xray=await exactSourceHistoryApi(parent,'corpus-xray-v2-legacy');assert.deepEqual(xray.corpusSpongiosumXrayLesson(identity,'xray'),old.bodyLesson(identity,'xray'));assert.deepEqual(xray.bodyLesson(identity,'ct'),pins.entries[0].previous.ct);
  const mra=await exactSourceHistoryApi(parent,'inferior-thyroid-mra-legacy'),arterialPins=JSON.parse(readFileSync('content/arterial-evidence-limits-pins.json','utf8'));
  for(const entry of arterialPins.entries.filter(e=>e.family==='inferiorThyroidMri'))assert.deepEqual(mra.arterialEvidenceLimitLesson(entry.identity,'mri'),old.bodyLesson(entry.identity,'mri'));
  assert.deepEqual(mra.bodyLesson(identity,'ct'),pins.entries[0].previous.ct);
});

test('actual review API refuses stale/foreign/unauthorized requests before storage; synthetic draft readback stays unapproved',async()=>{
  const context=await security.bodyReviewContext(id),previous=await old.bodyReviewContext(id);assert(context&&previous);
  assert.equal(context.sourceHash,previous.sourceHash);assert.notEqual(context.materialHash,previous.materialHash);assert.notEqual(context.revisions.teaching,previous.revisions.teaching);assert.equal(context.revisions.imaging,null);
  // Direct pure-function requests only, using a reserved origin and disposable user.
  // No running server, real account, private record or authentication bypass.
  const origin='https://visible-medicine-review.test',user='synthetic-corpus-ct-review';
  const payload=(track='teaching')=>({catalogScope:context.catalogScope,structureId:id,track,expectedVersion:0,materialHash:context.materialHash,revisionHash:context.revisions[track],checklistVersion:context.checklistVersion,draft:security.blankBodyReview(context,track)});
  const request=(body,headers={})=>new Request(origin+'/api/body-review',{method:'POST',headers:{origin,'content-type':'application/json','oai-authenticated-user-id':user,...headers},body:JSON.stringify(body)});
  let storageTouches=0;const forbidden=new Proxy({}, {get(){storageTouches++;throw Error('Rejected request reached storage');}}),foreign=catalog.structures.find(s=>s.id!==id).id;
  const cases=[['old material',p=>p.materialHash=previous.materialHash,409],['old teaching',p=>p.revisionHash=previous.revisions.teaching,409],['foreign scope',p=>p.catalogScope='shoulder',400],['foreign id signature',p=>p.structureId=foreign,409],['unknown id',p=>p.structureId=id+'-foreign',404],['foreign checklist',p=>p.checklistVersion+='-foreign',409]];
  for(const[name,mutate,status]of cases){const p=payload();mutate(p);const response=await security.postBodyDecision(request(p),forbidden);assert.equal(response.status,status,name);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(typeof(await response.json()).error,'string');assert.equal(storageTouches,0);}
  const unauthenticated=request(payload());unauthenticated.headers.delete('oai-authenticated-user-id');assert.equal((await security.postBodyDecision(unauthenticated,forbidden)).status,401);
  assert.equal((await security.postBodyDecision(request(payload(),{origin:'https://foreign.test'}),forbidden)).status,403);
  assert.equal((await security.postBodyDecision(request(payload(),{'sec-fetch-site':'cross-site'}),forbidden)).status,403);
  const imaging=payload('imaging');Object.assign(imaging.draft,{status:'approved',reviewer:'Synthetic test only',qualification:'Synthetic test only',scope:'Synthetic unit test, not clinical review',attested:true,evidence:[{title:'Synthetic public reference',url:'https://example.test/reference',note:'Synthetic test only'}]});for(const key of Object.keys(imaging.draft.checks))imaging.draft.checks[key]=true;
  assert.equal((await security.postBodyDecision(request(imaging),forbidden)).status,422);assert.equal(storageTouches,0);
  const sqlite=new DatabaseSync(':memory:');try{
    sqlite.exec(readFileSync('drizzle/0001_body_review_events.sql','utf8'));
    const db={prepare(sql){return{bind(...values){const st=sqlite.prepare(sql.replace(/\?(\d+)/g,':p$1')),bindings=Object.fromEntries(values.map((value,index)=>['p'+(index+1),value]));return{async all(){return{results:st.all(bindings)};},async run(){return{meta:{changes:Number(st.run(bindings).changes)}};}};}};}};
    const input=payload();assert.equal(input.draft.status,'draft');assert.equal(input.draft.attested,false);
    const saved=await security.postBodyDecision(request(input),db);assert.equal(saved.status,201);const record=(await saved.json()).review;assert.equal(record.status,'draft');assert.equal(record.attested,false);assert.equal(record.reviewedAt,null);assert.equal(record.version,1);assert.equal(record.material.materialHash,context.materialHash);
    const readback=await security.getBodyDecisions(new Request(origin+'/api/body-review?structureId='+encodeURIComponent(id)+'&track=teaching',{headers:{'oai-authenticated-user-id':user}}),db);assert.equal(readback.status,200);const returned=await readback.json();assert.equal(returned.scope,'private-to-signed-in-user');assert.equal(returned.history.length,1);assert.deepEqual(returned.history[0],record);assert.equal(sqlite.prepare('SELECT COUNT(*) AS total FROM body_review_events').get().total,1);
  }finally{sqlite.close();}
});
