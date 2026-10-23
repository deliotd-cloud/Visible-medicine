import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),sha=b=>createHash('sha256').update(b).digest('hex');
const paths=['app/fda-shoulder-reference.tsx','app/fda-shoulder-reference.css','app/specimens/fda-shoulder/page.tsx','lib/fda-reference-links.ts','lib/fda-reference-model-loader.ts','lib/fda-shoulder-reference.ts','lib/fda-reference-review.ts','lib/fda-specimen-review-material.ts','lib/specimen-review-material.ts','lib/specimen-review.ts','lib/specimen-review-api.ts','lib/specimen-review-client.ts','app/review/specimens/workspace.tsx','app/review/specimens/page.tsx'];
const inputs=[...paths].sort().map(p=>({path:p,sha256:sha(fs.readFileSync(root+'/'+p))}));
const text=JSON.stringify({schema:'vm-fda-reference-renderer/1',sha256:sha(JSON.stringify(inputs)),inputs},null,2)+'\n',target=root+'/content/fda-reference-renderer-revision.json';
assert(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--check','Usage: node scripts/pin-fda-reference-renderer.mjs [--check]');
if(process.argv[2]==='--check')assert.equal(fs.readFileSync(target,'utf8'),text,'FDA source viewer/review presentation changed; regenerate the exact source pin');else fs.writeFileSync(target,text);
console.log(JSON.stringify({mode:process.argv[2]==='--check'?'verified':'generated',files:inputs.length,sha256:JSON.parse(text).sha256,geometryApproval:false,patientSpaceRegistration:false}));
