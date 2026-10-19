import assert from 'node:assert/strict';
import test from 'node:test';
import {currentInputs,delivery,git,historicalWebsite,pins,sha,unchangedModels,website} from './atlas-neck-liver-delivery-fixture.ts';
import {ATLAS_DELIVERY_POLICY} from '../lib/atlas-delivery-policy.ts';
import {assertLacrimalEmittedPin} from './lacrimal-emitted-records.mjs';

const source={
 'content/lacrimal-drainage-imaging-pins.json':'0274e9775d804df06979cd9984a9f27083e22b2eb4aeee8ba1f3de1a46f54826',
 'content/lacrimal-drainage-imaging.ts':'f416f0caadde905b7ab573f48589ec20d5f30c128d411c470c44ec70da63bed4',
 'lib/lacrimal-drainage-imaging.ts':'a5affcd8c2058488514ece3349cbbd36f803b1053b0273e81526c022103d55ce',
};
const selections=[
 ['right-lacrimal-canaliculus','FMA59582','FJ1349','ff8401d7470c86141e144f82eea17a1081f076dbf3d068d48f26832c742ebbf3','canaliculus'],
 ['left-lacrimal-canaliculus','FMA59583','FJ1298','98ec4fcd5a6c260a179480702c2d4690624207aeeb76160c6be4667bd66e11a5','canaliculus'],
 ['right-lacrimal-sac','FMA59545','FJ1360','192020e5353d1f78e5867a7a2f09e4f114ab31a7cdc2865056c734a5f1bbc02e','sac'],
 ['left-lacrimal-sac','FMA59546','FJ1309','d62bdc3bfc8e3b2d5c0fea85973e68e4f066c253f6a18be5fe2c72e791a4ff21','sac'],
 ['right-nasolacrimal-duct','FMA59555','FJ1353','c54be1e1906335236559e5ca8bf69e95cbbdac0fef62d90efa9e36aa2ac164e8','duct'],
 ['left-nasolacrimal-duct','FMA59556','FJ1302','a8a4bcc60e752d4f4b79a60ec6e9539809aa4293be59d6623bb0ac008ad6606f','duct'],
] as const;
const phrases=['Even specialised dacryocystography has limited canalicular detail','The source envelope cannot be registered to a patient sac','The bony canal is not the membranous duct','no patient course or function is encoded by this surface','https://pubmed.ncbi.nlm.nih.gov/35522773/','https://pubmed.ncbi.nlm.nih.gov/30954539/','Anatomy/radiology review pending','No imaging study or spatial registration is connected','Didanix Education/light. Atlas, case and paid-lecture access remain independent'];
function teaching(epoch:'historical'|'current'){
 const {manifest,inputs,teaching}=delivery(epoch);pins(inputs,source,epoch);
 const runtime=teaching();
 const regionalIds=new Set((manifest.regionalScopes as {regionalIds:string[]}[]).flatMap(scope=>scope.regionalIds));
 for(const [name,fma,file,sourceHash,group] of selections){
  const side=name.startsWith('right-')?'right':'left';const id=`vm:anatomy:body:head-neck:${side}:organ:${name}`;
  assert.ok(regionalIds.has(id),`${name} regional scope`);
  assertLacrimalEmittedPin(runtime,{id,fma,file,sourceHash,group});
 }
 for(const [fmas,group] of [['[`FMA59582`,`FMA59583`]','canaliculus'],['[`FMA59545`,`FMA59546`]','sac'],['[`FMA59555`,`FMA59556`]','duct']])assert.ok(runtime.includes(`${group}:{fmas:${fmas},limit:`),`${group} bilateral group`);
 const start=runtime.indexOf('canaliculus:{fmas:[`FMA59582`');const end=runtime.indexOf('=new Map(',start);
 assert.ok(start>=0&&end>start&&end-start<4000,'bounded teaching group');
 const groups=runtime.slice(start,end);assert.match(groups,/focus:\{ct:\{body:/);
 assert.equal((groups.match(/focus:\{ct:\{body:/g)||[]).length,3);
 assert.equal((groups.match(/mri:\{body:/g)||[]).length,3);
 assert.doesNotMatch(groups,/ultrasound:\{body:|xray:\{body:/);
 assert.match(runtime,/\{ct:`CT`,mri:`MRI`\};function \w+\(\w+,\w+\)\{if\(!Object\.hasOwn\(\w+,\w+\)\)return/);
 assert.match(runtime,/if\(!\w+\|\|\w+\(\w+\)!==\w+\.signature\)return/);
 assert.match(runtime,/readiness:`draft`,title:`\$\{e\.name\} · \$\{\w+\[r\]\} orientation · draft`/);
 for(const phrase of phrases)assert.ok(runtime.includes(phrase),phrase);
 assert.equal(ATLAS_DELIVERY_POLICY.audience,'administrator-review');assert.equal('approvedRevision' in ATLAS_DELIVERY_POLICY,false);
}
test('historical lacrimal teaching stays pinned to the saved whole website epoch',()=>{
 teaching('historical');assert.equal(sha(git(website,historicalWebsite,'lib/atlas-model-inventory.json')),'b452f2b43d0183f76e20031885795ef034a3cabb856e2643d0e1c44ea839b1dc');
});
test('current lacrimal source/import and teaching remain bound without model or access change',()=>{
 const now=delivery('current');currentInputs(now.inputs,Object.keys(source));teaching('current');unchangedModels();
 assert.equal(now.inventory.sources.find((row:{module:string})=>row.module==='head-neck')?.manifestSha256,sha(now.read('manifest.json')));
});
