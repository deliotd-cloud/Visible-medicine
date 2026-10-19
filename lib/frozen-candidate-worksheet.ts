import { candidateDigest, canonicalCandidateJson, validateCandidate, type ClinicalReviewCandidate } from './clinical-review-candidate.ts';
import type { BodyReviewMaterial } from '../atlas-review/lib/body-review-material.ts';

export type FrozenWorksheetPacket = {
  schema: 'visible-medicine.frozen-body-inspection/1' | 'visible-medicine.frozen-body-inspection/2';
  decisionMode: 'inspection-only' | 'personal-review';
  selections: Array<{ material: BodyReviewMaterial; modelQuery: string }>;
};

const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const keys = (v: unknown, required: string[], optional: string[] = []): v is Record<string, unknown> =>
  obj(v) && required.every(k => Object.hasOwn(v, k)) && Object.keys(v).every(k => required.includes(k) || optional.includes(k));
const str = (v: unknown, max = 8192): v is string => typeof v === 'string' && v.length <= max && !/[\u0000-\u001f\u007f]/.test(v);
const nonempty = (v: unknown, max = 8192): v is string => str(v, max) && v.trim().length > 0;
const sha = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const token = (v: unknown): v is string => typeof v === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
const list = (v: unknown, max: number, check: (x: unknown) => boolean): v is unknown[] => Array.isArray(v) && v.length <= max && v.every(check);
const records = (v: unknown, max: number, check: (x: Record<string, unknown>) => boolean): v is Record<string, unknown>[] =>
  Array.isArray(v) && v.length <= max && v.every(x => obj(x) && check(x));
const strings = (v: unknown, max = 128): v is string[] => list(v, max, x => str(x));
const unique = (xs: unknown[]) => new Set(xs).size === xs.length;
const url = (v: unknown): v is string => {
  if (!str(v, 2048) || !v.startsWith('https://') || /[\s\\]/.test(v)) return false;
  try { const u = new URL(v); return u.protocol === 'https:' && !!u.hostname && !u.username && !u.password; } catch { return false; }
};
const refs = (v: unknown) => list(v, 64, url);
const sourceParts = (v: unknown) => list(v, 64, p => keys(p, ['file','sha256']) && typeof p.file === 'string' && /^FJ\d+M?$/.test(p.file) && sha(p.sha256)) && unique(v.map(p => (p as Record<string, unknown>).file));
const vec = (v: unknown) => Array.isArray(v) && v.length === 3 && v.every(x => typeof x === 'number' && Number.isFinite(x));
const bounds = (v: unknown) => keys(v, ['min','max']) && vec(v.min) && vec(v.max);
const frame = (v: unknown) => obj(v) && bounded(v, 0) && Object.keys(v).length > 0;

/** Validate every retained nested scalar, including fields not shown by this UI. */
function bounded(v: unknown, depth: number): boolean {
  if (depth > 12) return false;
  if (v === null || typeof v === 'boolean') return true;
  if (typeof v === 'number') return Number.isFinite(v);
  if (typeof v === 'string') return str(v);
  if (Array.isArray(v)) return v.length <= 256 && v.every(x => bounded(x, depth + 1));
  return obj(v) && Object.keys(v).length <= 80 && Object.entries(v).every(([k,x]) =>
    str(k, 100) && !/^(?:approval|reviewer|reviewerNotes|attested|decision|account|institution|patient|signature)$/i.test(k) &&
    (!/(?:url|reference|citation|link)$/i.test(k) || typeof x !== 'string' || url(x) || /^\/(?!\/)[a-zA-Z0-9_./-]+$/.test(x)) && bounded(x, depth + 1));
}
function structure(v: unknown): v is Record<string, unknown> {
  return keys(v, ['id','fmaId','name','sourceName','system','category','laterality','region','regions','bundle','nodeName','bounds','center','anchor','sourceTree','sources','coverageNote'], ['presentationParts','representation','provenance','validation']) &&
    nonempty(v.id,256) && /^FMA\d+$/.test(String(v.fmaId)) && nonempty(v.name,160) && nonempty(v.sourceName,160) && token(v.region) && token(v.bundle) &&
    ['left','right','midline','unpaired','unspecified'].includes(String(v.laterality)) &&
    ['skeleton','muscles','organs','nerves','vessels','connective'].includes(String(v.system)) &&
    ['isa','partof'].includes(String(v.sourceTree)) && nonempty(v.category,100) && nonempty(v.nodeName,256) &&
    strings(v.regions,32) && v.regions.length > 0 && v.regions.every(token) && unique(v.regions) &&
    bounds(v.bounds) && vec(v.center) && vec(v.anchor) && sourceParts(v.sources) &&
    (v.coverageNote === null || str(v.coverageNote)) &&
    (v.presentationParts === undefined || list(v.presentationParts,64,p => keys(p,['source','displaySide','nodeName','bounds','center','anchor']) && sourceParts([p.source]) && ['left','right'].includes(String(p.displaySide)) && nonempty(p.nodeName,256) && bounds(p.bounds) && vec(p.center) && vec(p.anchor))) &&
    (v.representation === undefined || keys(v.representation,['coverage','sourceLaterality','displayLaterality','description']) && v.representation.coverage === 'partial' && v.representation.sourceLaterality === 'unspecified' && v.representation.displayLaterality === 'right' && nonempty(v.representation.description)) &&
    (v.provenance === undefined || keys(v.provenance,['method','license','sourceVersion','recovered']) && v.provenance.method === 'licensed-source-mesh' && nonempty(v.provenance.license) && nonempty(v.provenance.sourceVersion) && typeof v.provenance.recovered === 'boolean') &&
    (v.validation === undefined || keys(v.validation,['status','anatomicalReview']) && v.validation.status === 'unvalidated' && v.validation.anatomicalReview === false);
}
function bundle(v: unknown): v is Record<string,unknown> {
  return keys(v,['id','url','bytes','sha256','structures']) && token(v.id) && str(v.url,512) && Number.isSafeInteger(v.bytes) && (v.bytes as number)>0 && sha(v.sha256) && Number.isSafeInteger(v.structures);
}
function topic(v: unknown, tab: string): boolean {
  if (!keys(v,['tab','readiness','title','body'],['bullets','note','citations','correctAnswer','explanation','additionalChecks']) || v.tab !== tab ||
      !['draft','pending','identity-only','generated-identification'].includes(String(v.readiness)) || !str(v.title) || !str(v.body) ||
      (v.bullets !== undefined && !strings(v.bullets)) || (v.note !== undefined && !str(v.note)) ||
      (v.citations !== undefined && !refs(v.citations)) || (v.correctAnswer !== undefined && !str(v.correctAnswer)) ||
      (v.explanation !== undefined && !str(v.explanation))) return false;
  return v.additionalChecks === undefined || tab === 'quiz' && list(v.additionalChecks,8,c =>
    keys(c,['key','body','bullets','correctAnswer','explanation','citations','note']) && token(c.key) && nonempty(c.body) &&
    strings(c.bullets,8) && c.bullets.length >= 2 && unique(c.bullets) && c.bullets.includes(c.correctAnswer as string) &&
    nonempty(c.correctAnswer) && nonempty(c.explanation) && nonempty(c.note) && refs(c.citations) && c.citations.length > 0);
}
function reasoning(v: unknown, s: Record<string,unknown>, b: Record<string,unknown>): boolean {
  if (v === null) return true;
  if (!keys(v,['key','readiness','revision','prompt','explanation','references','choices','answerId','scope']) || !token(v.key) || v.readiness !== 'draft' ||
      !Number.isSafeInteger(v.revision) || (v.revision as number)<1 || !nonempty(v.prompt) || !nonempty(v.explanation) || !nonempty(v.scope) ||
      !list(v.references,32,r=>keys(r,['title','url']) && nonempty(r.title) && url(r.url)) || v.references.length===0 ||
      !records(v.choices,12,c=>keys(c,['id','name','fmaId','laterality','regions','bundle','bundleSha256','nodeName','sourceTree','sources']) &&
        nonempty(c.id,256) && nonempty(c.name,160) && /^FMA\d+$/.test(String(c.fmaId)) &&
        ['left','right','midline','unpaired','unspecified'].includes(String(c.laterality)) && strings(c.regions,32) && c.regions.length>0 &&
        token(c.bundle) && sha(c.bundleSha256) && nonempty(c.nodeName,256) && ['isa','partof'].includes(String(c.sourceTree)) && sourceParts(c.sources)) ||
      v.choices.length<2 || !unique(v.choices.map(c=>c.id)) || v.answerId !== s.id) return false;
  const answer = v.choices.find(c=>c.id===s.id);
  return !!answer && ['id','name','fmaId','laterality','regions','bundle','nodeName','sourceTree','sources'].every(k=>canonicalCandidateJson(answer[k])===canonicalCandidateJson(s[k])) && answer.bundleSha256===b.sha256;
}
function tours(v: unknown, own: Record<string,unknown>, ownBundle: Record<string,unknown>): boolean {
  return records(v,32,e => {
    if (!keys(e,['tour','structures','bundles','coordinateSystem','sourceVersion','frame','transitionMs','transition','separation','continuousPlayback','limitations'],['stepFrames']) ||
        !keys(e.tour,['id','title','description','region','revision','status','contextIds','steps'],['limitations','requiredDisplayBundles','scopeRegions']) ||
        !token(e.tour.id) || !nonempty(e.tour.title) || !nonempty(e.tour.description) || !token(e.tour.region) || !token(e.tour.revision) || e.tour.status!=='draft' ||
        !strings(e.tour.contextIds,64) || !records(e.tour.steps,30,step=> keys(step,['id','title','caption','selectedId','view','durationMs','fadeOthers','references'],['frameIds']) && token(step.id) && nonempty(step.title) && nonempty(step.caption) && nonempty(step.selectedId,256) &&
          ['anterior','posterior','left','right','superior','inferior'].includes(String(step.view)) && Number.isSafeInteger(step.durationMs) && (step.durationMs as number)>=1000 && (step.durationMs as number)<=120000 && typeof step.fadeOthers==='boolean' && refs(step.references) && step.references.length>0 && (step.frameIds===undefined || strings(step.frameIds,64))) || e.tour.steps.length===0 ||
        !records(e.structures,64,structure) || !e.structures.some(x=>canonicalCandidateJson(x)===canonicalCandidateJson(own)) ||
        !records(e.bundles,64,bundle) || !e.bundles.some(x=>x.id===ownBundle.id && x.sha256===ownBundle.sha256) ||
        !frame(e.frame) || !obj(e.coordinateSystem) || !bounded(e.coordinateSystem,0) || !nonempty(e.sourceVersion) ||
        e.transitionMs!==1800 || e.transition!=='quintic-orbit' || e.separation!==0 || !nonempty(e.limitations) ||
        !obj(e.continuousPlayback) || !bounded(e.continuousPlayback,0) ||
        (e.stepFrames!==undefined && !list(e.stepFrames,30,frame))) return false;
    const tour=e.tour, structures=e.structures, bundles=e.bundles;
    if (!obj(tour) || !records(tour.steps,30,step=>keys(step,['id','title','caption','selectedId','view','durationMs','fadeOthers','references'],['frameIds'])) ||
        !records(structures,64,structure) || !records(bundles,64,bundle) || !strings(tour.contextIds,64)) return false;
    const ids = new Set(structures.map(x=>x.id));
    return tour.steps.every(x=>ids.has(x.selectedId)) && tour.contextIds.every(x=>ids.has(x)) &&
      structures.every(x=>bundles.some(b=>b.id===x.bundle)) &&
      (e.tour.limitations===undefined || str(e.tour.limitations)) &&
      (e.tour.scopeRegions===undefined || strings(e.tour.scopeRegions,32)) &&
      (e.tour.requiredDisplayBundles===undefined || obj(e.tour.requiredDisplayBundles) && bounded(e.tour.requiredDisplayBundles,0));
  }) && unique(v.map(e=>obj(e.tour)?e.tour.id:undefined));
}

function material(v: unknown, descriptor: ClinicalReviewCandidate['selections'][number]): v is BodyReviewMaterial {
  const checklist = obj(v) ? v.checklist : null;
  const topics = obj(v) ? v.topics : null;
  if (!keys(v,['schema','kind','structureId','status','approval','source','topics','reasoning','guidedTours','fingerprints','materialHash','atlasLink','checklist','reviewerNotes','limits']) ||
      v.schema!=='vm-body-review-worksheet-3' || v.kind!=='body-display-catalog' || v.structureId!==descriptor.structureId ||
      v.status!=='worksheet-not-submitted' || v.approval!==false || !sha(v.materialHash) ||
      !keys(v.source,['structure','bundle','coordinateSystem','sourceVersion','licence','credit']) || !structure(v.source.structure) || !bundle(v.source.bundle) ||
      v.source.structure.id!==descriptor.structureId || v.source.structure.name!==descriptor.structureName || v.source.structure.region!==descriptor.region ||
      v.source.structure.bundle!==v.source.bundle.id || !obj(v.source.coordinateSystem) || !bounded(v.source.coordinateSystem,0) ||
      !nonempty(v.source.sourceVersion) || !nonempty(v.source.licence) || !nonempty(v.source.credit) ||
      !keys(v.fingerprints,['source','teaching','checklist']) || ![v.fingerprints.source,v.fingerprints.teaching,v.fingerprints.checklist].every(sha) ||
      !keys(v.reviewerNotes,['reviewer','qualification','date','evidence','corrections']) ||
      v.reviewerNotes.reviewer!=='' || v.reviewerNotes.qualification!=='' || v.reviewerNotes.date!=='' ||
      !Array.isArray(v.reviewerNotes.evidence) || v.reviewerNotes.evidence.length!==0 || !Array.isArray(v.reviewerNotes.corrections) || v.reviewerNotes.corrections.length!==0 ||
      !strings(v.limits,32) || !keys(checklist,['geometry','teaching','imaging']) ||
      !['geometry','teaching','imaging'].every(k=>strings(checklist[k],64)) ||
      !(v.atlasLink===null || str(v.atlasLink,2048) && /^\/regions\/[a-z0-9-]+\?/.test(v.atlasLink)) ||
      !list(topics,9,()=>true) || topics.length!==9 ||
      !['anatomy','function','ct','mri','xray','ultrasound','pathology','clinical','quiz'].every((tab,i)=>topic(topics[i],tab)) ||
      !reasoning(v.reasoning,v.source.structure,v.source.bundle) || !tours(v.guidedTours,v.source.structure,v.source.bundle) ||
      !bounded(v.source,0) || !bounded(v.topics,0) || !bounded(v.reasoning,0) || !bounded(v.guidedTours,0)) return false;
  return true;
}

export async function decodeFrozenWorksheet(candidate: ClinicalReviewCandidate, bytes: Uint8Array): Promise<FrozenWorksheetPacket> {
  const descriptor = await validateCandidate(candidate);
  const file = descriptor.files.find(f=>f.path==='worksheet.json');
  if (!(bytes instanceof Uint8Array) || bytes.byteLength===0 || bytes.byteLength>2*1024*1024 || !file || file.bytes!==bytes.byteLength ||
      await crypto.subtle.digest('SHA-256', new Uint8Array(bytes)).then(b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join(''))!==file.sha256)
    throw new Error('Frozen worksheet bytes do not match descriptor.');
  let parsed: unknown;
  try { parsed = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)); } catch { throw new Error('Invalid frozen worksheet JSON.'); }
  const mode = descriptor.decisionMode==='personal-review';
  if (!keys(parsed,['schema','decisionMode','selections']) || parsed.schema!==(mode?'visible-medicine.frozen-body-inspection/2':'visible-medicine.frozen-body-inspection/1') ||
      parsed.decisionMode!==descriptor.decisionMode || !list(parsed.selections,32,()=>true) || parsed.selections.length!==descriptor.selections.length)
    throw new Error('Invalid frozen worksheet packet.');
  const results: FrozenWorksheetPacket['selections'] = [];
  const seen = new Set<string>();
  for (const item of parsed.selections) {
    if (!keys(item,['material','context','modelQuery']) || !obj(item.material) || !nonempty(item.material.structureId,256) || seen.has(item.material.structureId)) throw new Error('Invalid frozen selection.');
    seen.add(item.material.structureId);
    const materialValue=item.material, context=item.context;
    const selected = descriptor.selections.find(s=>s.structureId===materialValue.structureId);
    if (!selected || !material(item.material,selected) || !keys(item.context,['catalogScope','structureId','structureName','materialHash','sourceHash','teachingHash','rendererHash','checklistVersion','checklists','revisions','blockers','teachingTabs']) ||
        item.context.catalogScope!=='body-display-catalog' || item.context.structureId!==selected.structureId || item.context.structureName!==selected.structureName ||
        item.context.materialHash!==selected.materialHash || item.context.sourceHash!==selected.sourceHash || item.context.teachingHash!==selected.teachingHash ||
        !sha(item.context.rendererHash) || !nonempty(item.context.checklistVersion,80) || !keys(item.context.checklists,['geometry','teaching','imaging']) ||
        !keys(item.context.blockers,['geometry','teaching','imaging']) || !keys(item.context.revisions,['geometry','teaching','imaging']) ||
        !['geometry','teaching','imaging'].every(k=> obj(context) && obj(context.checklists) && obj(context.blockers) && obj(context.revisions) && list(context.checklists[k],30,c=>keys(c,['id','label']) && token(c.id) && nonempty(c.label,1000)) && strings(context.blockers[k],32) && (context.revisions[k]===null || sha(context.revisions[k]))) ||
        !strings(item.context.teachingTabs,9) || (mode && canonicalCandidateJson({checklistVersion:item.context.checklistVersion,checklists:item.context.checklists,blockers:item.context.blockers,teachingTabs:item.context.teachingTabs})!==canonicalCandidateJson((selected as {review?:unknown}).review)))
      throw new Error('Frozen worksheet identity mismatch.');
    const m = item.material;
    const scope = {schema:'vm-body-review-worksheet-3',kind:'body-display-catalog',structureId:m.structureId};
    const source = await candidateDigest({scope:{...scope,schema:'vm-body-review-worksheet-1'},source:m.source});
    const teaching = await candidateDigest({scope:{...scope,schema:'vm-body-review-worksheet-2'},topics:m.topics,reasoning:m.reasoning,...(m.guidedTours.length?{guidedTours:m.guidedTours}:{})});
    const checklist = await candidateDigest({scope:{...scope,schema:'vm-body-review-worksheet-2'},checks:m.checklist});
    const materialHash = await candidateDigest({scope,fingerprints:{source,teaching,checklist}});
    if (source!==m.fingerprints.source || teaching!==m.fingerprints.teaching || checklist!==m.fingerprints.checklist || materialHash!==m.materialHash ||
        source!==selected.sourceHash || teaching!==selected.teachingHash || materialHash!==selected.materialHash ||
        !str(item.modelQuery,2048)) throw new Error('Frozen worksheet hash mismatch.');
    const q = new URLSearchParams(item.modelQuery);
    if ([...q.keys()].length!==6 || ['kind','region','study','structure','side','source'].some(k=>q.getAll(k).length!==1) ||
        q.get('kind')!=='body' || q.get('region')!==selected.region || q.get('study')!=='1' || q.get('structure')!==selected.structureId || q.get('side')!=='both' || q.get('source')!==m.source.bundle.sha256)
      throw new Error('Frozen model query mismatch.');
    const link = new URL(m.atlasLink ?? '', 'https://saved.invalid');
    if (link.pathname!==`/regions/${selected.region}` || [...link.searchParams.keys()].length!==4 || link.searchParams.get('study')!=='1' || link.searchParams.get('structure')!==selected.structureId || link.searchParams.get('side')!=='both' || link.searchParams.get('source')!==m.source.bundle.sha256)
      throw new Error('Frozen atlas link mismatch.');
    results.push({material:m,modelQuery:item.modelQuery});
  }
  return {schema:parsed.schema as FrozenWorksheetPacket['schema'],decisionMode:parsed.decisionMode as FrozenWorksheetPacket['decisionMode'],selections:results};
}
