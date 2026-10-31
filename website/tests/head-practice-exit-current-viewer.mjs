// Test-only successor from the sealed 27 October viewer to the current stage.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { sourceHunks } from './head-tools-wider-consumer-inverse.mjs';

const sha = value => createHash('sha256').update(value).digest('hex');
const viewer = 'components/HeadAtlasViewer.tsx';
function sealedViewer(receiptPath, receiptSha, website, viewerSha) {
  const bytes = readFileSync(receiptPath);
  assert.equal(sha(bytes), receiptSha, 'Fixed viewer source receipt changed');
  const receipt = JSON.parse(bytes);
  assert.equal(receipt.website, website, 'Viewer receipt website changed');
  const rows = receipt.sourceRows.filter(row => row.path === viewer);
  assert.equal(rows.length, 1, 'Exactly one viewer source row');
  assert.equal(rows[0].sha256, viewerSha, 'Viewer receipt row changed');
  const source = readFileSync(website + '/' + viewer);
  assert.equal(source.length, rows[0].bytes, 'Viewer source size changed');
  assert.equal(sha(source), viewerSha, 'Viewer source bytes changed');
  const text = source.toString('utf8');
  assert.deepEqual(Buffer.from(text), source, 'Viewer source must be lossless UTF-8');
  return text;
}

export function restoreCurrentPracticeExitViewer(current) {
  const prior = sealedViewer(
    'F:/VisibleMedicine/staging/20261027-head-release-repairs/SOURCE_CANDIDATE.json',
    'bd6d2004d744d23fe252d3b9d15d46f760c7f4d418f374c3d84f13df4ab425b7',
    'F:/VisibleMedicine/staging/20261027-head-release-repairs/website',
    'af896cf7b68b7fc7a6bfaf2b2e67c219901570d0b363fa728467db0b2bf50e10');
  const sealedCurrent = sealedViewer(
    'G:/VisibleMedicine-temp/staging/20261031-release-partition13-repairs/SOURCE.json',
    '5912dd67d94b93dcb4e022345a0240cc691a82e1d31dcb24469b6ef2a2b9c5e6',
    'G:/VisibleMedicine-temp/staging/20261031-release-partition13-repairs/website',
    '65407ec32882f84f215f0df3210b0c632452592a0cef63b5c76eb3849c85d159');
  assert.equal(current, sealedCurrent, 'Current viewer differs from sealed stage');
  const hunks = sourceHunks(prior, current);
  assert.equal(hunks.length, 35, 'Later viewer hunk count changed');
  assert.equal(sha(JSON.stringify(hunks)),
    'b96cb50ad6ff5bf294b502d2377ea72046645bda400668413d98f01265dd2da0',
    'Later viewer hunks changed');
  const reverse = current.split('\n'), forward = prior.split('\n');
  for (const hunk of hunks.toReversed()) {
    assert.deepEqual(reverse.slice(hunk.newStart, hunk.newStart + hunk.added.length), hunk.added);
    reverse.splice(hunk.newStart, hunk.added.length, ...hunk.removed);
    assert.deepEqual(forward.slice(hunk.oldStart, hunk.oldStart + hunk.removed.length), hunk.removed);
    forward.splice(hunk.oldStart, hunk.removed.length, ...hunk.added);
  }
  assert.equal(reverse.join('\n'), prior, 'Whole 27 October viewer reconstructed');
  assert.equal(forward.join('\n'), current, 'Whole current viewer reconstructed');
  return prior;
}
