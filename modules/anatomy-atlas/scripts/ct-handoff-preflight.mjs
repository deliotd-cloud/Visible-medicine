/** Offline CT-to-Atlas metadata preflight. This is not a release or spatial gate. */
import { createHash } from 'node:crypto';
import { readFile, mkdir, lstat, realpath, open } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SHA = /^[a-f0-9]{64}$/;
const SCHEMA = 'elivion.cth.annotations.draft.v0.2';
const RELEASE = 'NOT_FOR_PUBLICATION';
const CROSSWALK = Object.freeze([
  ['cth.bst.midbrain', 'vm:anatomy:body:head-neck:midline:organ:midbrain'],
  ['cth.bst.pons', 'vm:anatomy:body:head-neck:midline:organ:pons'],
  ['cth.bst.medulla_oblongata', 'vm:anatomy:body:head-neck:midline:organ:medulla-oblongata'],
]);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = path.join(ROOT, 'public', 'models', 'bodyparts3d', 'brainstem', 'catalog.json');
const OUTPUT_DIR = path.join(ROOT, '.local', 'ct-handoff');

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const validSha = value => typeof value === 'string' && SHA.test(value);
const parse = bytes => JSON.parse(Buffer.from(bytes).toString('utf8').replace(/^\uFEFF/, ''));
const date = value => {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d\d)-(\d\d)(?:T\d\d:\d\d:\d\d(?:\.\d+)?Z)?$/.exec(value);
  if (!match || Number.isNaN(Date.parse(value))) return false;
  const parsed = new Date(value);
  return parsed.getUTCFullYear() === Number(match[1]) && parsed.getUTCMonth() + 1 === Number(match[2]) && parsed.getUTCDate() === Number(match[3]);
};
const recordId = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value);

function sourcePins(item) {
  if (!object(item) || !Array.isArray(item.sources) || item.sources.length === 0) return null;
  const pins = [];
  const seen = new Set();
  for (const source of item.sources) {
    if (!object(source) || typeof source.file !== 'string' || !/^[A-Z]{2}\d{4,}$/.test(source.file) || !validSha(source.sha256)) return null;
    if (seen.has(source.file)) return null;
    seen.add(source.file);
    pins.push({ sourceId: source.file, sha256: source.sha256 });
  }
  return pins;
}

/**
 * Inspect only supplied JSON bytes. No geometry file is opened or resolved.
 * Top-level source integrity failures throw; per-code concerns remain held rows.
 */
export function inspectCtHandoff(stateBytes, annotationBytes, catalogBytes) {
  const state = parse(stateBytes);
  const annotation = parse(annotationBytes);
  const catalog = parse(catalogBytes);
  if (!object(state) || !validSha(state.annotation_sha256) || state.annotation_sha256 !== sha(annotationBytes)) throw new Error('ANNOTATION_HASH_MISMATCH');
  if (!object(annotation) || annotation.schema !== SCHEMA || !object(annotation.annotations)) throw new Error('ANNOTATION_SCHEMA_INVALID');
  if (state.release !== RELEASE || annotation.release !== RELEASE) throw new Error('RELEASE_STATE_INVALID');
  if (typeof annotation.revision !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(annotation.revision)) throw new Error('ANNOTATION_REVISION_INVALID');

  const rows = CROSSWALK.map(([atlasCode, atlasId]) => {
    const reasons = [];
    const warnings = [];
    const entry = annotation.annotations[atlasCode];
    const geometry = object(entry) && object(entry.geometry) ? entry.geometry : null;
    const provenance = object(entry) && object(entry.provenance) ? entry.provenance : null;
    const acceptance = provenance && object(provenance.whole_entry_acceptance) ? provenance.whole_entry_acceptance : null;
    if (!object(entry)) reasons.push('ANNOTATION_MISSING');
    else {
      if (entry.atlas_code !== atlasCode) reasons.push('ATLAS_CODE_MISMATCH');
      if (entry.status !== 'USER_ACCEPTED' || entry.approved !== true) reasons.push('ACCEPTANCE_NOT_RECORDED');
      if (!geometry || geometry.complete_regional_segmentation !== true) reasons.push('REGIONAL_SEGMENTATION_INCOMPLETE');
      if (!geometry || geometry.type !== 'binary_mask' || !validSha(geometry.sha256)) reasons.push('GEOMETRY_FINGERPRINT_INVALID');
      if (!acceptance || !recordId(acceptance.record_id) || !date(acceptance.date) || !geometry || acceptance.geometry_sha256 !== geometry.sha256 || acceptance.geometry_unchanged !== true || acceptance.smoothing_applied !== false) reasons.push('WHOLE_ENTRY_ACCEPTANCE_INVALID');
      if (provenance && Object.hasOwn(provenance, 'current_mask_review_status') && provenance.current_mask_review_status !== 'USER_ACCEPTED') warnings.push('LEGACY_BOUNDARY_STATUS_DIFFERS');
    }

    const structures = object(catalog) && Array.isArray(catalog.structures) ? catalog.structures.filter(item => object(item) && item.id === atlasId) : [];
    const selected = object(catalog) && Array.isArray(catalog.selectableIds) && catalog.selectableIds.includes(atlasId);
    const pins = structures.length === 1 ? sourcePins(structures[0]) : null;
    if (structures.length !== 1 || !pins) reasons.push('CATALOG_STRUCTURE_INVALID');
    if (!selected) reasons.push('CATALOG_NOT_SELECTABLE');
    const geometrySha256 = validSha(geometry?.sha256) ? geometry.sha256 : null;
    const acceptanceSha256 = acceptance ? sha(Buffer.from(JSON.stringify(acceptance))) : null;
    const row = {
      atlasCode, atlasId,
      correspondence: 'ADVISORY_NAME_CORRESPONDENCE',
      status: reasons.length ? 'HELD' : 'RECORDED_ACCEPTANCE_ONLY',
      holdReasons: reasons,
      warnings,
      geometrySha256,
      acceptanceSha256,
      catalogSources: pins ?? [],
      candidateBindingSha256: sha(Buffer.from(JSON.stringify([sha(annotationBytes), annotation.revision, atlasCode, atlasId, geometrySha256, acceptanceSha256, sha(catalogBytes), pins]))),
    };
    return row;
  });

  return {
    schema: 'vm.ct-handoff-preflight.v1',
    release: RELEASE,
    annotationSchema: SCHEMA,
    annotationRevision: annotation.revision,
    annotationSha256: sha(annotationBytes),
    stateSha256: sha(stateBytes),
    catalogSha256: sha(catalogBytes),
    claims: {
      acceptance: 'RECORDED_METADATA_ONLY',
      geometryInspected: false,
      exactApprovedLink: false,
      spatialPermission: false,
      publicationPermission: false,
      clinicalSignoff: false,
    },
    summary: { candidates: rows.length, recordedAcceptance: rows.filter(row => row.status === 'RECORDED_ACCEPTANCE_ONLY').length, held: rows.filter(row => row.status === 'HELD').length },
    candidates: rows,
  };
}

async function ensureOutputDirectory() {
  const actualRoot = await realpath(ROOT);
  for (const dir of [path.join(ROOT, '.local'), OUTPUT_DIR]) {
    try { await mkdir(dir); } catch (error) { if (error.code !== 'EEXIST') throw error; }
    const stat = await lstat(dir);
    if (stat.isSymbolicLink() || !stat.isDirectory() || path.relative(actualRoot, await realpath(dir)).startsWith('..')) throw new Error('OUTPUT_DIRECTORY_INVALID');
  }
}

export function validateCliPaths(statePath, outPath) {
  if (typeof statePath !== 'string' || !path.isAbsolute(statePath) || path.extname(statePath).toLowerCase() !== '.json') throw new Error('STATE_PATH_INVALID');
  if (typeof outPath !== 'string' || !path.isAbsolute(outPath) || path.dirname(path.resolve(outPath)) !== OUTPUT_DIR || path.basename(outPath) === '.' || path.basename(outPath) === '..') throw new Error('OUTPUT_PATH_INVALID');
}

async function runCli(args) {
  if (args.length !== 4 || args[0] !== '--state' || args[2] !== '--out') throw new Error('USAGE_INVALID');
  const statePath = args[1];
  const outPath = args[3];
  validateCliPaths(statePath, outPath);
  await ensureOutputDirectory();
  const stateBytes = await readFile(statePath);
  if (stateBytes.length > 20 * 1024 * 1024) throw new Error('STATE_TOO_LARGE');
  const state = parse(stateBytes);
  if (!object(state) || typeof state.annotation_json !== 'string' || !path.isAbsolute(state.annotation_json) || path.extname(state.annotation_json).toLowerCase() !== '.json') throw new Error('ANNOTATION_PATH_INVALID');
  const annotationBytes = await readFile(state.annotation_json);
  if (annotationBytes.length > 20 * 1024 * 1024) throw new Error('ANNOTATION_TOO_LARGE');
  const catalogBytes = await readFile(CATALOG);
  const report = inspectCtHandoff(stateBytes, annotationBytes, catalogBytes);
  if (sha(await readFile(statePath)) !== sha(stateBytes)) throw new Error('STATE_CHANGED');
  if (sha(await readFile(state.annotation_json)) !== sha(annotationBytes)) throw new Error('ANNOTATION_CHANGED');
  if (sha(await readFile(CATALOG)) !== sha(catalogBytes)) throw new Error('CATALOG_CHANGED');
  const handle = await open(outPath, 'wx', 0o600);
  try { await handle.writeFile(`${JSON.stringify(report, null, 2)}\n`); } finally { await handle.close(); }
  console.log(JSON.stringify(report.summary));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli(process.argv.slice(2)).catch(error => {
    const safe = /^[A-Z_]+$/.test(error.message) ? error.message : 'PREFLIGHT_FAILED';
    console.error(safe);
    process.exitCode = 1;
  });
}
