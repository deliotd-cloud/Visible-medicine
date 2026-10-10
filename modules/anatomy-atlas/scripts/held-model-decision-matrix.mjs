import { createHash } from 'node:crypto';

const CATALOG_PATH = 'public/models/bodyparts3d/full-body/catalog.json';
const SCOPE = 'Only the 19 live recovery-named version-4 bundles; not all Atlas assets or source release paths.';
const HEX = /^[0-9a-f]{64}$/;
const SHA = /^[0-9a-f]{40}$/;
const ARCHIVES = Object.freeze({
  isa: {
    url: 'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip',
    sha256: '40665852c49f218326590e204db91064a1ecfc3c6f8cbd7bbbcaac62c7cd409e',
    bytes: 142903898,
    etag: '"8848a5a-4dd48ec9df000"',
    lastModified: 'Wed, 22 May 2013 06:46:24 GMT',
    centralDirectorySha256: 'edde15c7c5f34b2b9743935fb3c1873cce3a9789164427ddf8343c879bcde96b',
    selectedLocalHeadersChecked: 184,
  },
  partof: {
    url: 'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_BP3D_4.0_obj_99.zip',
    sha256: '9fbc713fffeee924a5a657d9813d84d7eb957bded63adb854931dd5e3eb61c97',
    bytes: 64888505,
    etag: '"3de1eb9-4dd48e9fe8d00"',
    lastModified: 'Wed, 22 May 2013 06:45:40 GMT',
    centralDirectorySha256: '699958b22b8facffc7a939ddfd650737694e8887ef4df9f1c57bc9c221d16ad5',
    selectedLocalHeadersChecked: 67,
  },
});
const WITNESS_KEYS = ['schema', 'recordedAt', 'sourceVersion', 'license', 'credit', 'officialLicence', 'catalogSha256', 'scope', 'structures', 'archives', 'derivedBundles', 'selectedSources', 'evidence', 'verification', 'limits'];
const HOLD_KEYS = ['rightsAdmission', 'privacyAdmission', 'pathAdmission', 'authenticatedProof', 'buildClosure', 'restoreVerification', 'clinicalApproval'];

function fail(message) { throw new Error(`Held-model matrix: ${message}`); }
function keys(object, allowed, label) {
  if (!object || typeof object !== 'object' || Array.isArray(object)) fail(`${label} must be an object`);
  const unexpected = Object.keys(object).filter(key => !allowed.includes(key));
  if (unexpected.length) fail(`${label} has unknown field ${unexpected[0]}`);
}
function digest(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function asBytes(value, label) {
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) return value;
  fail(`${label} must be bytes`);
}
function parse(bytes, label) {
  try { return JSON.parse(Buffer.from(bytes).toString('utf8')); }
  catch { fail(`${label} is not valid JSON`); }
}
function hash(value, label) { if (typeof value !== 'string' || !HEX.test(value)) fail(`${label} must be lowercase SHA-256`); }
function size(value, label) { if (!Number.isSafeInteger(value) || value <= 0) fail(`${label} must be positive safe bytes`); }
function pathFor(id) { return `public/models/bodyparts3d/full-body/${id}.glb`; }

/**
 * Join cleared text metadata only. Inputs are raw witness/catalog bytes and a
 * caller-supplied Git commit identity; this function does not read asset bytes.
 */
export function createHeldModelDecisionMatrix(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(options)) ||
      Reflect.ownKeys(options).length !== 3 ||
      Reflect.ownKeys(options).some(key => !['sourceCommit', 'witnessBytes', 'catalogBytes'].includes(key) ||
        !Object.hasOwn(Object.getOwnPropertyDescriptor(options, key), 'value'))) fail('invalid options');
  const { sourceCommit, witnessBytes, catalogBytes } = options;
  if (typeof sourceCommit !== 'string' || !SHA.test(sourceCommit)) fail('sourceCommit must be a full lowercase Git SHA');
  const witnessInput = asBytes(witnessBytes, 'witnessBytes');
  const catalogInput = asBytes(catalogBytes, 'catalogBytes');
  const witness = parse(witnessInput, 'witness');
  const catalog = parse(catalogInput, 'catalog');
  keys(witness, WITNESS_KEYS, 'witness');
  if (witness.schema !== 'vm-bodyparts-source-reverification/1' || witness.scope !== SCOPE || witness.sourceVersion !== '4.0') fail('witness schema, scope or version changed');
  hash(witness.catalogSha256, 'witness catalogSha256');
  const catalogSha256 = digest(catalogInput);
  if (witness.catalogSha256 !== catalogSha256) fail('catalog hash mismatch');
  if (catalog.version !== 2 || catalog.sourceVersion !== witness.sourceVersion || catalog.license !== witness.license || catalog.credit !== witness.credit) fail('catalog provenance mismatch');
  if (witness.license !== 'CC-BY-4.0' || witness.officialLicence !== 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html' || typeof witness.credit !== 'string' || !witness.credit.includes('The Database Center for Life Science')) fail('source credit or licence changed');
  keys(witness.evidence, ['selectedSourceReceiptSha256', 'archiveDigestReceiptSha256', 'conditionalRangeRequests', 'selectedSourceTransferBytes', 'fullArchiveTransferBytes'], 'evidence');
  keys(witness.verification, ['selectedSourceHashesMatch', 'conditionalWholeArchiveStreams', 'rawArchivesRetained', 'sourceAdmission', 'privacyClearance', 'clinicalApproval', 'deliveredNoticeVerified'], 'verification');
  if (witness.verification.selectedSourceHashesMatch !== true || witness.verification.conditionalWholeArchiveStreams !== true || witness.verification.rawArchivesRetained !== false || witness.verification.sourceAdmission !== false || witness.verification.privacyClearance !== false || witness.verification.clinicalApproval !== false || witness.verification.deliveredNoticeVerified !== false) fail('witness verification or approval flags changed');
  keys(witness.archives, Object.keys(ARCHIVES), 'archives');
  if (Object.keys(witness.archives).length !== 2) fail('archive identities changed');
  for (const [tree, expected] of Object.entries(ARCHIVES)) {
    const archive = witness.archives[tree];
    keys(archive, ['url', 'sha256', 'bytes', 'etag', 'lastModified', 'centralDirectorySha256', 'selectedLocalHeadersChecked', 'retainedArchive'], `${tree} archive`);
    for (const [field, value] of Object.entries(expected)) if (archive[field] !== value) fail(`${tree} archive ${field} changed`);
    if (archive.retainedArchive !== false) fail(`${tree} archive receipt malformed`);
    if (catalog.sources?.[tree] !== expected.url) fail(`${tree} catalog source URL mismatch`);
  }
  if (!Array.isArray(witness.derivedBundles) || witness.derivedBundles.length !== 19 || !Array.isArray(catalog.bundles) || !Array.isArray(catalog.structures) || !Array.isArray(witness.selectedSources)) fail('bundle or source arrays missing or wrong size');
  const recovery = catalog.bundles.filter(bundle => typeof bundle.id === 'string' && bundle.id.endsWith('-recovery'));
  if (recovery.length !== 19) fail('catalog recovery scope changed');
  const catalogBundles = new Map();
  for (const bundle of recovery) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*-recovery$/.test(bundle.id)) fail('unsafe bundle identity');
    if (catalogBundles.has(bundle.id)) fail('duplicate catalog bundle id');
    if (bundle.url !== `/models/bodyparts3d/full-body/${bundle.id}.glb`) fail('catalog bundle path changed');
    hash(bundle.sha256, 'catalog bundle hash'); size(bundle.bytes, 'catalog bundle bytes');
    catalogBundles.set(bundle.id, bundle);
  }
  const derived = new Map();
  const seenPaths = new Set();
  for (const bundle of witness.derivedBundles) {
    keys(bundle, ['id', 'path', 'sha256', 'bytes'], 'derived bundle');
    if (!catalogBundles.has(bundle.id) || derived.has(bundle.id) || bundle.path !== pathFor(bundle.id) || seenPaths.has(bundle.path)) fail('missing, extra or duplicate derived bundle path');
    hash(bundle.sha256, 'derived bundle hash'); size(bundle.bytes, 'derived bundle bytes');
    const counterpart = catalogBundles.get(bundle.id);
    if (bundle.sha256 !== counterpart.sha256 || bundle.bytes !== counterpart.bytes) fail('derived bundle hash or byte mismatch');
    derived.set(bundle.id, bundle); seenPaths.add(bundle.path);
  }
  if (derived.size !== catalogBundles.size) fail('missing derived bundle');
  const selected = new Map();
  for (const member of witness.selectedSources) {
    keys(member, ['key', 'archiveEntry', 'sha256', 'bytes', 'crc32'], 'selected source');
    const match = /^(isa|partof)\/(FJ[0-9]+M?)$/.exec(member.key);
    if (!match || selected.has(member.key)) fail('malformed or duplicate selected source identity');
    const [, tree, file] = match;
    if (member.archiveEntry !== `${tree}_BP3D_4.0_obj_99/${file}.obj`) fail('archive member identity changed');
    hash(member.sha256, 'selected source hash'); size(member.bytes, 'selected source bytes');
    if (!/^[0-9a-f]{8}$/.test(member.crc32)) fail('selected source CRC malformed');
    selected.set(member.key, member);
  }
  const grouped = new Map([...derived.keys()].map(id => [id, { structureIds: [], sourceKeys: [] }]));
  const seenStructures = new Set();
  const catalogStructureIds = new Set();
  const seenMembers = new Set();
  for (const structure of catalog.structures) {
    if (typeof structure.id !== 'string' || !structure.id || catalogStructureIds.has(structure.id)) fail('duplicate catalog structure or malformed identity');
    catalogStructureIds.add(structure.id);
    if (!grouped.has(structure.bundle)) continue;
    if (typeof structure.id !== 'string' || seenStructures.has(structure.id) || !['isa', 'partof'].includes(structure.sourceTree) || !Array.isArray(structure.sources) || !structure.sources.length) fail('catalog structure identity malformed or duplicate');
    if (structure.provenance?.method !== 'licensed-source-mesh' || structure.provenance?.license !== witness.license || structure.provenance?.sourceVersion !== witness.sourceVersion || structure.provenance?.recovered !== true) fail('catalog structure provenance mismatch');
    seenStructures.add(structure.id);
    const group = grouped.get(structure.bundle);
    group.structureIds.push(structure.id);
    for (const source of structure.sources) {
      const key = `${structure.sourceTree}/${source.file}`;
      if (!selected.has(key) || seenMembers.has(key) || selected.get(key).sha256 !== source.sha256) fail('source member missing, duplicate or hash changed');
      seenMembers.add(key); group.sourceKeys.push(key);
    }
  }
  if (seenMembers.size !== selected.size || seenStructures.size !== witness.structures || seenStructures.size !== 159 || seenMembers.size !== 251) fail('selected source membership or structure count changed');
  const gates = Object.fromEntries(HOLD_KEYS.map(key => [key, 'pending independent review']));
  const rows = [...derived.values()].sort((a, b) => a.path.localeCompare(b.path, 'en')).map(bundle => {
    const group = grouped.get(bundle.id);
    const counterpart = catalogBundles.get(bundle.id);
    if (!group.structureIds.length || group.structureIds.length !== counterpart.structures) fail('bundle structure count changed');
    return {
      id: bundle.id, path: bundle.path, sha256: bundle.sha256, bytes: bundle.bytes,
      catalogPath: CATALOG_PATH, catalogSha256, catalogBundleId: counterpart.id,
      structureCount: group.structureIds.length, sourceObjCount: group.sourceKeys.length,
      structureIds: group.structureIds.sort(), sourceObjKeys: group.sourceKeys.sort(),
      gates: { ...gates },
    };
  });
  return {
    schema: 'vm-held-model-decision-matrix/1', sourceCommit,
    inputs: { witnessSha256: digest(witnessInput), catalogPath: CATALOG_PATH, catalogSha256 },
    scope: SCOPE, rowCount: rows.length, structureCount: seenStructures.size, sourceObjCount: seenMembers.size,
    claimedSourceProvenance: { sourceVersion: witness.sourceVersion, licence: witness.license, credit: witness.credit, officialLicence: witness.officialLicence, archiveSha256: Object.fromEntries(Object.entries(ARCHIVES).map(([tree, entry]) => [tree, entry.sha256])) },
    obligations: ['Preserve BodyParts3D/DBCLS attribution and CC BY 4.0 licence link.', 'Indicate adaptations in distributions and exports.', 'Do not impose restrictions on recipients exercising CC BY 4.0 rights to covered assets.'],
    gates: { ...gates }, rows,
    sourceBackupAdmitted: false, rightsOrPrivacyGranted: false, clinicalApproval: false,
    assetBytesVerified: false, authenticatedEvidence: false, pathPolicyModified: false,
    limitations: ['Witness and catalog inspection support claimed lineage only.', 'Caller-supplied commit and witness claims are not authenticated by this pure join.', 'No GLB, OBJ or archive asset bytes were verified by this matrix.', 'No clinical approval, rights admission or privacy clearance is granted.'],
  };
}
