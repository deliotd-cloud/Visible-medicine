import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';

const sourceCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const baseline='390fc0cec7249d49106cd2bebeeb17bee6989a12';
// SHA-256 of git-show bytes at sourceCommit, independent of checkout line endings.
const sourceFiles={
 'content/orbital-support-mri-pins.json':'51bb8a5fa92edb063e1003f503dc445f029ae6289ea1e6fb7fe81d0d185e55b0',
 'content/orbital-support-mri.ts':'4bd812f1ef86e43ebbe219568fe019f0d878102495902028f6e38a5c26e9e8a8',
 'lib/orbital-support-mri.ts':'2aacd786b9d964a2ba713722f19c81b2cc37460cafcf2f2bdc72181d42366b62',
} as const;
const expected=[
 ['trochlea','right','vm:anatomy:body:head-neck:right:cartilage:trochlea-of-right-superior-oblique','FMA49067','FJ1380','eb522d2de22050bba2a6359cee767cd34d96e8a0bc135db043f9cf86f70d6d6e'],
 ['trochlea','left','vm:anatomy:body:head-neck:left:cartilage:trochlea-of-left-superior-oblique','FMA49068','FJ1329','bd3bb98b659cc91865a50457124aac9353d98d21a5963404cad21cfb010dce2d'],
 ['ring','right','vm:anatomy:body:head-neck:right:tendon:right-common-tendinous-ring','FMA49072','FJ1342','0e8384372e031d2720cbd2c1f776af44cf4003ccd6ff4cc68025d45c7ad44c59'],
 ['ring','left','vm:anatomy:body:head-neck:left:tendon:left-common-tendinous-ring','FMA49073','FJ1291','5c0611ee2d47bb1b50e6832ffb50e82703d188e6b00d1d1d154c25458c178346'],
 ['lateralCheck','right','vm:anatomy:body:head-neck:right:ligament:check-ligament-of-right-lateral-rectus','FMA49144','FJ1334','d9ca3ac16a64fce45856a1bc9efcc1b69e64bd1d13476c8d7a3a761922610f00'],
 ['lateralCheck','left','vm:anatomy:body:head-neck:left:ligament:check-ligament-of-left-lateral-rectus','FMA49145','FJ1284','2bf9ca79c9454eb0b81d30f20d6b889343a6c3e974e19719233932052cf98708'],
 ['medialCheck','right','vm:anatomy:body:head-neck:right:ligament:check-ligament-of-right-medial-rectus','FMA49147','FJ1335','d9e9be9082e35951f08cc43a0300f94145b8f99c7aaf049a8b773e2d9ad9a73e'],
 ['medialCheck','left','vm:anatomy:body:head-neck:left:ligament:check-ligament-of-left-medial-rectus','FMA49148','FJ1292','1f1eae3eee17d09c5ae914f223b842bdd1a8bcf0c051953404ce09dff1693ed9'],
 ['upperTarsal','right','vm:anatomy:body:head-neck:right:connective-tissue:tarsal-plate-of-right-upper-eyelid','FMA59091','FJ1375','752358970eb428283dadd2db88fbb3de3d08b7b876a9e346a84c21cb90a5e70a'],
 ['upperTarsal','left','vm:anatomy:body:head-neck:left:connective-tissue:tarsal-plate-of-left-upper-eyelid','FMA59092','FJ1324','eeb0db9872f49810b69d7865328602d6419327b2f46fda388cd76f8960f5f188'],
 ['lowerTarsal','right','vm:anatomy:body:head-neck:right:connective-tissue:tarsal-plate-of-right-lower-eyelid','FMA59089','FJ1379','fd33c2b682d289f26dc00f99cab43a8a835e15b5722d75850739a540517e4ff2'],
 ['lowerTarsal','left','vm:anatomy:body:head-neck:left:connective-tissue:tarsal-plate-of-left-lower-eyelid','FMA59090','FJ1328','c3ba07f82baf4e55563d9736653ef768cb047bbf277a079aacbcfa780096d322'],
] as const;
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

test('twelve orbital support MRI drafts retain exact learner and Review bindings',async()=>{
 const review=json('atlas-review/manifest.json');
 const pins=json('atlas-review/content/orbital-support-mri-pins.json');
 assert.equal(review.revision,sourceCommit);
 assert.equal(pins.baseline,baseline);
 assert.equal(pins.entries.length,12);
 assert.equal(new Set(pins.entries.map((entry:{identity:{id:string}})=>entry.identity.id)).size,12);
 assert.deepEqual(pins.entries.map((entry:{family:string;identity:{laterality:string;id:string;fmaId:string;sources:unknown}})=>
  [entry.family,entry.identity.laterality,entry.identity.id,entry.identity.fmaId,
   (entry.identity.sources as {file:string;sha256:string}[])[0]?.file,
   (entry.identity.sources as {file:string;sha256:string}[])[0]?.sha256]),expected);
 for(const family of ['trochlea','ring','lateralCheck','medialCheck','upperTarsal','lowerTarsal'])
  assert.deepEqual(pins.entries.filter((entry:{family:string})=>entry.family===family)
   .map((entry:{identity:{laterality:string}})=>entry.identity.laterality),['right','left']);
 for(const [path,digest] of Object.entries(sourceFiles)){
  const imported=review.files.find((file:{path:string})=>file.path===path);
  assert(imported,path);
  assert.equal(imported.sourceSha256,digest,path);
  assert.equal(imported.importedSha256,digest,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),digest,path);
 }
 const learnerBundles:string[]=[];
 // Root-body teaching lives in the regional/whole-body module, not the separate shoulder pilot.
 for(const module of ['head-neck']){
  const base=`public/atlas-runtime/${module}/`;
  const manifest=json(base+'manifest.json');
  const inputs=json(base+'source-inputs.json');
  assert.equal(manifest.sourceCommit,sourceCommit,module);
  assert.equal(manifest.patientDataIncluded,false,module);
  assert.equal(manifest.clinicalApproved,false,module);
  for(const [path,digest] of Object.entries(sourceFiles))
   assert.equal(inputs.find((file:{path:string})=>file.path===path)?.sha256,digest,`${module}: ${path}`);
  learnerBundles.push(manifest.files.filter((file:{path:string})=>file.path.endsWith('.js'))
   .map((file:{path:string;sha256:string})=>{
    const bytes=readFileSync(base+file.path);
    assert.equal(sha(bytes),file.sha256,`${module}: ${file.path}`);
    return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
   }).join('\n'));
 }
 const compiled=await build({stdin:{contents:[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {orbitalSupportMriLesson} from './atlas-review/lib/orbital-support-mri';",
  "export {orbitalSupportMriFacts,orbitalSupportMriLimitations,orbitalSupportMriReferences} from './atlas-review/content/orbital-support-mri';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 assert.deepEqual(Object.keys(api.orbitalSupportMriFacts),['trochlea','ring','lateralCheck','medialCheck','upperTarsal','lowerTarsal']);
 for(const [index,[family,side,id,fmaId,file,digest]] of expected.entries()){
  const {identity,previous}=pins.entries[index];
  assert.equal(identity.id,id);
  assert.equal(identity.fmaId,fmaId);
  assert.equal(identity.laterality,side);
  assert.equal(identity.region,'head-neck');
  assert.equal(identity.nodeName,fmaId);
  assert.deepEqual(identity.sources,[{file,sha256:digest}]);
  assert.equal(identity.validation.anatomicalReview,false);
  assert.equal(previous.readiness,'pending');
  const lesson=api.orbitalSupportMriLesson(identity,'mri');
  assert(lesson,id);
  assert.deepEqual(api.bodyLesson(identity,'mri'),lesson,id);
  assert.equal(lesson.readiness,'draft');
  assert.equal(lesson.title,`${identity.name} · MRI orientation · draft`);
  assert.equal(lesson.body,api.orbitalSupportMriFacts[family].body);
  assert.deepEqual(lesson.bullets,[api.orbitalSupportMriFacts[family].distinction,...api.orbitalSupportMriLimitations]);
  assert.deepEqual(lesson.citations,api.orbitalSupportMriReferences);
  assert.match(lesson.note,/Revision-bound radiologist review pending/);
  assert.match(lesson.note,/No scan, patient registration, diagnostic finding or clinical approval/);
  assert.match(lesson.note,/Atlas, imaging-case and lecture access remain independent/);
  for(const bundle of learnerBundles)for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])
   assert(bundle.includes(value),`${id}: learner missing ${value}`);
  const packet=wire(await api.bodyReviewMaterial(id));
  const context=await api.bodyReviewContext(id);
  assert(packet&&context,id);
  assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  assert.deepEqual(packet.source.structure,identity);
  assert.deepEqual(packet.topics.find((topic:{tab:string})=>topic.tab==='mri'),{tab:'mri',...lesson});
  assert.equal(context.structureId,id);
  assert.equal(context.materialHash,packet.materialHash);
  assert.equal(context.sourceHash,packet.fingerprints.source);
  assert.equal(context.teachingHash,packet.fingerprints.teaching);
  assert.equal(context.revisions.imaging,null);
  const scope={catalogScope:context.catalogScope,structureId:id,checklistVersion:context.checklistVersion};
  assert.equal(context.revisions.geometry,sha(JSON.stringify({...scope,source:packet.fingerprints.source,
   renderer:context.rendererHash,checks:context.checklists.geometry})),id);
  assert.equal(context.revisions.teaching,sha(JSON.stringify({...scope,source:packet.fingerprints.source,
   teaching:packet.fingerprints.teaching,checks:context.checklists.teaching})),id);
  assert(context.blockers.imaging.some((blocker:string)=>/No validated acquired-image series or spatial registration/.test(blocker)),id);
  assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet);
  // Display pins cover displayed evidence, not redundant fingerprint claims.
  // Decision revision/material authority is independently tested at the server below.
  for(const change of ['body','citation','source']){
   const bad=wire(packet);
   if(change==='body')bad.topics.find((topic:{tab:string})=>topic.tab==='mri').body+=' foreign';
   if(change==='citation')bad.topics.find((topic:{tab:string})=>topic.tab==='mri').citations[0]+='?foreign=1';
   if(change==='source')bad.source.structure.sources[0].sha256='0'.repeat(64);
   assert.equal(await api.parseBodyReviewResponse(bad,id),null,`${id}: ${change}`);
  }
  for(const claim of ['materialHash','revisionHash'] as const){
   const input={catalogScope:context.catalogScope,structureId:id,track:'teaching',expectedVersion:0,
    materialHash:context.materialHash,revisionHash:context.revisions.teaching,
    checklistVersion:context.checklistVersion,draft:{}};
   input[claim]='0'.repeat(64);
   const response=await api.postBodyDecision(new Request('https://review.test/api/body-review',{
    method:'POST',headers:{'oai-authenticated-user-id':'test-reviewer','origin':'https://review.test',
     'content-type':'application/json'},body:JSON.stringify(input)}),undefined);
   assert.equal(response.status,409,`${id}: stale ${claim}`);
  }
  for(const patch of [{name:'Foreign'},{fmaId:'FMA0'},{sources:[...identity.sources,...identity.sources]},
   {bounds:{...identity.bounds,min:[0,0,0]}}])
   assert.equal(api.orbitalSupportMriLesson({...identity,...patch},'mri'),undefined,id);
  for(const tab of ['ct','xray','ultrasound','clinical','pathology'])
   assert.equal(api.orbitalSupportMriLesson(identity,tab),undefined,`${id}: ${tab}`);
 }
});
