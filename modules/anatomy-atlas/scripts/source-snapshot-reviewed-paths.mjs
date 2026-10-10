// Pure, opt-in syntax exception for three reviewed source names. This does not
// admit source, verify provenance evidence, or grant rights or clinical approval.
const SCHEMA = 'vm-reviewed-source-names/1';
const HEX40 = /^[0-9a-f]{40}$/;
const HEX64 = /^[0-9a-f]{64}$/;
const ALLOWED = new Map([
  ['app/regions/[region]/page.tsx', 'framework-region-route'],
  ['app/scene-recovery.tsx', 'renderer-recovery-code'],
  ['app/scene-recovery.css', 'renderer-recovery-code'],
]);
const PRIVATE = new WeakMap();

export class ReviewedPathPolicyError extends Error {
  constructor(code, detail) {
    super(`${code}: ${detail}`);
    this.name = 'ReviewedPathPolicyError';
    this.code = code;
  }
}

const fail = (code, detail) => { throw new ReviewedPathPolicyError(code, detail); };

// Inspect descriptors before reading values, so accessors and inherited fields
// cannot influence compilation. Null-prototype and ordinary data objects only.
function exactObject(value, name, keys) {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    fail('REVIEWED_SCHEMA', `${name}: expected plain object`);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null)
    fail('REVIEWED_SCHEMA', `${name}: unexpected prototype`);
  const actual = Reflect.ownKeys(value);
  if (actual.length !== keys.length || actual.some(key => typeof key !== 'string' || !keys.includes(key)))
    fail('REVIEWED_SCHEMA', `${name}: keys must be ${keys.join(', ')}`);
  const data = Object.create(null);
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value'))
      fail('REVIEWED_SCHEMA', `${name}.${key}: data property required`);
    data[key] = descriptor.value;
  }
  return data;
}

function exactArray(value, name) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype)
    fail('REVIEWED_SCHEMA', `${name}: expected plain array`);
  const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
  const length = lengthDescriptor?.value;
  if (!Number.isSafeInteger(length) || length < 1 || length > 3)
    fail('REVIEWED_SCHEMA', `${name}: one to three records required`);
  const actual = Reflect.ownKeys(value);
  if (actual.length !== length + 1 || actual.some(key =>
    key !== 'length' && (typeof key !== 'string' || !/^(?:0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)))
    fail('REVIEWED_SCHEMA', `${name}: dense array without extra keys required`);
  const result = [];
  for (let index = 0; index < length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !Object.hasOwn(descriptor, 'value'))
      fail('REVIEWED_SCHEMA', `${name}[${index}]: data property required`);
    result.push(descriptor.value);
  }
  return result;
}

const hash = (value, length, name) => {
  if (typeof value !== 'string' || !(length === 40 ? HEX40 : HEX64).test(value))
    fail('REVIEWED_SCHEMA', `${name}: lowercase hex required`);
  return value;
};
const positiveBytes = (value, name) => {
  if (!Number.isSafeInteger(value) || value <= 0) fail('REVIEWED_SCHEMA', `${name}: positive safe integer required`);
  return value;
};
const nonempty = (value, name) => {
  if (typeof value !== 'string' || !value.length || value.trim() !== value)
    fail('REVIEWED_SCHEMA', `${name}: nonempty trimmed string required`);
  return value;
};
const privateData = token => {
  const data = PRIVATE.get(token);
  if (!data) fail('REVIEWED_TOKEN', 'invalid reviewed path policy token');
  return data;
};

export function compileReviewedPathPolicy(envelope, expectedSourceCommit) {
  const input = exactObject(envelope, 'envelope', ['schema', 'sourceCommit', 'records']);
  if (input.schema !== SCHEMA) fail('REVIEWED_SCHEMA', 'unsupported schema');
  hash(expectedSourceCommit, 40, 'expectedSourceCommit');
  const sourceCommit = hash(input.sourceCommit, 40, 'sourceCommit');
  if (sourceCommit !== expectedSourceCommit)
    fail('REVIEWED_SOURCE_COMMIT', 'policy source commit differs from expected source commit');
  const records = new Map();
  for (const [index, candidate] of exactArray(input.records, 'records').entries()) {
    const row = exactObject(candidate, `records[${index}]`,
      ['path', 'role', 'purpose', 'sha256', 'gitBlob', 'bytes', 'proof']);
    const purpose = ALLOWED.get(row.path);
    if (!purpose || row.purpose !== purpose || row.role !== 'code')
      fail('REVIEWED_PATH', `records[${index}]: path, purpose or role not allowed`);
    if (records.has(row.path)) fail('REVIEWED_DUPLICATE_PATH', row.path);
    const proof = exactObject(row.proof, `records[${index}].proof`, ['id', 'revision', 'sha256']);
    const copy = Object.freeze({
      path: row.path,
      role: row.role,
      purpose: row.purpose,
      sha256: hash(row.sha256, 64, `records[${index}].sha256`),
      gitBlob: hash(row.gitBlob, 40, `records[${index}].gitBlob`),
      bytes: positiveBytes(row.bytes, `records[${index}].bytes`),
      proof: Object.freeze({
        id: nonempty(proof.id, `records[${index}].proof.id`),
        revision: nonempty(proof.revision, `records[${index}].proof.revision`),
        sha256: hash(proof.sha256, 64, `records[${index}].proof.sha256`),
      }),
    });
    records.set(copy.path, copy);
  }
  const token = Object.freeze(Object.create(null));
  PRIVATE.set(token, {sourceCommit, records});
  return token;
}

export const reviewedPolicySourceCommit = token => privateData(token).sourceCommit;

export function reviewedPathRecord(token, path) {
  const {records} = privateData(token);
  if (typeof path !== 'string') fail('REVIEWED_SCHEMA', 'path must be a string');
  return records.get(path);
}

export function reviewedDirectoryAllowed(token, path) {
  const {records} = privateData(token);
  if (typeof path !== 'string') fail('REVIEWED_SCHEMA', 'path must be a string');
  return path === 'app/regions/[region]' && records.has('app/regions/[region]/page.tsx');
}

export function verifyReviewedPathIdentity(token, row) {
  const {records} = privateData(token);
  const actual = exactObject(row, 'observed identity', ['path', 'sha256', 'gitBlob', 'bytes']);
  const reviewed = records.get(actual.path);
  if (!reviewed || actual.sha256 !== reviewed.sha256 || actual.gitBlob !== reviewed.gitBlob ||
      actual.bytes !== reviewed.bytes)
    fail('REVIEWED_IDENTITY_MISMATCH', 'observed identity does not match reviewed record');
  return reviewed;
}
