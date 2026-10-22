// Current-delivery contract for the f505 orbital check-ligament teaching increment.
// The 9f-era original-admission fixture remains a separate historical theorem.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import test from 'node:test';
import {checkedAtlasSourceRepo} from './atlas-source-repo.mjs';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {validateCurrentAtlasDelivery as validateHistoricalAtlasDelivery} from './fixtures/closed56-validator/tests/current-atlas-delivery.mjs';

const introduction='f5052a1906bf9b87e5235bda57d367b1103729db';
const currentPin=validateCurrentAtlasDelivery();
const current=currentPin.source;
const atlas=checkedAtlasSourceRepo(current);
const website=fileURLToPath(new URL('../',import.meta.url));
const prior='509b01da5d72f33bd774e4a59d63e2406af1f2ff';
const evidence='https://pubmed.ncbi.nlm.nih.gov/9537133/';
const checked=new Set(['lateralCheck','medialCheck']);
const sourcePaths=['content/orbital-support-mri-pins.json','content/orbital-support-mri.ts','lib/orbital-support-mri.ts'];
const sourceChangePaths=sourcePaths.slice(1);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=(base,path)=>readFileSync(join(base,path));
const json=(base,path)=>JSON.parse(read(base,path));
const wire=value=>JSON.parse(JSON.stringify(value));
const git=(args,encoding)=>execFileSync('git',['--no-replace-objects',...args],{
 cwd:atlas,encoding,windowsHide:true,maxBuffer:32e6,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},
});
const gitBytes=(commit,path)=>git(['show',`${commit}:${path}`]);
const checkSha=(base,path,expected)=>assert.equal(sha(read(base,path)),expected,path);
const closedPinBytes=read(website,'tests/fixtures/current-atlas-delivery-before-foot-venous-xray.json.raw');
const closedPin=JSON.parse(closedPinBytes);
const readClosed=path=>read(website,'tests/fixtures/f505-closed/'+path);

const expected=[
 ['trochlea','right','FMA49067','FJ1380','eb522d2de22050bba2a6359cee767cd34d96e8a0bc135db043f9cf86f70d6d6e'],
 ['trochlea','left','FMA49068','FJ1329','bd3bb98b659cc91865a50457124aac9353d98d21a5963404cad21cfb010dce2d'],
 ['ring','right','FMA49072','FJ1342','0e8384372e031d2720cbd2c1f776af44cf4003ccd6ff4cc68025d45c7ad44c59'],
 ['ring','left','FMA49073','FJ1291','5c0611ee2d47bb1b50e6832ffb50e82703d188e6b00d1d1d154c25458c178346'],
 ['lateralCheck','right','FMA49144','FJ1334','d9ca3ac16a64fce45856a1bc9efcc1b69e64bd1d13476c8d7a3a761922610f00'],
 ['lateralCheck','left','FMA49145','FJ1284','2bf9ca79c9454eb0b81d30f20d6b889343a6c3e974e19719233932052cf98708'],
 ['medialCheck','right','FMA49147','FJ1335','d9e9be9082e35951f08cc43a0300f94145b8f99c7aaf049a8b773e2d9ad9a73e'],
 ['medialCheck','left','FMA49148','FJ1292','1f1eae3eee17d09c5ae914f223b842bdd1a8bcf0c051953404ce09dff1693ed9'],
 ['upperTarsal','right','FMA59091','FJ1375','752358970eb428283dadd2db88fbb3de3d08b7b876a9e346a84c21cb90a5e70a'],
 ['upperTarsal','left','FMA59092','FJ1324','eeb0db9872f49810b69d7865328602d6419327b2f46fda388cd76f8960f5f188'],
 ['lowerTarsal','right','FMA59089','FJ1379','fd33c2b682d289f26dc00f99cab43a8a835e15b5722d75850739a540517e4ff2'],
 ['lowerTarsal','left','FMA59090','FJ1328','c3ba07f82baf4e55563d9736653ef768cb047bbf277a079aacbcfa780096d322'],
];

async function importedApi(){
 const require=createRequire(join(website,'package.json'));
 const {build}=require('esbuild');
 const compiled=await build({stdin:{contents:[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {orbitalSupportMriLesson} from './atlas-review/lib/orbital-support-mri';",
  "export {orbitalSupportMriFacts,orbitalSupportMriLimitations,orbitalSupportMriReferences,orbitalSupportMriCheckEvidence} from './atlas-review/content/orbital-support-mri';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
 ].join('\n'),resolveDir:website,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 return import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}

test('current Atlas check-ligament evidence reaches exact Review and four learner deliveries',async()=>{
 assert.equal(sha(read(website,'tests/fixtures/clinical-review-orbital-check-evidence.test.mjs.raw')),'6f1718b9b652cee0e66960728a7885b7c160df00207b9182fc6c93502091d12e');
 assert.equal(sha(closedPinBytes),'28b970fbc9e001504d09fef7e85199a5d2027df324ef767e982c309d9cc2a0c3');
 assert.equal(sha(readFileSync(new URL('./fixtures/closed56-validator/tests/current-atlas-delivery.mjs',import.meta.url))),'dfcce9763cba89e6d94f6e7e75ceb59f79ca73ac0d6056552bbe00139e804d62','Frozen schema1 validator changed');
 assert.equal(validateHistoricalAtlasDelivery({pin:closedPin,read:readClosed}).source,introduction);
 assert.equal(closedPin.reviewSourceFiles,1538);
 assert.equal(closedPin.sourceTree,'36381d525f7c6886743bcec00fcee96931d65c58');
 assert.equal(git(['rev-parse',`${introduction}^{tree}`],'utf8').trim(),closedPin.sourceTree);
 assert.equal(git(['rev-parse','HEAD'],'utf8').trim(),current);
 assert.equal(git(['rev-parse',`${current}^{tree}`],'utf8').trim(),currentPin.sourceTree);
 assert.equal(git(['status','--porcelain=v1'],'utf8').trim(),'','Atlas source must be clean');
 const pins=json(atlas,sourcePaths[0]);
 for(const path of sourcePaths)assert.deepEqual(gitBytes(introduction,path),gitBytes(current,path),`${path}: unchanged since f505 introduction`);
 assert.deepEqual(read(atlas,sourcePaths[0]),gitBytes(current,sourcePaths[0]));
 assert.deepEqual(gitBytes(prior,sourcePaths[0]),gitBytes(current,sourcePaths[0]),'original pins retained');
 for(const path of sourceChangePaths){
  assert.deepEqual(read(atlas,path),gitBytes(current,path),path);
  assert.notDeepEqual(gitBytes(prior,path),gitBytes(current,path),`${path}: actual f505 delta`);
 }
 const sourceHash=Object.fromEntries(sourcePaths.map(path=>[path,sha(gitBytes(current,path))]));
 const review=json(website,'atlas-review/manifest.json');
 assert.equal(review.revision,current);
 assert.equal(review.files.length,currentPin.reviewSourceFiles);
 for(const [path,digest] of Object.entries(sourceHash)){
  const imported=review.files.find(file=>file.path===path);
  assert(imported,path);
  assert.equal(imported.sourceSha256,digest,path);
  assert.equal(imported.importedSha256,digest,path);
  checkSha(website,'atlas-review/'+path,digest);
 }
 const atlasBundles=new Map(pins.bundles.map(bundle=>[bundle.id,bundle]));
 assert.equal(pins.entries.length,12);
 assert.equal(atlasBundles.size,3);
 assert.equal(new Set(pins.entries.map(entry=>entry.identity.id)).size,12);
 assert.deepEqual(pins.entries.map(({family,identity})=>[
  family,identity.laterality,identity.fmaId,identity.sources[0]?.file,identity.sources[0]?.sha256,
 ]),expected);
 for(const bundle of pins.bundles){
  const sourcePath='public'+new URL(bundle.url,'https://atlas.invalid').pathname;
  const path='public/atlas-runtime/head-neck'+new URL(bundle.url,'https://atlas.invalid').pathname;
  const bytes=read(website,path);
  assert.equal(bytes.length,bundle.bytes,path);
  assert.equal(sha(bytes),bundle.sha256,path);
  assert.deepEqual(bytes,gitBytes(current,sourcePath),path);
 }
 const learnerBundles=[];
 for(const module of ['head-neck','shoulder','female-pelvis','lower-limb']){
  const base=`public/atlas-runtime/${module}/`;
  const manifest=json(website,base+'manifest.json');
  const inputs=json(website,base+'source-inputs.json');
  const runtimeSource=currentPin.runtimeSources[module];
  assert.equal(git(['rev-parse',`${runtimeSource}^{commit}`],'utf8').trim(),runtimeSource,`${module}: source commit`);
  assert.equal(manifest.sourceCommit,runtimeSource,module);
  assert.equal(manifest.patientDataIncluded,false,module);
  assert.equal(manifest.clinicalApproved,false,module);
  // The shared body renderer and shoulder contain the root teaching resolver;
  // separate specimen modules do not promise orbital lessons outside their scope.
  if(module==='head-neck'||module==='shoulder')
   for(const [path,digest] of Object.entries(sourceHash)){
    const runtimeBytes=gitBytes(runtimeSource,path);
    assert.deepEqual(runtimeBytes,gitBytes(current,path),`${module}: ${path} source continuity`);
    assert.equal(inputs.find(file=>file.path===path)?.sha256,sha(runtimeBytes),`${module}: ${path}`);
    assert.equal(sha(runtimeBytes),digest,`${module}: ${path} Review source`);
   }
  if(module==='head-neck')learnerBundles.push(manifest.files.filter(file=>file.path.endsWith('.js'))
   .map(file=>{checkSha(website,base+file.path,file.sha256);return read(website,base+file.path).toString('utf8');}).join('\n'));
 }
 const api=await importedApi();
 assert.deepEqual(Object.keys(api.orbitalSupportMriFacts),['trochlea','ring','lateralCheck','medialCheck','upperTarsal','lowerTarsal']);
 assert.equal(api.orbitalSupportMriCheckEvidence.reference,evidence);
 assert.match(api.orbitalSupportMriCheckEvidence.note,/four normal volunteers/i);
 assert.match(api.orbitalSupportMriCheckEvidence.note,/does not establish separate medial or lateral identification/i);
 for(const limit of [/1 T/,/surface coil/i,/routine-protocol visibility/i,/diagnostic accuracy/i])
  assert.match(api.orbitalSupportMriCheckEvidence.note,limit);
 const regional=json(website,'atlas-review/content/regional-teaching/head-neck.json');
 const regionalRows=new Map(regional.entries.map(entry=>[JSON.parse(entry.identity).id,entry]));
 assert.equal(regionalRows.size,regional.entries.length);
 for(let index=0;index<pins.entries.length;index++){
  const {family,identity,previous}=pins.entries[index];
  const [expectedFamily,side,fma,file,digest]=expected[index];
  assert.equal(family,expectedFamily);
  assert.equal(identity.laterality,side);
  assert.equal(identity.fmaId,fma);
  assert.equal(identity.nodeName,fma);
  assert.deepEqual(identity.sources,[{file,sha256:digest}]);
  assert(atlasBundles.has(identity.bundle),identity.id);
  assert.equal(identity.validation.anatomicalReview,false);
  assert.equal(previous.readiness,'pending');
  const lesson=api.orbitalSupportMriLesson(identity,'mri');
  assert(lesson,identity.id);
  assert.deepEqual(api.bodyLesson(identity,'mri'),lesson,identity.id);
  assert.equal(lesson.readiness,'draft');
  assert.deepEqual(lesson.bullets,[api.orbitalSupportMriFacts[family].distinction,
   ...api.orbitalSupportMriLimitations,...(checked.has(family)?[api.orbitalSupportMriCheckEvidence.note]:[])]);
  assert.deepEqual(lesson.citations,[...api.orbitalSupportMriReferences,...(checked.has(family)?[evidence]:[])]);
  assert.match(lesson.note,/Revision-bound radiologist review pending/);
  assert.match(lesson.note,/No scan, patient registration, diagnostic finding or clinical approval/);
  assert.match(lesson.note,/Atlas, imaging-case and lecture access remain independent/);
  const regionalLesson=regionalRows.get(identity.id)?.lessons?.mri;
  assert.deepEqual(regionalLesson,lesson,`${identity.id}: emitted regional teaching`);
  for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])
   assert(learnerBundles[0].includes(value),`${identity.id}: missing emitted text: ${value}`);
  const packet=wire(await api.bodyReviewMaterial(identity.id));
  const context=await api.bodyReviewContext(identity.id);
  assert(packet&&context,identity.id);
  assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  assert.deepEqual(packet.source.structure,identity);
  assert.deepEqual(packet.topics.find(topic=>topic.tab==='mri'),{tab:'mri',...lesson});
  assert.equal(context.structureId,identity.id);
  assert.equal(context.materialHash,packet.materialHash);
  assert.equal(context.sourceHash,packet.fingerprints.source);
  assert.equal(context.teachingHash,packet.fingerprints.teaching);
  const reviewScope={catalogScope:context.catalogScope,structureId:identity.id,checklistVersion:context.checklistVersion};
  assert.equal(context.revisions.geometry,sha(JSON.stringify({...reviewScope,source:packet.fingerprints.source,
   renderer:context.rendererHash,checks:context.checklists.geometry})));
  assert.equal(context.revisions.teaching,sha(JSON.stringify({...reviewScope,source:packet.fingerprints.source,
   teaching:packet.fingerprints.teaching,checks:context.checklists.teaching})));
  assert.equal(context.revisions.imaging,null);
  assert(context.blockers.imaging.some(blocker=>/No validated acquired-image series or spatial registration/.test(blocker)));
  assert.deepEqual(await api.parseBodyReviewResponse(packet,identity.id),packet);
  for(const kind of ['body','citation','source']){
   const bad=wire(packet);
   if(kind==='body')bad.topics.find(topic=>topic.tab==='mri').body+=' tampered';
   if(kind==='citation')bad.topics.find(topic=>topic.tab==='mri').citations[0]+='?tampered=1';
   if(kind==='source')bad.source.structure.sources[0].sha256='0'.repeat(64);
   assert.equal(await api.parseBodyReviewResponse(bad,identity.id),null,`${identity.id}: ${kind}`);
  }
  for(const claim of ['materialHash','revisionHash']){
   const input={catalogScope:context.catalogScope,structureId:identity.id,track:'teaching',expectedVersion:0,
    materialHash:context.materialHash,revisionHash:context.revisions.teaching,
    checklistVersion:context.checklistVersion,draft:{}};
   input[claim]='0'.repeat(64);
   const response=await api.postBodyDecision(new Request('https://review.test/api/body-review',{
    method:'POST',headers:{'oai-authenticated-user-id':'test-reviewer',origin:'https://review.test',
     'content-type':'application/json'},body:JSON.stringify(input)}),undefined);
   assert.equal(response.status,409,`${identity.id}: stale ${claim}`);
  }
  for(const patch of [{name:'Forged'},{fmaId:'FMA0'},{sources:[...identity.sources,...identity.sources]},
   {bounds:{...identity.bounds,min:[0,0,0]}}])
   assert.equal(api.orbitalSupportMriLesson({...identity,...patch},'mri'),undefined,identity.id);
  for(const tab of ['ct','xray','ultrasound','clinical','pathology'])
   assert.equal(api.orbitalSupportMriLesson(identity,tab),undefined,`${identity.id}: ${tab}`);
 }
 // The prior epoch supplies the expected eight unchanged lessons. It is replayed
 // from real Git application blobs by the existing Git-only helper, with no override.
 const {exactOrbitalSupportHistory}=await import(pathToFileURL(join(atlas,'scripts/exact-orbital-support-history.mjs')).href);
 const old=(await exactOrbitalSupportHistory(prior)).helper;
 let fourChanged=0,eightUnchanged=0;
 for(const {family,identity} of pins.entries){
  const before=old.orbitalSupportMriLesson(identity,'mri');
  const after=api.orbitalSupportMriLesson(identity,'mri');
  assert(before&&after,identity.id);
  if(checked.has(family)){
   fourChanged++;
   assert.deepEqual(after,{...before,bullets:[...before.bullets,api.orbitalSupportMriCheckEvidence.note],
    citations:[...before.citations,evidence]},identity.id);
  }else{eightUnchanged++;assert.deepEqual(after,before,identity.id);}
 }
 assert.equal(fourChanged,4);
 assert.equal(eightUnchanged,8);
});

