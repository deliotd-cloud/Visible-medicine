import fs from 'node:fs/promises';
import { supportingTopologyReport } from './supporting-topology-report.mjs';
const report = await supportingTopologyReport();
await fs.writeFile(
  'content/supporting-topology-audit.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  JSON.stringify(
    {
      sources: report.sources.map(({ id, topology }) => ({
        id,
        vertices: topology.exactUniqueVertices,
        components: topology.components.length,
        boundary: topology.boundaryEdges,
        nonManifoldEdges: topology.nonManifoldEdges,
        nonManifoldVertices: topology.nonManifoldVertices,
        winding: topology.inconsistentWindingEdges,
        closedOrientedManifold: topology.closedOrientedManifold,
      })),
      contacts: report.contacts.map(({ a, b, aToB, bToA }) => ({
        a,
        b,
        aVertexQuarter: aToB.vertices.thresholds[1].weightedFraction,
        aCentroidAreaQuarter:
          aToB.triangleCentroids.thresholds[1].weightedFraction,
        bVertexQuarter: bToA.vertices.thresholds[1].weightedFraction,
        bCentroidAreaQuarter:
          bToA.triangleCentroids.thresholds[1].weightedFraction,
      })),
      admitted: report.admitted,
    },
    null,
    2,
  ),
);
