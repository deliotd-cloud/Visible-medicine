import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const base='public/atlas-runtime/head-neck/';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const baseline='1d498da';
const original=(path:string)=>execFileSync('git',['show',`${baseline}:${path}`]);

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

test('regional runtime carries 11 exact thoracoabdominal X-ray and 15 spine ultrasound drafts',()=>{
  const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  assert.equal(manifest.sourceCommit,'0aac0fc6663741effea3a48963e1b931f6f5002a');
  assert.equal(new Set(xrayIds).size,11);
  assert.equal(new Set(ultrasoundIds).size,15);
  const regionalIds=new Set((manifest.regionalScopes as {regionalIds:string[]}[]).flatMap(scope=>scope.regionalIds));
  for(const id of [...xrayIds,...ultrasoundIds])assert.ok(regionalIds.has(id),id);

  // These are the exact source pins, lessons and resolvers used by the generated runtime.
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,expected] of Object.entries({
    'content/thoracoabdominal-organ-imaging.ts':'a4a06ff48a418cf79cb7c1ef232422b363a0568902a19dbe93f539704cbd7923',
    'content/thoracoabdominal-organ-imaging-pins.json':'e8c92ef7101f083c10c75c0b109c5bcd58197fe5a307ffd8203fcfee8d66a129',
    'lib/thoracoabdominal-organ-imaging.ts':'c503474a75696b55f6bf6bd13bb01b85a60b79c1bc63e0740eb522d81966f720',
    'content/spine-imaging-concepts.ts':'c38defc6224bfa043651d3f338bc9dc389e2e6b700a8f8f95ec719af01258855',
    'content/spine-imaging-pins.json':'4976164571345045f0a0c8d1a16f12afa4122858ecd522fc9ea3949ff18bc6de',
    'lib/spine-imaging.ts':'669cb11ce1edd966b056ee975bdc61c647232410c84ba3a180fbd89920957a39',
  }))assert.equal(inputs.find(input=>input.path===path)?.sha256,expected,path);

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

test('draft export keeps clinical, access and model boundaries',()=>{
  const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  for(const flag of ['clinicalApproved','patientDataIncluded','imagingConnection','standaloneReviewConnection'])
    assert.equal(manifest[flag],false,flag);
  const inventory=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  const previous=JSON.parse(original('lib/atlas-model-inventory.json').toString());
  assert.deepEqual(inventory.models,previous.models);
  assert.equal(inventory.models.length,135);
  assert.equal(inventory.models.flatMap((model:{paths:string[]})=>model.paths).length,142);
  assert.deepEqual(inventory.sources.filter((source:{module:string})=>source.module!=='head-neck'),
    previous.sources.filter((source:{module:string})=>source.module!=='head-neck'));
  for(const path of ['lib/atlas-delivery-access.ts','lib/lecture-repository.ts','lib/atlas-navigation.ts'])
    assert.deepEqual(readFileSync(path),original(path),path);
});
