import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

test('regional export carries the four source-bound forearm MR drafts without a model or access change',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const manifestBytes=readFileSync(base+'manifest.json');
  assert.equal(sha(manifestBytes),'6b368a0f7c2165c10b60a6f03c11436cd4f3a8a5eae5d406d7998aa8eca3b5b3');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,'dbe9e9260ded964de8b6e79fff4798c13f4b8c55');
  for(const field of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(manifest[field],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,expected] of Object.entries({
    'app/body-content.ts':'64b753333f473de90ce382f3af40cb212bfa0ce65975b9c021cfe127823cddde',
    'content/forearm-venous-imaging-pins.json':'81dd9bcdf0dae7cfcac45d099a960d69d5ff39598a815b8103798382e685c490',
    'content/forearm-venous-imaging.ts':'4b003f2e5d91186b05429989a28f9b4162e9364043736fa5e9d0199b59da0332',
    'lib/forearm-venous-imaging.ts':'2866e1bef3a871d47e8107c2ef3783661548e1a518018c3c03fb52ceadb978cb',
  }))assert.equal(inputs.find(row=>row.path===path)?.sha256,expected,path);
  const scripts=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js'));
  const runtime=scripts.map(file=>{const bytes=readFileSync(base+file.path);assert.equal(sha(bytes),file.sha256);return bytes.toString();}).join('\n');
  for(const phrase of ['Dedicated upper-limb MR venography','Basilic-vein visibility in upper-limb MR venography','This does not establish visibility on a routine forearm MRI','Source limit: This is one archived source selection'])assert(runtime.includes(phrase),phrase);
  const inventory=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.equal(inventory.sources.find((source:{module:string})=>source.module==='head-neck')?.manifestSha256,sha(manifestBytes));
  assert.equal(inventory.models.length,136);
  assert.equal(inventory.models.flatMap((model:{paths:string[]})=>model.paths).length,143);
});
