import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {build} from 'esbuild';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const sha=(value:unknown):string=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const rawSha=(bytes:Buffer):string=>createHash('sha256').update(bytes).digest('hex');
const parentCommit='169e3aef92e866dd98e97f5394c1d2c908268547';
const fmaIds=['FMA46592','FMA46593','FMA55245','FMA55246'];
const sourceFiles:Record<string,string>={FMA55245:'FJ2805',FMA55246:'FJ2787',FMA46592:'FJ2806',FMA46593:'FJ2788'};
const tabs=['anatomy','function'] as const;
const pins=JSON.parse(readFileSync('atlas-review/content/vocal-tissue-teaching-pins.json','utf8'));
const entries:any[]=pins.entries;
assert.equal(pins.sourceCommit,parentCommit);
assert.equal(pins.sourceVersion,'4.0');assert.equal(pins.license,'CC-BY-4.0');
assert.equal(entries.length,4);
assert.deepEqual(entries.map(entry=>entry.identity.fmaId).sort(),fmaIds);
assert.equal(new Set(entries.map(entry=>entry.identity.id)).size,4);
const families=new Map<string,any[]>();
for(const entry of entries){
 const identity=entry.identity;
 assert.equal(identity.region,'head-neck');assert(['left','right'].includes(identity.laterality));
 assert.deepEqual(identity.sources.map((source:any)=>source.file),[sourceFiles[identity.fmaId]]);
 assert(['ligament','vocalis'].includes(entry.family));
 families.set(entry.family,[...(families.get(entry.family)??[]),identity]);
}
assert.equal(families.size,2);
for(const pair of families.values())assert.deepEqual(pair.map(identity=>identity.laterality).sort(),['left','right']);

const bundled=build({stdin:{contents:[
 "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
 "export {vocalTissueTeachingLesson} from './atlas-review/lib/vocal-tissue-teaching';",
 "export {bodyReviewMaterial,bodyReviewSnapshot} from './atlas-review/lib/body-review-material';",
 "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
 "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'})
 .then(result=>import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64')));

test('four exact vocal tissues bind eight Anatomy/Function drafts and retain current Quiz',async()=>{
 const api=await bundled;
 const renderer=JSON.parse(readFileSync('atlas-review/content/body-renderer-revision.json','utf8'));
 let changed=0,forged=0;
 for(const {identity}of entries){
  const snapshot=api.bodyReviewSnapshot(identity.id);
  const material=await api.bodyReviewMaterial(identity.id);
  const context=await api.bodyReviewContext(identity.id);
  assert(snapshot&&material&&context,identity.id);
  assert.equal(material.approval,false);
  assert.deepEqual(snapshot.source.structure,identity);
  assert.deepEqual(material.source.structure,identity);
  assert.deepEqual(await api.parseBodyReviewResponse(material,identity.id),material);
  assert.deepEqual(await api.parseBodyReviewResponse(JSON.parse(JSON.stringify(material)),identity.id),material);
  assert.equal(context.catalogScope,'body-display-catalog');
  assert.equal(context.structureId,identity.id);
  assert.equal(context.structureName,identity.name);
  assert.equal(context.materialHash,material.materialHash);
  assert.equal(context.sourceHash,material.fingerprints.source);
  assert.equal(context.teachingHash,material.fingerprints.teaching);
  assert.equal(context.rendererHash,renderer.sha256);
  assert.equal(context.revisions.imaging,null);
  assert.equal(context.revisions.teaching,sha({catalogScope:context.catalogScope,structureId:identity.id,
   checklistVersion:context.checklistVersion,source:context.sourceHash,teaching:context.teachingHash,checks:context.checklists.teaching}));
  const quiz=api.bodyLesson(identity,'quiz');
  assert.equal(api.vocalTissueTeachingLesson(identity,'quiz'),undefined);
  assert.deepEqual(snapshot.topics.find((topic:any)=>topic.tab==='quiz'),{tab:'quiz',...quiz});
  assert.deepEqual(material.topics.find((topic:any)=>topic.tab==='quiz'),{tab:'quiz',...quiz});
  for(const tab of tabs){
   const lesson=api.vocalTissueTeachingLesson(identity,tab);
   assert(lesson,identity.id+'|'+tab);
   assert.equal(lesson.readiness,'draft');
   assert.deepEqual(api.bodyLesson(identity,tab),lesson);
   const {readiness,...shown}=lesson;
   assert.deepEqual(api.bodyContent(identity,tab),shown);
   assert.deepEqual(snapshot.topics.find((topic:any)=>topic.tab===tab),{tab,...lesson});
   assert.deepEqual(material.topics.find((topic:any)=>topic.tab===tab),{tab,...lesson});
   assert(context.teachingTabs.includes(tab));
   assert.match(lesson.title,new RegExp(identity.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
   assert.match(lesson.note,/review pending/i);
   assert(lesson.citations.length>0);
   assert.equal(new Set(lesson.citations).size,lesson.citations.length);
   assert(lesson.citations.every((url:string)=>/^https:\/\//.test(url)));
   assert(lesson.bullets.some((bullet:string)=>bullet.includes(`Source identity: ${identity.fmaId} · ${identity.laterality} · ${identity.sources.map((source:any)=>source.file).join(', ')}`)));
   for(const mutate of [
    (topic:any)=>{topic.body+=' foreign';},
    (topic:any)=>{topic.bullets[0]+=' foreign';},
    (topic:any)=>{topic.citations[0]='https://foreign.example/';},
    (topic:any)=>{topic.note+=' foreign';},
   ]){
    const stale=structuredClone(material);
    mutate(stale.topics.find((topic:any)=>topic.tab===tab));
    assert.equal(await api.parseBodyReviewResponse(stale,identity.id),null);forged++;
   }
   changed++;
  }
  for(const patch of [{id:identity.id+'-foreign'},{fmaId:'FMA0'},{name:'Foreign'},
   {sources:[...identity.sources,...identity.sources]},{foreign:true}])
   for(const tab of tabs)assert.equal(api.vocalTissueTeachingLesson({...identity,...patch},tab),undefined);
  for(const tab of ['quiz','clinical','pathology','xray','ct','mri','ultrasound'])assert.equal(api.vocalTissueTeachingLesson(identity,tab),undefined);
  const staleIdentity=structuredClone(material);staleIdentity.source.structure={...identity,name:'Foreign'};
  assert.equal(await api.parseBodyReviewResponse(staleIdentity,identity.id),null);
 }
 assert.equal(changed,8);assert.equal(forged,32);
 for(const pair of families.values())for(const tab of tabs){
  const [a,b]=pair.map(identity=>api.bodyLesson(identity,tab));
  assert.equal(a.body,b.body);assert.deepEqual(a.citations,b.citations);
 }
});

test('head-neck and shoulder learner bundles bind imported vocal source closure',async()=>{
 const api=await bundled;
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const pin=validateCurrentAtlasDelivery();
 assert.match(review.revision,/^[a-f0-9]{40}$/);
 assert.notEqual(review.revision,parentCommit);
 const paths=['content/vocal-tissue-teaching-pins.json','content/vocal-tissue-teaching.ts',
  'lib/vocal-tissue-teaching.ts','app/body-content.ts'];
 for(const name of ['head-neck','shoulder']){
  const base=`public/atlas-runtime/${name}/`;
  const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  assert.equal(learner.sourceCommit,pin.runtimeSources[name]);
  assert.equal(learner.patientDataIncluded,false);
  assert.equal(learner.clinicalApproved,false);
  for(const path of paths){
   const record=review.files.find((file:any)=>file.path===path);assert(record,path);
   const imported=readFileSync('atlas-review/'+path);
   assert.equal(rawSha(imported),record.importedSha256,path);
   assert.equal(inputs.find((file:any)=>file.path===path)?.sha256,record.sourceSha256,name+' '+path);
   if(path==='content/vocal-tissue-teaching-pins.json')assert.equal(record.importedSha256,record.sourceSha256);
  }
  const js=learner.files.filter((file:any)=>file.path.endsWith('.js')).map((file:any)=>{
   const bytes=readFileSync(base+file.path);assert.equal(rawSha(bytes),file.sha256);
   return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  }).join('\n');
  for(const {identity}of entries)for(const tab of tabs){
   const lesson=api.bodyLesson(identity,tab);
   assert(js.includes(lesson.body),name+' '+identity.id+'|'+tab);
  }
 }
});
