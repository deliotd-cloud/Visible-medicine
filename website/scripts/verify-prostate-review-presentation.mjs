import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const required=['components/ProstateReviewNotes.tsx','components/prostate-review-notes.css',
 'lib/prostate-review-material.ts','lib/prostate-review-link.ts','lib/prostate-review-contract.ts',
 'lib/prostate-review-store.ts','lib/prostate-review-api.ts','lib/prostate-review-inbox.ts',
 'app/api/atlas-review/prostate/route.ts','app/workspace/atlas-review/prostate/page.tsx',
 'app/workspace/atlas-review/prostate/prostate-review.css','scripts/clinical-review-viewer/prostate-viewer.tsx',
 'scripts/clinical-review-viewer/prostate-viewer.css','scripts/verify-prostate-review-presentation.mjs'];
/** A generated compact seal, never a clinical approval or a replacement for the full delivery verifier. */
export function verifyProstateReviewPresentation({source,receipt,presentation=JSON.parse(readFileSync('lib/prostate-review-presentation.json'))}){
 assert.deepEqual(Object.keys(presentation).sort(),['presentationRevision','schema','sourceCommit']);
 assert.equal(presentation.schema,'vm.prostate-review-presentation/1');
 assert.match(presentation.sourceCommit,/^[a-f0-9]{40}$/);assert.match(presentation.presentationRevision,/^[a-f0-9]{64}$/);
 assert.equal(presentation.sourceCommit,source.revision);assert.equal(presentation.sourceCommit,receipt.sourceCommit);
 assert.equal(presentation.presentationRevision,source.websiteIntegrationSha256);assert.equal(presentation.presentationRevision,receipt.sha256);
 for(const path of required)assert.equal(receipt.inputs.filter(row=>row.path===path).length,1,'Missing or duplicate prostate presentation input: '+path);
 assert(!receipt.inputs.some(row=>row.path==='lib/prostate-review-presentation.json'),'Derived presentation seal cannot hash itself.');
 return{sourceCommit:presentation.sourceCommit,presentationRevision:presentation.presentationRevision,requiredInputs:required.length};
}
