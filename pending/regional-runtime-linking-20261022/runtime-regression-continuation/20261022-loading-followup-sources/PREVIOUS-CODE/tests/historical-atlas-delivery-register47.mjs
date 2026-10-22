// Closed Register47 contract, scoped to the archived schema-1 delivery packet.
// Keep the current schema-2 validator independent and strict.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const websiteRoot=fileURLToPath(new URL('../',import.meta.url));
const modules=['head-neck','shoulder','lower-limb','female-pelvis'];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const paths=['atlas-review/manifest.json','atlas-review/integration-inputs.json',
 'public/atlas-review-viewer/manifest.json','lib/atlas-model-inventory.json',
 ...modules.flatMap(name=>['manifest.json','source-inputs.json'].map(file=>`public/atlas-runtime/${name}/${file}`))];

// This is the archived Register47 validator's complete packet and document check.
// Callers supply the exact frozen pin; it never falls back to a live/current pin.
export function validateHistoricalAtlasDelivery({pin,root=websiteRoot,read=(path)=>readFileSync(root+'/'+path)}={}){
 assert.equal(pin.schema,'vm-current-atlas-test-delivery-1');
 assert.deepEqual(Object.keys(pin).sort(),['schema','source','sourceTree','reviewIntegration','reviewSourceFiles','viewerFiles','viewerPackages','documents'].sort());
 assert.match(pin.source,/^[a-f0-9]{40}$/);assert.match(pin.sourceTree,/^[a-f0-9]{40}$/);assert.match(pin.reviewIntegration,/^[a-f0-9]{64}$/);
 assert(Number.isSafeInteger(pin.reviewSourceFiles)&&pin.reviewSourceFiles>0);
 assert.equal(pin.viewerFiles,46);assert.equal(pin.viewerPackages,22);
 assert.deepEqual(Object.keys(pin.documents).sort(),[...paths].sort());
 const documents=new Map(paths.map(path=>{assert.match(pin.documents[path],/^[a-f0-9]{64}$/);const bytes=read(path);assert.equal(sha(bytes),pin.documents[path],'Current delivery changed: '+path);return[path,JSON.parse(bytes)];}));
 const review=documents.get('atlas-review/manifest.json'),inputs=documents.get('atlas-review/integration-inputs.json'),viewer=documents.get('public/atlas-review-viewer/manifest.json'),inventory=documents.get('lib/atlas-model-inventory.json');
 assert.equal(review.revision,pin.source);assert.equal(review.files.length,pin.reviewSourceFiles);
 assert.equal(new Set(review.files.map(f=>f.path)).size,review.files.length);
 assert.equal(review.websiteIntegrationSha256,pin.reviewIntegration);
 assert.equal(inputs.sourceCommit,pin.source);assert.equal(inputs.sha256,pin.reviewIntegration);assert.equal(sha(JSON.stringify(inputs.inputs)),pin.reviewIntegration);
 assert.equal(viewer.sourceCommit,pin.source);assert.equal(viewer.websiteIntegrationSha256,pin.reviewIntegration);
 assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(viewer.files.length,pin.viewerFiles);assert.equal(viewer.packages.length,pin.viewerPackages);
 assert.equal(inventory.purpose,'licensed-atlas-model-staging-only');
 assert.deepEqual(new Set(inventory.sources.map(s=>s.module)),new Set(modules));
 assert.equal(inventory.models.length,137);assert.equal(inventory.models.flatMap(m=>m.paths).length,144);
 assert.equal(inventory.models.reduce((n,m)=>n+m.bytes,0),199072480);
 for(const name of modules){
  const base=`public/atlas-runtime/${name}/`,manifest=documents.get(base+'manifest.json'),sourceInputs=documents.get(base+'source-inputs.json');
  assert.equal(manifest.sourceCommit,pin.source);assert.equal(manifest.patientDataIncluded,false);
  for(const key of ['clinicalApproved','standaloneReviewConnection','imagingConnection'])assert(manifest[key]===false||manifest[key]===undefined,'No widened clearance: '+name+':'+key);
  assert.equal(new Set(manifest.files.map(f=>f.path)).size,manifest.files.length);
  assert.equal(new Set(sourceInputs.map(f=>f.path)).size,sourceInputs.length);
  const entry=inventory.sources.find(s=>s.module===name);assert.equal(entry.sourceCommit,pin.source);assert.equal(entry.manifestSha256,pin.documents[base+'manifest.json']);
 }
 return structuredClone(pin);
}
