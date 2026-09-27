import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

test('regional export includes the exact laryngeal drafts and preserves clinical/access gates',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=readFileSync(base+'manifest.json'),manifest=JSON.parse(bytes.toString());
  assert.equal(sha(bytes),'cd0153780348320b65287d48618d1281bcdad8e68c03fc418231ce605d708467');
  assert.equal(manifest.sourceCommit,'0ff5e51a5fb9e6b660a16d1531da5c92a74317c2');
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,expected] of Object.entries({
    'content/laryngeal-imaging-pins.json':'97af73448c9063517468aee21c881a6df3b2fc2f4fd8e6a004c98a58a3607338',
    'content/laryngeal-imaging.ts':'bfcced54a94c0b349fdbd433dbdb015dd9b654c2a434d58fb12da85e2a04efad',
    'lib/laryngeal-imaging.ts':'1f70ea5c5fdd188bd4ab73555a12ed9b77f5ea028d62c63e77eb3111f50417ef',
  }))assert.equal(inputs.find(row=>row.path===path)?.sha256,expected);
  const files=manifest.files as {path:string;sha256:string}[];
  const runtime=files.filter(f=>f.path.endsWith('.js')).map(f=>{
    const bytes=readFileSync(base+f.path);assert.equal(sha(bytes),f.sha256);return bytes.toString();
  }).join('\n');
  for(const text of ['Trace the epiglottis from its broad upper portion','Recognise the thyroid cartilage as the anterior shield','Look for the cricoid ring below the thyroid cartilage','https://pmc.ncbi.nlm.nih.gov/articles/PMC4266916/','No acquired image, validated registration, contouring protocol or airway-management guidance is supplied.'])assert(runtime.includes(text),text);
});
