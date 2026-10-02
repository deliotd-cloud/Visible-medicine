import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('compact source disclosure ships the tested implementation without rewriting teaching',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(data:Buffer)=>createHash('sha256').update(data).digest('hex');
  const manifestBytes=readFileSync(base+'manifest.json');
  assert.equal(sha(manifestBytes),'16d1648f505c12cc8896e02461ff0bea5aea09afeb7b147d14975597a712ef57');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,'ab3e884bd28c9d112bfd7300d429891a3c1d1d36');
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256]of [
    ['app/source-display-notes.tsx','57b83b84c0c2cc4fe005b57d798e61bc4fc74bbb5e89a11bd014fbdf2f8ba183'],
    ['lib/source-display-notes.ts','b8c5fee2d8b91950d1951ea733e519b8fe7dec3e92e0fad22dd7a36df54871a2'],
    ['app/body-explorer.tsx','af2304091172896d7ba7f3c9eb57303cb0bffcc2b1ff5ad93b98e3ac56428984'],
  ])assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256}]);
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(f=>f.path.endsWith('.js')).map(f=>{
    const data=readFileSync(base+f.path);assert.equal(sha(data),f.sha256);return data.toString();
  }).join('\n');
  for(const text of ['body-source-details','Source representation','separated structures',
    'Independent anatomical and clinical review pending.',
    'Display aggregate excludes the separately selectable great cardiac vein surface. Source coordinates are unchanged.',
    'Atlas, case and paid-lecture access remain independent.',
  ])assert.ok(runtime.includes(text),text);
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
});
