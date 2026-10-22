import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {admitPreservedClinicalReview} from './clinical-review-current-admission.mjs';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const parent='894c899f194b143c3ef6260f88e017296917649f';
const sourceHashes:Record<string,string>={
  // Independently measured from git show b3a9ff28:<path> in Atlas.
  'content/pectoral-branch-ultrasound.ts':'ff7719463b42e358fdb6834445cc9f9fb9a9776d4aed7c43a124cf4007200e9e',
  'lib/pectoral-branch-ultrasound.ts':'14fa0c953c18d3ba78a28925496318c7ae3420c69d70c75402f427274f230633',
  'content/thoracoacromial-quiz-pins.json':'65307f01c0bb7c2991a6bc3ae1b0484effbd588840c116523394b2591d966bf3',
};
const expected:Record<string,{side:'right'|'left';file:string;sha256:string}>={
  FMA23063:{side:'right',file:'FJ2361',sha256:'341bf21d162b7d1f60261396f397db0d7d4acb5be2295e30dea7f6b9394651e8'},
  FMA23064:{side:'left',file:'FJ2330',sha256:'3defe0932a0a8948faf7037f0812527864b9ac4e4f8251f45873d7b48ab00977'},
};
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
type Identity={id:string;fmaId:string;name:string;laterality:string;category:string;region:string;
  bundle:string;nodeName:string;sources:{file:string;sha256:string}[];bounds:{min:number[]}};
type Entry={identity:Identity;group:string};
const pathsWhere=(value:unknown,predicate:(value:unknown)=>boolean,path:string[]=[]):string[][]=>[
  ...(predicate(value)?[path]:[]),
  ...(value&&typeof value==='object'?Object.entries(value).flatMap(([key,part])=>
    pathsWhere(part,predicate,[...path,key])):[]),
];
const at=(value:unknown,path:string[])=>path.reduce((part,key)=>(part as Record<string,unknown>)[key],value);

test('two pectoral ultrasound drafts bind exact Atlas source, learner runtimes and protected Review',async()=>{
  const currentRevision=admitPreservedClinicalReview({revision,sourceHashes,learnerModules:['head-neck','shoulder']});
  const deliveryPin=validateCurrentAtlasDelivery();
  assert.equal(deliveryPin.source,currentRevision);
  const review=json('atlas-review/manifest.json');
  const pins=json('atlas-review/content/thoracoacromial-quiz-pins.json');
  const catalog=json('atlas-review/public/models/bodyparts3d/full-body/catalog.json');
  assert.equal(review.revision,currentRevision);
  assert.equal(pins.parentCommit,parent);
  assert.equal(pins.entries.length,8);
  const entries=(pins.entries as Entry[]).filter(entry=>entry.group==='pectoral');
  assert.deepEqual(entries.map(entry=>entry.identity.fmaId),['FMA23063','FMA23064']);
  assert.equal(new Set(entries.map(entry=>entry.identity.id)).size,2);
  assert.deepEqual(pins.bundles.map((bundle:{id:string;sha256:string})=>[bundle.id,bundle.sha256]),[
    ['shoulder-arm-vessels-inventory','d12d81529a1408f934b5055462bb39f0f79c84e25c878a25225652b9baac3e84'],
  ]);
  for(const entry of entries){
    const {identity}=entry,source=expected[identity.fmaId];assert(source,identity.id);
    assert.equal(identity.id,`vm:anatomy:body:shoulder-arm:${source.side}:vessel:pectoral-branch-of-${source.side}-thoraco-acromial-artery`);
    assert.equal(identity.laterality,source.side);
    assert.equal(identity.region,'shoulder-arm');assert.equal(identity.category,'vessel');
    assert.equal(identity.bundle,'shoulder-arm-vessels-inventory');
    assert.equal(identity.nodeName,identity.fmaId);
    assert.deepEqual(identity.sources,[{file:source.file,sha256:source.sha256}]);
    assert.deepEqual(catalog.structures.filter((item:Identity)=>item.id===identity.id),[identity]);
  }
  for(const [path,expectedHash] of Object.entries(sourceHashes)){
    const file=review.files.find((item:{path:string})=>item.path===path);
    assert(file,`Review missing ${path}`);
    assert.equal(file.sourceSha256,expectedHash,path);
    assert.equal(file.importedSha256,expectedHash,path);
    assert.equal(sha(readFileSync('atlas-review/'+path)),expectedHash,path);
  }

  const learnerBundles:string[]=[];
  for(const module of ['head-neck','female-pelvis','lower-limb','shoulder']){
    const base=`public/atlas-runtime/${module}/`;
    const manifest=json(base+'manifest.json'),inputs=json(base+'source-inputs.json');
    assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[module],module);
    assert.equal(manifest.patientDataIncluded,false,module);
    assert.equal(manifest.clinicalApproved,false,module);
    for(const [path,expectedHash] of Object.entries(sourceHashes)){
      const input=inputs.find((file:{path:string})=>file.path===path);
      if(module==='head-neck'||module==='shoulder')assert.equal(input?.sha256,expectedHash,`${module}: ${path}`);
      else assert.equal(input,undefined,`${module}: unexpected ${path}`);
    }
    if(module!=='head-neck'&&module!=='shoulder')continue;
    if(module==='head-neck')assert(manifest.regionalScopes.some((scope:{region:string;regionalIds:string[]})=>
      scope.region==='shoulder-arm'&&entries.every(entry=>scope.regionalIds.includes(entry.identity.id))));
    learnerBundles.push(manifest.files.filter((file:{path:string})=>file.path.endsWith('.js')).map((file:{path:string;sha256:string})=>{
      const bytes=readFileSync(base+file.path);assert.equal(sha(bytes),file.sha256,`${module}: ${file.path}`);
      return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
    }).join('\n'));
  }

  const compiled=await build({stdin:{contents:[
    "export {bodyLesson} from './atlas-review/app/body-content';",
    "export {pectoralBranchUltrasoundLesson} from './atlas-review/lib/pectoral-branch-ultrasound';",
    "export {pectoralBranchUltrasound} from './atlas-review/content/pectoral-branch-ultrasound';",
    "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
    "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
    "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
    "export {parseBodyDecisionPage} from './atlas-review/lib/body-review-client';",
    "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
  ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  const authored=api.pectoralBranchUltrasound;
  assert.deepEqual(Object.keys(authored).sort(),['body','bullets','citations','note']);
  assert.deepEqual(authored.citations,['https://pubmed.ncbi.nlm.nih.gov/15622236/']);
  assert.match(authored.body,/colour Doppler/);
  assert.match(authored.note,/revision-bound radiologist review pending/i);
  assert.match(authored.note,/no acquired ultrasound image/i);
  assert.match(authored.note,/patient-space registration/i);
  assert.match(authored.note,/access remain independent/i);

  for(const {identity} of entries){
    const id=identity.id,lesson=api.pectoralBranchUltrasoundLesson(identity,'ultrasound');
    assert(lesson,id);assert.equal(lesson.readiness,'draft',id);
    assert.deepEqual(api.bodyLesson(identity,'ultrasound'),lesson,id);
    assert.equal(lesson.body,authored.body,id);
    assert.deepEqual(lesson.bullets,authored.bullets,id);
    assert.deepEqual(lesson.citations,authored.citations,id);
    assert.equal(lesson.note,authored.note,id);
    for(const bundle of learnerBundles)for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])
      assert(bundle.includes(value),`${id}: learner missing ${value}`);
    const packet=wire(await api.bodyReviewMaterial(id));assert(packet,id);
    assert.equal(packet.approval,false,id);
    assert.equal(packet.status,'worksheet-not-submitted',id);
    assert.deepEqual(packet.source.structure,identity,id);
    assert.equal(packet.source.bundle.sha256,pins.bundles[0].sha256,id);
    assert.deepEqual(packet.topics.find((topic:{tab:string})=>topic.tab==='ultrasound'),
      {tab:'ultrasound',...lesson},id);
    const context=await api.bodyReviewContext(id);assert(context,id);
    assert.equal(context.structureId,id);
    assert.equal(context.sourceHash,packet.fingerprints.source);
    assert.equal(context.teachingHash,packet.fingerprints.teaching);
    assert.equal(context.materialHash,packet.materialHash);
    assert.equal(context.revisions.imaging,null);
    assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet);
    const decisionPage={scope:'private-to-signed-in-user',track:'teaching',
      context:wire(context),reviews:[],history:[],nextBefore:null};
    assert.deepEqual(api.parseBodyDecisionPage(decisionPage,id,packet.materialHash,'teaching').context,
      context,`${id}: current private review context`);
    const stalePage=wire(decisionPage);
    stalePage.context.materialHash='0'.repeat(64);
    assert.throws(()=>api.parseBodyDecisionPage(stalePage,id,packet.materialHash,'teaching'),
      /worksheet and current review material differ/i,`${id}: stale worksheet material`);
    for(const change of ['stale-readiness','body','bullet','citation','source','identity']){
      const altered=wire(packet),topic=altered.topics.find((item:{tab:string})=>item.tab==='ultrasound');
      if(change==='stale-readiness')topic.readiness='pending';
      if(change==='body')topic.body+=' foreign';
      if(change==='bullet')topic.bullets[0]+=' foreign';
      if(change==='citation')topic.citations[0]='https://foreign.example/';
      if(change==='source')altered.source.structure.sources[0].sha256='0'.repeat(64);
      if(change==='identity')altered.source.structure.fmaId='FMA0';
      assert.equal(await api.parseBodyReviewResponse(altered,id),null,`${id}: ${change}`);
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
      assert.match((await response.json()).error,/material or checklist changed/i);
    }
    for(const path of pathsWhere(identity,value=>value===null||typeof value!=='object')){
      const bad=wire(identity),part=at(bad,path.slice(0,-1)) as Record<string,unknown>;
      const key=path.at(-1)!,value=part[key];
      part[key]=typeof value==='number'?value+.01:typeof value==='boolean'?!value:String(value)+'-foreign';
      assert.equal(api.pectoralBranchUltrasoundLesson(bad,'ultrasound'),undefined,`${id}: ${path.join('.')}`);
    }
    for(const path of pathsWhere(identity,Array.isArray)){
      const bad=wire(identity);(at(bad,path) as unknown[]).push('foreign');
      assert.equal(api.pectoralBranchUltrasoundLesson(bad,'ultrasound'),undefined,`${id}: ${path.join('.')}`);
    }
    for(const path of pathsWhere(identity,value=>!!value&&typeof value==='object'&&!Array.isArray(value))){
      const bad=wire(identity);(at(bad,path) as Record<string,unknown>).foreign=true;
      assert.equal(api.pectoralBranchUltrasoundLesson(bad,'ultrasound'),undefined,`${id}: ${path.join('.')||'<root>'}`);
    }
    for(const tab of ['anatomy','function','ct','mri','xray','pathology','clinical','quiz'])
      assert.equal(api.pectoralBranchUltrasoundLesson(identity,tab),undefined,`${id}: ${tab}`);
  }
  for(const entry of (pins.entries as Entry[]).filter(entry=>entry.group!=='pectoral'))
    assert.equal(api.pectoralBranchUltrasoundLesson(entry.identity,'ultrasound'),undefined,entry.identity.id);
});
