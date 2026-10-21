import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const target='F:/VisibleMedicine/website/docs/anatomy-coverage/README.md';
const site='F:/VisibleMedicine/staging/20261021-source190-website/website';
const stage='F:/VisibleMedicine/staging/20261021-coverage-prose-merge';
const before=read(target);assert.equal(sha(before),'8bf1991b55e0d306eba9beb7168882a08a296f0679c1a739970b7784e3b98f39');
const index=json(site+'/docs/anatomy-coverage/index.json'),manifest=json(site+'/atlas-review/manifest.json');
const source='190a63238eadcf906abe89dcbb6a67c88afe70b9';
assert.equal(index.sourceRevision,source);assert.equal(manifest.revision,source);
const byPath=new Map(manifest.files.map(row=>[row.path,row]));let imported=0,metadata=0;
for(const [p,hash] of Object.entries(index.evidence.sourceInputs)){const row=byPath.get(p);if(row){assert.equal(row.sourceSha256,hash,p);imported++;}else metadata++;}
assert.equal(imported,142);assert.equal(metadata,26);
for(const artifact of index.sourceArtifacts)assert.equal(sha(read(site+'/'+artifact.path)),artifact.sha256,artifact.path);
assert.equal(index.sourceArtifacts.length,4);
const text=before.toString(),newline=text.includes('\r\n')?'\r\n':'\n',head='# Anatomy coverage and remaining work'+newline+newline;assert(text.startsWith(head));
const addition=[
 '## Current coordinated inventory — 21 October 2026',
 '',
 'Atlas source: `'+source+'`. All four exact inventory artifacts,',
 'the learner exports and the protected Review import use this source revision.',
 'The index binds 168 named source dependencies: 142 imported Review paths and',
 '26 source-only metadata paths. They remain separate verification scopes.',
 'Passing checks does not turn inventory counts into unique lessons, accepted',
 'anatomy, clinical approval, patient registration or public deployment.',
 '',
 'The factual inventory, seven documented gap groups, source frames and holds',
 'are unchanged. In particular, missing peripheral nerves/plexuses are not filled',
 'with inferred geometry, and spinal cord tissue remains held. The current',
 'coverage view and production preflight reject mixed revisions or altered',
 'evidence; the source-only checker below verifies the additional metadata.',
 '',
 'The following coordination record is preserved verbatim. Its older source',
 'revisions and 141/25/166 counts describe historical checkpoints, not the',
 'current inventory. The intermediate candidate README is retained separately',
 'with its exact preimage in the recoverable cutover preparation.',
 '',
 '## Historical coordination record (preserved)',
 '',
].join(newline)+newline;
const proposed=head+addition+text.slice(head.length);
assert.equal(proposed.replace(addition,''),text,'The entire canonical prose has an exact inverse');
assert(!fs.existsSync(stage));fs.mkdirSync(stage);
// Generated evidence/preimages only; the proposed document is emitted as an
// apply_patch edit and is NOT applied to either running source tree.
fs.copyFileSync(target,stage+'/canonical-before.raw',fs.constants.COPYFILE_EXCL);
fs.copyFileSync(site+'/docs/anatomy-coverage/README.md',stage+'/candidate-before.raw',fs.constants.COPYFILE_EXCL);
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({stage,source,target,beforeSha256:sha(before),candidateBeforeSha256:sha(read(stage+'/candidate-before.raw')),proposedSha256:sha(Buffer.from(proposed.replaceAll('\r\n','\n'))),normalizedProposal:true,canonicalHistoricalProseExactlyPreserved:true,imported,metadata,dependencies:168,sourceArtifacts:index.sourceArtifacts,proposalOnly:true,canonicalInstalled:false,requiredGate:'Do not admit until the coherent source190 local runtime/Review/coverage cutover; guard the exact canonical preimage again.'},null,2)+'\n',{flag:'wx'});
console.log(['*** Begin Patch','*** Add File: '+stage+'/README.md',...proposed.replaceAll('\r\n','\n').replace(/\n$/,'').split('\n').map(line=>'+'+line),'*** End Patch'].join('\n'));
