import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const atlas='F:/VisibleMedicine/atlas';
const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const baseline='a70b6f640c5511330f250882f525b63a4a21117b';
// Actual empty-DB private inbox captured before this source import; no account history.
const oldIntegration='64c0eee7fbb6eb334364a4afc6fcb383fa218081a6e09f342455e3bcc3184f44';
const oldRenderer='1c622768fe7f6756b265a6c7b784e07f8ac37884f140352d55e15b74b207d92b';
const oldCatalog='0fef6614b18c7ef9619d9906376b83f63f14c8d587882d278791bbab194dacf4';
// Synthetic request headers exercise offline handlers only; they are not clinical or browser authentication proof.
const pinPath='content/elbow-arterial-tour-pins.json';
const sourcePaths=[pinPath,'lib/elbow-arterial-tour.ts','lib/regional-tours.ts'];
const sourceCatalogPath='public/models/bodyparts3d/full-body/catalog.json';
const expectedArteries=['FMA22712','FMA22801','FMA22707','FMA22804','FMA23126','FMA22764','FMA23124','FMA268667'];
const expectedBones=['FMA23130','FMA23464','FMA23467'];
const expectedBundles=['elbow-arteries','forearm-skeleton','forearm-vessels-forearm-vascular','shoulder-arm-skeleton'];
const expectedStops=['inferior-ulnar-collateral','anterior-ulnar-recurrent','superior-ulnar-collateral','posterior-ulnar-recurrent',
  'radial-collateral','radial-recurrent','middle-collateral','recurrent-interosseous'];
const require=createRequire(import.meta.url);
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const git=(args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:32e6,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const committed=(commit:string,path:string)=>git(['show',`${commit}:${path}`]);
const norm=(bytes:Uint8Array)=>Buffer.from(bytes).toString('utf8').replaceAll('\r\n','\n');
type Entry={id:string;name:string;fmaId:string;bundle:string;bounds:{min:number[];max:number[]};validation:{anatomicalReview:boolean}};
type File={path:string;sha256:string;sourceSha256?:string;importedSha256?:string};

async function imported(){
  const built=await build({stdin:{contents:[
    "export {elbowArterialTour,elbowArterialTourMatches} from './atlas-review/lib/elbow-arterial-tour';",
    "export {regionalTours,regionalTourStructures,regionalTourStepFrames} from './atlas-review/lib/regional-tours';",
    "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
    "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
    "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
    "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
    "export {blankBodyReview} from './atlas-review/lib/body-review-decisions';",
    "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
    "export {contentTabs} from './atlas-review/lib/content-types';",
    "export {default as rawCatalog} from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';",
  ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
  return import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
}
async function inbox(){
  const built=await build({stdin:{contents:[
    "export {getClinicalReviewInbox} from './lib/clinical-review-inbox';",
    "export {clinicalReviewEntries} from './atlas-review/lib/clinical-review-index';",
  ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'cjs',platform:'node',packages:'external'});
  const mod={exports:{} as Record<string,any>};
  new Function('require','module','exports',built.outputFiles[0].text)((name:string)=>name==='server-only'?{}:require(name),mod,mod.exports);
  return mod.exports;
}
function database(result:unknown={success:true,results:[]}){
  const reads:{sql:string;args:unknown[]}[]=[];
  return {reads,prepare(sql:string){assert.match(sql,/^\s*SELECT\b/i);let args:unknown[]=[];
    const statement={bind(...values:unknown[]){args=values;return statement;},async all(){reads.push({sql,args});return result;},
      async run(){throw Error('The inbox is read-only.');}};return statement;}};
}
const request=(query='')=>new Request('https://review.invalid/api/atlas-review/inbox'+query,
  {headers:{'oai-authenticated-user-id':'offline-elbow-inbox-fixture'}});

test('right elbow guide binds eleven exact records, four bundles, learner captions and draft Review packets',async()=>{
  assert.equal(git(['rev-parse','HEAD']).toString().trim(),revision);
  const review=json('atlas-review/manifest.json');assert.equal(review.revision,revision);
  assert.notEqual(review.websiteIntegrationSha256,oldIntegration);
  assert.notEqual(json('atlas-review/content/body-renderer-revision.json').sha256,oldRenderer);
  const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
  assert.equal(viewer.sourceCommit,revision);assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
  assert.equal(viewer.personalRecordsIncluded,false);
  const learners=['head-neck','shoulder','lower-limb','female-pelvis'].map(name=>({name,base:`public/atlas-runtime/${name}/`,
    manifest:json(`public/atlas-runtime/${name}/manifest.json`)}));
  for(const {name,manifest} of learners){assert.equal(manifest.sourceCommit,revision,name);
    assert.equal(manifest.patientDataIncluded,false,name);assert.equal(manifest.clinicalApproved,false,name);}
  const inputs:File[]=json(learners[0].base+'source-inputs.json');
  for(const path of sourcePaths){
    const source=committed(revision,path),copy=readFileSync('atlas-review/'+path),record:File=review.files.find((f:File)=>f.path===path);
    assert(record,path);assert.equal(record.sourceSha256,sha(source),path);assert.equal(record.importedSha256,sha(copy),path);
    assert.equal(inputs.find(f=>f.path===path)?.sha256,sha(source),`${path}: learner input`);
    assert.equal(norm(copy),norm(source),`${path}: imported source`);
    assert.equal(norm(readFileSync(atlas+'/'+path)),norm(source),`${path}: Atlas source`);
    for(const base of ['public/atlas-review/',viewerBase,...learners.map(item=>item.base)])
      assert.equal(existsSync(base+path),false,`${base+path}: raw source exposed`);
  }
  const pins=json('atlas-review/'+pinPath);
  assert.equal(sha(JSON.stringify(pins)),'d61979a48cee12daf0dfd3468b5683a788ff914cc83a36bd91c1ea776415ade7');
  assert.equal(pins.baseline,baseline);assert.equal(pins.tourRevision,'right-elbow-arterial-pairs-20261012-r1');
  assert.deepEqual(pins.entries.map((e:Entry)=>e.fmaId),expectedArteries);
  assert.deepEqual(pins.contextEntries.map((e:Entry)=>e.fmaId),expectedBones);
  assert.deepEqual(pins.bundles.map((b:{id:string})=>b.id).sort(),expectedBundles);
  const api=await imported(),catalog=api.bodyDisplayCatalog(api.rawCatalog),tour=api.elbowArterialTour;
  const records:Entry[]=[...pins.entries,...pins.contextEntries];
  assert.equal(catalog.structures.length,1104);assert.equal(api.contentTabs.length,9);
  assert.equal(api.elbowArterialTourMatches(catalog,tour),true);
  assert.equal(api.regionalTours.filter((item:{id:string})=>item.id===tour.id).length,1);
  const legacyTours=api.regionalTours.filter((item:{id:string})=>item.id!=='portal-hepatic-venous-relationships');
  assert.equal(legacyTours.length,47);
  assert.equal(legacyTours.reduce((count:number,item:{steps:unknown[]})=>count+item.steps.length,0),282);
  assert.equal(api.regionalTours.length,48);
  assert.equal(api.regionalTours.reduce((count:number,item:{steps:unknown[]})=>count+item.steps.length,0),290);
  assert.deepEqual(api.regionalTourStructures(catalog,tour),[...pins.contextEntries,...pins.entries]);
  assert.equal(tour.id,'right-elbow-arterial-pairs');assert.equal(tour.region,'forearm');
  assert.equal(tour.revision,pins.tourRevision);assert.equal(tour.status,'draft');
  assert.deepEqual(tour.contextIds,pins.contextEntries.map((e:Entry)=>e.id));
  assert.deepEqual(tour.steps.map((s:{id:string})=>s.id),expectedStops);
  assert.deepEqual(tour.steps.map((s:{selectedId:string})=>s.selectedId),pins.entries.map((e:Entry)=>e.id));
  assert.deepEqual(tour.steps.map((s:{title:string})=>s.title),pins.entries.map((e:Entry)=>e.name));
  assert.deepEqual(Object.keys(tour.requiredDisplayBundles).sort(),records.map(e=>e.id).sort());
  for(const entry of records)assert.equal(tour.requiredDisplayBundles[entry.id],entry.bundle,entry.id);
  const frames=api.regionalTourStepFrames(catalog,tour);assert.equal(frames.length,8);
  for(const [i,step] of tour.steps.entries()){
    const pair=Math.floor(i/2)*2,local=[pins.entries[pair],pins.entries[pair+1]] as Entry[];
    assert.deepEqual(step.frameIds,local.map(e=>e.id),step.id);
    assert.deepEqual(frames[i],{min:[0,1,2].map(a=>Math.min(...local.map(e=>e.bounds.min[a]))),
      max:[0,1,2].map(a=>Math.max(...local.map(e=>e.bounds.max[a])))});
    assert.deepEqual(frames[i],frames[i^1],`${step.id}: paired frame`);
    assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);assert(step.caption.trim());
  }
  const learnerJs=learners[0].manifest.files.filter((f:File)=>f.path.endsWith('.js')).map((f:File)=>{
    const bytes=readFileSync(learners[0].base+f.path);assert.equal(sha(bytes),f.sha256);return bytes.toString();}).join('\n');
  for(const step of tour.steps)assert(learnerJs.includes(step.caption),`${step.id}: actual learner caption`);
  // The shared player keeps the existing reduced-motion branch for this tour.
  const player=readFileSync('atlas-review/app/regional-guided-learning.tsx','utf8');
  assert.match(player,/transitionMs=\{active&&!reduced\?1800:0\}/);
  let storageCalls=0;const storage={prepare(){storageCalls++;throw Error('Rejected request reached storage');}};
  for(const entry of records){
    assert.equal(entry.validation.anatomicalReview,false);
    const packet=wire(await api.bodyReviewMaterial(entry.id));
    assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');assert.equal(packet.topics.length,9);
    assert.deepEqual(packet.source.structure,entry);
    const matching=packet.guidedTours.filter((item:{tour:{id:string}})=>item.tour.id===tour.id);
    assert.equal(matching.length,1,entry.id);
    const evidence=matching[0];assert.deepEqual(evidence.tour,wire(tour));
    assert.deepEqual(evidence.structures,[...pins.contextEntries,...pins.entries]);
    assert.deepEqual(evidence.stepFrames,frames);assert.deepEqual(evidence.bundles,pins.bundles);
    assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');
    assert.equal(evidence.separation,0);assert.equal(evidence.patientRegistered,undefined);
    assert.deepEqual(await api.parseBodyReviewResponse(packet,entry.id),packet);
    for(const change of ['missing','duplicate','caption','context','frame','revision','source','registration','approval']){
      const bad=wire(packet),item=bad.guidedTours.find((g:{tour:{id:string}})=>g.tour.id===tour.id);
      if(change==='missing')bad.guidedTours.splice(bad.guidedTours.indexOf(item),1);
      if(change==='duplicate')bad.guidedTours.push(wire(item));
      if(change==='caption')item.tour.steps[0].caption='Forged caption';
      if(change==='context')item.tour.contextIds=[];
      if(change==='frame')item.stepFrames[0].max[0]+=0.1;
      if(change==='revision')item.tour.revision='foreign';
      if(change==='source')item.structures[0].sources[0].sha256='0'.repeat(64);
      if(change==='registration')item.patientRegistered=true;
      if(change==='approval')bad.approval=true;
      assert.equal(await api.parseBodyReviewResponse(bad,entry.id),null,`${entry.id}: ${change}`);
    }
    const context=await api.bodyReviewContext(entry.id);
    const decision={catalogScope:context.catalogScope,structureId:entry.id,track:'teaching',expectedVersion:0,
      materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
      draft:api.blankBodyReview(context,'teaching')};
    const save=(input:unknown)=>api.postBodyDecision(new Request('https://review.test/api/body-decisions',{
      method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
        'oai-authenticated-user-id':'offline-synthetic-elbow-reviewer'},body:JSON.stringify(input)}),storage);
    assert.equal((await save({...decision,materialHash:'0'.repeat(64)})).status,409);
    assert.equal((await save({...decision,revisionHash:'0'.repeat(64)})).status,409);
    const forged=wire(decision);forged.draft.checks.foreign=true;
    assert.equal((await save(forged)).status,422);
    const approval=wire(decision);approval.draft.status='approved';
    assert.equal((await save(approval)).status,422);
  }
  assert.equal(storageCalls,0);
});

test('private inbox rejects the old catalogue before reads and binds eleven current teaching worksheets',async()=>{
  const {getClinicalReviewInbox,clinicalReviewEntries}=await inbox(),api=await imported();
  const prior=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  const before=await prior.exactSourceHistoryApi(baseline,'review-security');
  const pins=json('atlas-review/'+pinPath),ids=new Set<string>([...pins.entries,...pins.contextEntries].map((e:Entry)=>e.id));
  assert.equal(ids.size,11);
  const db=database(),first=await getClinicalReviewInbox(request(),db);
  assert.equal(first.status,200);assert.equal(first.headers.get('Cache-Control'),'private, no-store');
  const catalog=(await first.json()).catalogRevision as string;assert.match(catalog,/^[a-f0-9]{64}$/);
  assert.notEqual(catalog,oldCatalog);
  db.reads.length=0;
  const stale=await getClinicalReviewInbox(request('?page=2&revision='+oldCatalog),db);
  assert.equal(stale.status,409);assert.equal(db.reads.length,0,'stale continuation reached DB reads');
  const selections=clinicalReviewEntries.map((entry:any,index:number)=>({entry,index}))
    .filter(({entry}:any)=>entry.scope==='body'&&ids.has(entry.id));
  assert.equal(selections.length,11);
  const pages=[...new Set<number>(selections.map(({index}:any)=>Math.floor(index/12)+2))];
  const batches:any[]=[];
  for(const page of pages){const response=await getClinicalReviewInbox(request(`?page=${page}&revision=${catalog}`),db);
    assert.equal(response.status,200);batches.push(...(await response.json()).items);}
  for(const {entry} of selections){
    const key=JSON.stringify([entry.key,'teaching']),matches=batches.filter(row=>row.key===key);
    assert.equal(matches.length,1,key);const row=matches[0];
    const previous=await before.bodyReviewContext(entry.id),now=await api.bodyReviewContext(entry.id),packet=await api.bodyReviewMaterial(entry.id);
    assert(previous&&now&&packet,entry.id);assert.equal(row.href,'/workspace/atlas-review/body?structure='+encodeURIComponent(entry.id));
    assert.equal(row.revision,now.revisions.teaching,entry.id);assert.equal(row.status,'not-started',entry.id);
    assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');
    assert.equal(now.sourceHash,previous.sourceHash);assert.notEqual(now.revisions.teaching,previous.revisions.teaching);
  }
  const failed=await getClinicalReviewInbox(request(`?page=${pages[0]}&revision=${catalog}`),database({success:false,results:[]}));
  assert.equal(failed.status,200);
  assert((await failed.json()).items.every((row:any)=>row.status==='unavailable'));
});
