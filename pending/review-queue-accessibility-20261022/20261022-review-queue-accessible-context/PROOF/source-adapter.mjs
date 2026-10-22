import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const receiptPath = fileURLToPath(new URL('../../20261022-final-loading-history-closures/APPLIED_SOURCE.json', import.meta.url));
const receipt = JSON.parse(readFileSync(receiptPath, 'utf8'));
const sourceRow = receipt.sourceRows.find(row => row.path === 'components/ClinicalReviewInbox.tsx');
assert(sourceRow, 'receipt must identify the exact owned source');
const digest = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const candidate = resolve(receipt.website, sourceRow.path);
const raw = fileURLToPath(new URL('../RAW/components/ClinicalReviewInbox.tsx', import.meta.url));
assert.match(sourceRow.sha256, /^[a-f0-9]{64}$/);
assert.equal(digest(candidate), sourceRow.sha256, 'candidate drift');
assert.equal(digest(raw), sourceRow.sha256, 'RAW is not the exact receipt preimage');

const selected = process.env.VM_REVIEW_PROOF_BASELINE === '1' ? raw :
  fileURLToPath(new URL('../CODE/components/ClinicalReviewInbox.tsx', import.meta.url));
globalThis.__vmClinicalReviewSourceProof = {
  websiteRoot: receipt.website,
  componentUrl: pathToFileURL(selected),
};
