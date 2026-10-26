import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { respondWithEducationMediaObject } from '../lib/education-media-response.ts';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const privateKey = 'education-media/synthetic/private-object';
const secret = 'SECRET-SOURCE-REVISION-AND-PROVIDER-DETAIL';

function fixture() {
  // Opaque synthetic bytes: deliberately neither a scan nor a decodable image.
  const bytes = new TextEncoder().encode('synthetic opaque Education object');
  const assessmentHash = hash('synthetic frozen assessment');
  const publicationHash = hash('synthetic case publication');
  const request = {
    actorId: 'edu:synthetic-learner', assessmentVersionId: 'assessment-v1',
    assessmentIntegrityHash: assessmentHash, caseId: 'case-1', objectId: 'object-1',
  };
  const series = {
    studyInstanceUid: '2.25.1', seriesInstanceUid: '2.25.2',
    frameOfReferenceUid: '2.25.3', sopInstanceUids: ['2.25.4'], plane: 'axial',
  };
  const assessment = {
    id: 'assessment-v1', integrityHash: assessmentHash,
    manifest: {
      product: 'Visible Medicine', intendedPurpose: 'education-only',
      workbook: { id: 'workbook-1' },
      cases: [{ id: 'case-1', version: 1, publicationHash,
        media: { kind: 'dicom', series: [series] } }],
    },
  };
  const binding = {
    assessmentVersionId: request.assessmentVersionId,
    assessmentIntegrityHash: assessmentHash,
    caseId: request.caseId, caseVersion: 1, casePublicationHash: publicationHash,
    sourceId: 'source-1', sourceRevision: 'source-r1', clearanceRevision: 'clearance-r1',
    objectId: request.objectId, objectKey: privateKey, sha256: hash(bytes),
    byteLength: bytes.byteLength, contentType: 'application/dicom',
    representation: 'dicom-instance', studyInstanceUid: series.studyInstanceUid,
    seriesInstanceUid: series.seriesInstanceUid,
    frameOfReferenceUid: series.frameOfReferenceUid, sopInstanceUid: series.sopInstanceUids[0],
  };
  const clearance = {
    sourceId: binding.sourceId, sourceRevision: binding.sourceRevision,
    clearanceRevision: binding.clearanceRevision, state: 'cleared',
    privacyCleared: true, commercialUseCleared: true,
    objectSha256s: [binding.sha256],
  };
  const calls = [];
  const dependencies = {
    async loadVerifiedAssessment(version) { calls.push('assessment'); assert.equal(version, request.assessmentVersionId); return assessment; },
    async authorizeCase(actor, workbook, caseId) {
      calls.push('access'); assert.deepEqual([actor, workbook, caseId], [request.actorId, 'workbook-1', request.caseId]); return true;
    },
    async loadBinding(version, caseId, objectId) {
      calls.push('binding'); assert.deepEqual([version, caseId, objectId], [request.assessmentVersionId, request.caseId, request.objectId]); return binding;
    },
    async loadClearance(source, revision) {
      calls.push('clearance'); assert.deepEqual([source, revision], [binding.sourceId, binding.sourceRevision]); return clearance;
    },
    async readObject(key, cap) { calls.push('object'); assert.equal(key, privateKey); assert.equal(cap, bytes.byteLength); return bytes; },
  };
  return { bytes, request, assessment, binding, clearance, calls, dependencies };
}

function assertPrivate(response, status) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('pragma'), 'no-cache');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('location'), null);
  assert.equal(response.headers.get('accept-ranges'), null);
  assert.equal(response.headers.get('content-range'), null);
  for (const [name, value] of response.headers) {
    assert(!`${name}:${value}`.includes(privateKey));
    assert(!`${name}:${value}`.includes('source-r1'));
    assert(!`${name}:${value}`.includes(requestIdMarker));
  }
}
const requestIdMarker = 'assessment-v1';

async function refused(f, status) {
  const response = await respondWithEducationMediaObject(f.request, f.dependencies);
  assertPrivate(response, status);
  assert.match(response.headers.get('content-type'), /^text\/plain/);
  const body = await response.text();
  assert.equal(body, 'Protected Education images are unavailable for this request.');
  for (const forbidden of [privateKey, 'source-r1', 'assessment-v1', secret, 'synthetic opaque Education object'])
    assert(!body.includes(forbidden));
}

test('verified object reaches HTTP only after complete read and two live rechecks', async () => {
  const f = fixture();
  const expected = new Uint8Array(f.bytes);
  const response = await respondWithEducationMediaObject(f.request, f.dependencies);
  assertPrivate(response, 200);
  assert.equal(response.headers.get('content-type'), 'application/dicom');
  f.bytes.fill(0); // Mutate the provider buffer BEFORE consuming the response.
  const body = new Uint8Array(await response.arrayBuffer());
  assert.deepEqual(body, expected);
  assert.deepEqual(f.calls, ['assessment', 'access', 'binding', 'clearance', 'object', 'binding', 'clearance', 'access']);
  assert.notDeepEqual(body, f.bytes);
});

test('malformed request is 400 before any trusted provider call', async () => {
  const f = fixture(); f.request.objectId = '../private';
  await refused(f, 400); assert.deepEqual(f.calls, []);
});

test('foreign case or absent case access is 404 before object access', async () => {
  const foreign = fixture(); foreign.request.caseId = 'case-foreign';
  // The verifier must refuse a case absent from the frozen manifest.
  foreign.dependencies.loadVerifiedAssessment = async () => foreign.assessment;
  await refused(foreign, 404); assert(!foreign.calls.includes('object'));
  const denied = fixture(); denied.dependencies.authorizeCase = async () => false;
  await refused(denied, 404); assert(!denied.calls.includes('object'));
});

test('stale assessment or case revision and absent binding are 404', async () => {
  const staleAssessment = fixture(); staleAssessment.request.assessmentIntegrityHash = hash('other');
  await refused(staleAssessment, 404); assert(!staleAssessment.calls.includes('object'));
  const staleCase = fixture(); staleCase.binding.caseVersion = 2;
  await refused(staleCase, 404); assert(!staleCase.calls.includes('object'));
  const absent = fixture(); absent.dependencies.loadBinding = async () => null;
  await refused(absent, 404); assert(!absent.calls.includes('object'));
  const missingObject = fixture(); missingObject.dependencies.readObject = async () => null;
  await refused(missingObject, 404);
});

test('uncleared or changed mid-read clearance gives only generic 404', async () => {
  const notCleared = fixture(); notCleared.clearance.privacyCleared = false;
  await refused(notCleared, 404); assert(!notCleared.calls.includes('object'));
  const changed = fixture(); let reads = 0;
  changed.dependencies.loadClearance = async () => {
    reads++; return { ...changed.clearance, state: reads === 1 ? 'cleared' : 'revoked' };
  };
  await refused(changed, 404); assert.equal(reads, 2); assert(changed.calls.includes('object'));
});

test('mid-read access revocation gives generic 404 after object was buffered', async () => {
  const f = fixture(); let reads = 0;
  f.dependencies.authorizeCase = async () => ++reads === 1;
  await refused(f, 404); assert.equal(reads, 2); assert(f.calls.includes('object'));
});

test('short, oversized or changed-hash object gives generic 503 and no bytes', async () => {
  for (const kind of ['short', 'oversized', 'changed-hash']) {
    const f = fixture();
    const returned = kind === 'short' ? new Uint8Array(1)
      : kind === 'oversized' ? new Uint8Array(f.bytes.byteLength + 1)
      : new Uint8Array(f.bytes);
    if (kind === 'changed-hash') returned[0] ^= 1;
    f.dependencies.readObject = async () => returned;
    await refused(f, 503);
  }
});

test('provider exception and unknown error give generic 503 without metadata', async () => {
  const provider = fixture(); provider.dependencies.readObject = async () => { throw Error(secret + privateKey); };
  await refused(provider, 503);
  const unknown = fixture(); unknown.dependencies.loadVerifiedAssessment = async () => { throw Error(secret); };
  await refused(unknown, 503);
});

test('no Response resolves while final post-read clearance is pending', async () => {
  const f = fixture(); let release;
  const pending = new Promise(resolve => { release = resolve; });
  let clearanceReads = 0, enteredFinal;
  const finalEntered = new Promise(resolve => { enteredFinal = resolve; });
  f.dependencies.loadClearance = async () => {
    if (++clearanceReads === 2) { enteredFinal(); await pending; }
    return f.clearance;
  };
  let settled = false;
  const responsePromise = respondWithEducationMediaObject(f.request, f.dependencies).then(value => {
    settled = true; return value;
  });
  await finalEntered;
  await Promise.resolve();
  assert.equal(settled, false);
  release();
  const response = await responsePromise;
  assertPrivate(response, 200);
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), f.bytes);
});


test('a valid-shaped binding replaced during read gives only generic 404', async () => {
  const f = fixture();
  f.dependencies.readObject = async () => {
    f.calls.push('object');
    f.binding.objectKey = 'education-media/synthetic/replaced-private-object';
    return f.bytes;
  };
  await refused(f, 404);
  assert(f.calls.includes('object'));
  assert.equal(f.calls.filter(c => c === 'binding').length, 2);
});
