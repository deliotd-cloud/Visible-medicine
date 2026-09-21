import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

test('regional export includes the exact laryngeal drafts and preserves clinical/access gates',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=readFileSync(base+'manifest.json'),manifest=JSON.parse(bytes.toString());
  assert.equal(sha(bytes),'df2ee985c5403e42543d457960bf973de713d5f3ca1d4358c3aaf5ed81d92a05');
  assert.equal(manifest.sourceCommit,'9b9a1ffca58eb9f921354eccbebeabcb9965d556');
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,expected] of Object.entries({
    'content/laryngeal-imaging-pins.json':'97af73448c9063517468aee21c881a6df3b2fc2f4fd8e6a004c98a58a3607338',
    'content/laryngeal-imaging.ts':'bfcced54a94c0b349fdbd433dbdb015dd9b654c2a434d58fb12da85e2a04efad',
    'lib/laryngeal-imaging.ts':'145628e9fd451edca4ef20f0f6dcadb8eb0d0680a5ce1214ef9560751cbdf189',
  }))assert.equal(inputs.find(row=>row.path===path)?.sha256,expected);
  const files=manifest.files as {path:string;sha256:string}[];
  const runtime=files.filter(f=>f.path.endsWith('.js')).map(f=>{
    const bytes=readFileSync(base+f.path);assert.equal(sha(bytes),f.sha256);return bytes.toString();
  }).join('\n');
  for(const text of ['Trace the epiglottis from its broad upper portion','Recognise the thyroid cartilage as the anterior shield','Look for the cricoid ring below the thyroid cartilage','https://pmc.ncbi.nlm.nih.gov/articles/PMC4266916/','No acquired image, validated registration, contouring protocol or airway-management guidance is supplied.'])assert(runtime.includes(text),text);
});
