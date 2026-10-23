import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const stage='F:/VisibleMedicine/staging/20261023-fda-review-source',root=stage+'/atlas',file=root+'/scripts/validate-specimen-review.mjs';
const original=fs.readFileSync(file,'utf8'),seams=[
 ['let contexts = 0,',"// Original356-source proof stays intact; the six unitless drafts have a separate native API/identity suite.\nconst legacyReviewRows = api.specimenReviewRows.filter(row => row.key !== 'fda-shoulder-fc9f3e56');\nassert.equal(api.specimenReviewRows.length - legacyReviewRows.length, 1);\nassert.equal(api.specimenReviewRows.find(row => row.key === 'fda-shoulder-fc9f3e56').surfaces.length, 6);\nlet contexts = 0,"],
 ['for (const group of api.specimenReviewRows)\n','for (const group of legacyReviewRows)\n'],
 ['  specimens: api.specimenReviewRows.map((r) => ({','  specimens: legacyReviewRows.map((r) => ({'],
];
fs.mkdirSync(stage+'/validator-preservation',{recursive:true});fs.writeFileSync(stage+'/validator-preservation/validate-specimen-review.original.mjs',original,{flag:'wx'});
let next=original;for(const[from,to]of seams){assert.equal(next.split(from).length,2);next=next.replace(from,to);}
let inverse=next;for(const[from,to]of [...seams].reverse()){assert.equal(inverse.split(to).length,2);inverse=inverse.replace(to,from);}assert.equal(inverse,original);
fs.writeFileSync(file,next);fs.writeFileSync(stage+'/validator-preservation/INVERSE.json',JSON.stringify({originalSha256:createHash('sha256').update(original).digest('hex'),currentSha256:createHash('sha256').update(next).digest('hex'),seams,wholeFileInverseExact:true,original356SourceChecksAndRefusalsPreserved:true,fdaSixSourcesCoveredBySeparateSuite:true},null,2)+'\n',{flag:'wx'});console.log('Three exact seams retain complete original validator; no expectation values changed');
