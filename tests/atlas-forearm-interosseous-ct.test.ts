import assert from 'node:assert/strict';
import test from 'node:test';
import {delivery,pins} from './atlas-forearm-delivery-fixture.ts';

const expected={
  'content/forearm-arterial-ct-pins.json':'2631968bf877c2b0fda7a01bfd5925cf25c16f0fb804de54668051ad274a6e0f',
  'content/forearm-arterial-imaging-pins.json':'eae339a9d4868bfeff7310c35bc8391cb200c6a32893456ffae1758132c3cb51',
  'content/forearm-arterial-imaging.ts':'8786e98000b58eb6e256d6ccc73f3b653f3ffe714103a59822722f207b9ef791',
  'lib/forearm-arterial-imaging.ts':'a28a38a3d8b2e21ae8dc2f80aafb559867932e05d162da7ad20bb5a5887d7ca3',
};
const selections=[
  ['right-common-interosseous-artery','FMA22807','FJ2275','96afb03f4aa0d1a62ccb95c8b1a7094da8104f9a9cb193e02ea2706707f473ce'],
  ['left-common-interosseous-artery','FMA22808','FJ2223','11fccc2e5aec84ef7ed0d0c34ae3e9928c0aac91faaf48ce6801c09942985f28'],
  ['right-recurrent-interosseous-artery','FMA268667','FJ2297','0b37892b1dfc542627ebd1c0ef4644772f405da643ff51f18cb2eda374c07d9a'],
  ['left-recurrent-interosseous-artery','FMA268669','FJ2245','3dc9427ea23fcea776ebee481af423ea6ac82f4efe22250bb22afcbb0359a0e0'],
] as const;

for(const epoch of ['old','current'] as const)test(`${epoch} shared regional export retains four exact interosseous CT draft bindings and source limits`,()=>{
  const {inputs,script,teaching}=delivery(epoch);
  pins(inputs,expected,epoch);
  const identities=script('index');
  for(const [name,fma,file,sourceHash] of selections){
    const id=`vm:anatomy:body:forearm:${name.startsWith('right-')?'right':'left'}:vessel:${name}`;
    const start=identities.indexOf(`id:\`${id}\`,fmaId:\`${fma}\``);
    assert.ok(start>=0,`${name} exact ID and FMA`);
    const bound=identities.slice(start,identities.indexOf('},{id:',start));
    assert.ok(bound.includes(`nodeName:\`${fma}\``),`${name} source node`);
    assert.ok(bound.includes(`file:\`${file}\`,sha256:\`${sourceHash}\``),`${name} source file and hash`);
    assert.ok(bound.includes('anatomicalReview:!1'),`${name} remains unvalidated`);
  }
  if(epoch==='old'){
    for(const [fmas,group] of [
      ['[\`FMA22807\`,\`FMA22808\`]','common-interosseous'],
      ['[\`FMA268667\`,\`FMA268669\`]','recurrent-interosseous'],
    ])assert.ok(teaching.includes(`fmas:${fmas},group:\`${group}\`,topics:[\`ct\`]`),`${group} CT-only draft topic`);
  }else{
    const ctPin=teaching.indexOf('previousAllLessonsAndRecipesHash:`3bbca8486215c3f4f232865f21d317a27474379928010eb7e785756924a6691f`,entries:[');
    assert.ok(ctPin>=0,'exact emitted interosseous CT pin');
    for(const [name,fma] of selections){
      const group=name.includes('common-')?'common-interosseous':'recurrent-interosseous';
      const id=`vm:anatomy:body:forearm:${name.startsWith('right-')?'right':'left'}:vessel:${name}`;
      const start=teaching.indexOf(`identity:{id:\`${id}\`,fmaId:\`${fma}\``,ctPin);
      assert.ok(start>=0,`${name} emitted teaching identity`);
      const bound=teaching.slice(start,teaching.indexOf('previous:{ct:',start));
      assert.ok(bound.includes(`group:\`${group}\`,topics:[\`ct\`]`),`${name} CT-only draft topic`);
    }
  }
  const modalities=[...teaching.matchAll(/([\w$]+)=\{ct:`CT`,mri:`MRI`,ultrasound:`Ultrasound`\}/g)];
  assert.ok(modalities.length>0,'arterial orientation modality labels');
  assert.ok(modalities.some(modality=>teaching.includes('readiness:`draft`,title:`${e.name} · ${'+modality[1]+'[t]} arterial orientation · draft`')),'source-bound draft resolver');
  assert.ok(teaching.includes('The review does not establish that this exact short branch is visible in every CT acquisition.'),'common branch visibility limit');
  assert.ok(teaching.includes('does not demonstrate reliable depiction of this specific small recurrent branch.'),'recurrent branch visibility limit');
  assert.ok(teaching.includes('Do not read a missing or indistinct branch on CT as proof of absence, injury or occlusion.'),'no diagnostic inference');
  if(epoch==='old')assert.ok(teaching.includes('MRI content pending') && teaching.includes('Ultrasound content pending'),'other arterial modalities remain pending');
});
