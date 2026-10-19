import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {build} from 'esbuild';

const sha=(value:any):string=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const rawSha=(bytes:Buffer):string=>createHash('sha256').update(bytes).digest('hex');
const expectedHashes:Record<string,string>={
 FMA7204:'6dba5604aee2954b9c5101e1ec434b8c3015419ecdfc4c93157ec161ee1662c3',
 FMA7205:'e2ca998670ad27ade8099262e896764729c47dacb897f4959980f2fe6d7c9658',
};
async function currentApi(){
 const compiled=await build({stdin:{contents:[
  "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
  "export {abdominalOrganImagingLesson} from './atlas-review/lib/abdominal-organ-imaging';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 return import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}
const pins=JSON.parse(readFileSync('atlas-review/content/abdominal-organ-imaging-pins.json','utf8'));
const identities:any[]=pins.entries.filter((entry:any)=>Object.hasOwn(expectedHashes,entry.identity.fmaId)).map((entry:any)=>entry.identity);
assert.deepEqual(identities.map((identity:any)=>identity.fmaId).sort(),['FMA7204','FMA7205']);

test('two imported renal ultrasound drafts retain exact source identity and reject forged Review packets',async()=>{
 const api=await currentApi();
 for(const identity of identities){
  const lesson=api.abdominalOrganImagingLesson(identity,'ultrasound');
  assert.equal(sha(lesson),expectedHashes[identity.fmaId]);
  assert.deepEqual(api.bodyLesson(identity,'ultrasound'),lesson);
  const {readiness,...shown}=lesson;assert.equal(readiness,'draft');
  assert.deepEqual(api.bodyContent(identity,'ultrasound'),shown);
  assert.equal(lesson.bullets.length,6);assert.equal(lesson.citations.length,4);
  assert.match(lesson.note,/review pending/);assert.match(lesson.note,/No patient images, scan registration or paid-lecture access/);
  assert.match(lesson.bullets.at(-1),/not registered/);
  assert.equal(lesson.title,`${identity.name} · Ultrasound orientation · draft`);
  const material=await api.bodyReviewMaterial(identity.id);
  assert.equal(material.approval,false);assert.deepEqual(material.source.structure,identity);
  assert.deepEqual(material.topics.find((topic:any)=>topic.tab==='ultrasound'),{tab:'ultrasound',...lesson});
  assert.deepEqual(await api.parseBodyReviewResponse(material,identity.id),material);
  for(const field of ['body','bullet','reference','note']){
   const forged=structuredClone(material),topic=forged.topics.find((topic:any)=>topic.tab==='ultrasound');
   if(field==='body')topic.body+=' foreign';
   if(field==='bullet')topic.bullets[0]+=' foreign';
   if(field==='reference')topic.citations[0]='https://foreign.example/';
   if(field==='note')topic.note+=' foreign';
   assert.equal(await api.parseBodyReviewResponse(forged,identity.id),null);
  }
  for(const patch of [{id:identity.id+'-foreign'},{fmaId:'FMA0'},{name:'Foreign'},
   {sources:[...identity.sources,...identity.sources]},{foreign:true}]){
   assert.equal(api.abdominalOrganImagingLesson({...identity,...patch},'ultrasound'),undefined);
  }
 }
});

test('actual regional learner bundle includes the same renal teaching and source inputs as Review',async()=>{
 const api=await currentApi(),review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const base='public/atlas-runtime/head-neck/',learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
 assert.equal(learner.sourceCommit,review.revision);assert.equal(learner.patientDataIncluded,false);assert.equal(learner.clinicalApproved,false);
 const js=learner.files.filter((file:any)=>file.path.endsWith('.js')).map((file:any)=>{
  const bytes=readFileSync(base+file.path);assert.equal(rawSha(bytes),file.sha256);return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 }).join('\n');
 for(const path of ['content/abdominal-organ-imaging.ts','lib/abdominal-organ-imaging.ts']){
  const record=review.files.find((file:any)=>file.path===path);assert(record,path);
  assert.equal(inputs.find((file:any)=>file.path===path)?.sha256,record.sourceSha256);
  assert.equal(rawSha(readFileSync('atlas-review/'+path)),record.importedSha256);
 }
 for(const identity of identities){const lesson=api.bodyLesson(identity,'ultrasound');
  assert.equal(sha(lesson),expectedHashes[identity.fmaId]);
  for(const marker of [lesson.body,...lesson.bullets,...lesson.citations])assert(js.includes(marker),identity.id);
 }
});
