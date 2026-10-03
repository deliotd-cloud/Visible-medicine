import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {ATLAS_DELIVERY_POLICY} from '../lib/atlas-delivery-policy.ts';

const base='public/atlas-runtime/head-neck/';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

test('central airway and hepatic teaching export retains exact inputs, pins and review access',()=>{
  const manifestBytes=readFileSync(base+'manifest.json');
  assert.equal(sha(manifestBytes),'7a3f87be967083d661ab7303d08bc08f5ba995bde4c27d6414574eb58247fae9');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,'2413ff790069d5bfa6c2c507d67ebfa2a5b3fe51');
  for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])
    assert.equal(manifest[flag],false,flag);
  assert.equal(manifest.regionalScopes.length,12);

  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,expectedHash] of Object.entries({
    'content/thorax-central-airway-study.ts':'140b9bcd802fdf31e5498bc822b9691022fdcb7898730da22406fdd00b128888',
    'content/hepatic-teaching.ts':'0c93b76eba32feb4e5c1d0f139fccd416645dad6419b1e59bb97b043c534a654',
  })){
    const matches=inputs.filter(row=>row.path===path);
    assert.equal(matches.length,1,`${path}: one source input`);
    assert.equal(matches[0].sha256,expectedHash,path);
  }
  assert.ok(!inputs.some(row=>/native-mr|local-mr-study|\.vmmr|patient[-_/]?data/i.test(row.path)),
    'private MRI checker and patient data excluded from source inputs');

  const scripts=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js'));
  const code=scripts.map(file=>{
    const bytes=readFileSync(base+file.path);
    assert.equal(sha(bytes),file.sha256,file.path);
    return bytes.toString();
  });
  const runtime=code.join('\n');
  const airwayRows=[
    ['unpaired:organ:trachea','FMA7394','unpaired','thorax-organs','FJ2541','f4c8cd3c70d212b09db6319e3b218b35aecfa02f53678d6886484a31aaa11cd9'],
    ['right:organ:right-main-bronchus','FMA7395','right','thorax-organs-inventory','FJ2539','0e1e4dc8c326263c21819c3c48a3e2e41e72fa92425983876d4902fa5dcc3074'],
    ['left:organ:left-main-bronchus','FMA7396','left','thorax-organs-inventory','FJ2450','7c4ac571448fb3d0c3c1095874bf17a60853bf12457d842a11dd2c62c0994946'],
  ] as const;
  const serialized=airwayRows.map(([suffix,fma,side,bundle,file,sourceHash])=>
    `{id:\`vm:anatomy:body:thorax:${suffix}\`,fmaId:\`${fma}\`,laterality:\`${side}\`,bundle:\`${bundle}\`,nodeName:\`${fma}\`,sources:[{file:\`${file}\`,sha256:\`${sourceHash}\`}]}`);
  assert.ok(runtime.includes(serialized.join(',')),'all three exact airway source bindings remain contiguous');
  assert.ok(runtime.includes('id:`central-airways`,title:`Central airway source segments`,fmaIds:[`FMA7394`,`FMA7395`,`FMA7396`]'),
    'focus remains exactly targeted');
  const focusGuardAt=runtime.indexOf('sideFilteredSourceBindings:!0');
  assert.ok(focusGuardAt>0,'side-filtered source guard retained');
  const focusPush=runtime.slice(runtime.lastIndexOf('focuses.push(',focusGuardAt),focusGuardAt+30);
  assert.ok(focusPush.includes('rule:{fmaIds:[...')&&focusPush.includes('requiredSourceBindings:'),
    'runtime focus uses exact FMA and source-binding guards');
  for(const phrase of [
    'Compare the supplied trachea and proximal right and left main bronchus exterior surfaces.',
    'do not establish a lumen, carina or lobar tree, continuity between segments, or patient registration',
  ])assert.ok(runtime.includes(phrase),phrase);

  const hepaticPairs=[
    ['hepatic-arterial',['FMA14778','FMA14779']],
    ['hepatic-portal',['FMA15414','FMA15415']],
  ] as const;
  const teachingCode=code.find(text=>text.includes('On contrast-enhanced liver CT, hepatic arterial branches'));
  assert.ok(teachingCode,'hepatic teaching bundle');
  for(const [conceptId,fmas] of hepaticPairs){
    const marker='conceptId:`'+conceptId+'`,study:`hepatic`,sourceHash:';
    const starts:number[]=[];
    for(let offset=teachingCode.indexOf(marker);offset>=0;offset=teachingCode.indexOf(marker,offset+marker.length))
      starts.push(offset);
    assert.equal(starts.length,2,`${conceptId}: right and left source-bound placements`);
    const found:(typeof fmas[number]|undefined)[]=starts.map((start:number):typeof fmas[number]|undefined=>{
      const row:string=teachingCode.slice(start,start+1500);
      assert.ok(row.includes('sourceHash:`4cf393e8b9bce6637f139b6e85d47be0098aac52103bbacfba3cc399747d9857`'));
      assert.ok(row.includes('parentHash:`5e224f77acade0a27068f45faf3b24839ec13a4d3cb8de283952263ecc1e3124`'));
      return fmas.find(fma=>row.includes(`fmaId:\`${fma}\``));
    });
    assert.deepEqual(found.sort(),[...fmas].sort(),`${conceptId}: exact sided FMA targets`);
  }
  for(const phrase of [
    'On contrast-enhanced liver CT, hepatic arterial branches are enhanced in the arterial phase',
    'On dynamic contrast-enhanced liver MRI, arterial-phase enhancement is assessed as signal intensity',
    'On contrast-enhanced liver CT, the portal venous phase shows fully enhanced portal veins',
    'On dynamic contrast-enhanced liver MRI, the portal venous phase shows enhanced portal veins',
    'hepaticLIRADSPhases',
  ])assert.ok(runtime.includes(phrase),phrase);

  const inventoryBytes=readFileSync('lib/atlas-model-inventory.json');
  assert.equal(sha(inventoryBytes),'c0b358dc8679a0d46dbbc8f969b0b1a2c8bfc7322f2c66c224d5d95e99e691b5');
  const inventory=JSON.parse(inventoryBytes.toString());
  assert.equal(inventory.sources.find((source:{module:string})=>source.module==='head-neck')?.manifestSha256,sha(manifestBytes));
  assert.equal(inventory.models.length,137);
  assert.equal(inventory.models.flatMap((model:{paths:string[]})=>model.paths).length,144);
  assert.equal(ATLAS_DELIVERY_POLICY.audience,'administrator-review');
  assert.equal(ATLAS_DELIVERY_POLICY.manifestRevision,sha(inventoryBytes));
  assert.equal('approvedRevision' in ATLAS_DELIVERY_POLICY,false);
});
