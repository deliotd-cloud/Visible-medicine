// Read-only repeatable check. Never installs, refreshes or rewrites the checklist.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {json,read,sha} from './source-only-backup-20261019.mjs';

const root='F:/VisibleMedicine/staging/20261022-checklist-installed-reconciliation';
const site='F:/VisibleMedicine/website',result=json(root+'/RESULT.json');
const {verifyImportedAtlasEvidence,renderChecklist,evidencePath}=await import(pathToFileURL(root+'/scripts/refresh-completion-checklist.v2.mjs'));
assert.equal(result.verdict,'pass');assert.equal(result.canonicalChecklistChanged,false);
for(const row of result.files)assert.equal(sha(read(root+'/'+row.path)),row.sha256,row.path);
const draft=json(root+'/docs/completion-checklist.json'),original=json(root+'/preimages/completion-checklist.json');
verifyImportedAtlasEvidence(draft,site);
assert.deepEqual(draft.items,original.items);assert.deepEqual(draft.baseline,original.baseline);
assert.deepEqual(draft.rules,original.rules);assert.deepEqual(draft.statusDefinitions,original.statusDefinitions);
assert.equal(read(root+'/docs/completion-checklist.md').toString(),renderChecklist(draft));
assert.equal(read(site+'/docs/completion-checklist.json').toString(),read(root+'/preimages/completion-checklist.json').toString());
assert.equal(read(site+'/docs/completion-checklist.md').toString(),read(root+'/preimages/completion-checklist.md').toString());
assert.equal(read(site+'/scripts/refresh-completion-checklist.mjs').toString(),read(root+'/preimages/refresh-completion-checklist.mjs').toString());
const evidence=json(evidencePath(draft,draft.importedAtlasSource.evidence));
for(const witness of ['installation','snapshot','teachingCheckpoint'])assert.equal(sha(read(evidence[witness].path)),evidence[witness].sha256,witness);
const inputs=json(site+'/atlas-review/integration-inputs.json');
for(const row of inputs.inputs)assert.equal(sha(read(site+'/'+row.path)),row.sha256,row.path);
let references=0;for(const item of draft.items)for(const ref of item.evidence){assert(fs.statSync(evidencePath(draft,ref)).isFile(),ref);references++;}
console.log(JSON.stringify({verdict:'pass',revision:draft.revision,items:draft.items.length,optional:draft.items.filter(i=>i.scope==='optional').length,
 liveBoundInputs:inputs.inputs.length,itemEvidenceReferences:references,statusesChanged:false,canonicalTrackingUnchanged:true,readOnly:true}));
