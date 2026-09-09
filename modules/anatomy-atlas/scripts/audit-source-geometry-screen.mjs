import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { archiveReader, parallelMap } from './bodyparts-archive.mjs';
import { loadSourceHolds } from './load-source-holds.mjs';
import {
  screenTargets,
  inspectSourceBytes,
  buildGeometryScreen,
  sha256,
} from './source-geometry-screen.mjs';

const context = await loadSourceHolds();
const targets = screenTargets(context);
const archives = new Map(
  await Promise.all(
    context.inventory.archives.map(async (evidence) => {
      const archive = await archiveReader(evidence.tree, evidence.url);
      const items = [...archive.entries]
        .filter(([name]) => name.endsWith('.obj'))
        .sort(([a], [b]) => a.localeCompare(b));
      assert.equal(
        items.length,
        evidence.entryCount,
        'Archive entry count changed',
      );
      assert.equal(
        sha256(JSON.stringify(items)),
        evidence.directorySha256,
        'Archive directory changed',
      );
      return [evidence.tree, archive];
    }),
  ),
);
const files = await parallelMap(targets, 4, async (target) => {
  const bytes = await archives.get(target.tree).get(target.file);
  return inspectSourceBytes(target, bytes, context.inventory);
});
const report = buildGeometryScreen(context, targets, files);
await writeFile(
  'content/source-geometry-screen.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report.summary, null, 2));
