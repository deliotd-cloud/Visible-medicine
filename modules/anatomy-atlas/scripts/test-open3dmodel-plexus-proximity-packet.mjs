import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import test from 'node:test';
import {buildMeasurements, persistAudit, pins, renderReport, verifyInputs} from './audit-open3dmodel-plexus-proximity.mjs';

const root = resolve(import.meta.dirname, '..');
const sourceDir = 'F:/VisibleMedicine/staging/20261003-plexus-conversion-v7';
const face = [[0, 1, 2]];
const object = (id, sourceName, z, extras = {}) => ({
  id, sourceName, core: false, groupedDivisions: false, sourceNamedRight: true,
  vertices: [[0, 0, z], [1, 0, z], [0, 1, z]], faces: face.map(row => [...row]), ...extras,
});
const scene = () => ({
  schemaVersion: 1, purpose: 'open3dmodel-plexus-source-review',
  sourceObjSha256: '1'.repeat(64), sourceInventorySha256: '2'.repeat(64), conversionReportSha256: '3'.repeat(64),
  units: 'unknown-source-units', coordinateFrame: 'unaltered-source-OBJ',
  registered: false, mirrored: false, clinicalApproved: false, admissions: 0, license: 'CC-BY-SA-4.0',
  objects: [
    {id: 'group', sourceName: 'Grouped <script>alert(1)</script>', core: true,
      groupedDivisions: true, sourceNamedRight: true,
      vertices: [[0,0,0],[1,0,0],[0,1,0],[0,0,10],[1,0,10],[0,1,10]],
      faces: [[0,1,2],[3,4,5]]},
    object('core', 'Other & core', 12, {core: true}),
    object('identical', 'Another name', 12),
    object('far', 'Far', 20),
  ],
  held: [{id: 'held', sourceName: 'Held object'}],
  contextObjects: [
    object('humerus', 'Humerus.r', 50, {role: 'bone-context'}),
    object('scapula', 'Scapula.r.', 60, {role: 'bone-context'}),
    object('clavicle', 'Clavicle.r', 70, {role: 'bone-context'}),
  ],
});

test('immutable inventory, conversion report and v7 scene are pinned; byte mutations refuse', async () => {
  const [inventoryText, reportText, sceneText] = await Promise.all([
    readFile(resolve(root, 'docs/open3dmodel-plexus-source-inventory.json'), 'utf8'),
    readFile(resolve(sourceDir, 'conversion-report.json'), 'utf8'),
    readFile(resolve(sourceDir, 'preview/scene.json'), 'utf8'),
  ]);
  const input = {inventoryText, reportText, sceneText};
  const verified = verifyInputs(input);
  assert.equal(verified.scene.objects.length, 42);
  assert.equal(verified.scene.held.length, 8);
  assert.equal(verified.scene.objects.filter(row => row.core).length, 15);
  assert.equal(verified.report.objects.length, 50);
  assert.equal(verified.scene.conversionReportSha256, pins.report);
  assert.equal(verified.scene.sourceInventorySha256, pins.inventory);
  for (const key of Object.keys(input)) {
    const altered = {...input, [key]: input[key] + ' '};
    assert.throws(() => verifyInputs(altered), /changed/);
  }
});

test('synthetic packet covers every unordered neural pair and retains unresolved identity', () => {
  const measurements = buildMeasurements(scene());
  assert.deepEqual(measurements.counts, {
    objects: 4, coreObjects: 2, heldObjects: 1, disconnectedObjects: 1, components: 5,
    objectPairs: 6, verifiedObjectPairs: 5, unresolvedObjectPairs: 1,
    groupedDivisionObjects: 1, groupedDivisionComponents: 2,
    groupedComponentComparisons: 2, unresolvedGroupedComparisons: 0,
  });
  assert.deepEqual(measurements.pairs.map(pair => [pair.idA, pair.idB]), [
    ['core','far'], ['core','group'], ['core','identical'],
    ['far','group'], ['far','identical'], ['group','identical'],
  ]);
  const unresolved = measurements.pairs.find(pair => pair.status === 'query-incomplete');
  assert.deepEqual([unresolved.idA, unresolved.idB], ['core', 'identical']);
  assert.equal(unresolved.witnessVerified, false);
  assert.match(unresolved.reason, /identity adjudication/);
  assert.equal(measurements.pairs.some(pair => /held|humerus|scapula|clavicle/.test(pair.idA + pair.idB)), false);
  assert.deepEqual(measurements.objects.find(row => row.id === 'group').components.map(row => row.sourceFaceIds), [[0], [1]]);
  assert.deepEqual(measurements.groupedComponents.map(row => row.componentIndex), [0, 1]);
  assert.deepEqual(measurements.groupedComponents.map(row => row.comparisons[0].otherId), ['core', 'core']);
  assert.deepEqual(measurements.groupedComponents.map(row => row.comparisons[0].sourceFaceIdA), [0, 1]);
  assert.equal(measurements.held.length, 1);
});

test('readable packet escapes source labels and keeps review limitations', async () => {
  const measurements = buildMeasurements(scene());
  const report = {
    purpose: 'open3dmodel-plexus-offline-proximity-review', units: 'unknown-source-units',
    admissions: 0, registered: false, clinicalApproved: false,
    credit: 'Source <img src=x onerror=alert(1)>', sceneSha256: pins.scene,
    conversionReportSha256: pins.report,
    limitations: ['No <script>injection</script> or anatomical threshold.'], ...measurements,
  };
  const html = renderReport(report);
  assert.match(html, /Grouped &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /Source &lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html, /<img src=x onerror|<script>injection|<script>alert/);
  assert.match(html, /No individual anatomical division is assigned/);
  assert.match(html, /Unresolved: identical source geometry requires identity adjudication/);
  assert.match(html, /Unknown source units/);
  assert.match(html, /href="proximity-report.json"/);
  assert.doesNotMatch(html, /href="https?:/);
  await assert.rejects(persistAudit({...report, admissions: 1}, {check: true}));
  // Check mode must reject this synthetic report against any real review output.
  await assert.rejects(persistAudit(report, {check: true}));
});
