import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261021-review-navigation-ui-candidate',site=root+'/website',base=root+'/baseline-website';
const p=json('F:/VisibleMedicine/staging/20261021-plexus-navigation-binding-proposal/PROPOSAL.json');
assert(!fs.existsSync(root+'/PLEXUS_TRANSITION.json'));
for(const r of p.paths)assert.equal(sha(read(site+'/'+r.path)),r.candidateSha256);
const saved=json(root+'/PLEXUS_BASELINE.json');for(const r of saved.rows)assert.equal(sha(read(base+'/'+r.path)),r.sha256);
for(const r of p.externalInputs.filter(r=>r.generatedCandidateSha256))assert.equal(sha(read(site+'/'+r.path)),r.preimageSha256);
const {rebindPlexusNavigation}=await import(pathToFileURL(site+'/scripts/rebind-plexus-review-navigation.mjs'));
const result=rebindPlexusNavigation(json(base+'/lib/plexus-review-manifest.json'),read(base+'/.local/plexus-review/assets.ts').toString(),p=>read(base+'/'+p),p=>read(site+'/'+p));
const generated=[{path:'lib/plexus-review-manifest.json',bytes:Buffer.from(JSON.stringify(result.packet,null,2)+'\n')},{path:'.local/plexus-review/assets.ts',bytes:Buffer.from(result.moduleText)}];
for(const r of generated)assert.equal(sha(r.bytes),p.externalInputs.find(x=>x.path===r.path).generatedCandidateSha256);
// Mechanical serialized generator output, never hand-edited generated content.
for(const r of generated){fs.writeFileSync(site+'/'+r.path,r.bytes);assert.equal(sha(read(site+'/'+r.path)),sha(r.bytes));}
for(const r of saved.rows)assert.equal(sha(read(base+'/'+r.path)),r.sha256);
fs.writeFileSync(root+'/PLEXUS_TRANSITION.json',JSON.stringify({at:new Date().toISOString(),before:result.before,after:result.after,generated:generated.map(r=>({path:r.path,bytes:r.bytes.length,sha256:sha(r.bytes),privateLocalOnly:r.path.startsWith('.local/')})),topologyUnchanged:true,nonHtmlAssetsUnchanged:true,admissions:0,decisionsMigrated:false,canonicalInstalled:false,sourceBaselineUnchanged:true,privateModuleUploadAllowed:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({isolatedTransitionApplied:true,topologyUnchanged:true,nonHtmlAssetsUnchanged:true,admissions:0,canonicalInstalled:false}));
