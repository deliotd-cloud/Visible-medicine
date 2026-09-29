import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {ATLAS_DELIVERY_POLICY} from '../lib/atlas-delivery-policy.ts';
import {authorizeAtlasDelivery} from '../lib/atlas-delivery-access.ts';
import {resolveAtlasDeliveryModel} from '../lib/atlas-model-delivery.ts';

const base='public/atlas-runtime/head-neck/';
const modelPath='/atlas-runtime/head-neck/models/bodyparts3d/coronary-venous/coronary-venous.glb';
const modelHash='4dbd938c5cde865a0f7f66957ec3304965530a5b7744d93a85e95531ce827b12';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

test('exact Atlas coronary venous study is nested under Heart with one protected source bundle',()=>{
  const manifestBytes=readFileSync(base+'manifest.json');
  assert.equal(sha(manifestBytes),'4c546a73ea08bac20bc887ceda2abfd1e7e83557849311e14231ad5c4ac29b7f');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,'2c9d80ba1eaba9f520a7da9ac7fcb1201ca42a65');
  assert.equal(manifest.regionalScopes.length,12);
  for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])
    assert.equal(manifest[flag],false,flag);
  const targets=manifest.regionalScopes.find((scope:{region:string})=>scope.region==='thorax').nestedTargets
    .filter((target:{study:string})=>target.study==='coronary-venous');
  assert.deepEqual(targets.map((target:{structureId:string})=>target.structureId),[
    'vm:anatomy:body:thorax:unpaired:vessel:coronary-sinus',
    'vm:anatomy:body:thorax:unpaired:vessel:small-cardiac-vein',
  ]);
  for(const target of targets){
    assert.equal(target.parentId,'vm:anatomy:body:thorax:unpaired:organ:heart');
    assert.equal(target.parentHash,'612b6d095c42e78b0aca151bb295b0d5fd48488c5aace250ca707eff96788316');
    assert.equal(target.sourceHash,modelHash);
  }
  const bundle=manifest.modelBundles.filter((entry:{id:string})=>entry.id==='coronary-venous');
  assert.deepEqual(bundle,[{
    id:'coronary-venous',url:'/models/bodyparts3d/coronary-venous/coronary-venous.glb?v='+modelHash,
    bytes:40996,sha256:modelHash,structures:2,
  }]);
  assert.equal(sha(readFileSync('public'+modelPath)),modelHash);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,hash] of Object.entries({
    'lib/coronary-venous.ts':'7fe9f98f5ea4ac4e7e9a76cd25016b5461393ba3f25e52b7b2fc8215c64cd62e',
    'content/coronary-venous-teaching.ts':'ccae64c4d3c441cf681e756456f91fb62f3987f9939dbd1d11fb6c547f393155',
    'public/models/bodyparts3d/coronary-venous/catalog.json':'996d8ca712b12dc3c2b9df4a6bad372838aeca64f017574be244ffa0b129abfe',
    'integration/head-neck/delivery.ts':'a021cf6806b205834848faf3e1283827a402257922a2c94fd3a4b71799fc185e',
  }))assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256:hash}]);
  assert.ok(!inputs.some(input=>/native-mr|local-mr-study|\.vmmr|patient[-_/]?data/i.test(input.path)));
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js'))
    .map(file=>{const bytes=readFileSync(base+file.path);assert.equal(sha(bytes),file.sha256);return bytes.toString();}).join('\n');
  for(const phrase of ['Explore coronary venous parts','Coronary venous source parts','Coronary sinus','Small cardiac vein','FJ2655','FJ2724','FJ2731'])
    assert.ok(runtime.includes(phrase),phrase);
});

test('coronary model stays registered for administrator review without case or lecture entitlement',async()=>{
  const inventoryBytes=readFileSync('lib/atlas-model-inventory.json');
  assert.equal(sha(inventoryBytes),'3c30664a4000294d252ea8970b7645657f528d034a1b154a6c53251f12a6327f');
  const inventory=JSON.parse(inventoryBytes.toString());
  assert.equal(inventory.models.length,137);
  assert.equal(inventory.models.flatMap((model:{paths:string[]})=>model.paths).length,144);
  const model=inventory.models.filter((entry:{paths:string[]})=>entry.paths.includes(modelPath));
  assert.deepEqual(model,[{sha256:modelHash,bytes:40996,paths:[modelPath]}]);
  assert.equal(resolveAtlasDeliveryModel(new URL(modelPath+'?v='+modelHash,'https://atlas.test'),inventory.models).sha256,modelHash);
  assert.throws(()=>resolveAtlasDeliveryModel(new URL(modelPath+'?v='+'0'.repeat(64),'https://atlas.test'),inventory.models));
  assert.equal(ATLAS_DELIVERY_POLICY.audience,'administrator-review');
  assert.equal(ATLAS_DELIVERY_POLICY.manifestRevision,sha(inventoryBytes));
  assert.equal('approvedRevision' in ATLAS_DELIVERY_POLICY,false);
  const db={withSession:(mode:string)=>{
    assert.equal(mode,'first-primary');
    return {prepare:(sql:string)=>{
      assert.match(sql,/FROM users u JOIN account_security_profiles/);
      return {bind:(id:string,external:string)=>({first:async()=>{
        assert.equal(external,id.replace(/^edu:/,'sites:'));
        return {roles:id==='edu:admin'?'administrator':'learner',status:'active'};
      }})};
    }};
  }};
  await authorizeAtlasDelivery(db as never,'admin',ATLAS_DELIVERY_POLICY);
  await assert.rejects(authorizeAtlasDelivery(db as never,'lecture-only',ATLAS_DELIVERY_POLICY),
    /administrator review only/);
  await assert.rejects(authorizeAtlasDelivery(db as never,null,ATLAS_DELIVERY_POLICY),
    /Sign in/);
});
