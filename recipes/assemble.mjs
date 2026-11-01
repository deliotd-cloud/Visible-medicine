// Execute after prepare.mjs, under the main chat's 1024 MiB heap / 2048 MiB job / 4096 MiB free guard.
// Stops at assembled source and Review binding; it does not build Review or the website.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {root,site,native,head,tree,exportRoot,child,sha,json,cleanNative,run,write} from './plan.mjs';

const p=json(child(root,'PREPARATION.json'));assert.equal(path.resolve(p.website),path.resolve(site));assert.equal(p.nativeHead,head);assert.equal(p.nativeTree,tree);cleanNative();
assert(!fs.existsSync(child(root,'ASSEMBLED.json')),'Already assembled');
const baselineInventory=json(child(site,'lib/atlas-model-inventory.json'));
const baselineCoverage=json(child(site,'docs/anatomy-coverage/index.json'));
const baselineRoot=json(child(site,'docs/anatomy-coverage/root.json'));
// The importer reads committed blobs only. Its one revision literal was changed in preparation.
run(site,'import',['scripts/import-clinical-review.mjs',native]);
const review=json(child(site,'atlas-review/manifest.json'));assert.equal(review.revision,head);
for(const row of review.files)assert.equal(sha(child(site,'atlas-review/'+row.path)),row.importedSha256,row.path);

const manifest=json(child(exportRoot,'manifest.json'));assert.equal(manifest.sourceCommit,head);assert.equal(manifest.files.length,222);
const previous=child(site,'public/atlas-runtime/head-neck'),parked=child(root,'prior-head-neck-runtime');
assert(!fs.existsSync(parked));
const rootReal=fs.realpathSync(root),targetReal=fs.realpathSync(previous);
assert(targetReal.startsWith(rootReal+path.sep),'Runtime target escapes fresh stage');
assert(!fs.lstatSync(previous).isSymbolicLink());
fs.renameSync(previous,parked);
fs.mkdirSync(previous,{recursive:true});
for(const row of [...manifest.files,{path:'manifest.json',sha256:sha(child(exportRoot,'manifest.json'))}]){
  const from=child(exportRoot,row.path),to=child(previous,row.path);assert.equal(sha(from),row.sha256,row.path);
  fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);assert.equal(sha(to),row.sha256,row.path);
}

run(site,'inventory',['scripts/atlas-model-inventory.mjs']);
const inventory=json(child(site,'lib/atlas-model-inventory.json'));
assert.deepEqual(inventory.models,baselineInventory.models,'Canonical model rows changed');
assert.equal(inventory.sources.find(s=>s.module==='head-neck')?.sourceCommit,head);
const policyPath=child(site,'lib/atlas-delivery-policy.ts'),oldPolicy=fs.readFileSync(policyPath,'utf8');
const matches=[...oldPolicy.matchAll(/manifestRevision: '([a-f0-9]{64})'/g)];assert.equal(matches.length,1);
assert(oldPolicy.includes("audience: 'administrator-review'"));
const policy=oldPolicy.replace(matches[0][1],sha(child(site,'lib/atlas-model-inventory.json')));
assert.equal(policy.replace(sha(child(site,'lib/atlas-model-inventory.json')),matches[0][1]),oldPolicy);
fs.writeFileSync(policyPath,policy);
run(site,'lecture-catalog',['scripts/lecture-body-catalog.mjs']);

// The native revision changes, so generate the four scope ledgers outside the website.
const coverageCandidate=child(root,'coverage-candidate');assert(!fs.existsSync(coverageCandidate));
run(site,'coverage-generate',['scripts/generate-anatomy-coverage.mjs','--source-root',native,'--revision',head,'--output-root',coverageCandidate]);
const scopes=['root','nested','independent','reference'];
const generated=json(child(coverageCandidate,'index.json'));
assert.deepEqual(generated.scopedCounts,baselineCoverage.scopedCounts,'Coverage counts changed');
assert.deepEqual(json(child(coverageCandidate,'root.json')).counts,baselineRoot.counts,'Root model counts changed');
const checkerPath=child(site,'scripts/check-anatomy-coverage.mjs');let checker=fs.readFileSync(checkerPath,'utf8');
const oldRevision="export const coverageRevision='7d3ab00f500a738d4f2d261ca6cd768e7f6ce1bc';";
assert.equal(checker.split(oldRevision).length,2,'Coverage revision seam drift');checker=checker.replace(oldRevision,`export const coverageRevision='${head}';`);
for(const scope of scopes){const relative='docs/anatomy-coverage/'+scope+'.json';const old=baselineCoverage.sourceArtifacts.find(a=>a.scope===scope);assert(old,'Missing previous scope');
  const newSha=sha(child(coverageCandidate,scope+'.json'));assert.equal(checker.split(old.sha256).length,2,'Coverage hash seam drift: '+scope);checker=checker.replace(old.sha256,newSha);
  fs.copyFileSync(child(coverageCandidate,scope+'.json'),child(site,relative));assert.equal(sha(child(site,relative)),newSha);
}
fs.copyFileSync(child(coverageCandidate,'index.json'),child(site,'docs/anatomy-coverage/index.json'));
fs.writeFileSync(checkerPath,checker);run(site,'coverage-check',['scripts/check-anatomy-coverage.mjs','--source-root',native]);
run(site,'catalog-types',['scripts/atlas-catalog-types.mjs']);
run(site,'catalog-types-check',['scripts/atlas-catalog-types.mjs','--check']);
run(site,'review-binding',['scripts/bind-clinical-review.mjs']);
const binding=json(child(site,'atlas-review/integration-inputs.json'));
assert(binding.inputs.length>0);for(const row of binding.inputs)assert.equal(sha(child(site,row.path)),row.sha256,row.path);

// Focused source checks. No current-delivery pin updates or broad test-contract rewrites.
const tests=['tests/atlas-catalog-types.test.mjs','tests/atlas-compiler-artifact-plugin.test.mjs','tests/anatomy-coverage-index.test.mjs'];
for(const test of tests)run(site,'test-'+path.basename(test),['--test',test]);
write(child(root,'ASSEMBLED.json'),{schema:'vm-orientation-website-assembled/1',website:site,nativeHead:head,nativeTree:tree,baselineRows:p.baseline.rows,overlayFiles:p.overlay.length,imported:review.files.length,runtimeFiles:manifest.files.length,modelRows:inventory.models.length,modelPaths:inventory.models.reduce((n,m)=>n+m.paths.length,0),coverageScopes:scopes,coverageCounts:generated.scopedCounts,boundInputs:binding.inputs.length,reviewBinding:binding.sha256,focusedTests:tests,reviewBuilt:false,websiteTypes:false,websiteBuilt:false,installed:false,clinicalApproval:false});
console.log(JSON.stringify({assembled:site,imported:review.files.length,bound:binding.inputs.length,runtime:manifest.files.length,reviewBuild:false,websiteBuild:false}));
