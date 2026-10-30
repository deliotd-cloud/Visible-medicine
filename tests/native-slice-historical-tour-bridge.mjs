// Execute the original b79 theorem in its receipt-bound Website context.
// The adjacent current helper belongs to a later delivery and cannot certify it.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {readFileSync} from 'node:fs';
import {historicalWebsiteRoot,historicalReceiptPath,validateHistoricalReceiptBytes,readHistoricalSource} from './head-study-set-historical-source.mjs';

const sourceCommit='b79e110d2d28f18993263926ba35aa7a3f478b20';
const helper='tests/adjacent-current-tour-source-role.mjs';

export async function assertHistoricalNativeTourSource(){
  // Authenticate the helper and its local verifier imports before module load.
  for(const path of [helper,'tests/native-slice-current-display.mjs',
    'tests/current-atlas-delivery.mjs','tests/atlas-source-repo.mjs',
    'tests/tour-playback-source-role.mjs','tests/guided-review-completeness.mjs',
    'tests/fixtures/current-atlas-delivery.json'])readHistoricalSource(path);
  const receipt=validateHistoricalReceiptBytes(readFileSync(historicalReceiptPath));
  assert.equal(receipt.atlasHead,sourceCommit);
  assert.equal(receipt.atlasTree,'0dd97cc55ef9aff3493b91752309d1d661c0b0c8');
  const atlasRoot=receipt.atlas;
  const historical=await import(pathToFileURL(historicalWebsiteRoot+'/'+helper).href);
  assert.equal(typeof historical.assertCurrentTourSource,'function');
  const proof=historical.assertCurrentTourSource({atlasRoot,sourceCommit});
  assert.match(proof.sha256,/^[a-f0-9]{64}$/);
  assert.throws(()=>historical.assertCurrentTourSource({atlasRoot,sourceCommit:'9cef8900417bf592d3130f6ff92bf3e748cb55fc'}),
    'mutated source context must not pass the historical theorem');
  return proof;
}
