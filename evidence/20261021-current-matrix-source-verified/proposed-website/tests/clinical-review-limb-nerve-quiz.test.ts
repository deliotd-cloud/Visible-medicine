import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {specimenChannelEntrypoint} from './specimen-channel-entrypoint.ts';
import {bodyChannelBaseline,bodyChannelEntrypoint} from './body-channel-source-epoch.ts';
import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const atlas=currentAtlasDeliveryRoot();
const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
// Historical source epoch: deliberately independent of current generated pins.
const parent='7d77c973aab2a7135635ab2e65a2831f3e7d22c4';
// Captured from the actual empty-DB private inbox before import (staging/20261013-limb-nerve-integration/old-inbox.json).
const oldCatalog='f8c31e2d9f76574bec88a47fa19d57aba09a8afa84612451f425eb675b53ab62';
const pinPath='content/limb-nerve-quiz-pins.json';
const sourcePaths=[pinPath,'content/limb-nerve-quiz.ts','lib/limb-nerve-quiz.ts'];
const require=createRequire(import.meta.url);
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const git=(args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:64e6,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const committed=(commit:string,path:string)=>git(['show',`${commit}:${path}`]);
const norm=(bytes:Uint8Array)=>Buffer.from(bytes).toString('utf8').replaceAll('\r\n','\n');
type File={path:string;sha256:string;sourceSha256?:string;importedSha256?:string};
type Pin={identity:any;group:string;previous:any};

async function imported(){
  const built=await build({stdin:{contents:[
    "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
    "export {limbNerveQuizChecks} from './atlas-review/lib/limb-nerve-quiz';",
    "export {limbNerveQuizQuestions} from './atlas-review/content/limb-nerve-quiz';",
    "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
    "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
    "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
    "export {blankBodyReview} from './atlas-review/lib/body-review-decisions';",
    "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
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
  {headers:{'oai-authenticated-user-id':'offline-limb-nerve-inbox-fixture'}});

test('18 original Quiz questions survive with exact additional learner and Review checks',async()=>{
  const current=validateCurrentAtlasDelivery();
  assert.equal(current.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
  assert.equal(git(['rev-parse','HEAD']).toString().trim(),current.source);
  assert.equal(git(['merge-base',revision,current.source]).toString().trim(),revision);
  const review=json('atlas-review/manifest.json');assert.equal(review.revision,current.source);
  const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
  assert.equal(viewer.sourceCommit,current.source);
  assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
  assert.equal(viewer.personalRecordsIncluded,false);
  const learners=['head-neck','shoulder','lower-limb','female-pelvis'].map(name=>({name,base:`public/atlas-runtime/${name}/`,
    manifest:json(`public/atlas-runtime/${name}/manifest.json`)}));
  for(const {name,manifest} of learners){assert.equal(manifest.sourceCommit,current.source,name);
    assert.equal(manifest.patientDataIncluded,false,name);assert.equal(manifest.clinicalApproved,false,name);}
  const learnerInputs=new Map(learners.map(({name,base})=>[name,json(base+'source-inputs.json') as File[]]));
  for(const [name,entry,pattern] of [
    ['head-neck','integration/head-neck/main.tsx',/BodyExplorer initialRegion=/],
    ['shoulder','integration/shoulder/main.tsx',/ShoulderExplorer initialSelectedId=/],
    ['lower-limb','integration/lower-limb/main.tsx',/KneeSpecimenView key=\{scope\} specimen=\{limbDefinitions\[scope\]\}/],
    ['female-pelvis','integration/female-pelvis/main.tsx',/KneeSpecimenView specimen=\{hraPelvisDefinition\}/],
  ] as const){
    const source=committed(revision,entry),inputs=learnerInputs.get(name)!;
    assert.equal(inputs.find(f=>f.path===entry)?.sha256,sha(source),`${name}: entrypoint input`);
    assert.match(norm(source),pattern,`${name}: learner scope`);
    const precedingEntrypoint=specimenChannelEntrypoint(norm(committed(parent,entry)),name);
    assert.equal(norm(committed(bodyChannelBaseline,entry)),precedingEntrypoint,`${name}: original entrypoint plus exact opt-in channel at the preceding source epoch`);
    assert.equal(norm(source),bodyChannelEntrypoint(precedingEntrypoint,name),`${name}: exact additional root-body channel only`);
  }
  for(const path of sourcePaths){
    const source=committed(revision,path),copy=readFileSync('atlas-review/'+path),record:File=review.files.find((f:File)=>f.path===path);
    assert.deepEqual(committed(current.source,path),source,`${path}: exact historical feature source retained`);
    assert(record,path);assert.equal(record.sourceSha256,sha(source),path);
    assert.equal(record.importedSha256,sha(copy),path);
    for(const name of ['head-neck','shoulder'])assert.equal(learnerInputs.get(name)!.find(f=>f.path===path)?.sha256,
      sha(source),`${name}: ${path} learner input`);
    assert.equal(norm(copy),norm(source),`${path}: imported source`);
    assert.equal(norm(readFileSync(atlas+'/'+path)),norm(source),`${path}: Atlas source`);
    for(const base of ['public/atlas-review/',viewerBase,...learners.map(item=>item.base)])
      assert.equal(existsSync(base+path),false,`${base+path}: raw source exposed`);
  }
  const pins=json('atlas-review/'+pinPath),api=await imported();
  assert.equal(pins.parentCommit,parent);
  assert.equal(pins.entries.length,18);
  assert.equal(new Set(pins.entries.map((row:Pin)=>row.identity.id)).size,18);
  assert.equal(new Set(pins.entries.map((row:Pin)=>row.group)).size,8);
  const rootIds=new Set<string>(pins.entries.map((row:Pin)=>row.identity.id));
  for(const [name,path] of [['lower-limb','public/models/um-limb/catalog.json'],
    ['female-pelvis','public/models/hra-pelvis/catalog.json']] as const){
    const source=committed(revision,path),catalog=json('atlas-review/'+path);
    assert.equal(learnerInputs.get(name)!.find(f=>f.path===path)?.sha256,sha(source),`${name}: independent catalogue input`);
    assert.deepEqual(catalog,JSON.parse(norm(source)),`${name}: imported independent catalogue`);
    assert.equal(norm(source),norm(committed(parent,path)),`${name}: original specimen source`);
    assert(catalog.structures.length>0,`${name}: specimen structures`);
    for(const structure of catalog.structures){assert.match(structure.id,/^vm:reference:/,`${name}: source ID`);
      assert.equal(rootIds.has(structure.id),false,`${name}: independent ID`);}
  }
  const prior=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  const before=await prior.exactSourceHistoryApi(parent,'review-security');
  const learnerJs=learners.map(({name,base,manifest})=>({name,text:manifest.files.filter((f:File)=>f.path.endsWith('.js'))
    .map((f:File)=>{const bytes=readFileSync(base+f.path);assert.equal(sha(bytes),f.sha256,`${name}: ${f.path}`);return bytes.toString();}).join('\n')}));
  let storageCalls=0;const storage={prepare(){storageCalls++;throw Error('Invalid decision reached storage');}};
  for(const row of pins.entries as Pin[]){
    const id=row.identity.id,original=await before.bodyLesson(row.identity,'quiz');
    assert.deepEqual(row.previous,original,id);
    const lesson=api.bodyLesson(row.identity,'quiz'),{additionalChecks,...primary}=lesson;
    assert.deepEqual(primary,original,`${id}: original prompt, key and explanation`);
    assert.equal(additionalChecks.length,1,id);
    const check=additionalChecks[0],question=api.limbNerveQuizQuestions[row.group];
    assert.equal(check.key,row.group,id);assert.equal(check.body,question.body,id);
    assert.deepEqual(check.bullets,question.choices,id);assert.equal(check.correctAnswer,question.correctAnswer,id);
    assert.equal(check.explanation,question.explanation,id);assert.deepEqual(check.citations,question.references,id);
    assert.equal(check.bullets.filter((choice:string)=>choice===check.correctAnswer).length,1,id);
    assert.deepEqual(api.limbNerveQuizChecks(row.identity),[check],id);
    const {readiness,...shown}=lesson;void readiness;
    assert.deepEqual(api.bodyContent(row.identity,'quiz'),shown,id);
    for(const learner of learnerJs.filter(item=>item.name==='head-neck'||item.name==='shoulder')){
      assert(learner.text.includes(check.body),`${learner.name}: ${id} prompt`);
      assert(learner.text.includes(check.correctAnswer),`${learner.name}: ${id} answer`);
      assert(learner.text.includes(check.explanation),`${learner.name}: ${id} explanation`);}
    const previous=await before.bodyReviewMaterial(id),packet=wire(await api.bodyReviewMaterial(id));
    assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');
    assert.deepEqual(packet.source,previous.source,id);
    assert.deepEqual(packet.topics.filter((topic:any)=>topic.tab!=='quiz'),previous.topics.filter((topic:any)=>topic.tab!=='quiz'),id);
    assert.deepEqual(packet.topics.find((topic:any)=>topic.tab==='quiz'),{tab:'quiz',...lesson},id);
    assert.equal(packet.fingerprints.source,previous.fingerprints.source,id);
    assert.notEqual(packet.fingerprints.teaching,previous.fingerprints.teaching,id);
    assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet,id);
    assert.equal(await api.parseBodyReviewResponse(previous,id),null,`${id}: old worksheet`);
    for(const change of ['missing','duplicate','prompt','options','answer','explanation','citation','key','source','approval']){
      const bad=wire(packet),checks=bad.topics.find((topic:any)=>topic.tab==='quiz').additionalChecks;
      if(change==='missing')checks.pop();
      if(change==='duplicate')checks.push(wire(checks[0]));
      if(change==='prompt')checks[0].body+=' forged';
      if(change==='options')checks[0].bullets[0]+=' forged';
      if(change==='answer')checks[0].correctAnswer='forged';
      if(change==='explanation')checks[0].explanation+=' forged';
      if(change==='citation')checks[0].citations=['https://forged.invalid'];
      if(change==='key')checks[0].key='forged';
      if(change==='source')bad.source.structure.sources[0].sha256='0'.repeat(64);
      if(change==='approval')bad.approval=true;
      assert.equal(await api.parseBodyReviewResponse(bad,id),null,`${id}: ${change}`);
    }
    const oldContext=await before.bodyReviewContext(id),context=await api.bodyReviewContext(id);
    assert.equal(context.sourceHash,oldContext.sourceHash,id);
    assert.notEqual(context.revisions.teaching,oldContext.revisions.teaching,id);
    const decision={catalogScope:context.catalogScope,structureId:id,track:'teaching',expectedVersion:0,
      materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
      draft:api.blankBodyReview(context,'teaching')};
    const save=(input:unknown)=>api.postBodyDecision(new Request('https://review.test/api/body-decisions',{
      method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
        'oai-authenticated-user-id':'offline-synthetic-limb-nerve-reviewer'},body:JSON.stringify(input)}),storage);
    assert.equal((await save({...decision,materialHash:oldContext.materialHash,
      revisionHash:oldContext.revisions.teaching})).status,409,id);
    const forged=wire(decision);forged.draft.checks.foreign=true;
    assert.equal((await save(forged)).status,422,id);
    const approval=wire(decision);approval.draft.status='approved';
    assert.equal((await save(approval)).status,422,id);
  }
  assert.equal(storageCalls,0);
});

test('private inbox binds all 18 current teaching revisions and rejects stale scans before database reads',async()=>{
  const {getClinicalReviewInbox,clinicalReviewEntries}=await inbox(),api=await imported();
  const pins=json('atlas-review/'+pinPath),ids=new Set<string>(pins.entries.map((row:Pin)=>row.identity.id));
  const oldSnapshotPath='F:/VisibleMedicine/staging/20261013-limb-nerve-integration/old-inbox.json';
  const oldSnapshot=existsSync(oldSnapshotPath)?json(oldSnapshotPath):null;
  if(oldSnapshot){assert.equal(oldSnapshot.catalogRevision,oldCatalog);
    assert.equal(oldSnapshot.sourceCommit,parent);assert.equal(oldSnapshot.rows.length,18);}
  const db=database(),first=await getClinicalReviewInbox(request(),db);
  assert.equal(first.status,200);assert.equal(first.headers.get('Cache-Control'),'private, no-store');
  const catalog=(await first.json()).catalogRevision as string;assert.match(catalog,/^[a-f0-9]{64}$/);
  assert.notEqual(catalog,oldCatalog);
  db.reads.length=0;
  const stale=await getClinicalReviewInbox(request('?page=2&revision='+oldCatalog),db);
  assert.equal(stale.status,409);assert.equal(db.reads.length,0,'stale continuation reached DB reads');
  const selections=clinicalReviewEntries.map((entry:any,index:number)=>({entry,index}))
    .filter(({entry}:any)=>entry.scope==='body'&&ids.has(entry.id));
  assert.equal(selections.length,18);
  const pages=[...new Set<number>(selections.map(({index}:any)=>Math.floor(index/12)+2))];
  const batches:any[]=[];
  for(const page of pages){const response=await getClinicalReviewInbox(request(`?page=${page}&revision=${catalog}`),db);
    assert.equal(response.status,200);batches.push(...(await response.json()).items);}
  const prior=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  const before=await prior.exactSourceHistoryApi(parent,'review-security');
  for(const {entry} of selections){
    const key=JSON.stringify([entry.key,'teaching']),matches=batches.filter(row=>row.key===key);
    assert.equal(matches.length,1,key);const row=matches[0];
    const previous=await before.bodyReviewContext(entry.id),now=await api.bodyReviewContext(entry.id);
    assert(previous&&now,entry.id);
    assert.equal(row.href,'/workspace/atlas-review/body?structure='+encodeURIComponent(entry.id)+'&t=teaching');
    assert.equal(row.revision,now.revisions.teaching,entry.id);
    assert.equal(row.status,'not-started',entry.id);
    assert.equal(now.sourceHash,previous.sourceHash,entry.id);
    assert.notEqual(now.revisions.teaching,previous.revisions.teaching,entry.id);
    if(oldSnapshot){const old=oldSnapshot.rows.find((item:any)=>item.id===entry.id);
      assert(old,entry.id);assert.equal(old.key,key,entry.id);
      assert.equal(old.revision,previous.revisions.teaching,entry.id);
      assert.equal(old.status,'not-started',entry.id);
      assert.notEqual(row.revision,old.revision,entry.id);}
  }
  const failed=await getClinicalReviewInbox(request(`?page=${pages[0]}&revision=${catalog}`),database({success:false,results:[]}));
  assert.equal(failed.status,200);
  assert((await failed.json()).items.every((row:any)=>row.status==='unavailable'));
});
