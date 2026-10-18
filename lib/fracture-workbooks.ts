import { parse, sha, type FracturePackage } from './fracture-package.mjs';
import { groupEducationCaseQuestions } from './education-case-grouping.ts';

export const FRACTURE_IMPORT_LIMIT = 24 * 1024 * 1024;
export const FRACTURE_API = '/api/education/fracture-workbooks';
export type StoredFractureCase = { id: string; images: Array<{ id: string; mime: 'image/png'; sha256: string; view: string | null; laterality: string | null }>; questions: FracturePackage['cases'][number]['questions']; assessment?:FracturePackage['cases'][number]['assessment'] };
export type FractureWorkbook = { id: string; title: string; contentRevision: string; caseCount: number; createdAt: string };
export type FractureAnswer = { questionId: string; response: string; revision: number; updatedAt: string };
export type FractureWorkbookDetail = FractureWorkbook & { cases: StoredFractureCase[]; answers: FractureAnswer[] };
export type FracturePrincipal = { userId: string; organizationId: string; storageKey: string; session: D1DatabaseSession };
type Row = { id: string; title: string; content_revision: string; case_count: number; created_at: string; manifest_key: string; manifest_sha256: string };
export class FractureError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
const summary = (r: Row): FractureWorkbook => ({ id: r.id, title: r.title, contentRevision: r.content_revision, caseCount: r.case_count, createdAt: r.created_at });
export async function fractureContext(principal: Pick<FracturePrincipal, 'storageKey'>) {
  return sha(new TextEncoder().encode(`fracture-workbooks-v1:${principal.storageKey}`));
}
export async function boundedBody(request: Request, limit: number) {
  if (Number(request.headers.get('Content-Length')) > limit) throw new FractureError(413, 'The import is too large.');
  if (!request.body) throw new FractureError(400, 'A request body is required.');
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let text = '', size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new FractureError(413, 'The import is too large.'); }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally { reader.releaseLock(); }
}
export function assertFractureWrite(request: Request, context: string) {
  if (request.headers.get('X-Fracture-Context') !== context || request.headers.get('Sec-Fetch-Site') === 'cross-site')
    throw new FractureError(409, 'Your account or institution changed. Reload the workspace before saving.');
}
export function projectFractureCases(payload: FracturePackage): StoredFractureCase[] {
  const groups = groupEducationCaseQuestions(payload.cases.flatMap(c => c.questions.map(q => ({ caseId: c.id, questionId: q.id, prompt: q.prompt, maxMarks: q.maxMarks }))));
  return groups.map(group => {
    const c = payload.cases.find(item => item.id === group.caseId)!;
    return { id: c.id, ...(c.assessment ? {assessment:c.assessment} : {}), images: c.images.map(({ base64: _bytes, ...image }) => image), questions: group.questions.map(q => ({ ...q, answer: c.questions.find(item => item.id === q.id)!.answer, rationale: c.questions.find(item => item.id === q.id)!.rationale })) };
  });
}
export async function handleFractureRequest(request: Request, p: FracturePrincipal, bucket: R2Bucket): Promise<Response> {
  const context = await fractureContext(p);
  const headers = { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, oai-authenticated-user-id', 'X-Fracture-Context': context, 'X-Content-Type-Options': 'nosniff' };
  const json = (body: unknown, status = 200) => Response.json(body, { status, headers });
  const url = new URL(request.url), id = url.searchParams.get('id');
  const db = p.session;
  if (request.method === 'POST') assertFractureWrite(request, context);
  if (request.method === 'POST' && !id) {
    // Explicit uploader attestation is scoped to the exact validated package.
    // It records authority for private hosted review only, never clinical approval.
    if (request.headers.get('X-Fracture-Clearance') !== 'private-review-privacy-and-reuse-confirmed')
      throw new FractureError(422, 'Confirm image privacy review and permission for hosted educational review before importing.');
    let title: string;
    try { title = decodeURIComponent(request.headers.get('X-Workbook-Title') || '').trim(); } catch { throw new FractureError(422, 'Enter a valid workbook title.'); }
    if (!title || title.length > 120 || /[\x00-\x1f]/.test(title)) throw new FractureError(422, 'Enter a workbook title of 1–120 characters.');
    const raw = await boundedBody(request, FRACTURE_IMPORT_LIMIT);
    let payload: FracturePackage;
    try { payload = await parse(raw); } catch { throw new FractureError(422, 'The fracture package is invalid or damaged.'); }
    const packageHash = await sha(new TextEncoder().encode(raw));
    const existing = await db.prepare('SELECT * FROM fracture_review_workbooks WHERE owner_id = ? AND organization_id = ? AND package_sha256 = ?').bind(p.userId, p.organizationId, packageHash).first<Row>();
    if (existing) return json({ workbook: summary(existing) });
    const workbookId = `frw_${crypto.randomUUID().replaceAll('-', '')}`;
    const prefix = `education/fracture-review/${context}/${workbookId}`;
    const cases = projectFractureCases(payload);
    const manifest = JSON.stringify({ contentRevision: payload.contentRevision, cases });
    if (new TextEncoder().encode(manifest).length > 512 * 1024) throw new FractureError(422, 'The workbook question text is too large.');
    const manifestHash = await sha(new TextEncoder().encode(manifest));
    const written: string[] = [];
    const created = new Date().toISOString();
    try {
      for (const c of payload.cases) for (const im of c.images) {
        const key = `${prefix}/${im.id}.png`;
        await bucket.put(key, Uint8Array.from(atob(im.base64), ch => ch.charCodeAt(0)), { httpMetadata: { contentType: 'image/png', cacheControl: 'private, no-store' }, sha256: im.sha256 });
        written.push(key);
      }
      const key = `${prefix}/manifest.json`;
      await bucket.put(key, manifest, { httpMetadata: { contentType: 'application/json', cacheControl: 'private, no-store' } });
      written.push(key);
      await db.prepare(`INSERT INTO fracture_review_workbooks (id, owner_id, organization_id, title, content_revision, package_sha256, manifest_key, manifest_sha256, case_count, clearance_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(workbookId, p.userId, p.organizationId, title, payload.contentRevision, packageHash, key, manifestHash, cases.length, JSON.stringify({ scope: 'private-hosted-review-only', pixelPrivacyAttested: true, educationalReuseAttested: true, clinicalApproval: false, actor: p.userId, contentRevision: payload.contentRevision, packageHash, at: created }), created).run();
    } catch (error) {
      // A committed row can exist after an uncertain database response. Do not
      // delete its assets; otherwise roll back this unique import's own keys.
      const committed = await db.prepare('SELECT id FROM fracture_review_workbooks WHERE id = ?').bind(workbookId).first();
      if (!committed && written.length) await bucket.delete(written);
      throw error;
    }
    return json({ workbook: { id: workbookId, title, contentRevision: payload.contentRevision, caseCount: cases.length, createdAt: created } }, 201);
  }
  if (!id && request.method === 'GET') {
    const rows = await db.prepare('SELECT * FROM fracture_review_workbooks WHERE owner_id = ? AND organization_id = ? ORDER BY created_at DESC LIMIT 100').bind(p.userId, p.organizationId).all<Row>();
    return json({ workbooks: rows.results.map(summary) });
  }
  if (!id || !/^frw_[a-f0-9]{32}$/.test(id)) throw new FractureError(404, 'Workbook unavailable.');
  // Every image, question and response request independently rechecks ownership.
  const row = await db.prepare('SELECT * FROM fracture_review_workbooks WHERE id = ? AND owner_id = ? AND organization_id = ?').bind(id, p.userId, p.organizationId).first<Row>();
  if (!row) throw new FractureError(404, 'Workbook unavailable.');
  const object = await bucket.get(row.manifest_key);
  if (!object || object.size > 512 * 1024) throw new FractureError(503, 'Workbook images are temporarily unavailable.');
  const manifestText = await object.text();
  if (await sha(new TextEncoder().encode(manifestText)) !== row.manifest_sha256) throw new FractureError(503, 'Workbook integrity check failed.');
  const manifest = JSON.parse(manifestText) as { contentRevision: string; cases: StoredFractureCase[] };
  const imageId = url.searchParams.get('image');
  if (request.method === 'GET' && imageId) {
    const im = manifest.cases.flatMap(c => c.images).find(im => im.id === imageId);
    if (!im) throw new FractureError(404, 'Image unavailable.');
    const image = await bucket.get(row.manifest_key.replace(/manifest\.json$/, `${im.id}.png`));
    if (!image || image.size < 33 || image.size > 8 * 1024 * 1024) throw new FractureError(503, 'Image temporarily unavailable.');
    const bytes = await image.arrayBuffer();
    if (bytes.byteLength !== image.size || await sha(bytes) !== im.sha256) throw new FractureError(503, 'Image integrity check failed.');
    return new Response(bytes, { headers: { ...headers, 'Content-Type': 'image/png', 'Content-Length': String(bytes.byteLength), 'Content-Disposition': 'inline', 'Cross-Origin-Resource-Policy': 'same-origin' } });
  }
  if (request.method === 'POST') {
    let body: Record<string, unknown>;
    try { body = JSON.parse(await boundedBody(request, 100_000)); } catch (e) { if (e instanceof FractureError) throw e; throw new FractureError(422, 'Invalid answer.'); }
    if (!body || Object.keys(body).sort().join(',') !== 'expectedRevision,questionId,response' || typeof body.questionId !== 'string' || typeof body.response !== 'string' || body.response.length > 20000 || !Number.isSafeInteger(body.expectedRevision) || Number(body.expectedRevision) < 0 || !manifest.cases.some(c => c.questions.some(q => q.id === body.questionId))) throw new FractureError(422, 'The answer does not match this workbook.');
    const saved = await db.prepare(`INSERT INTO fracture_review_answers (workbook_id, question_id, response, revision, updated_at)
      SELECT ?, ?, ?, 1, ? WHERE ? = 0
      ON CONFLICT(workbook_id, question_id) DO UPDATE SET response = excluded.response, revision = fracture_review_answers.revision + 1, updated_at = excluded.updated_at WHERE fracture_review_answers.revision = ?
      RETURNING question_id AS questionId, response, revision, updated_at AS updatedAt`)
      .bind(id, body.questionId, body.response, new Date().toISOString(), body.expectedRevision, body.expectedRevision).first<FractureAnswer>();
    // For revisions >0 use UPDATE: SQLite's guarded INSERT SELECT produces no
    // conflict row when its initial WHERE is false.
    const updated = saved || (Number(body.expectedRevision) > 0 ? await db.prepare(`UPDATE fracture_review_answers SET response = ?, revision = revision + 1, updated_at = ? WHERE workbook_id = ? AND question_id = ? AND revision = ? RETURNING question_id AS questionId, response, revision, updated_at AS updatedAt`)
      .bind(body.response, new Date().toISOString(), id, body.questionId, body.expectedRevision).first<FractureAnswer>() : null);
    if (!updated) {
      const current = await db.prepare('SELECT question_id AS questionId, response, revision, updated_at AS updatedAt FROM fracture_review_answers WHERE workbook_id = ? AND question_id = ?').bind(id, body.questionId).first<FractureAnswer>();
      // Idempotent retry after a lost response, but never overwrite a newer edit.
      if (current?.response === body.response && current.revision === Number(body.expectedRevision) + 1) return json({ answer: current });
      return json({ error: 'This answer changed in another tab. Your text is preserved; reload the saved answer before replacing it.', current }, 409);
    }
    return json({ answer: updated });
  }
  if (request.method !== 'GET') throw new FractureError(405, 'Method not supported.');
  const answers = await db.prepare('SELECT question_id AS questionId, response, revision, updated_at AS updatedAt FROM fracture_review_answers WHERE workbook_id = ?').bind(id).all<FractureAnswer>();
  return json({ workbook: { ...summary(row), cases: manifest.cases, answers: answers.results } });
}
