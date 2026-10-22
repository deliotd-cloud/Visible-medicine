import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {regionalTourRoleNames,restorePriorRegionalTourRole} from './regional-tour-role-inverse.mjs'
import {batchCRoleNames,restorePriorBatchCRole} from './batch-c-role-inverse.mjs'

// A whole-source inverse, not an assertion-count proxy: every byte of each
// original test must be recoverable from the corresponding proposed test.
const expected = new Map([
  ['clinical-review-iliac-venous-xray.test.ts', ['4b3e6d5f6fc24cbeb19fcb43af72a97ad10160ff7778266b6f66c256fc873dba', 'a55f6c33ee41cccc7720482124104b529bcdfa9336ee5760ff35ec49ce34be68']],
  ['clinical-review-intracranial-arterial-xray.test.ts', ['4fb65a161ac7114957cc6551efab2c7d3834344ee250b875240ca407bb28d740', '582b55d1960288b58f00cac0c2bf4b5be88df0dbe851a2e270e7522b3f9a91c8']],
  ['clinical-review-limb-nerve-quiz.test.ts', ['2fc0a37e63dee23f82cff25fb7caa5af6b07c2feb886802a99a2cc84d004b432', '74a100863fb33a27b94e7e56847c225fab618b500bfeb5f0d37971faff5781d9']],
  ['clinical-review-longus-colli-quiz.test.ts', ['d050051128140219b110774454dcfdda235565d35d4c9a7a18a719330013585d', '68589eca6ad26c87d2e46f57f55769b75f3e3ce0919fe5cc49ac50ae7fa32dd8']],
  ['clinical-review-lower-venous-tour-v2.test.ts', ['c4eef1a6057e7bb9e9d5e197d858601b4ee353d64d0a8c09663de5a005de6d84', 'f52a3fd3ba12fc9836344febb9ab59a0a6c3f2b9bd6199595e0def5ef74ad4ae']],
  ['clinical-review-medial-thigh-tour.test.ts', ['a72852540281e6e6525e67dad75ce888483c3040e2d6c0a780459b35bdaa62b0', '03b265445b7937621a9d01ce849294ea170232c245f6f8c7a3f34b19325b4916']],
  ['clinical-review-median-cubital-xray.test.ts', ['3d7f3026f1c679ae695209c8bbe2b9f66c160fc67745d86804ea880e2b4492f4', '886db4ebcf56a04764fb9e416aaffd61c72f9487d5d18ddc63f66b0ed6e848a4']],
  ['clinical-review-mesenteric-vessel-teaching.test.ts', ['cc50a3c5d8a8334b3cd9f6eb92c4f7d1a1dbbd5088ba5f0a0c0c13fc1c64c26c', 'b677b62a8c142b7e0a07ed8d225e1ba040f1e675bc3402a77d71b0883ed140b4']],
])
const inverseUrl = new URL('./fixtures/clinical-epoch-batch-c-original/inverse-hunks.json', import.meta.url)
const inverseSha256 = 'a302b465f4caf1b89898bee80ea175e04e9cf15b6bd15fca0ccfbe807129ecce'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const normalize = bytes => bytes.toString('utf8').replace(/\r\n/g, '\n')

function invertWholeSource(source, hunks) {
  let restored = source
  for (const { before, after } of [...hunks].reverse()) {
    assert.ok(before.length > 0 && after.length > 0, 'an inverse hunk must have both sides')
    assert.equal(restored.split(after).length, 2, 'each inverse hunk must match exactly once')
    restored = restored.replace(after, before)
  }
  return restored
}

test('all eight Batch C proposals preserve their entire byte-pinned historical tests', () => {
  const inverseBytes = readFileSync(inverseUrl)
  assert.equal(sha256(inverseBytes), inverseSha256)
  const inverse = JSON.parse(inverseBytes.toString('utf8'))
  assert.equal(inverse.schema, 'vm-clinical-epoch-batch-c-whole-source-inverse-1')
  assert.deepEqual(inverse.files.map(file => file.name).sort(), [...expected.keys()].sort())
  const regionalNames = regionalTourRoleNames.filter(name => expected.has(name))
  assert.deepEqual([...regionalNames,...batchCRoleNames].sort(), [...expected.keys()].sort(),
    'All eight current-source roles have exact adapters')

  for (const { name, hunks } of inverse.files) {
    const [originalHash, proposalHash] = expected.get(name)
    const originalBytes = readFileSync(new URL('./fixtures/clinical-epoch-batch-c-original/' + name + '.raw', import.meta.url))
    const currentBytes = readFileSync(new URL('./' + name, import.meta.url))
    const proposalBytes = regionalNames.includes(name) ? restorePriorRegionalTourRole(name,currentBytes) :
      restorePriorBatchCRole(name,currentBytes)
    assert.equal(sha256(originalBytes), originalHash, name + ': original fixture bytes')
    assert.equal(sha256(proposalBytes), proposalHash, name + ': proposed test bytes')
    assert.ok(hunks.length > 0, name + ': declared inverse hunks')
    const original = normalize(originalBytes)
    const proposed = normalize(proposalBytes)
    assert.equal(invertWholeSource(proposed, hunks), original, name + ': complete historical source')

    // Mutation refusal: a changed proposed source cannot still claim this inverse.
    const firstAfter = hunks[0].after
    const match = /[A-Za-z0-9]/.exec(firstAfter)
    assert.ok(match, name + ': inverse mutation probe')
    const replacement = match[0] === 'X' ? 'Y' : 'X'
    const changedAfter = firstAfter.slice(0, match.index) + replacement + firstAfter.slice(match.index + 1)
    const changedProposal = proposed.replace(firstAfter, changedAfter)
    assert.notEqual(changedProposal, proposed)
    assert.throws(() => invertWholeSource(changedProposal, hunks), name + ': mutated proposal refused')
  }
})
