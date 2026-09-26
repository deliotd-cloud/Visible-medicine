// Bind website renderer adaptations as well as the independently versioned
// Atlas renderer. No saved decisions are changed or migrated by this script.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const sha = value => createHash('sha256').update(value).digest('hex');
const manifest = JSON.parse(readFileSync('atlas-review/manifest.json'));
const revisionPaths = ['content/body-renderer-revision.json','content/review-revisions.json'];
const adapterPaths = ['scripts/import-clinical-review.mjs','scripts/build-clinical-review-viewer.mjs','scripts/bind-clinical-review.mjs','lib/clinical-review-links.ts','lib/clinical-review-fetch.ts','components/review-ui-variants.css','package-lock.json',
  ...readdirSync('scripts/clinical-review-viewer').map(p=>'scripts/clinical-review-viewer/'+p),
  ...readdirSync('app/workspace/atlas-review',{recursive:true}).filter(p=>/\.(tsx|css)$/.test(p)).map(p=>'app/workspace/atlas-review/'+p.replaceAll('\\','/'))];
const inputs = [...manifest.files.filter(f=>!revisionPaths.includes(f.path)).map(f=>({path:'atlas-review/'+f.path,sha256:sha(readFileSync('atlas-review/'+f.path))})),
  ...adapterPaths.map(path=>({path,sha256:sha(readFileSync(path))}))].sort((a,b)=>a.path.localeCompare(b.path));
const integrationHash = sha(JSON.stringify(inputs));
const bodyPath = 'atlas-review/' + revisionPaths[0], shoulderPath = 'atlas-review/' + revisionPaths[1];
const body = JSON.parse(readFileSync(bodyPath)), shoulder = JSON.parse(readFileSync(shoulderPath));
body.sourceRendererSha256 ??= body.sha256;
body.websiteIntegrationSha256 = integrationHash;
body.sha256 = sha(JSON.stringify({source:body.sourceRendererSha256,website:integrationHash}));
shoulder.sourceRevisions ??= structuredClone(shoulder.revisions);
shoulder.websiteIntegrationSha256 = integrationHash;
for (const [id, tracks] of Object.entries(shoulder.sourceRevisions))
  for (const track of ['geometry','teaching']) shoulder.revisions[id][track] = tracks[track] === null ? null : sha(JSON.stringify({source:tracks[track],website:integrationHash}));
writeFileSync(bodyPath,JSON.stringify(body,null,2)+'\n');
writeFileSync(shoulderPath,JSON.stringify(shoulder,null,2)+'\n');
for (const file of manifest.files) if(revisionPaths.includes(file.path)) file.importedSha256=sha(readFileSync('atlas-review/'+file.path));
manifest.websiteIntegrationSha256 = integrationHash;
writeFileSync('atlas-review/manifest.json',JSON.stringify(manifest,null,2)+'\n');
writeFileSync('atlas-review/integration-inputs.json',JSON.stringify({sourceCommit:manifest.revision,sha256:integrationHash,inputs},null,2)+'\n');
console.log(JSON.stringify({integrationHash,bodyRenderer:body.sha256,shoulderStructures:Object.keys(shoulder.revisions).length}));
