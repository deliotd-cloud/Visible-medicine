import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {dirname} from 'node:path';
import {build} from 'esbuild';
import {desktopLayoutImportMilestone,withoutCubitalVenousUltrasoundNotice} from './atlas-cubital-ultrasound-history.ts';
const source='ac88a3c72de1e69971321e00a883e4b88fc356ce',base='db062f3fa5c287d24c20f4b8e77a9ba2eb120ecc';
const old=(path:string)=>Buffer.from(execFileSync('git',['show',base+':'+path],{maxBuffer:32e6}));
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const milestone=(path:string)=>Buffer.from(execFileSync('git',['show','792810f5:'+path],{maxBuffer:32e6}));
async function load(previous=false,historicalQueue=false){
 const result=await build({stdin:{contents:`export * from './atlas-review/lib/nested-review-queue';
 export * from './atlas-review/lib/nested-review-material';export * from './atlas-review/lib/nested-review';
 export * from './atlas-review/lib/nested-review-api';export * from './atlas-review/lib/nested-review-client';
 export {default as NestedReviewPage} from './atlas-review/app/review/nested/page';`,
 resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',packages:'external',
 jsx:'automatic',loader:{'.css':'empty'},plugins:previous||historicalQueue?[{name:'exact-queue-milestone',setup(api){
 if(historicalQueue)api.onLoad({filter:/[\\/]lib[\\/]nested-review-material\.ts$/},args=>({contents:milestone('atlas-review/lib/nested-review-material.ts').toString('utf8'),loader:'ts',resolveDir:dirname(args.path)}));
 api.onLoad({filter:/body-renderer-revision\.json$/},args=>({contents:(previous?old:milestone)('atlas-review/content/body-renderer-revision.json').toString('utf8'),loader:'json',resolveDir:dirname(args.path)}));
 }}]:[]});
 const module={exports:{}},nodeRequire=createRequire(process.cwd()+'/package.json');
 // Node's external CJS wrappers differ from vinext's framework default imports.
 // Keep the real components; normalize only those two wrappers for static SSR.
 const require=(id:string)=>{const value=nodeRequire(id);
  return ['next/link','next/image'].includes(id)?value.default??value:value;};
 runInNewContext(result.outputFiles[0].text,{module,exports:module.exports,require,crypto,
  Request,Response,URL,URLSearchParams,TextEncoder,TextDecoder,structuredClone,console,setTimeout,clearTimeout});
 return module.exports as any;
}

test('compact review queue retains exact source/search/track and models/rights after the independently tested eye guide',async()=>{
 const api=await load(),review=json('atlas-review/manifest.json'),prior=JSON.parse(old('atlas-review/manifest.json').toString('utf8'));
 assert.equal(review.revision,source);assert.equal(review.files.length,950);assert.deepEqual(review.packages,prior.packages);
 const milestone=desktopLayoutImportMilestone();
 assert.deepEqual(milestone.files.filter((f:any)=>!prior.files.some((p:any)=>p.path===f.path)).map((f:any)=>f.path).sort(),
  ['content/nested-guided-learning-bindings.v1.json','lib/eye-layer-guide.ts','lib/nested-guided-learning.ts','lib/nested-review-queue.ts']);
 assert.deepEqual(milestone.files.filter((f:any)=>prior.files.some((p:any)=>p.path===f.path&&p.sourceSha256!==f.sourceSha256)).map((f:any)=>f.path).sort(),
  ['app/atlas-workspace.css','app/eye-layers.css','app/eye-layers.tsx','app/review/nested/nested-review.css','app/review/nested/page.tsx','app/review/nested/workspace.tsx','app/whole-body-guided-learning.css','app/whole-body-guided-learning.tsx','content/body-renderer-revision.json','lib/nested-review-material.ts','lib/nested-review.ts']);
 for(const file of review.files)assert.equal(sha(readFileSync('atlas-review/'+file.path)),file.importedSha256,file.path);
 const receipt=json('atlas-review/integration-inputs.json');assert.equal(receipt.sourceCommit,source);
 assert(receipt.inputs.some((i:any)=>i.path==='atlas-review/lib/nested-review-queue.ts'));
 assert.notEqual(receipt.sha256,prior.websiteIntegrationSha256);
 const viewer=json('public/atlas-review-viewer/manifest.json');assert.equal(viewer.sourceCommit,source);
 assert.equal(viewer.websiteIntegrationSha256,receipt.sha256);assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);
 for(const file of viewer.files)assert.equal(sha(readFileSync('public/atlas-review-viewer/'+file.path)),file.sha256);
 for(const name of ['head-neck','shoulder','lower-limb']){
  const folder='public/atlas-runtime/'+name+'/',manifest=json(folder+'manifest.json');
  const earlier=JSON.parse(old(folder+'manifest.json').toString('utf8'));
  assert.equal(manifest.sourceCommit,source);
  assert.deepEqual(manifest.files.filter((f:any)=>f.path.startsWith('models/')),earlier.files.filter((f:any)=>f.path.startsWith('models/')),'Model bytes unchanged');
  for(const file of manifest.files)assert.equal(sha(readFileSync(folder+file.path)),file.sha256);
  assert.equal(withoutCubitalVenousUltrasoundNotice(readFileSync(folder+'LICENSES/THIRD_PARTY_NOTICES.md','utf8')),old(folder+'LICENSES/THIRD_PARTY_NOTICES.md').toString('utf8'));
  for(const path of ['bundled-dependencies.json','BUNDLED_NOTICES.txt'])
   assert.deepEqual(readFileSync(folder+path),old(folder+path),'Credits/dependencies retained');
 }
 const inventory=json('lib/atlas-model-inventory.json');assert.equal(inventory.models.length,137);
 assert.deepEqual(inventory.models,JSON.parse(old('lib/atlas-model-inventory.json').toString('utf8')).models);
 for(const path of ['content/nested-review-bindings.json','content/nested-teaching.ts',
  'lib/nested-review-client.ts','lib/nested-review-api.ts'])
  assert.deepEqual(readFileSync('atlas-review/'+path),old('atlas-review/'+path),path+' retained');
 assert.equal(withoutCubitalVenousUltrasoundNotice(readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','utf8')),old('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md').toString('utf8'));
 let count=0;
 for(const group of api.nestedReviewRows){
  const list=api.nestedReviewQueue(api.nestedReviewRows,group.key,'',null,'teaching');
  assert.deepEqual(list.entries.map((s:any)=>s.id),group.surfaces.map((s:any)=>s.id));
  for(const [index,entry]of list.entries.entries()){
   const url=new URL(entry.href,'https://website.test');assert.equal(url.pathname,'/workspace/atlas-review/nested');
   assert.equal(url.searchParams.get('parent'),group.parentId);assert.equal(url.searchParams.get('study'),group.study);
   assert.equal(url.searchParams.get('structure'),entry.id);assert.equal(url.searchParams.get('t'),'teaching');
   const packet=await api.nestedReviewSelection(group.key,entry.id,url.searchParams.get('source'));assert(packet);
   const current=api.nestedReviewQueue(api.nestedReviewRows,group.key,'',packet.context,'teaching');
   assert.equal(current.index,index);assert.equal(current.previous?.id??null,list.entries[index-1]?.id??null);
   assert.equal(current.next?.id??null,list.entries[index+1]?.id??null);count++;
  }
 }
 assert.equal(count,108);assert.equal(api.nestedReviewRows.length,20);
 const group=api.nestedReviewRows.find((g:any)=>g.surfaces.filter((s:any)=>s.laterality==='left').length>=3);
 const list=api.nestedReviewQueue(api.nestedReviewRows,group.key,'LEFT',null,'teaching');
 const params=Object.fromEntries(new URL(list.entries[1].href,'https://website.test').searchParams);
 assert.equal(params.q,'LEFT');assert.equal(params.t,'teaching');
 const require=createRequire(process.cwd()+'/package.json'),{renderToStaticMarkup}=require('react-dom/server');
 const render=async(p:any)=>renderToStaticMarkup(await api.NestedReviewPage({searchParams:Promise.resolve(p)}));
 const html=await render(params);assert.match(html,/Structure 2 of \d+ in the filtered queue/);
 assert.match(html,/Previous structure:/);assert.match(html,/Next structure:/);assert.match(html,/q=LEFT/);assert.match(html,/t=teaching/);
 assert(!html.includes('href="/review/nested'));assert.match(html,/Private history not loaded/);assert.match(html,/<fieldset disabled/);
 assert.match(await render({...params,q:'NO_MATCH_AT_ALL'}),/Selected structure is outside this filtered queue/);
 assert.match(await render({...params,source:'0'.repeat(64)}),/outside the available nested review scope/);
 assert.equal(api.nestedReviewNavigationTrack('imaging'),'geometry');assert.equal(api.nestedReviewQuery(['left']),'');
 const workspace=readFileSync('atlas-review/app/review/nested/workspace.tsx','utf8');
 assert(workspace.includes('document.addEventListener("click", click, true)'));assert(workspace.includes('window.addEventListener("beforeunload", unload)'));
});

test('exact saved queue milestone preserves teaching/source identities and rejects old material; later eye transitions tested separately',async()=>{
 const now=await load(false,true),before=await load(true,true),storage=new Proxy({},{get(){throw Error('Stale packet reached storage');}});
 let contexts=0,materialRejects=0,geometryRejects=0;let fixture:any;
 for(const group of now.nestedReviewRows)for(const row of group.surfaces){
  const current=await now.nestedReviewMaterial(group.key,row.id),previous=await before.nestedReviewMaterial(group.key,row.id);
  assert.deepEqual(current.source,previous.source);assert.deepEqual(current.teaching,previous.teaching);
  const c=current.context,p=previous.context;assert.equal(c.sourceHash,p.sourceHash);assert.equal(c.teachingHash,p.teachingHash);
  assert.equal(c.revisions.teaching,p.revisions.teaching);assert.deepEqual(c.blockers,p.blockers);assert.equal(c.revisions.imaging,null);
  assert.notEqual(c.rendererHash,p.rendererHash);assert.notEqual(c.materialHash,p.materialHash);assert.notEqual(c.revisions.geometry,p.revisions.geometry);
  const reject=async(track:string,delta:any)=>{
   const response=await now.postNestedReview(new Request('https://review.test/api/atlas-review/nested-review',{
    method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_QUEUE_TEST'},
    body:JSON.stringify({catalogScope:c.catalogScope,nestedKey:c.nestedKey,structureId:c.structureId,sourceFrame:c.sourceFrame,
     materialHash:c.materialHash,revisionHash:c.revisions[track],checklistVersion:c.checklistVersion,track,expectedVersion:0,
     draft:now.blankNestedReview(c,track),...delta})}),storage);
   assert.equal(response.status,409);
  };
  for(const track of ['geometry','teaching']){await reject(track,{materialHash:p.materialHash});materialRejects++;}
  await reject('geometry',{revisionHash:p.revisions.geometry});geometryRejects++;contexts++;
  if(!fixture&&!c.blockers.teaching.length)fixture={c,p};
 }
 assert.deepEqual({contexts,materialRejects,geometryRejects},{contexts:108,materialRejects:216,geometryRejects:108});
 const renderer=JSON.parse(milestone('atlas-review/content/body-renderer-revision.json').toString('utf8')),oldRenderer=JSON.parse(old('atlas-review/content/body-renderer-revision.json').toString('utf8'));
 assert.equal(renderer.sourceRendererSha256,oldRenderer.sourceRendererSha256);
 assert.notEqual(renderer.websiteIntegrationSha256,oldRenderer.websiteIntegrationSha256);
 const {c,p}=fixture;
 for(const track of ['geometry','teaching']){
  const r={...before.blankNestedReview(p,track),reviewer:'SOFTWARE TEST ONLY',qualification:'Synthetic fixture',
   scope:'Synthetic review only; not clinical sign-off',status:'approved',attested:true,
   checks:Object.fromEntries(p.checklists[track].map((item:any)=>[item.id,true])),
   evidence:[{title:'Synthetic fixture',url:'https://example.com/test',note:'Not clinical evidence'}],
   eventSchema:'vm-nested-review-event-1',catalogScope:p.catalogScope,nestedKey:p.nestedKey,sourceFrame:p.sourceFrame,
   structureId:p.structureId,track,version:1,savedAt:'2026-10-01T10:00:00.000Z',reviewedAt:'2026-10-01T10:00:00.000Z',
   revisionHash:p.revisions[track],checklistVersion:p.checklistVersion,checklist:p.checklists[track],
   material:{materialHash:p.materialHash,sourceHash:p.sourceHash,teachingHash:p.teachingHash,rendererHash:p.rendererHash,teachingTabs:p.teachingTabs}};
  const parsed=now.parseSavedNestedReview(r);
  const history=now.parseNestedHistory({scope:'private-to-signed-in-user',track,context:c,history:[r],nextBefore:null},c,track);
  assert.deepEqual(history.history[0],parsed);
  assert.equal(now.nestedDecisionLabel(parsed,c),track==='geometry'?'Re-review required':'Approval recorded');
  const draft=now.nestedDraftFromSaved(parsed,c,track);assert.equal(draft.status,'draft');assert.equal(draft.attested,false);
  if(track==='geometry')assert(Object.values(draft.checks).every(value=>value===false));
 }
});
