import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {checkedAtlasSourceRepo} from './atlas-source-repo.mjs';
import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';

const sha=(v:unknown):string=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const rawSha=(v:Uint8Array):string=>createHash('sha256').update(v).digest('hex');
const parent='665e87ac91aea2d273d11562276b7be0f9aff567';
const authoredRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const revision='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const sourceFiles:Record<string,string>={FMA4149:'FJ1934',FMA10704:'FJ3418',FMA68109:'FJ1933',FMA71537:'FJ3431'};
const tabs=['anatomy','function','quiz'] as const;
const pins=JSON.parse(readFileSync('atlas-review/content/thoracic-systemic-teaching-pins.json','utf8'));
assert.equal(pins.sourceCommit,parent);assert.equal(pins.sourceVersion,'4.0');assert.equal(pins.license,'CC-BY-4.0');
const entries:any[]=pins.entries;assert.equal(entries.length,4);
assert.deepEqual(entries.map(e=>e.identity.fmaId).sort(),Object.keys(sourceFiles).sort());
for(const {identity}of entries){assert.equal(identity.region,'thorax');assert.equal(identity.bundle,'thorax-vessels-thoracic-detail');assert.equal(identity.laterality,'midline');assert.deepEqual(identity.sources.map((s:any)=>s.file),[sourceFiles[identity.fmaId]]);}
const bundled=build({stdin:{contents:[
 "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
 "export {thoracicSystemicTeachingLesson} from './atlas-review/lib/thoracic-systemic-teaching';",
 "export {bodyReviewMaterial,bodyReviewSnapshot} from './atlas-review/lib/body-review-material';",
 "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
 "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'})
 .then(result=>import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64')));

test('four exact thoracic arterial selections deliver twelve draft topics and refuse forged review content',async()=>{
 const api=await bundled,renderer=JSON.parse(readFileSync('atlas-review/content/body-renderer-revision.json','utf8'));
 const sourceRoot=checkedAtlasSourceRepo(revision);
 const {exactSourceHistoryApi}=await import(pathToFileURL(sourceRoot+'/scripts/exact-source-history-api.mjs').href);
 const authored=await exactSourceHistoryApi(authoredRevision,'review-security'),bound=await boundLiveAtlasHistory(revision);
 for(const path of ['content/thoracic-systemic-teaching-pins.json','content/thoracic-systemic-teaching.ts','lib/thoracic-systemic-teaching.ts'])
  assert.deepEqual(readFileSync('atlas-review/'+path),execFileSync('git',['show',authoredRevision+':'+path],{cwd:sourceRoot,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}),'Unchanged exact authored teaching source '+path);
 let topics=0,forgeries=0;
 for(const {identity}of entries){
  const snapshot=api.bodyReviewSnapshot(identity.id),packet=await api.bodyReviewMaterial(identity.id),context=await api.bodyReviewContext(identity.id);
  assert(snapshot&&packet&&context);assert.equal(packet.approval,false);assert.deepEqual(snapshot.source.structure,identity);assert.deepEqual(packet.source.structure,identity);
  const authoredPacket=await authored.bodyReviewMaterial(identity.id);assert(authoredPacket);assert.equal(authoredPacket.approval,false);assert.deepEqual(authoredPacket.source.structure,identity);
  assert.deepEqual(packet,await bound.bodyReviewMaterial(identity.id),'Complete current packet equals independently renderer-bound Atlas replay');
  assert.deepEqual(await api.parseBodyReviewResponse(packet,identity.id),packet);assert.equal(context.materialHash,packet.materialHash);
  assert.equal(context.rendererHash,renderer.sha256);assert.equal(context.revisions.imaging,null);
  assert.equal(context.revisions.teaching,sha({catalogScope:context.catalogScope,structureId:identity.id,checklistVersion:context.checklistVersion,source:context.sourceHash,teaching:context.teachingHash,checks:context.checklists.teaching}));
  for(const tab of tabs){
   const lesson=api.thoracicSystemicTeachingLesson(identity,tab);assert(lesson);assert.equal(lesson.readiness,'draft');assert.match(lesson.note,/review pending/i);
   assert.deepEqual(api.bodyLesson(identity,tab),lesson);const {readiness,...shown}=lesson;assert.deepEqual(api.bodyContent(identity,tab),shown);
   assert.deepEqual(snapshot.topics.find((t:any)=>t.tab===tab),{tab,...lesson});assert.deepEqual(packet.topics.find((t:any)=>t.tab===tab),{tab,...lesson});
   assert.deepEqual(authoredPacket.topics.find((t:any)=>t.tab===tab),{tab,...lesson},'Exact authored target teaching topic');
   assert(lesson.citations.length>0&&lesson.citations.every((u:string)=>/^https:\/\//.test(u)));assert.equal(new Set(lesson.citations).size,lesson.citations.length);
   if(tab==='quiz'){assert.equal(lesson.bullets.length,4);assert.equal(new Set(lesson.bullets).size,4);assert.equal(lesson.bullets.filter((c:string)=>c===lesson.correctAnswer).length,1);assert(lesson.explanation);}
   for(const mutate of [(t:any)=>{t.body+=' foreign';},(t:any)=>{t.bullets[0]+=' foreign';},(t:any)=>{t.citations[0]='https://foreign.example/';},(t:any)=>{t.note+=' foreign';},...(tab==='quiz'?[(t:any)=>{t.correctAnswer='foreign';},(t:any)=>{t.explanation+=' foreign';}]:[])]){
    const forged=structuredClone(packet);mutate(forged.topics.find((t:any)=>t.tab===tab));assert.equal(await api.parseBodyReviewResponse(forged,identity.id),null);forgeries++;
   }
   for(const patch of [{id:identity.id+'-foreign'},{fmaId:'FMA0'},{name:'Foreign'},{bundle:'thorax-vessels-recovery'},{sources:[...identity.sources,...identity.sources]},{foreign:true}])assert.equal(api.thoracicSystemicTeachingLesson({...identity,...patch},tab),undefined);
   topics++;
  }
  for(const tab of ['clinical','pathology','xray','ct','mri','ultrasound'])assert.equal(api.thoracicSystemicTeachingLesson(identity,tab),undefined);
 }
 assert.equal(topics,12);assert.equal(forgeries,56);
});

test('learner bundles and protected Review bind the same exact thoracic teaching source',async()=>{
 const api=await bundled,review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(review.revision,revision);assert.notEqual(review.revision,parent);
 const paths=['content/thoracic-systemic-teaching-pins.json','content/thoracic-systemic-teaching.ts','lib/thoracic-systemic-teaching.ts','app/body-content.ts'];
 for(const name of ['head-neck','shoulder']){
  const base=`public/atlas-runtime/${name}/`,m=JSON.parse(readFileSync(base+'manifest.json','utf8')),inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  assert.equal(m.sourceCommit,review.revision);assert.equal(m.patientDataIncluded,false);assert.equal(m.clinicalApproved,false);
  for(const path of paths){const f=review.files.find((f:any)=>f.path===path);assert(f);assert.equal(rawSha(readFileSync('atlas-review/'+path)),f.importedSha256);assert.equal(inputs.find((i:any)=>i.path===path)?.sha256,f.sourceSha256);}
  const js=m.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>{const b=readFileSync(base+f.path);assert.equal(rawSha(b),f.sha256);return new TextDecoder('utf-8',{fatal:true}).decode(b);}).join('\n');
  for(const {identity}of entries)for(const tab of tabs)assert(js.includes(api.bodyLesson(identity,tab).body),name+' '+identity.id+'|'+tab);
 }
});
