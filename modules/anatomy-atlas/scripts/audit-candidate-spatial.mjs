import { writeFile } from 'node:fs/promises';
import { candidateSpatialReport } from './candidate-spatial-report.mjs';
const report = await candidateSpatialReport({
  fetchSources: process.argv.includes('--fetch'),
});
await writeFile(
  'content/candidate-spatial-audit.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  JSON.stringify(
    {
      ...report.summary,
      flagged: report.comparisons
        .filter((c) => c.broadNearContact || c.exactSharedTriangles)
        .map((c) => ({
          file: c.file,
          name: c.name,
          role: c.role,
          verticesQuarterFraction:
            c.candidateVertices.thresholds[1].weightedFraction,
          centroidsQuarterFraction:
            c.candidateTriangleCentroids.thresholds[1].weightedFraction,
        })),
    },
    null,
    2,
  ),
);
