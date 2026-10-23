import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';import {dirname,relative} from 'node:path';import {fileURLToPath} from 'node:url';import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),head='0327b6360e18b62563265d115df2b779c9397792';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8'),prior=p=>execFileSync('git',['show',head+':'+p],{cwd:root,encoding:'utf8',maxBuffer:32e6});
const same=(a,b,message)=>assert.deepEqual(structuredClone(a),structuredClone(b),message);
const require=createRequire(new URL('../package.json',import.meta.url)),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const entry=`export * from './lib/reasoning-questions';export * from './lib/upper-cervical-reasoning';export * from './lib/atlas-practice';export * from './lib/body-review-material';export * from './lib/body-reasoning-review';export * from './lib/body-review-response';export * from './lib/body-review-context';export * from './lib/body-review-decisions';export * from './lib/body-review-api';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {ReasoningFeedback} from './app/reasoning-feedback';`;
async function load(previous=false){
 const result=await build({stdin:{contents:previous?entry.replace("export * from './lib/upper-cervical-reasoning';",''):entry,resolveDir:root,loader:'ts'},bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',plugins:previous?[{name:'exact-predecessor',setup(api){api.onLoad({filter:/\.(?:ts|tsx|json)$/},args=>{const p=relative(root,args.path).replaceAll('\\','/');return{contents:prior(p),loader:p.endsWith('.json')?'json':p.endsWith('.tsx')?'tsx':'ts',resolveDir:dirname(args.path)};});}}]:[]});
 const module={exports:{}};runInNewContext(result.outputFiles[0].text,{module,exports:module.exports,require,crypto,TextEncoder,TextDecoder,Request,Response,structuredClone,URL,URLSearchParams});return module.exports;
}
const previous=await load(true),api=await load(),catalog=api.bodyDisplayCatalog(JSON.parse(await read('public/models/bodyparts3d/full-body/catalog.json'))),pins=JSON.parse(await read('content/upper-cervical-reasoning-pins.json'));
same(pins.parentSource,head);same(api.reasoningConcepts.slice(0,193),previous.reasoningConcepts);assert.equal(api.reasoningConcepts.length,197);assert.equal(previous.reasoningConcepts.length,193);
assert.equal(catalog.structures.filter(previous.reasoningConceptFor).length,346);assert.equal(catalog.structures.filter(api.reasoningConceptFor).length,354);
same(api.reasoningConcepts.slice(193),api.upperCervicalReasoningConcepts);assert.equal(pins.entries.length,8);
const expected=[['rectus-capitis-posterior-minor',['FMA32532','FMA32533'],['FJ1590','FJ1568']],['obliquus-capitis-superior',['FMA32534','FMA32535'],['FJ1585','FJ1564']],['rectus-capitis-anterior',['FMA46313','FMA46314'],['FJ1588','FJ1566']],['rectus-capitis-lateralis',['FMA46317','FMA46318'],['FJ1591','FJ1569']]];
same(api.upperCervicalReasoningConcepts.map(c=>c.key),expected.map(([slug])=>'upper-cervical-'+slug));
const isa=(await read('LICENSES/bodyparts3d-v4-index/isa_element_parts.txt')).trim().split(/\r?\n/).map(s=>s.split('\t'));
const leaves=(value,parts=[])=>value===null||typeof value!=='object'?[parts]:Object.entries(value).flatMap(([k,v])=>leaves(v,[...parts,k]));
const loaded=catalog.bundles.map(b=>b.id),create=(target,scope=catalog.structures,bundles=loaded,opts={},random=()=>.314159)=>api.createPracticeSession(scope,bundles,{id:1,mode:'reason',sampling:'all',count:1,retryIds:[target.id],...opts},random);
const feedback=session=>renderToStaticMarkup(React.createElement(api.ReasoningFeedback,{session}));let identityNegatives=0,plays=0,packetNegatives=0,stalePosts=0;
for(const [slug,fmas,files] of expected){
 const key='upper-cervical-'+slug,concept=api.upperCervicalReasoningConcepts.find(c=>c.key===key);assert(concept);assert.equal(concept.readiness,'draft');assert.equal(concept.revision,1);assert.equal(concept.region,'spine');assert.equal(concept.sourceTree,'isa');same(concept.sourceRegions,['spine']);assert.equal(concept.sourceTissue,undefined);same(new Set(concept.distractors),new Set(expected.filter(([s])=>s!==slug).map(([s])=>'upper-cervical-'+s)));assert(concept.prompt.length>40&&concept.explanation.length>40);
 same(concept.bindings.map(b=>[b.fma,b.side,b.files??[b.file]]),fmas.map((fma,i)=>[fma,i===0?'right':'left',[files[i]]]));
 for(const ref of concept.references){const u=new URL(ref.url);assert.equal(u.protocol,'https:');assert(['medicine.uams.edu','anatomy.ttuhscep.edu'].includes(u.hostname));}
 for(const fma of fmas){
  const matches=catalog.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1);const target=matches[0],pin=pins.entries.find(e=>e.identity.id===target.id);assert(pin);same(target,pin.identity);assert.equal(pin.key,key);same(isa.filter(row=>row[0]===fma).map(row=>row[2]),target.sources.map(s=>s.file));
  assert.equal(api.upperCervicalReasoningSourceMatches(target,key),true);assert.equal(api.reasoningConceptFor(target)?.key,key);assert.equal(previous.reasoningConceptFor(target),undefined);
  for(const parts of leaves(target)){
   const bad=structuredClone(target);let n=bad;for(const p of parts.slice(0,-1))n=n[p];const last=parts.at(-1),value=n[last];n[last]=typeof value==='number'?value+.01:typeof value==='boolean'?!value:String(value)+'-foreign';
   assert.equal(api.upperCervicalReasoningSourceMatches(bad,key),false,parts.join('.'));assert.equal(api.reasoningConceptFor(bad),undefined,parts.join('.'));identityNegatives++;
  }
  for(const bad of [{...target,unexpected:true},(()=>{const b=structuredClone(target);delete b.coverageNote;return b;})()]){assert.equal(api.upperCervicalReasoningSourceMatches(bad,key),false);assert.equal(api.reasoningConceptFor(bad),undefined);identityNegatives++;}
  for(const scope of [catalog.structures,catalog.structures.filter(s=>s.regions.includes('spine'))])for(const random of [()=>0,()=>.314159,()=>.999999]){
   const session=create(target,scope,loaded,{},random);assert(session);const q=session.questions[0];assert.equal(q.target,target.id);assert.equal(q.reasoning.key,key);assert.equal(q.choices.length,4);assert.equal(new Set(q.choices).size,4);
   for(const id of q.choices){const choice=scope.find(s=>s.id===id);assert(choice);assert.equal(choice.laterality,target.laterality);assert(loaded.includes(choice.bundle));if(id!==target.id)assert(concept.distractors.includes(api.reasoningConceptFor(choice)?.key));}
   assert.equal(feedback(session),'');const action={sessionId:session.id,index:0},wrong=q.choices.find(id=>id!==target.id);
   const correct=api.practiceReducer(session,{type:'answer',...action,chosen:target.id});assert.equal(api.practiceScore(correct),1);same(api.practiceReducer(correct,{type:'answer',...action,chosen:wrong}),correct);assert(feedback(correct).includes('Sources &amp; scope'));
   const incorrect=api.practiceReducer(session,{type:'answer',...action,chosen:wrong});assert.equal(api.practiceScore(incorrect),0);const done=api.practiceReducer(incorrect,{type:'next',...action});same(api.missedPracticeIds(done.responses),[target.id]);assert.equal(create(target,scope,loaded,{retryIds:api.missedPracticeIds(done.responses)})?.questions[0].target,target.id);plays++;
  }
  assert.equal(create(target,[target]),null);assert.equal(create(target,catalog.structures,loaded.filter(b=>b!==target.bundle)),null);assert.equal(create(target,catalog.structures.filter(s=>s.id!==target.id)),null);
  const material=await api.bodyReviewMaterial(target.id),before=await previous.bodyReviewMaterial(target.id);assert(material?.reasoning);assert.equal(before.reasoning,null);same(material.source,before.source);same(material.topics,before.topics);same(material.guidedTours,before.guidedTours);same(material.checklist,before.checklist);assert.equal(material.approval,false);assert.equal(material.status,'worksheet-not-submitted');assert.notEqual(material.fingerprints.teaching,before.fingerprints.teaching);assert(await api.parseBodyReviewResponse(material,target.id));assert.equal(await api.parseBodyReviewResponse(before,target.id),null);
  for(const edit of [p=>{p.reasoning.answerId=p.reasoning.choices.find(c=>c.id!==target.id).id;},p=>{p.reasoning.explanation+=' altered';},p=>{p.reasoning.readiness='approved';},p=>{p.reasoning.choices[0].sources[0].sha256='0'.repeat(64);},p=>{p.reasoning.references[0].url='javascript:alert(1)';}]){const bad=structuredClone(material);edit(bad);assert.equal(await api.parseBodyReviewResponse(bad,target.id),null);packetNegatives++;}
  const oldContext=await previous.bodyReviewContext(target.id),context=await api.bodyReviewContext(target.id);assert(oldContext&&context);let storageCalls=0;
  const stale={catalogScope:oldContext.catalogScope,structureId:target.id,track:'teaching',expectedVersion:0,materialHash:oldContext.materialHash,revisionHash:oldContext.revisions.teaching,checklistVersion:oldContext.checklistVersion,draft:api.blankBodyReview(oldContext,'teaching')};
  const response=await api.postBodyDecision(new Request('https://atlas.example/api/body-review/decisions',{method:'POST',headers:{'content-type':'application/json','oai-authenticated-user-id':'synthetic-reviewer',origin:'https://atlas.example'},body:JSON.stringify(stale)}),{prepare(){storageCalls++;throw Error('Stale question touched storage');}});
  assert.equal(response.status,409);assert.equal(storageCalls,0);stalePosts++;
 }
}
const docs=await read('docs/UPPER_CERVICAL_REASONING.md');for(const {identity} of pins.entries){assert(docs.includes(identity.id));assert(docs.includes(identity.fmaId));assert(docs.includes(identity.sources[0].file));assert(docs.includes(identity.sources[0].sha256));}
console.log(JSON.stringify({concepts:197,representedRoots:354,newConcepts:4,newRoots:8,identityNegatives,practicePaths:plays,packetNegatives,stalePosts,clinicalApproval:false,patientSpaceRegistration:false}));
