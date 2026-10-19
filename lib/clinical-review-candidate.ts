/** Immutable, public-material-only inspection package. Private decisions live elsewhere. */
export type ClinicalReviewCandidateFile = {
  path: string;
  sha256: string;
  bytes: number;
  contentType: string;
  storage: 'candidate' | 'atlas-model';
};
export type ClinicalReviewCandidateSelection = {
  structureId: string;
  structureName: string;
  region: string;
  materialHash: string;
  sourceHash: string;
  teachingHash: string;
};
export type ClinicalReviewInspectionCandidate = {
  schema: 'visible-medicine.clinical-review-candidate/1';
  id: string;
  kind: 'root-body-inspection';
  label: string;
  createdAt: string;
  atlasRevision: string;
  reviewRevision: string;
  rendererRevision: string;
  decisionMode: 'inspection-only';
  selections: ClinicalReviewCandidateSelection[];
  files: ClinicalReviewCandidateFile[];
};
export type CandidateReviewBasis = Pick<import('../atlas-review/lib/body-review-decisions').BodyReviewContext,
  'checklistVersion'|'checklists'|'blockers'|'teachingTabs'>;
export type PersonalReviewCandidate = Omit<ClinicalReviewInspectionCandidate,'schema'|'kind'|'decisionMode'|'selections'> & {
  schema:'visible-medicine.clinical-review-candidate/2';
  kind:'root-body-review';
  decisionMode:'personal-review';
  supersedes:string|null;
  selections:Array<ClinicalReviewCandidateSelection & {review:CandidateReviewBasis}>;
};
export type ClinicalReviewCandidate = ClinicalReviewInspectionCandidate|PersonalReviewCandidate;

const hex64 = /^[a-f0-9]{64}$/;
const hex40 = /^[a-f0-9]{40}$/;
const token = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const exact = (value: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const nonempty = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.trim() === value && value.length > 0 && value.length <= max &&
  !/[\u0000-\u001f\u007f]/.test(value);

/** JSON wire values only; object keys sort recursively and array order is retained. */
export function canonicalCandidateJson(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalCandidateJson).join(',')}]`;
  if (object(value)) return `{${Object.keys(value).sort().map(key =>
    `${JSON.stringify(key)}:${canonicalCandidateJson(value[key])}`).join(',')}}`;
  throw new Error('Candidate contains a non-JSON value.');
}

export async function candidateDigest(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalCandidateJson(value)));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function candidateObjectKey(sha256: string): string {
  if (!hex64.test(sha256)) throw new Error('Invalid candidate object digest.');
  return `atlas-review-candidates/v1/${sha256}`;
}

export function candidateContentType(path: string): string | null {
  const extension = path.slice(path.lastIndexOf('.') + 1);
  return ({html:'text/html',js:'text/javascript',mjs:'text/javascript',css:'text/css',json:'application/json',txt:'text/plain',md:'text/plain',glb:'model/gltf-binary'} as Record<string,string>)[extension] ?? null;
}

export function safeCandidatePath(path: unknown): path is string {
  if (typeof path !== 'string' || path.length > 512 || !/^[a-zA-Z0-9_./-]+$/.test(path)) return false;
  if (!(path === 'index.html' || path === 'worksheet.json' || path === 'viewer/index.html' ||
    path.startsWith('assets/') || path.startsWith('viewer/assets/') || path.startsWith('models/'))) return false;
  return path.split('/').every(segment => segment.length > 0 && segment !== '.' && segment !== '..' &&
    /^[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)*$/.test(segment));
}

/** Reject extra fields and ambiguous identities before trusting the digest. */
export async function validateCandidate(input: unknown): Promise<ClinicalReviewCandidate> {
  const personal=object(input)&&input.schema==='visible-medicine.clinical-review-candidate/2';
  if (!object(input) || !exact(input, ['schema','id','kind','label','createdAt','atlasRevision',
    'reviewRevision','rendererRevision','decisionMode','selections','files',...(personal?['supersedes']:[])])) throw new Error('Invalid candidate fields.');
  if ((personal?(input.kind!=='root-body-review'||input.decisionMode!=='personal-review'||!(input.supersedes===null||typeof input.supersedes==='string'&&hex64.test(input.supersedes)&&input.supersedes!==input.id)):
    (input.schema !== 'visible-medicine.clinical-review-candidate/1' || input.kind !== 'root-body-inspection' || input.decisionMode !== 'inspection-only')) || !nonempty(input.label,160) ||
    typeof input.id !== 'string' || !hex64.test(input.id) ||
    typeof input.atlasRevision !== 'string' || !hex40.test(input.atlasRevision) ||
    typeof input.reviewRevision !== 'string' || !hex64.test(input.reviewRevision) ||
    typeof input.rendererRevision !== 'string' || !hex64.test(input.rendererRevision) || typeof input.createdAt !== 'string' ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(input.createdAt) ||
    !Number.isFinite(Date.parse(input.createdAt)) || new Date(input.createdAt).toISOString() !== input.createdAt)
    throw new Error('Invalid candidate identity.');
  if (!Array.isArray(input.selections) || input.selections.length < 1 || input.selections.length > 32 ||
    !input.selections.every(selection => object(selection) && exact(selection, ['structureId','structureName','region','materialHash','sourceHash','teachingHash',...(personal?['review']:[])]) &&
      nonempty(selection.structureId,256) && nonempty(selection.structureName,160) &&
      typeof selection.region === 'string' && token.test(selection.region) &&
      [selection.materialHash,selection.sourceHash,selection.teachingHash].every(hash => typeof hash === 'string' && hex64.test(hash)) &&
      (!personal||validCandidateReviewBasis(selection.review))) ||
    new Set(input.selections.map(selection => selection.structureId)).size !== input.selections.length)
    throw new Error('Invalid candidate selections.');
  if (!Array.isArray(input.files) || input.files.length < 3 || input.files.length > 512 ||
    !input.files.every(file => object(file) && exact(file, ['path','sha256','bytes','contentType','storage']) &&
      safeCandidatePath(file.path) && typeof file.sha256 === 'string' && hex64.test(file.sha256) &&
      Number.isSafeInteger(file.bytes) && (file.bytes as number) > 0 &&
      (file.bytes as number) <= ((file.path as string).endsWith('.glb') ? 32 * 1024 * 1024 : 16 * 1024 * 1024)))
    throw new Error('Invalid candidate files.');
  for (const file of input.files) {
    const entry = file as Record<string,unknown>;
    const path = entry.path as string;
    if (typeof entry.contentType !== 'string' || candidateContentType(path) === null ||
      entry.contentType !== candidateContentType(path) ||
      (path.endsWith('.glb') ? entry.storage !== 'atlas-model' || !path.startsWith('models/') : entry.storage !== 'candidate'))
      throw new Error('Invalid candidate file type or storage.');
  }
  const paths = input.files.map(file => file.path);
  if (new Set(paths).size !== paths.length ||
    !['index.html','worksheet.json','viewer/index.html'].every(path => paths.includes(path)))
    throw new Error('Candidate entrypoints are missing or repeated.');
  const { id, ...material } = input;
  if (await candidateDigest(material as Omit<ClinicalReviewCandidate,'id'>) !== id)
    throw new Error('Candidate digest does not match its material.');
  return structuredClone(input) as ClinicalReviewCandidate;
}

export function validCandidateReviewBasis(value:unknown):value is CandidateReviewBasis {
  const tracks=['geometry','teaching','imaging'];
  if(!object(value)||!exact(value,['checklistVersion','checklists','blockers','teachingTabs'])||!nonempty(value.checklistVersion,80)||
    !object(value.checklists)||!exact(value.checklists,tracks)||!object(value.blockers)||!exact(value.blockers,tracks)||
    !Array.isArray(value.teachingTabs)||value.teachingTabs.length>9||new Set(value.teachingTabs).size!==value.teachingTabs.length||
    !value.teachingTabs.every(tab=>typeof tab==='string'&&['anatomy','function','ct','mri','xray','ultrasound','pathology','clinical','quiz'].includes(tab)))return false;
  for(const track of tracks){
    const checks=value.checklists[track],blockers=value.blockers[track];
    if(!Array.isArray(checks)||checks.length<1||checks.length>30||!checks.every(check=>object(check)&&exact(check,['id','label'])&&nonempty(check.id,80)&&/^[a-z0-9-]+$/.test(check.id)&&nonempty(check.label,1000))||new Set(checks.map(c=>c.id)).size!==checks.length||
      !Array.isArray(blockers)||blockers.length>32||!blockers.every(s=>nonempty(s,2000)))return false;
  }
  return true;
}

export async function resolveCandidate(registry: readonly unknown[], candidateId: string): Promise<ClinicalReviewCandidate | null> {
  if (!hex64.test(candidateId)) return null;
  const matching = registry.filter(value => object(value) && value.id === candidateId);
  if (matching.length === 0) return null;
  if (matching.length !== 1) throw new Error('Ambiguous candidate ID.');
  return validateCandidate(matching[0]);
}
