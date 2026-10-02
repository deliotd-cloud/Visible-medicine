import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

const base='public/atlas-runtime/head-neck/';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const selections=[
  ['right-common-interosseous-artery','FMA22807','FJ2275','96afb03f4aa0d1a62ccb95c8b1a7094da8104f9a9cb193e02ea2706707f473ce'],
  ['left-common-interosseous-artery','FMA22808','FJ2223','11fccc2e5aec84ef7ed0d0c34ae3e9928c0aac91faaf48ce6801c09942985f28'],
  ['right-recurrent-interosseous-artery','FMA268667','FJ2297','0b37892b1dfc542627ebd1c0ef4644772f405da643ff51f18cb2eda374c07d9a'],
  ['left-recurrent-interosseous-artery','FMA268669','FJ2245','3dc9427ea23fcea776ebee481af423ea6ac82f4efe22250bb22afcbb0359a0e0'],
] as const;

test('shared regional export retains four exact interosseous CT draft bindings and source limits',()=>{
  const manifestBytes=readFileSync(base+'manifest.json');
  assert.equal(sha(manifestBytes),'3b042ba359638f591e8775dd76f026e6c1f52798fa415d1a5e407b13c06dfcbe');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,'acd99b11e279a0525f1488456c0a8adf2abb2cf7');
  for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])
    assert.equal(manifest[flag],false,flag);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,expected] of Object.entries({
    'content/forearm-arterial-ct-pins.json':'2631968bf877c2b0fda7a01bfd5925cf25c16f0fb804de54668051ad274a6e0f',
    'content/forearm-arterial-imaging-pins.json':'eae339a9d4868bfeff7310c35bc8391cb200c6a32893456ffae1758132c3cb51',
    'content/forearm-arterial-imaging.ts':'8786e98000b58eb6e256d6ccc73f3b653f3ffe714103a59822722f207b9ef791',
    'lib/forearm-arterial-imaging.ts':'a28a38a3d8b2e21ae8dc2f80aafb559867932e05d162da7ad20bb5a5887d7ca3',
  }))assert.equal(inputs.find(row=>row.path===path)?.sha256,expected,path);

  const scripts=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js'));
  const script=(name:string)=>{
    const file=scripts.find(item=>item.path.startsWith(`assets/${name}-`));
    assert.ok(file,`${name} bundle`);
    const bytes=readFileSync(base+file.path);
    assert.equal(sha(bytes),file.sha256,file.path);
    return bytes.toString();
  };
  const identities=script('index'),teaching=emittedTeaching(base,manifest.files);
  for(const [name,fma,file,sourceHash] of selections){
    const id=`vm:anatomy:body:forearm:${name.startsWith('right-')?'right':'left'}:vessel:${name}`;
    const start=identities.indexOf(`id:\`${id}\`,fmaId:\`${fma}\``);
    assert.ok(start>=0,`${name} exact ID and FMA`);
    const bound=identities.slice(start,identities.indexOf('},{id:',start));
    assert.ok(bound.includes(`nodeName:\`${fma}\``),`${name} source node`);
    assert.ok(bound.includes(`file:\`${file}\`,sha256:\`${sourceHash}\``),`${name} source file and hash`);
    assert.ok(bound.includes('anatomicalReview:!1'),`${name} remains unvalidated`);
  }
  for(const [fmas,group] of [
    ['[`FMA22807`,`FMA22808`]','common-interosseous'],
    ['[`FMA268667`,`FMA268669`]','recurrent-interosseous'],
  ])assert.ok(teaching.includes(`fmas:${fmas},group:\`${group}\`,topics:[\`ct\`]`),`${group} CT-only draft topic`);
  const modalities=[...teaching.matchAll(/([\w$]+)=\{ct:`CT`,mri:`MRI`,ultrasound:`Ultrasound`\}/g)];
  assert.ok(modalities.length>0,'arterial orientation modality labels');
  assert.ok(modalities.some(modality=>teaching.includes('readiness:`draft`,title:`${e.name} · ${'+modality[1]+'[t]} arterial orientation · draft`')),'source-bound draft resolver');
  assert.ok(teaching.includes('The review does not establish that this exact short branch is visible in every CT acquisition.'),'common branch visibility limit');
  assert.ok(teaching.includes('does not demonstrate reliable depiction of this specific small recurrent branch.'),'recurrent branch visibility limit');
  assert.ok(teaching.includes('Do not read a missing or indistinct branch on CT as proof of absence, injury or occlusion.'),'no diagnostic inference');
  assert.ok(teaching.includes('MRI content pending') && teaching.includes('Ultrasound content pending'),'other arterial modalities remain pending');

  const inventory=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.equal(inventory.sources.find((source:{module:string})=>source.module==='head-neck')?.manifestSha256,sha(manifestBytes));
  assert.equal(inventory.models.length,137);
  assert.equal(inventory.models.flatMap((model:{paths:string[]})=>model.paths).length,144);
});
