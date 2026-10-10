// Source/notice consistency only. This does not establish upstream rights,
// artifact privacy, clinical approval, or permission to release a source path.
import assert from 'node:assert/strict';

export const bodyPartsCredit = 'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International';
export const bodyPartsLicence = 'https://creativecommons.org/licenses/by/4.0/';
const prefix = '/models/bodyparts3d/full-body/';
const sha = /^[a-f0-9]{64}$/;
const systems = ['skeleton', 'muscles', 'organs', 'nerves', 'vessels', 'connective'];
const labels = ['skeletal', 'muscular', 'organ', 'nervous-system', 'vascular', 'connective-tissue'];

export function summarizeFullBodyCredits(catalog) {
  assert.equal(catalog.sourceVersion, '4.0');
  assert.equal(catalog.license, 'CC-BY-4.0');
  assert.equal(catalog.credit, bodyPartsCredit);
  assert(Array.isArray(catalog.bundles) && catalog.bundles.length);
  assert(Array.isArray(catalog.structures) && catalog.structures.length);
  const bundles = new Map(), ids = new Set(), counts = Object.fromEntries(systems.map(s => [s, 0]));
  let bytes = 0;
  for (const bundle of catalog.bundles) {
    assert(typeof bundle.id === 'string' && /^[a-z0-9-]+$/.test(bundle.id));
    assert(!bundles.has(bundle.id), 'Duplicate bundle');
    assert.equal(bundle.url, `${prefix}${bundle.id}.glb`);
    assert(sha.test(bundle.sha256));
    assert(Number.isSafeInteger(bundle.bytes) && bundle.bytes > 0);
    assert(Number.isSafeInteger(bundle.structures) && bundle.structures > 0);
    bytes += bundle.bytes;
    assert(Number.isSafeInteger(bytes));
    bundles.set(bundle.id, {expected: bundle.structures, seen: 0});
  }
  for (const structure of catalog.structures) {
    assert(typeof structure.id === 'string' && structure.id && !ids.has(structure.id), 'Duplicate/missing structure');
    ids.add(structure.id);
    assert(systems.includes(structure.system), 'Unknown system');
    assert(bundles.has(structure.bundle), 'Missing bundle');
    assert.equal(structure.provenance.sourceVersion, '4.0');
    assert.equal(structure.provenance.license, 'CC-BY-4.0');
    bundles.get(structure.bundle).seen++;
    counts[structure.system]++;
  }
  for (const bundle of bundles.values()) assert.equal(bundle.seen, bundle.expected, 'Bundle membership count');
  const entries = catalog.structures.length;
  const summary = `The current version-4 full-body catalogue contains ${entries.toLocaleString('en-US')} selectable source representations in ${bundles.size} GLB bundles: ${systems.map((s, i) => `${counts[s]} ${labels[i]}`).join(', ')} entries.`;
  return {entries, bundles: bundles.size, bytes, systems: counts, summary};
}

export function verifyFullBodyCredits(catalog, html) {
  const inventory = summarizeFullBodyCredits(catalog);
  assert.equal(typeof html, 'string');
  assert(html.includes(`<p>${bodyPartsCredit}</p>`), 'Visible DBCLS credit missing');
  assert(html.includes(`href="${bodyPartsLicence}"`), 'CC BY 4.0 licence link missing');
  assert(html.includes('href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html"'), 'Official licence link missing');
  assert(html.includes('href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html"'), 'Official source link missing');
  assert(html.includes('href="full-body/catalog.json"'), 'Catalogue link missing');
  assert(html.includes(`<p id="full-body-current-inventory">${inventory.summary}</p>`), 'Visible current catalogue counts stale or missing');
  for (const disclosure of ['Source geometry was converted from OBJ to GLB', 'Colours were adapted for illustration', 'All anatomy remains unvalidated', 'No endorsement by the source institution is implied', 'Hosting quotas and provider charges are separate from asset licences'])
    assert(html.includes(disclosure), `Required existing disclosure missing: ${disclosure}`);
  assert(!/expanded library contains 924|partitioned into 73 regional\/system bundles/.test(html), 'Historical counts presented as current');
  return {...inventory, consistencyOnly: true, upstreamRightsProven: false,
    privacyCleared: false, sourceAdmission: false, clinicalApproval: false, deployment: false};
}
