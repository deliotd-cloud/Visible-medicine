import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build,type PluginBuild} from 'esbuild';
import {desktopLayoutImportMilestone,desktopLayoutMilestoneBytes} from './atlas-cubital-ultrasound-history.ts';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const source='88cea927d48729769b96ad8fe680b0872b7e6687',base='792810f5bcf8808f57d2f55e12cca217ed4d262d';
const old=(p:string)=>Buffer.from(execFileSync('git',['show',base+':'+p],{maxBuffer:32e6}));
const imported=(p:string)=>Buffer.from(execFileSync('git',['show','f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6:'+p],{maxBuffer:32e6}));
const milestoneSource=(p:string)=>execFileSync('git',['-C','F:/VisibleMedicine/atlas','show',source+':'+p],{maxBuffer:32e6});
const featureSource='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const featureTree='1bd327fb20a52b35bec584675c457173c548e24b';
const currentSource=CURRENT_ATLAS_REVISION;
const sourceBytes=(p:string)=>execFileSync('git',['show',currentSource+':'+p],{cwd:currentAtlasDeliveryRoot(),maxBuffer:32e6});
const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const escaped=(s:string)=>s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;'}[m]!));
async function load(previous=false){
 const saved=previous?base:'4aa346e7923e3b303ad869d71e0ea36044d61aa6';
 const result=await build({stdin:{contents:`export * from './atlas-review/lib/nested-review-material';
 export * from './atlas-review/lib/nested-review';export * from './atlas-review/lib/nested-review-api';
 export * from './atlas-review/lib/nested-review-client';${previous?'':"export {eyeLayerGuide} from './atlas-review/lib/eye-layer-guide';"}
 export {default as Page} from './atlas-review/app/review/nested/page';`,resolveDir:process.cwd(),loader:'tsx'},
 bundle:true,write:false,platform:'node',format:'cjs',packages:'external',jsx:'automatic',loader:{'.css':'empty'},
 plugins:[{name:'exact-eye-guide-website-epoch',setup(api:PluginBuild){
  api.onLoad({filter:/[\\/]atlas-review[\\/].*\.(?:ts|tsx|json)$/},args=>{
   const path=relative(process.cwd(),args.path).replaceAll('\\','/');
   return {contents:execFileSync('git',['show',saved+':'+path],{encoding:'utf8',maxBuffer:32e6}),loader:path.endsWith('.json')?'json':path.endsWith('.tsx')?'tsx':'ts',resolveDir:dirname(args.path)};
  });
 }}]});
 const module={exports:{}},nodeRequire=createRequire(process.cwd()+'/package.json');
 const require=(id:string)=>{const value=nodeRequire(id);return ['next/link','next/image'].includes(id)?value.default??value:value;};
 runInNewContext(result.outputFiles[0].text,{module,exports:module.exports,require,crypto,Request,Response,URL,URLSearchParams,
  TextEncoder,TextDecoder,structuredClone,console,setTimeout,clearTimeout});
 return module.exports as any;
}
test('eye guide reaches learner and protected review with exact source, credits and unchanged model/access boundaries',async()=>{
 const api=await load(),review=desktopLayoutImportMilestone(),prior=JSON.parse(old('atlas-review/manifest.json').toString());
 const pin=validateCurrentAtlasDelivery(),sourceRoot=currentAtlasDeliveryRoot();
 assert.equal(pin.source,currentSource);
 assert.equal(execFileSync('git',['rev-parse',featureSource+'^{tree}'],{cwd:sourceRoot,encoding:'utf8'}).trim(),featureTree);
 assert.equal(review.files.length,944);assert.deepEqual(review.packages,prior.packages);
 assert.equal(JSON.parse(imported('atlas-review/manifest.json').toString()).revision,source);
 assert.deepEqual(imported('atlas-review/lib/eye-layer-guide.ts'),milestoneSource('lib/eye-layer-guide.ts'));
 const milestone=desktopLayoutImportMilestone(); // Exact saved inventory epoch, not later root-body teaching.
 assert.deepEqual(milestone.files.filter((f:any)=>!prior.files.some((p:any)=>p.path===f.path)).map((f:any)=>f.path).sort(),
  ['content/nested-guided-learning-bindings.v1.json','lib/eye-layer-guide.ts','lib/nested-guided-learning.ts']);
 assert.deepEqual(milestone.files.filter((f:any)=>prior.files.some((p:any)=>p.path===f.path&&p.sourceSha256!==f.sourceSha256)).map((f:any)=>f.path).sort(),
  ['app/atlas-workspace.css','app/eye-layers.css','app/eye-layers.tsx','app/review/nested/workspace.tsx','app/whole-body-guided-learning.css','app/whole-body-guided-learning.tsx','content/body-renderer-revision.json','lib/nested-review-material.ts','lib/nested-review.ts']);
 for(const f of review.files)assert.equal(sha(desktopLayoutMilestoneBytes('atlas-review/'+f.path)),f.importedSha256,f.path);
 const receipt=JSON.parse(imported('atlas-review/integration-inputs.json').toString());assert.equal(receipt.sourceCommit,source);
 assert.equal(sha(imported('atlas-review/lib/eye-layer-guide.ts')),JSON.parse(imported('atlas-review/manifest.json').toString()).files.find((f:any)=>f.path==='lib/eye-layer-guide.ts').importedSha256);
 assert(receipt.inputs.some((i:any)=>i.path==='atlas-review/lib/eye-layer-guide.ts'));
 const guides=[];
 for(const g of api.nestedReviewRows.filter((g:any)=>g.study==='eye')){
  const packet=await api.nestedReviewMaterial(g.key,g.surfaces[0].id),guide=api.eyeLayerGuide(packet.source.parent);assert(guide);
  guides.push(guide);assert.equal(guide.steps.length,4);assert.equal(guide.transitionMs,1800);assert.equal(guide.fadeOthers,true);
  const html=createRequire(process.cwd()+'/package.json')('react-dom/server').renderToStaticMarkup(await api.Page({searchParams:Promise.resolve({
   parent:g.parentId,study:g.study,structure:g.surfaces[0].id,source:packet.context.sourceHash,t:'teaching'})}));
  assert.match(html,/Eye guided-learning evidence/);assert.match(html,/Private history not loaded/);assert.match(html,/<fieldset disabled/);
  assert(html.includes(escaped(guide.limitation)));
  for(const s of guide.steps){assert(html.includes(s.selectedId));assert(html.includes(escaped(s.title)));assert(html.includes(escaped(s.caption)));
   for(const url of s.references)assert(html.includes(escaped(url)));
  }
 }
 assert.equal(guides.length,2);
 for(const [folder,protectedViewer]of [['public/atlas-runtime/head-neck/',false],['public/atlas-review-viewer/',true]]as const){
  const manifest=JSON.parse(imported(folder+'manifest.json').toString());assert.equal(manifest.sourceCommit,source);
  assert.equal(manifest[protectedViewer?'personalRecordsIncluded':'patientDataIncluded'],false);
  if(protectedViewer){assert.equal(manifest.mode,'production');assert.equal(manifest.websiteIntegrationSha256,receipt.sha256);}
  else for(const flag of ['clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(manifest[flag],false);
  for(const f of manifest.files)assert.equal(sha(imported(folder+f.path)),f.sha256,f.path);
  const js=manifest.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>imported(folder+f.path).toString()).join('\n');
  for(const guide of guides)for(const text of [guide.title,guide.limitation,...guide.steps.flatMap((s:any)=>[s.title,s.caption,...s.references])])
   assert(js.includes(text)||js.includes(JSON.stringify(text).slice(1,-1)),'Missing complete guide/credit '+text);
 }
 const inventory=json('lib/atlas-model-inventory.json');assert.equal(inventory.models.length,137);
 assert.deepEqual(inventory.models,JSON.parse(old('lib/atlas-model-inventory.json').toString()).models);
 assert.deepEqual(desktopLayoutMilestoneBytes('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md'),old('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md'));
 for(const p of ['content/nested-teaching-bindings.v1.json','content/nested-review-bindings.json','content/nested-teaching.ts'])
  assert.deepEqual(desktopLayoutMilestoneBytes('atlas-review/'+p),old('atlas-review/'+p));
 assert.equal(json('atlas-review/manifest.json').revision,currentSource);
 assert.equal(json('public/atlas-runtime/head-neck/manifest.json').sourceCommit,currentSource);
 const liveReview=json('atlas-review/manifest.json');
 for(const p of ['lib/eye-layer-guide.ts','content/nested-guided-learning-bindings.v1.json']){
  const entry=liveReview.files.find((f:any)=>f.path===p);assert(entry,p);
  const historical=execFileSync('git',['show',featureSource+':'+p],{cwd:sourceRoot,maxBuffer:32e6});
  assert.deepEqual(sourceBytes(p),historical,p+': immutable later eye-guide source held');
  assert.equal(entry.sourceSha256,sha(sourceBytes(p)),p);
  assert.equal(entry.importedSha256,sha(readFileSync('atlas-review/'+p)),p);
 }
 for(const folder of ['public/atlas-runtime/head-neck/','public/atlas-review-viewer/']){
  const live=json(folder+'manifest.json');assert.equal(live.sourceCommit,currentSource);
  const js=live.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>{
   const bytes=readFileSync(folder+f.path);assert.equal(sha(bytes),f.sha256,f.path);return bytes.toString();
  }).join('\n');
  for(const guide of guides)for(const text of [guide.title,guide.limitation,...guide.steps.flatMap((s:any)=>[s.title,s.caption,...s.references])])
   assert(js.includes(text)||js.includes(JSON.stringify(text).slice(1,-1)),'Current guide/credit missing '+text);
 }
});
test('exact 15 eye teaching transitions, 93 unchanged packets, stale refusals and 30 real draft history round trips',async()=>{
 const now=await load(),before=await load(true),forbidden=new Proxy({},{get(){throw Error('Stale request reached storage');}});
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync('drizzle/0008_solid_infant_terrible.sql','utf8'));
 const db={prepare(sql:string){return{bind(...values:any[]){return{
  async all(){return{results:sqlite.prepare(sql).all(...values)};},async run(){return{meta:{changes:Number(sqlite.prepare(sql).run(...values).changes)}};}
 };}};}};
 let contexts=0,changed=0,unchanged=0,staleTeaching=0,staleGeometry=0,roundTrips=0;
 try{for(const g of now.nestedReviewRows)for(const row of g.surfaces){
  const n=await now.nestedReviewMaterial(g.key,row.id),p=await before.nestedReviewMaterial(g.key,row.id),c=n.context,b=p.context;contexts++;
  assert.deepEqual(n.source,p.source);assert.equal(c.sourceHash,b.sourceHash);assert.equal(c.sourceFrame,b.sourceFrame);
  assert.deepEqual(c.blockers,b.blockers);assert.equal(c.revisions.imaging,null);
  const request=(track:string,delta:any={})=>new Request('https://review.test/api/atlas-review/nested-review',{method:'POST',headers:{
   origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_EYE_GUIDE_TEST'},body:JSON.stringify({
   catalogScope:c.catalogScope,nestedKey:c.nestedKey,structureId:c.structureId,sourceFrame:c.sourceFrame,materialHash:c.materialHash,
   revisionHash:c.revisions[track],checklistVersion:c.checklistVersion,track,expectedVersion:0,draft:now.blankNestedReview(c,track),...delta})});
  const guide=n.teaching.guidedLearning;
  if(!guide){unchanged++;assert.notEqual(g.study,'eye');assert.deepEqual(n.teaching,p.teaching);assert.equal(c.teachingHash,b.teachingHash);
   assert.equal(c.revisions.teaching,b.revisions.teaching);assert.deepEqual(c.teachingTabs,b.teachingTabs);
  }else{changed++;assert.equal(g.study,'eye');assert.equal(guide.status,'draft');assert.equal(guide.parentId,g.parentId);
   assert.deepEqual(guide,structuredClone(now.eyeLayerGuide(n.source.parent)));assert(guide.steps.some((s:any)=>s.ids.includes(row.id)));
   for(const f of ['topics','lesson','concept'])assert.deepEqual(n.teaching[f],p.teaching[f]);
   for(const [url,title]of Object.entries(p.teaching.referenceTitles))assert.equal(n.teaching.referenceTitles[url],title);
   const urls=new Set([...p.teaching.topics.flatMap((t:any)=>t.references),...(p.teaching.lesson?.extended.selfCheck.references??[]),...guide.steps.flatMap((s:any)=>s.references)]);
   assert.deepEqual(Object.keys(n.teaching.referenceTitles).sort(),[...urls].sort());
   assert.notEqual(c.teachingHash,b.teachingHash);assert.notEqual(c.revisions.teaching,b.revisions.teaching);
   assert.deepEqual(c.teachingTabs,[...b.teachingTabs,'guided-learning']);assert.deepEqual(c.checklists.teaching.slice(0,-1),b.checklists.teaching);
   assert.equal(c.checklists.teaching.at(-1).id,'guided-learning');assert.equal(now.blankNestedReview(c,'teaching').checks['guided-learning'],false);
   const almost={...now.blankNestedReview(c,'teaching'),reviewer:'SOFTWARE TEST ONLY',qualification:'Synthetic',scope:'No clinical sign-off',
    status:'approved',attested:true,evidence:[{title:'Synthetic only',url:'https://example.test/evidence',note:'Not clinical evidence'}],
    checks:Object.fromEntries(c.checklists.teaching.map((i:any)=>[i.id,i.id!=='guided-learning']))};
   assert(now.nestedApprovalProblems(almost,c,'teaching').includes('Complete every checklist item.'));
   for(const delta of [{revisionHash:b.revisions.teaching},{materialHash:b.materialHash},{sourceFrame:'foreign'}]){
    assert.equal((await now.postNestedReview(request('teaching',delta),forbidden)).status,409);staleTeaching++;
   }
   for(const track of ['geometry','teaching']){
    const response=await now.postNestedReview(request(track),db);assert.equal(response.status,201);
    const saved=now.parseSavedNestedReview((await response.json()).review);assert.equal(saved.status,'draft');assert.equal(saved.attested,false);
    assert(saved.material.teachingTabs.includes('guided-learning'));
    const historyResponse=await now.getNestedReviews(new Request('https://review.test/api/atlas-review/nested-review?'+new URLSearchParams({
     nestedKey:c.nestedKey,structureId:c.structureId,track}),{headers:{'oai-authenticated-user-id':'SYNTHETIC_EYE_GUIDE_TEST'}}),db);
    assert.equal(historyResponse.status,200);assert.deepEqual(structuredClone(now.parseNestedHistory(await historyResponse.json(),c,track)).history,[structuredClone(saved)]);roundTrips++;
    const historical={...saved,reviewer:'SOFTWARE TEST ONLY',qualification:'Synthetic fixture',scope:'No clinical sign-off',
     status:'approved',attested:true,reviewedAt:saved.savedAt,
     evidence:[{title:'Synthetic prior decision',url:'https://example.test/evidence',note:'Not clinical evidence'}],
     revisionHash:b.revisions[track],checklist:b.checklists[track],checks:Object.fromEntries(b.checklists[track].map((i:any)=>[i.id,true])),
     material:{materialHash:b.materialHash,sourceHash:b.sourceHash,teachingHash:b.teachingHash,rendererHash:b.rendererHash,teachingTabs:b.teachingTabs}};
    assert.equal(now.nestedDecisionLabel(now.parseSavedNestedReview(historical),c),'Re-review required');
    const restored=now.nestedDraftFromSaved(historical,c,track);assert.equal(restored.attested,false);assert.equal(restored.status,'draft');
    assert(Object.values(restored.checks).every(v=>v===false));
    const oldHistory=now.parseNestedHistory({scope:'private-to-signed-in-user',track,context:c,history:[historical],nextBefore:null},c,track);
    assert.equal(oldHistory.history[0].status,'approved');assert.equal(oldHistory.history[0].revisionHash,b.revisions[track]);
    assert.equal(now.nestedDecisionLabel(oldHistory.history[0],c),'Re-review required');
    assert.throws(()=>now.parseSavedNestedReview({...saved,material:{...saved.material,teachingTabs:['lecture']}}));
   }
  }
  assert.notEqual(c.revisions.geometry,b.revisions.geometry);
  assert.equal((await now.postNestedReview(request('geometry',{revisionHash:b.revisions.geometry}),forbidden)).status,409);staleGeometry++;
 }}finally{sqlite.close();}
 assert.deepEqual({contexts,changed,unchanged,staleTeaching,staleGeometry,roundTrips},{contexts:108,changed:15,unchanged:93,staleTeaching:45,staleGeometry:108,roundTrips:30});
});


test('current eye guide binding refuses altered source, Review and learner metadata',()=>{
 const sourceRoot=currentAtlasDeliveryRoot(),review=json('atlas-review/manifest.json');
 const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
 for(const path of ['lib/eye-layer-guide.ts','content/nested-guided-learning-bindings.v1.json']){
  const committed=execFileSync('git',['show',currentSource+':'+path],{cwd:sourceRoot,maxBuffer:32e6});
  const imported=readFileSync('atlas-review/'+path);
  const verify=(manifest:any,learnerInputs:any,bytes:Buffer=imported)=>{
   const entry=manifest.files.find((file:any)=>file.path===path);assert(entry);
   assert.equal(entry.sourceSha256,sha(committed),'committed source');
   assert.equal(entry.importedSha256,sha(bytes),'Review import');
   assert.deepEqual(learnerInputs.filter((file:any)=>file.path===path),[{path,sha256:sha(committed)}],'learner input');
  };
  verify(review,inputs);
  const forgedSource=structuredClone(review);forgedSource.files.find((file:any)=>file.path===path).sourceSha256='0'.repeat(64);
  assert.throws(()=>verify(forgedSource,inputs),/committed source/);
  const forgedImport=structuredClone(review);forgedImport.files.find((file:any)=>file.path===path).importedSha256='0'.repeat(64);
  assert.throws(()=>verify(forgedImport,inputs),/Review import/);
  const changed=Buffer.from(imported);changed[0]^=1;assert.throws(()=>verify(review,inputs,changed),/Review import/);
  const forgedInput=structuredClone(inputs);forgedInput.find((file:any)=>file.path===path).sha256='0'.repeat(64);
  assert.throws(()=>verify(review,forgedInput),/learner input/);
 }
});
