import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

test('regional export carries the four source-bound forearm MR drafts without a model or access change',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const manifestBytes=readFileSync(base+'manifest.json');
  assert.equal(sha(manifestBytes),'026d863c7c98235afe007b0b930942a4593868cfa2b60692c404c8b51a8fbba8');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,'bc03ed3f7324819f4bfa3e7cd0afb7203cc8e3b8');
  for(const field of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(manifest[field],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,expected] of Object.entries({
    'app/body-content.ts':'688a620d5821e5f228d07010be7a365edfff35a729561b02ec2871f3a05e0fc3',
    'content/forearm-venous-imaging-pins.json':'81dd9bcdf0dae7cfcac45d099a960d69d5ff39598a815b8103798382e685c490',
    'content/forearm-venous-imaging.ts':'4b003f2e5d91186b05429989a28f9b4162e9364043736fa5e9d0199b59da0332',
    'lib/forearm-venous-imaging.ts':'2866e1bef3a871d47e8107c2ef3783661548e1a518018c3c03fb52ceadb978cb',
  }))assert.equal(inputs.find(row=>row.path===path)?.sha256,expected,path);
  const scripts=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js'));
  const runtime=scripts.map(file=>{const bytes=readFileSync(base+file.path);assert.equal(sha(bytes),file.sha256);return bytes.toString();}).join('\n');
  for(const phrase of ['Dedicated upper-limb MR venography','Basilic-vein visibility in upper-limb MR venography','This does not establish visibility on a routine forearm MRI','Source limit: This is one archived source selection'])assert(runtime.includes(phrase),phrase);
  const inventory=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.equal(inventory.sources.find((source:{module:string})=>source.module==='head-neck')?.manifestSha256,sha(manifestBytes));
  assert.equal(inventory.models.length,137);
  assert.equal(inventory.models.flatMap((model:{paths:string[]})=>model.paths).length,144);
});
