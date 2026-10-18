import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import {currentNonregionalAtlasSources,CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery,assertCurrentAtlasInput,assertHistoricalAtlasInputs} from './atlas-nonregional-release-fixture.ts';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {authorizeAtlasDelivery} from '../lib/atlas-delivery-access.ts';
import {ATLAS_DELIVERY_POLICY} from '../lib/atlas-delivery-policy.ts';

const base='public/atlas-runtime/head-neck/';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const baseline='1d498da639bcad4468c922b575a83442379c4849';
const featureEpoch='be32dd864c549619b53a73d84d0d6a0c36257d5a';
const saved=(revision:string,path:string)=>execFileSync('git',['show',`${revision}:${path}`],{windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const original=(path:string)=>saved(baseline,path);

const xrayIds=[
  'thorax:unpaired:organ:heart','thorax:right:organ:right-lung','thorax:left:organ:left-lung',
  'abdomen:unpaired:organ:stomach','abdomen:unpaired:organ:small-intestine',
  'abdomen:unpaired:organ:large-intestine','thorax:unpaired:organ:esophagus',
  'thorax:unpaired:organ:trachea','thorax:unpaired:organ:thymus',
  'abdomen:unpaired:organ:appendix','abdomen:unpaired:organ:ileocecal-junction',
].map(id=>`vm:anatomy:body:${id}`);
const ultrasoundIds=[
  'bone:atlas','bone:axis','bone:third-cervical-vertebra','bone:fourth-cervical-vertebra',
  'bone:fifth-cervical-vertebra','bone:sixth-cervical-vertebra','bone:seventh-cervical-vertebra',
  'bone:first-thoracic-vertebra','bone:twelfth-thoracic-vertebra',
  'bone:first-lumbar-vertebra','bone:fifth-lumbar-vertebra','bone:sacrum',
  'cartilage:intervertebral-disk-of-axis',
  'cartilage:intervertebral-disk-of-first-thoracic-vertebra',
  'cartilage:intervertebral-disk-of-fifth-lumbar-vertebra',
].map(id=>`vm:anatomy:body:spine:midline:${id}`);

const historicalSourceBindings={
  "content/thoracoabdominal-organ-imaging.ts": "bebed40490aa6ba882c6a53d54db529564be3a3ee556d724605ba2748febcc06",
  "content/thoracoabdominal-organ-imaging-pins.json": "e8c92ef7101f083c10c75c0b109c5bcd58197fe5a307ffd8203fcfee8d66a129",
  "lib/thoracoabdominal-organ-imaging.ts": "c503474a75696b55f6bf6bd13bb01b85a60b79c1bc63e0740eb522d81966f720",
  "content/spine-imaging-concepts.ts": "c38defc6224bfa043651d3f338bc9dc389e2e6b700a8f8f95ec719af01258855",
  "content/spine-imaging-pins.json": "4976164571345045f0a0c8d1a16f12afa4122858ecd522fc9ea3949ff18bc6de",
  "lib/spine-imaging.ts": "669cb11ce1edd966b056ee975bdc61c647232410c84ba3a180fbd89920957a39"
};

test('regional runtime carries 11 exact thoracoabdominal X-ray and 15 spine ultrasound drafts',()=>{
  const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION);
  assert.equal(new Set(xrayIds).size,11);
  assert.equal(new Set(ultrasoundIds).size,15);
  const regionalIds=new Set((manifest.regionalScopes as {regionalIds:string[]}[]).flatMap(scope=>scope.regionalIds));
  for(const id of [...xrayIds,...ultrasoundIds])assert.ok(regionalIds.has(id),id);

  // These are the exact source pins, lessons and resolvers used by the generated runtime.
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const path of Object.keys(historicalSourceBindings))assertCurrentAtlasInput(inputs,path);

  const runtime=(manifest.files as {path:string;sha256:string}[])
    .filter(file=>file.path.endsWith('.js'))
    .map(file=>{const bytes=readFileSync(base+file.path);assert.equal(sha(bytes),file.sha256,file.path);return bytes.toString();})
    .join('\n');
  for(const phrase of [
    'On a chest radiograph, orient the cardiomediastinal silhouette',
    'a normal-looking abdominal film',
    'Neonatal and early-infant spinal canal sonography',
    'In adults, sound is limited by bone',
    'X-ray teaching pending','Ultrasound content pending',
  ])assert.ok(runtime.includes(phrase),phrase);
  for(const id of [...xrayIds,...ultrasoundIds])assert.ok(runtime.includes(id),id);
});

test('exact right and left main bronchus selections carry external ultrasound draft limits',()=>{
  const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  assertCurrentAtlasInput(inputs,'content/thoracoabdominal-organ-imaging.ts');
  const runtime=(manifest.files as {path:string;sha256:string}[])
    .filter(file=>file.path.endsWith('.js'))
    .map(file=>{const bytes=readFileSync(base+file.path);assert.equal(sha(bytes),file.sha256,file.path);return bytes.toString();})
    .join('\n');
  const rightStart=runtime.indexOf('"right-main-bronchus":{fmaId:`FMA7395`');
  const leftStart=runtime.indexOf('"left-main-bronchus":{fmaId:`FMA7396`',rightStart);
  const nextStart=runtime.indexOf('stomach:{fmaId:',leftStart);
  assert.ok(rightStart>=0 && leftStart>rightStart && nextStart>leftStart,'exact bronchus source bindings');
  const right=runtime.slice(rightStart,leftStart),left=runtime.slice(leftStart,nextStart);
  assert.ok(right.includes('For external transthoracic ultrasound, orient to the right pleural interface'), 'right external ultrasound note');
  assert.ok(right.includes('Pleural artefacts are not direct views of the bronchial lumen.'), 'right lumen limit');
  assert.ok(right.includes('this lesson does not cover endobronchial or endoscopic ultrasound.'), 'right procedure exclusion');
  assert.ok(left.includes('For external transthoracic ultrasound, use the left pleural interface'), 'left external ultrasound note');
  assert.ok(left.includes('Pleural artefacts do not directly image the bronchial lumen.'), 'left lumen limit');
  assert.ok(left.includes('endobronchial and endoscopic ultrasound are outside this lesson.'), 'left procedure exclusion');
  for(const note of [right,left]){
    assert.doesNotMatch(note,/ultrasound (?:confirms|establishes|demonstrates) (?:bronchial )?patency/i);
    assert.doesNotMatch(note,/endobronchial ultrasound (?:shows|guides|diagnoses)/i);
  }
  for(const flag of ['clinicalApproved','patientDataIncluded','imagingConnection','standaloneReviewConnection'])
    assert.equal(manifest[flag],false,flag);
});

test('draft export keeps clinical, access and model boundaries',()=>{
  const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  for(const flag of ['clinicalApproved','patientDataIncluded','imagingConnection','standaloneReviewConnection'])
    assert.equal(manifest[flag],false,flag);
  const inventory=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  const previous=JSON.parse(original('lib/atlas-model-inventory.json').toString());
  assert.deepEqual(beforeHippocampi(inventory.models).filter((m:{sha256:string})=>m.sha256!=='4dbd938c5cde865a0f7f66957ec3304965530a5b7744d93a85e95531ce827b12'),previous.models);
  assert.equal(inventory.models.length,137);
  assert.equal(inventory.models.flatMap((model:{paths:string[]})=>model.paths).length,144);
  assert.deepEqual(inventory.sources.filter((source:{module:string})=>source.module!=='head-neck'),
    currentNonregionalAtlasSources);
  for(const path of ['lib/atlas-delivery-access.ts','lib/lecture-repository.ts','lib/atlas-navigation.ts'])
    assert.equal(saved(featureEpoch,path).toString().replaceAll('\r\n','\n'),original(path).toString().replaceAll('\r\n','\n'),path);
  // Current Atlas delivery still uses the same access implementation. Studio and
  // navigation have evolved; their historical byte proof above stays historical.
  assert.equal(readFileSync('lib/atlas-delivery-access.ts','utf8').replaceAll('\r\n','\n'),original('lib/atlas-delivery-access.ts').toString().replaceAll('\r\n','\n'));
});

test('current draft and learner Atlas guards remain independent of lecture and case rights',async()=>{
  const calls:string[]=[];
  const db=(roles:string,atlasGrant:boolean)=>({withSession:(mode:string)=>{
    assert.equal(mode,'first-primary');
    return {prepare:(sql:string)=>({bind:()=>({first:async()=>{
      calls.push(sql);
      if(sql.includes('SELECT u.roles'))return {roles,status:'active'};
      assert(sql.includes('e.atlas_access = 1'));
      assert(!/enrolments|workbook_assignments|studio_access|case_access/.test(sql));
      return atlasGrant?{organization_id:'synthetic-atlas-organization'}:null;
    }})})};
  }}) as unknown as Pick<D1Database,'withSession'>;
  assert.equal(ATLAS_DELIVERY_POLICY.audience,'administrator-review');
  assert.equal('approvedRevision' in ATLAS_DELIVERY_POLICY,false);
  await assert.rejects(()=>authorizeAtlasDelivery(db('learner',true),null,ATLAS_DELIVERY_POLICY),{status:401});
  assert.equal(calls.length,0);
  await assert.rejects(()=>authorizeAtlasDelivery(db('learner',true),'synthetic-lecture-subscriber',ATLAS_DELIVERY_POLICY),{status:403});
  await authorizeAtlasDelivery(db('administrator',false),'synthetic-administrator',ATLAS_DELIVERY_POLICY);
  const revision=ATLAS_DELIVERY_POLICY.manifestRevision;
  const syntheticReleased={audience:'reviewed-learner' as const,manifestRevision:revision,approvedRevision:revision};
  await assert.rejects(()=>authorizeAtlasDelivery(db('learner',true),'synthetic-learner',{...syntheticReleased,approvedRevision:'0'.repeat(64)}),{status:403});
  await assert.rejects(()=>authorizeAtlasDelivery(db('learner',false),'synthetic-lecture-and-case-only',syntheticReleased),{status:403});
  await authorizeAtlasDelivery(db('learner',true),'synthetic-atlas-only',syntheticReleased);
});


test('historical projection-ultrasound source-input hashes remain exact at the saved website export',()=>{
  assertHistoricalAtlasInputs(historicalSourceBindings);
});
