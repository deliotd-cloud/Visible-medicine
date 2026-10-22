import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const original = readFileSync(new URL('./fixtures/clinical-review-genicular-ultrasound-before-current.ts.raw', import.meta.url));
assert.equal(createHash('sha256').update(original).digest('hex'), '9f58d0e61113b327695d6cb6c98bd89062e00d5b64c2228ff7636dee9def3f10');
const importLine = "import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';\n";
const newImport = importLine + "import {admitPreservedClinicalReview} from './clinical-review-current-admission.mjs';\n"
  + "import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\n";
const oldRoot = "const atlas='F:/VisibleMedicine/atlas';";
const newRoot = 'const atlas=currentAtlasDeliveryRoot();';
const oldCommit = "const liveCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2'; // Exact integrated Atlas feature commit.";
const newCommit = "const historicalFeature='9fba9a1e24b6669aafd48e945d55fc0939d50ab2'; // Exact original integrated Atlas feature commit.\n"
  + 'const liveCommit=admitPreservedClinicalReview({revision:historicalFeature,sourceHashes:{\n'
  + "  'content/genicular-imaging-pins.json':'365a921cf5fa507c682f067df6762dd6759e21c4c686442129bc3f2e3103e9f2',\n"
  + "  'content/genicular-ultrasound.ts':'3a4d9e4da862b4de40aeef26408874ad7679e5ae3e13603f923d0313d70ae298',\n"
  + "  'lib/genicular-ultrasound.ts':'27ecab9cc163d92fb6d2adce507484b62e74dc42b6468ec00860a84f84124a13',\n"
  + "},learnerModules:['head-neck','shoulder']});";
let expected = original.toString();
for (const [before, after] of [[importLine, newImport], [oldRoot, newRoot], [oldCommit, newCommit]]) {
  assert.equal(expected.split(before).length, 2); expected = expected.replace(before, after);
}
const verify = bytes => {
  const text = bytes.toString().replace(/\r\n/g, '\n');
  assert.equal(text, expected, 'Only three declared current/history admission seams may differ');
  const restored = text.replace(newImport, importLine).replace(newRoot, oldRoot).replace(newCommit, oldCommit);
  assert.deepEqual(Buffer.from(restored), original, 'Whole original LF bytes restored; all test bodies retained');
};
test('two complete original genicular test bodies survive exact current admission seams', () => {
  const candidate = readFileSync(new URL('./clinical-review-genicular-ultrasound.test.ts', import.meta.url));
  verify(candidate);
  assert.equal((expected.match(/\ntest\('/g) ?? []).length, 2);
  assert(expected.includes("const baseline='20988a1ba542b7a39d2135cfa5c2e426ab81d593';"));
});
test('forged current source, lost identity/refusal/old-epoch checks and disabled registrations refuse', () => {
  for (const [before, after] of [
    ["assert.equal((await save(forged)).status,422);", "assert.equal((await save(forged)).status,200);"],
    ['assert.deepEqual(packet,livePacket);', 'assert(true);'],
    ['assert.equal(old.bodyLesson(structure,tab).readiness,\'pending\');', 'assert(true);'],
    ["'365a921cf5fa507c682f067df6762dd6759e21c4c686442129bc3f2e3103e9f2'", "'" + '0'.repeat(64) + "'"],
  ]) {
    assert.equal(expected.split(before).length, 2); assert.throws(() => verify(Buffer.from(expected.replace(before, after))));
  }
  assert.throws(() => verify(Buffer.from('if(false){\n' + expected + '\n}')));
});
