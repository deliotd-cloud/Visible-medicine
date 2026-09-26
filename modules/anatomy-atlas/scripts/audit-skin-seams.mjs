import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {inspectExactPositionTopology} from './skin-seam-topology.mjs';
assert(process.argv.includes('--check'),'Verify the original audit offline with --check');
const {skinMesh:{vertices,faces}}=await import('./audit-skin-source.mjs');
const topology=inspectExactPositionTopology(vertices,faces);
const original=JSON.parse(await readFile('docs/skin-source-audit-20260926.json','utf8'));
assert.equal(topology.indexed.boundaryEdges,original.boundaryEdges);
assert.equal(topology.indexed.connectedComponents,original.indexedConnectedComponents);
assert.deepEqual(topology.indexed.componentVertexCounts,original.componentVertexCounts);
const result={schemaVersion:1,sourceSha256:original.sha256,topology,
  diagnosticOnly:true,meshModified:false,runtimeAdmission:false,clinicalApproval:false,
  limitations:['Exact-position vertex equivalence is a diagnostic only, not a repaired source mesh.',
    'No tolerance-based weld, self-intersection, vertex-manifold, solid-interior or anatomical validity claim.']};
const out='docs/skin-seam-screen-20260926.json',bytes=Buffer.from(JSON.stringify(result,null,2)+'\n');
if(process.argv.includes('--verify-output'))assert.deepEqual(bytes,await readFile(out));
else await writeFile(out,bytes,{flag:'wx'});
console.log(JSON.stringify({merged:topology.mergedVertexCount,indexedBoundaries:topology.indexed.boundaryEdges,
  exactBoundaries:topology.exactPosition.boundaryEdges,exactComponents:topology.exactPosition.connectedComponents,
  boundaryBounds:topology.exactPosition.boundaryBounds,nonManifoldEdges:topology.exactPosition.nonManifoldEdges,
  largestBoundaries:topology.exactPosition.boundaryComponents.slice(0,6)}));
