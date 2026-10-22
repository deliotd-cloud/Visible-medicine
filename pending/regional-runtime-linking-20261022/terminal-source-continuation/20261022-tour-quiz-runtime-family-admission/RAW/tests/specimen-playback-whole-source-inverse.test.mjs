import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const originalSha256 = '34f0869e7319915cefcd0e4746d0563173e9a83c25e47388ba06098c148ceca3'
const proposalSha256 = '3076ac33f3096b47f09dbf9364f92687d74d8ffb5899b4c612e8134f3db1ba1c'
const inverseSha256 = '82cefd21ea512d477afe334076f3d4880d79d222ed970b3ec4e5e99e98eb6d77'
const name = 'clinical-review-specimen-continuous-playback.test.ts'
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const normalize = bytes => bytes.toString('utf8').replace(/\r\n/g, '\n')

function invert(source, hunks) {
  let restored = source
  for (const { before, after } of [...hunks].reverse()) {
    assert.ok(before && after, 'inverse hunk has both exact sides')
    assert.equal(restored.split(after).length, 2, 'inverse hunk matches once')
    restored = restored.replace(after, before)
  }
  return restored
}

test('the complete original playback theorem survives an exact declared whole-source inverse', () => {
  const originalBytes = readFileSync(new URL('./fixtures/specimen-playback-original/' + name + '.raw', import.meta.url))
  const proposedBytes = readFileSync(new URL('./' + name, import.meta.url))
  const inverseBytes = readFileSync(new URL('./fixtures/specimen-playback-original/inverse-hunks.json', import.meta.url))
  assert.equal(sha(originalBytes), originalSha256)
  assert.equal(sha(proposedBytes), proposalSha256)
  assert.equal(sha(inverseBytes), inverseSha256)
  const inverse = JSON.parse(inverseBytes.toString('utf8'))
  assert.equal(inverse.schema, 'vm-specimen-playback-whole-source-inverse-1')
  assert.equal(inverse.name, name)
  assert.equal(inverse.hunks.length, 4)
  assert.equal(invert(normalize(proposedBytes), inverse.hunks), normalize(originalBytes))

  const after = inverse.hunks[0].after
  const match = /[A-Za-z0-9]/.exec(after)
  assert(match)
  const replacement = match[0] === 'X' ? 'Y' : 'X'
  const changed = after.slice(0, match.index) + replacement + after.slice(match.index + 1)
  const mutated = normalize(proposedBytes).replace(after, changed)
  assert.notEqual(mutated, normalize(proposedBytes))
  assert.throws(() => invert(mutated, inverse.hunks), 'an undeclared edit is refused')
})
