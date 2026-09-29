import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {ATLAS_DELIVERY_POLICY} from '../lib/atlas-delivery-policy.ts';

const base='public/atlas-runtime/head-neck/';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const selections=[
  ['right-lacrimal-canaliculus','FMA59582','FJ1349','ff8401d7470c86141e144f82eea17a1081f076dbf3d068d48f26832c742ebbf3','canaliculus'],
  ['left-lacrimal-canaliculus','FMA59583','FJ1298','98ec4fcd5a6c260a179480702c2d4690624207aeeb76160c6be4667bd66e11a5','canaliculus'],
  ['right-lacrimal-sac','FMA59545','FJ1360','192020e5353d1f78e5867a7a2f09e4f114ab31a7cdc2865056c734a5f1bbc02e','sac'],
  ['left-lacrimal-sac','FMA59546','FJ1309','d62bdc3bfc8e3b2d5c0fea85973e68e4f066c253f6a18be5fe2c72e791a4ff21','sac'],
  ['right-nasolacrimal-duct','FMA59555','FJ1353','c54be1e1906335236559e5ca8bf69e95cbbdac0fef62d90efa9e36aa2ac164e8','duct'],
  ['left-nasolacrimal-duct','FMA59556','FJ1302','a8a4bcc60e752d4f4b79a60ec6e9539809aa4293be59d6623bb0ac008ad6606f','duct'],
] as const;

test('head-neck export binds six exact lacrimal drainage selections to CT and MRI drafts only',()=>{
  const manifestBytes=readFileSync(base+'manifest.json');
  assert.equal(sha(manifestBytes),'9d3e36abd24bfa6e77cc5484513c427e9ed0038e6caac1fa501bc7853a911a37');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,'2792be3b4f5d2913aa506f35691b53ae6c711867');
  for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])
    assert.equal(manifest[flag],false,flag);

  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,expected] of Object.entries({
    'content/lacrimal-drainage-imaging-pins.json':'0274e9775d804df06979cd9984a9f27083e22b2eb4aeee8ba1f3de1a46f54826',
    'content/lacrimal-drainage-imaging.ts':'f416f0caadde905b7ab573f48589ec20d5f30c128d411c470c44ec70da63bed4',
    'lib/lacrimal-drainage-imaging.ts':'a5affcd8c2058488514ece3349cbbd36f803b1053b0273e81526c022103d55ce',
  }))assert.equal(inputs.find(row=>row.path===path)?.sha256,expected,path);

  const slider=(manifest.files as {path:string;sha256:string}[])
    .find(file=>/^assets\/slider-.*\.js$/.test(file.path));
  assert.ok(slider,'teaching bundle');
  const bytes=readFileSync(base+slider.path);
  assert.equal(sha(bytes),slider.sha256);
  const runtime=bytes.toString();
  const regionalIds=new Set((manifest.regionalScopes as {regionalIds:string[]}[]).flatMap(scope=>scope.regionalIds));
  for(const [name,fma,file,sourceHash,group] of selections){
    const side=name.startsWith('right-')?'right':'left';
    const id=`vm:anatomy:body:head-neck:${side}:organ:${name}`;
    assert.ok(regionalIds.has(id),`${name} in regional scope`);
    const start=runtime.indexOf(`id:\`${id}\`,fmaId:\`${fma}\``);
    assert.ok(start>=0,`${name} exact identity`);
    const bound=runtime.slice(start,start+1300);
    assert.ok(bound.includes(`file:\`${file}\`,sha256:\`${sourceHash}\``),`${name} exact source`);
    assert.ok(bound.includes(`group:\`${group}\``),`${name} group`);
    assert.ok(bound.includes('anatomicalReview:!1'),`${name} unvalidated`);
  }
  for(const [fmas,group] of [
    ['[`FMA59582`,`FMA59583`]','canaliculus'],
    ['[`FMA59545`,`FMA59546`]','sac'],
    ['[`FMA59555`,`FMA59556`]','duct'],
  ])assert.ok(runtime.includes(`${group}:{fmas:${fmas},limit:`),`${group} bilateral source group`);
  const groupsStart=runtime.indexOf('canaliculus:{fmas:[`FMA59582`');
  const groupsEnd=runtime.indexOf('=new Map(',groupsStart);
  assert.ok(groupsStart>=0&&groupsEnd>groupsStart&&groupsEnd-groupsStart<4000,'bounded lacrimal teaching group');
  const groups=runtime.slice(groupsStart,groupsEnd);
  assert.match(groups,/focus:\{ct:\{body:/);
  assert.equal((groups.match(/focus:\{ct:\{body:/g)||[]).length,3,'each group has CT');
  assert.equal((groups.match(/mri:\{body:/g)||[]).length,3,'each group has MRI');
  assert.doesNotMatch(groups,/ultrasound:\{body:|xray:\{body:/,'Ultrasound and X-ray remain pending');
  assert.match(runtime,/\{ct:`CT`,mri:`MRI`\};function \w+\(\w+,\w+\)\{if\(!Object\.hasOwn\(\w+,\w+\)\)return/,'resolver accepts CT and MRI only');
  assert.match(runtime,/if\(!\w+\|\|\w+\(\w+\)!==\w+\.signature\)return/,'resolver rejects altered source identities');
  assert.match(runtime,/readiness:`draft`,title:`\$\{e\.name\} · \$\{\w+\[r\]\} orientation · draft`/,'review remains draft');
  for(const phrase of [
    'Even specialised dacryocystography has limited canalicular detail',
    'The source envelope cannot be registered to a patient sac',
    'The bony canal is not the membranous duct',
    'no patient course or function is encoded by this surface',
    'https://pubmed.ncbi.nlm.nih.gov/35522773/',
    'https://pubmed.ncbi.nlm.nih.gov/30954539/',
    'Anatomy/radiology review pending',
    'No imaging study or spatial registration is connected',
    'Didanix Education/light. Atlas, case and paid-lecture access remain independent',
  ])assert.ok(runtime.includes(phrase),phrase);

  const inventoryBytes=readFileSync('lib/atlas-model-inventory.json');
  assert.equal(sha(inventoryBytes),'5b002972375b8c451dcd28ad00764655a3a0a9cf87d2596390766504a69e3511');
  const inventory=JSON.parse(inventoryBytes.toString());
  assert.equal(inventory.sources.find((source:{module:string})=>source.module==='head-neck')?.manifestSha256,sha(manifestBytes));
  assert.equal(inventory.models.length,137);
  assert.equal(inventory.models.flatMap((model:{paths:string[]})=>model.paths).length,144);
  assert.equal(ATLAS_DELIVERY_POLICY.audience,'administrator-review');
  assert.equal('approvedRevision' in ATLAS_DELIVERY_POLICY,false);
});
