import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
test('short ciliary pathology ships exact draft source and evidence limits',()=>{
 const base='public/atlas-runtime/head-neck/';
 const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
 for(const [path,sha256]of [
  ['content/short-ciliary-pathology.ts','6cc88d0a6b9620920c2a3a8326a6784610087ae1fa00dcc30cd8a0e542629f91'],
  ['lib/short-ciliary-pathology.ts','bf74dbc970a46d4a93745acb2771e9420ed4a3fbadb9b28298589ba3fdef215f'],
 ])assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256}]);
 const files=manifest.files as {path:string;sha256:string}[];
 const chunks=files.filter(f=>f.path.endsWith('.js'));assert(chunks.length>0);
 const text=chunks.map(f=>{const b=readFileSync(base+f.path);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);return b.toString();}).join('\n');
 for(const marker of ['FMA7041','Tonic pupil and postganglionic injury','not a standalone diagnosis',
  'not demonstrated nerve histology','bilateral source group does not depict a diseased side',
  'https://pubmed.ncbi.nlm.nih.gov/333920/','https://pmc.ncbi.nlm.nih.gov/articles/PMC8115311/',
  'https://pubmed.ncbi.nlm.nih.gov/19721706/','Atlas, imaging-case and paid-lecture access remain independent.'])assert(text.includes(marker),marker);
 for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
 assert(!files.some(f=>/ct-handoff|\.local\/|\.(dcm|dicom|nii|nrrd)(\.|$)/i.test(f.path)));
});
