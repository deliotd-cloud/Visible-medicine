import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { cache } from './bodyparts-archive.mjs';
import { loadSourceHolds } from './load-source-holds.mjs';
import {
  screenTargets,
  inspectSourceBytes,
  buildGeometryScreen,
  sourceKey,
  sha256,
} from './source-geometry-screen.mjs';

const context = await loadSourceHolds();
const targets = screenTargets(context);
const reportBytes = await readFile('content/source-geometry-screen.json');
const report = JSON.parse(reportBytes);
let checks = 0;
const same = (a, b, message) => {
  checks++;
  assert.deepEqual(a, b, message);
};
const rejects = (fn, message) => {
  checks++;
  assert.throws(fn, message);
};
same(
  sha256(reportBytes),
  '80a31dc88bc8e85561e5f3702b7697485ea547a4a85c7b3264ceb24291c66cd7',
  'Initial 52-file evidence changed; review a new dated audit rather than silently replacing it',
);
const files = report.files.map(
  ({ sameTreeAliases, exactGeometryMatches, displayedBy, admitted, ...file }) =>
    file,
);
same(
  buildGeometryScreen(context, targets, files),
  report,
  'Report must be reproducible from pinned evidence',
);
same(report.summary, {
  evaluatedFiles: 52,
  verifiedSourceBytes: 11312418,
  heldFiles: 48,
  previouslyUnfingerprintedHeldFiles: 47,
  candidateDefinitions: 3,
  candidateFiles: 4,
  displayedSourceFilesScreened: 1674,
  indexedFingerprintsScreened: 2819,
  candidateFilesWithExactHeldOrDisplayedMatch: 0,
  heldFilesWithExactDisplayedMatch: 1,
  admissions: 0,
});
same(
  report.candidates.every(
    (c) =>
      !c.admissionApproved &&
      c.decision ===
        'adjacency-endpoints-and-anatomical-extent-review-required',
  ),
  true,
);
same(report.clinicalValidation, false);
same(report.admissionsChanged, false);
same(
  report.files
    .filter(
      (f) =>
        f.heldBy.length &&
        f.exactGeometryMatches.some((m) => m.displayedBy.length),
    )
    .map((f) => ({
      key: sourceKey(f),
      matches: f.exactGeometryMatches.filter((m) => m.displayedBy.length),
    })),
  [
    {
      key: 'partof/FJ1737',
      matches: [
        {
          tree: 'isa',
          file: 'FJ1737',
          heldBy: [],
          displayedBy: [
            'vm:anatomy:body:spine:midline:space:central-canal-of-spinal-cord',
          ],
        },
      ],
    },
  ],
);
same(
  report.files
    .filter((f) => f.candidateFor.length)
    .map((f) => ({
      file: f.file,
      hash: f.sha256,
      components: f.topology.components.length,
      closed: f.topology.closedOrientedManifold,
      negative: f.sourceXDistribution.negative > 0,
      positive: f.sourceXDistribution.positive > 0,
    })),
  [
    {
      file: 'FJ1319',
      hash: '7f45ad84f0874a8aeb62085affb9e9303057bea8b46068cc0b3e7e341a1258e7',
      components: 2,
      closed: true,
      negative: false,
      positive: true,
    },
    {
      file: 'FJ1370',
      hash: '8e8853c389c874fa12b5db73c008755eb5a98a3fe9ce7457757c809ef0c9ded9',
      components: 2,
      closed: true,
      negative: true,
      positive: false,
    },
    {
      file: 'FJ1674',
      hash: '202680975274f9b744dbfb3cae561f0d4a63f53c35fe0c00702b62fe9b9c5fa5',
      components: 1,
      closed: true,
      negative: true,
      positive: false,
    },
    {
      file: 'FJ1674M',
      hash: 'a4fbf6ec7035f2db91998bbe660209a9af4ca6070136bda0c10ef5c14cc11bac',
      components: 1,
      closed: true,
      negative: false,
      positive: true,
    },
  ],
);
for (const file of report.files) {
  same(file.admitted, false);
  same(
    Object.values(file.sourceXDistribution).reduce((n, count) => n + count, 0),
    file.vertices,
  );
  same(file.topology === null, file.candidateFor.length === 0);
  same(
    file.bounds.min.every(
      (value, axis) => Number.isFinite(value) && value <= file.bounds.max[axis],
    ),
    true,
  );
}

// Fail closed on missing/altered evidence; absence of a match never grants admission.
rejects(
  () => buildGeometryScreen(context, targets, files.slice(1)),
  /Missing\/reordered/,
);
rejects(
  () => buildGeometryScreen(context, targets, [...files].reverse()),
  /Missing\/reordered/,
);
for (const field of [
  'tree',
  'file',
  'bytes',
  'crc32',
  'heldBy',
  'candidateFor',
  'sha256',
  'geometrySha256',
]) {
  const changed = structuredClone(files);
  changed[0][field] = null;
  rejects(() => buildGeometryScreen(context, targets, changed));
}
const missing = structuredClone(context.inventory);
missing.assets = missing.assets.filter(
  (a) => sourceKey(a) !== sourceKey(targets[0]),
);
rejects(() => screenTargets({ ...context, inventory: missing }), /Every held/);
const renamed = structuredClone(context.records);
renamed.find((r) => r.tree === 'isa' && r.id === 'FMA7041').name =
  'left short ciliary nerve';
rejects(() => screenTargets({ ...context, records: renamed }));
const split = structuredClone(context.records);
split.find((r) => r.tree === 'isa' && r.id === 'FMA7041').files.pop();
rejects(() => screenTargets({ ...context, records: split }), /Do not split/);
const noRenderedFingerprints = structuredClone(context.inventory);
noRenderedFingerprints.assets.forEach((a) => {
  a.geometrySha256 = null;
});
rejects(
  () =>
    buildGeometryScreen(
      { ...context, inventory: noRenderedFingerprints },
      targets,
      files,
    ),
  /coverage is incomplete/,
);
for (const mode of ['held', 'displayed']) {
  const changed = structuredClone(files);
  const candidate = changed.find((f) => f.file === 'FJ1319');
  candidate.geometrySha256 =
    mode === 'held'
      ? changed.find((f) => f.heldBy.length).geometrySha256
      : context.inventory.assets.find(
          (a) =>
            a.tree === context.catalog.structures[0].sourceTree &&
            a.file === context.catalog.structures[0].sources[0].file,
        ).geometrySha256;
  const result = buildGeometryScreen(context, targets, changed);
  same(
    result.candidates[0].decision,
    'exact-held-or-displayed-match-requires-adjudication',
  );
  same(result.summary.admissions, 0);
  same(
    result.candidates.every((c) => c.admissionApproved === false),
    true,
  );
}

let rawFiles = 0;
if (process.argv.includes('--raw')) {
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i],
      bytes = await readFile(
        path.join(cache, target.tree, target.file + '.obj'),
      );
    same(
      inspectSourceBytes(target, bytes, context.inventory),
      files[i],
      'Exact cached source bytes/topology must reproduce the report',
    );
    rejects(
      () => inspectSourceBytes(target, bytes.subarray(1), context.inventory),
      /size/,
    );
    const corrupt = Buffer.from(bytes);
    corrupt[0] ^= 1;
    rejects(
      () => inspectSourceBytes(target, corrupt, context.inventory),
      /CRC/,
    );
    rawFiles++;
  }
}
console.log(
  JSON.stringify({
    checks,
    rawFiles,
    files: report.summary.evaluatedFiles,
    admissions: 0,
    clinicalValidation: false,
  }),
);
