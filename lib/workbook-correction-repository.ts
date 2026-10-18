import { env } from 'cloudflare:workers';
import type { AuthContext } from '@/lib/auth';
import { ensureEducationUser } from '@/db/bootstrap';
import { getPlatformSnapshot } from '@/db/platform';
import { parseAndVerifyAssessmentManifest, type AssessmentManifest } from '@/lib/assessment-manifest';
import { assessmentMediaForCase } from '@/lib/assessment-manifest-store';
import { parseAndVerifyLectureManifest } from '@/lib/lecture-manifest';
import { sha256 } from '@/lib/domain';
import { WORKBOOK_CORRECTION_ACTION, WORKBOOK_CORRECTION_SOURCE_ACTION, WORKBOOK_CORRECTION_LOOKUP_ACTION,
  WorkbookCorrectionError, parseWorkbookCorrectionRequest, parseWorkbookCorrectionLookupRequest,
  parseWorkbookCorrectionReceipt,
  workbookCorrectionId, type WorkbookCorrectionMode, type WorkbookCorrectionReceipt,
  type WorkbookCorrectionSource, type WorkbookCorrectionLookup } from '@/lib/workbook-correction-contract';

type Row = Record<string, string | number | null>;
type SourceRow = {id:string; module_id:string; title:string; mode:WorkbookCorrectionMode; status:string;
  version:number; duration_minutes:number; dual_display_allowed:number; manifest_id:string;
  integrity_hash:string; manifest_json:string | null; manifest_status:string | null;
  viewer_core_version:string | null; manifest_dual_display:number | null};
// D1 permits at most 2,000,000 bytes in a string/row. Assessment publication
// has no narrower manifest cap; lecture publication already caps at 64,000.
const MAX_ASSESSMENT_MANIFEST_BYTES=2_000_000;
const MAX_LECTURE_MANIFEST_BYTES=64_000;

const authority = `EXISTS (SELECT 1 FROM users u
  JOIN account_security_profiles p ON p.user_id=u.id
  JOIN organization_memberships om ON om.user_id=u.id
  JOIN organizations o ON o.id=om.organization_id
  JOIN organization_entitlements e ON e.organization_id=o.id
  WHERE u.id=? AND o.id=? AND p.status='active' AND om.status='active'
    AND o.status='active' AND e.status='active' AND e.studio_access=1
    AND (e.valid_until IS NULL OR (e.valid_until=strftime('%Y-%m-%dT%H:%M:%fZ',e.valid_until)
      AND e.valid_until>strftime('%Y-%m-%dT%H:%M:%fZ','now')))
    AND (instr(','||u.roles||',',',instructor,')>0 OR instr(','||u.roles||',',',examiner,')>0
      OR instr(','||u.roles||',',',administrator,')>0))`;

// The complete SQL material snapshots are checked again by the audit INSERT in
// the same transaction as every draft write. Their order and fields are fixed.
const snapshotQueries = {
  cases: `SELECT COALESCE(json_group_array(json(item)),'[]') AS value FROM
    (SELECT json_object('id',c.id,'position',wc.position,'title',c.title,'description',c.description,
      'classification',c.classification,'status',c.status,'version',c.version,'visual_kind',c.visual_kind,
      'tools_json',c.tools_json,'publication_hash',c.publication_hash,'deidentified',c.deidentified,
      'publication_cleared',c.publication_cleared) AS item
      FROM workbook_cases wc JOIN cases c ON c.id=wc.case_id WHERE wc.workbook_id=? ORDER BY wc.position,c.id)`,
  questions: `SELECT COALESCE(json_group_array(json(item)),'[]') AS value FROM
    (SELECT json_object('id',q.id,'case_id',q.case_id,'prompt',q.prompt,'max_marks',q.max_marks,
      'version',q.version,'response_type',q.response_type,'options_json',q.options_json,'position',q.position,
      'rubric_version',r.version,'criteria_json',r.criteria_json) AS item
      FROM questions q JOIN workbook_cases wc ON wc.case_id=q.case_id
      LEFT JOIN rubrics r ON r.id=(SELECT r2.id FROM rubrics r2 WHERE r2.question_id=q.id AND r2.status='published'
        ORDER BY r2.version DESC,r2.id DESC LIMIT 1)
      WHERE wc.workbook_id=? ORDER BY wc.position,q.position,q.id)`,
  edits: `SELECT COALESCE(json_group_array(json(item)),'[]') AS value FROM
    (SELECT json_object('question_id',question_id,'prompt',prompt,'revision',revision) AS item
      FROM workbook_draft_question_edits WHERE workbook_id=? ORDER BY question_id)`,
  blocks: `SELECT COALESCE(json_group_array(json(item)),'[]') AS value FROM
    (SELECT json_object('id',id,'case_id',case_id,'type',type,'title',title,'body',body,'url',url,
      'position',position,'version',version,'status',status) AS item
      FROM teaching_content_blocks WHERE workbook_id=? ORDER BY position,id)`,
  polls: `SELECT COALESCE(json_group_array(json(item)),'[]') AS value FROM
    (SELECT json_object('id',id,'case_id',case_id,'prompt',prompt,'selection_mode',selection_mode,
      'options_json',options_json,'correct_option_ids_json',correct_option_ids_json,'explanation',explanation,
      'position',position,'version',version,'status',status) AS item
      FROM teaching_polls WHERE workbook_id=? ORDER BY position,id)`,
} as const;
type SnapshotKey = keyof typeof snapshotQueries;
const stale = () => new WorkbookCorrectionError('The published source or access changed. Refresh and review before continuing.',409);
function jsonRows(value:string): Row[] { const parsed:unknown=JSON.parse(value); if(!Array.isArray(parsed)) throw stale(); return parsed as Row[]; }
function canonical(value:unknown):unknown {
  if(Array.isArray(value)) return value.map(canonical);
  if(value && typeof value==='object') return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,canonical(v)]));
  return value;
}
function parsedJson(value:unknown):unknown { if(typeof value!=='string') throw stale(); try{return JSON.parse(value);}catch{throw stale();} }
function options(value:unknown) {
  const parsed=parsedJson(value); if(!Array.isArray(parsed)) throw stale();
  return parsed.map((entry,index)=>typeof entry==='string' ? {id:`option-${index+1}`,label:entry,order:index+1} : {
    id:typeof entry?.id==='string'?entry.id:`option-${index+1}`,label:typeof entry?.label==='string'?entry.label:'',
    order:Number.isInteger(Number(entry?.order))?Number(entry.order):index+1});
}
function criteria(value:unknown) {
  const parsed=parsedJson(value); if(!Array.isArray(parsed)) throw stale();
  return parsed.map((entry,index)=>({label:typeof entry?.label==='string'?entry.label:'',
    maxMarks:Number(entry?.maxMarks??entry?.marks),order:Number.isInteger(Number(entry?.order))?Number(entry.order):index+1}));
}

async function access(auth:AuthContext) {
  const user=await ensureEducationUser(auth);
  if(user.status!=='active' || !user.roles.some(role=>['instructor','examiner','administrator'].includes(role)))
    throw new WorkbookCorrectionError('Active Studio educator access is required.',403);
  const platform=await getPlatformSnapshot(auth);
  const org=platform.organization?.id;
  if(!org || !platform.entitlement?.studioAccess ||
    !await env.DB.prepare(`SELECT 1 AS allowed WHERE ${authority}`).bind(auth.userId,org).first())
    throw new WorkbookCorrectionError('Active Studio access for this institution is required.',403);
  return org;
}
async function source(auth:AuthContext,id:string) {
  if(!workbookCorrectionId(id)) throw new WorkbookCorrectionError('A valid workbook identifier is required.',422);
  const org=await access(auth);
  const row=await env.DB.prepare(`SELECT w.id,w.module_id,w.title,w.mode,w.status,w.version,w.duration_minutes,
    w.dual_display_allowed,COALESCE(av.id,lv.id) AS manifest_id,
    COALESCE(av.integrity_hash,lv.integrity_hash) AS integrity_hash,
    CASE WHEN length(CAST(COALESCE(av.manifest_json,lv.manifest_json) AS BLOB))<=
      CASE WHEN w.mode='lecture' THEN ${MAX_LECTURE_MANIFEST_BYTES} ELSE ${MAX_ASSESSMENT_MANIFEST_BYTES} END
      THEN COALESCE(av.manifest_json,lv.manifest_json) ELSE NULL END AS manifest_json,
    av.status AS manifest_status,av.viewer_core_version,
    av.dual_display_allowed AS manifest_dual_display
    FROM workbooks w JOIN modules m ON m.id=w.module_id
    JOIN course_ownership co ON co.course_id=m.course_id
    LEFT JOIN assessment_versions av ON av.workbook_id=w.id AND av.version=w.version AND w.mode IN ('teaching','assessment')
    LEFT JOIN lecture_versions lv ON lv.workbook_id=w.id AND lv.version=w.version AND w.mode='lecture'
    WHERE w.id=? AND co.organization_id=?`).bind(id,org).first<SourceRow>();
  if(!row) throw new WorkbookCorrectionError('Workbook not found in this institution.',404);
  if(row.status!=='published' || !['teaching','assessment','lecture'].includes(row.mode) || !row.manifest_id)
    throw stale();
  if(typeof row.manifest_json!=='string') throw stale();
  let manifest:AssessmentManifest | Awaited<ReturnType<typeof parseAndVerifyLectureManifest>>;
  try {
    if(row.mode==='lecture') {
      if(Number(row.duration_minutes)!==0 || Number(row.dual_display_allowed)!==0) throw stale();
      manifest=await parseAndVerifyLectureManifest(row.manifest_json,row.integrity_hash);
    }
    else {
      if(row.manifest_status!=='published') throw stale();
      manifest=await parseAndVerifyAssessmentManifest(row.manifest_json,row.integrity_hash);
      if(manifest.viewer.coreVersion!==row.viewer_core_version ||
        manifest.assessment.durationMinutes!==Number(row.duration_minutes) ||
        ![0,1].includes(Number(row.dual_display_allowed)) ||
        ![0,1].includes(Number(row.manifest_dual_display)) ||
        manifest.assessment.displayPolicy.dualDisplayAllowed!==(Number(row.dual_display_allowed)===1) ||
        manifest.assessment.displayPolicy.dualDisplayAllowed!==(Number(row.manifest_dual_display)===1)) throw stale();
    }
    if(manifest.workbook.id!==id || manifest.workbook.version!==Number(row.version) ||
      manifest.workbook.mode!==row.mode || manifest.workbook.title!==row.title) throw stale();
  } catch { throw stale(); }
  return {org,row,manifest};
}

export async function getWorkbookCorrectionSource(auth:AuthContext,id:string):Promise<WorkbookCorrectionSource> {
  const {row}=await source(auth,id);
  return {ok:true,action:WORKBOOK_CORRECTION_SOURCE_ACTION,workbookId:id,
    workbookVersion:Number(row.version),mode:row.mode,sourceHash:row.integrity_hash};
}

/** Recover the immutable creation fact, not a promise about current draft status.
 * Direct D1 queries use the primary. The final SELECT rechecks authority, source,
 * ownership and target in one read snapshot; lookup never retries creation.
 */
export async function lookupStudioWorkbookCorrection(auth:AuthContext,id:string,input:unknown):Promise<WorkbookCorrectionLookup> {
  const request=parseWorkbookCorrectionLookupRequest(input,id);
  if(!request) throw new WorkbookCorrectionError('The exact correction request and published source are required.',422);
  const {org,row}=await source(auth,id);
  if(row.version!==request.expectedVersion || row.mode!==request.expectedMode ||
    row.integrity_hash!==request.expectedSourceHash) throw stale();
  type LookupRow={allowed:number; event_id:string|null; sequence:number|null; actor_id:string|null;
    action:string|null; target_type:string|null; target_id:string|null; outcome:string|null;
    reason:string|null; occurred_at:string|null; integrity_hash:string|null; previous_hash:string|null;
    draft_id:string|null; draft_mode:string|null; draft_version:number|null; draft_status:string|null;
    draft_module_id:string|null; draft_author:string|null};
  const found=await env.DB.prepare(`SELECT 1 AS allowed,
    a.id AS event_id,a.sequence,a.actor_id,a.action,a.target_type,a.target_id,a.outcome,
    CASE WHEN length(CAST(a.reason AS BLOB))<=8000 THEN a.reason ELSE NULL END AS reason,
    a.occurred_at,a.integrity_hash,previous.integrity_hash AS previous_hash,
    d.id AS draft_id,d.mode AS draft_mode,d.version AS draft_version,d.status AS draft_status,
    d.module_id AS draft_module_id,da.author_id AS draft_author
    FROM workbooks w JOIN modules m ON m.id=w.module_id
    JOIN course_ownership co ON co.course_id=m.course_id
    ${row.mode==='lecture'?'JOIN lecture_versions v':'JOIN assessment_versions v'} ON v.workbook_id=w.id AND v.version=w.version
    LEFT JOIN audit_events a ON a.id=? AND a.actor_id=?
      AND a.action='workbook.correction-draft-created' AND a.target_type='workbook' AND a.outcome='success'
    LEFT JOIN audit_events previous ON previous.sequence=a.sequence-1
    LEFT JOIN workbooks d ON d.id=a.target_id
      AND d.module_id=w.module_id AND d.mode=w.mode
    LEFT JOIN workbook_authorship da ON da.workbook_id=d.id AND da.author_id=a.actor_id
    WHERE ${authority} AND w.id=? AND co.organization_id=? AND w.status='published'
      AND w.version=? AND w.mode=? AND w.module_id=? AND w.title=?
      AND w.duration_minutes=? AND w.dual_display_allowed=?
      AND v.id=? AND v.integrity_hash=? AND v.manifest_json=?
      ${row.mode==='lecture'?'':"AND v.status='published' AND v.viewer_core_version=? AND v.dual_display_allowed=?"}`)
    .bind(request.requestId,auth.userId,auth.userId,org,id,org,row.version,row.mode,row.module_id,
      row.title,row.duration_minutes,row.dual_display_allowed,row.manifest_id,row.integrity_hash,row.manifest_json,
      ...(row.mode==='lecture'?[]:[row.viewer_core_version,row.manifest_dual_display])).first<LookupRow>();
  if(!found) throw stale();
  const context={ok:true as const,action:WORKBOOK_CORRECTION_LOOKUP_ACTION,requestId:request.requestId,
    sourceWorkbookId:id,sourceVersion:row.version,sourceHash:row.integrity_hash,mode:row.mode};
  if(!found.event_id) return {...context,outcome:'unconfirmed',receipt:null};
  // Audit payloads are server-written, but must still be strictly verified before
  // they can turn an uncertain network result into a usable workbook link.
  if(!found.reason || !Number.isSafeInteger(found.sequence) || (found.sequence??0)<1 ||
    !found.draft_id || found.draft_author!==auth.userId || found.draft_mode!==row.mode ||
    found.draft_module_id!==row.module_id || !Number.isSafeInteger(found.draft_version) ||
    (found.draft_version??0)<1 || !['draft','in-review','changes-requested','approved','published','archived','withdrawn'].includes(found.draft_status??'')) throw stale();
  let payload:unknown;
  try { payload=JSON.parse(found.reason); } catch { throw stale(); }
  if(!payload || typeof payload!=='object' || Array.isArray(payload)) throw stale();
  const data=payload as Record<string,unknown>;
  const expectedKeys=['schema','sourceWorkbookId','sourceVersion','sourceHash','mode','organizationId',
    'draftWorkbookId','reason','excludedEvidence','independentReviewRequired'];
  if(Object.keys(data).length!==expectedKeys.length || Object.keys(data).some(key=>!expectedKeys.includes(key)) ||
    data.schema!=='vm-workbook-correction-audit-1' || data.sourceWorkbookId!==id ||
    data.sourceVersion!==row.version || data.sourceHash!==row.integrity_hash || data.mode!==row.mode ||
    data.organizationId!==org || data.draftWorkbookId!==found.draft_id ||
    data.excludedEvidence!==true || data.independentReviewRequired!==true || typeof data.reason!=='string' ||
    !data.reason.trim() || data.reason!==data.reason.trim() || data.reason.length>1000 ||
    /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(data.reason)) throw stale();
  const previousHash=found.sequence===1?'GENESIS':found.previous_hash;
  if((found.sequence===1 && found.previous_hash!==null) || !previousHash ||
    (found.sequence!==1 && !/^[a-f0-9]{64}$/.test(previousHash))) throw stale();
  const auditHash=await sha256(`${previousHash}|${found.sequence}|${found.actor_id}|${found.action}|${found.target_type}|${found.target_id}|${found.outcome}|${found.reason}|${found.occurred_at}`);
  if(auditHash!==found.integrity_hash) throw stale();
  const receipt=parseWorkbookCorrectionReceipt({ok:true,action:WORKBOOK_CORRECTION_ACTION,
    requestId:found.event_id,sourceWorkbookId:id,sourceVersion:row.version,sourceHash:row.integrity_hash,
    mode:row.mode,draftWorkbookId:found.draft_id,draftVersion:1,draftStatus:'draft',auditId:found.event_id,
    auditHash,createdAt:found.occurred_at},request);
  if(!receipt) throw stale();
  return {...context,outcome:'confirmed',receipt};
}

async function snapshots(id:string,keys:SnapshotKey[]) {
  const values={} as Record<SnapshotKey,string>;
  for(const key of keys) {
    const row=await env.DB.prepare(snapshotQueries[key]).bind(id).first<{value:string}>();
    if(!row || new TextEncoder().encode(row.value).byteLength>500_000) throw stale();
    values[key]=row.value;
  }
  return values;
}

export async function createStudioWorkbookCorrection(auth:AuthContext,id:string,input:unknown):Promise<WorkbookCorrectionReceipt> {
  const request=parseWorkbookCorrectionRequest(input,id);
  if(!request) throw new WorkbookCorrectionError('Confirm the exact published source and provide a correction reason.',422);
  const {org,row,manifest}=await source(auth,id);
  if(await env.DB.prepare('SELECT 1 AS used FROM audit_events WHERE id=?').bind(request.requestId).first()) throw stale();
  if(row.version!==request.expectedVersion || row.mode!==request.expectedMode ||
    row.integrity_hash!==request.expectedSourceHash) throw stale();
  const keys:SnapshotKey[]=row.mode==='lecture'?[]:['cases','questions','edits',...(row.mode==='teaching'?['blocks','polls'] as SnapshotKey[]:[])];
  const snap=await snapshots(id,keys);
  let cases:Row[]=[]; let edits:Array<{question_id:string;prompt:string;revision:number}>=[];
  let blocks:Row[]=[]; let polls:Row[]=[];
  if(row.mode!=='lecture') {
    const published=manifest as AssessmentManifest;
    cases=jsonRows(snap.cases);
    const questions=jsonRows(snap.questions);
    const currentEdits=jsonRows(snap.edits);
    if(!cases.length || cases.length!==published.cases.length ||
      questions.length!==published.cases.reduce((n,c)=>n+c.questions.length,0)) throw stale();
    const manifestCases=published.cases;
    const reconstructed=[];
    for(let i=0;i<cases.length;i++) {
      const c=cases[i], expected=manifestCases[i];
      if(c.id!==expected.id || Number(c.position)!==expected.order || c.status!=='published' ||
        Number(c.deidentified)!==1 || Number(c.publication_cleared)!==1) throw stale();
      const qRows=questions.filter(q=>q.case_id===c.id);
      if(qRows.length!==expected.questions.length) throw stale();
      const materialQuestions=expected.questions.map((q,j)=>{
        const current=qRows[j];
        if(!current || current.id!==q.id || Number(current.version)>q.version ||
          !Number.isSafeInteger(q.version-Number(current.version))) throw stale();
        const rubricCriteria=criteria(current.criteria_json);
        edits.push({question_id:q.id,prompt:q.prompt,revision:q.version-Number(current.version)});
        return {id:String(current.id),prompt:q.prompt,responseType:current.response_type,options:options(current.options_json),
          maxMarks:Number(current.max_marks),order:Number(current.position),version:q.version,
          rubric:{version:Number(current.rubric_version),maxMarks:rubricCriteria.reduce((n,x)=>n+x.maxMarks,0),criteria:rubricCriteria}};
      });
      reconstructed.push({id:String(c.id),title:String(c.title),description:String(c.description),classification:c.classification,
        version:Number(c.version),visualKind:c.visual_kind,tools:parsedJson(c.tools_json),publicationHash:c.publication_hash,
        order:Number(c.position),media:assessmentMediaForCase(String(c.id),String(c.classification)),questions:materialQuestions});
    }
    // Prompt history is taken only from the immutable manifest; old draft rows
    // are deliberately ignored. Every other shared case/question fact must match.
    try { await parseAndVerifyAssessmentManifest(JSON.stringify({...published,cases:reconstructed}),row.integrity_hash); }
    catch { throw stale(); }
    if(currentEdits.some(e=>!questions.some(q=>q.id===e.question_id))) throw stale();
    if(row.mode==='teaching') {
      blocks=jsonRows(snap.blocks).filter(b=>b.status==='published');
      polls=jsonRows(snap.polls).filter(p=>p.status==='published');
      const normalizedBlocks=blocks.map(b=>({id:b.id,case_id:b.case_id,type:b.type,title:b.title,body:b.body,url:b.url,
        position:b.position,version:b.version}));
      const normalizedPolls=polls.map(p=>({id:p.id,case_id:p.case_id,prompt:p.prompt,selection_mode:p.selection_mode,
        options_json:p.options_json,correct_option_ids_json:p.correct_option_ids_json,explanation:p.explanation,
        position:p.position,version:p.version}));
      if(!published.supplementalIntegrity ||
        await sha256(JSON.stringify(canonical(normalizedBlocks)))!==published.supplementalIntegrity.teachingContentHash ||
        await sha256(JSON.stringify(canonical(normalizedPolls)))!==published.supplementalIntegrity.teachingPollsHash ||
        [...blocks,...polls].some(x=>!cases.some(c=>c.id===x.case_id))) throw stale();
    }
  }
  const previous=await env.DB.prepare('SELECT sequence,integrity_hash FROM audit_events ORDER BY sequence DESC LIMIT 1')
    .first<{sequence:number;integrity_hash:string}>();
  if(previous && (!Number.isSafeInteger(previous.sequence)||previous.sequence<1||!/^[a-f0-9]{64}$/.test(previous.integrity_hash)))
    throw new WorkbookCorrectionError('The audit chain requires administrator review.',503);
  const sequence=(previous?.sequence??0)+1;
  if(!Number.isSafeInteger(sequence)) throw new WorkbookCorrectionError('The audit chain requires administrator review.',503);
  const draftId=crypto.randomUUID(), now=new Date().toISOString(), prevHash=previous?.integrity_hash??'GENESIS';
  const action='workbook.correction-draft-created';
  const reason=JSON.stringify({schema:'vm-workbook-correction-audit-1',sourceWorkbookId:id,sourceVersion:row.version,
    sourceHash:row.integrity_hash,mode:row.mode,organizationId:org,draftWorkbookId:draftId,reason:request.reason,
    excludedEvidence:true,independentReviewRequired:true});
  const auditHash=await sha256(`${prevHash}|${sequence}|${auth.userId}|${action}|workbook|${draftId}|success|${reason}|${now}`);
  const sourceGuard=`EXISTS (SELECT 1 FROM workbooks w JOIN modules m ON m.id=w.module_id
    JOIN course_ownership co ON co.course_id=m.course_id
    ${row.mode==='lecture'?'JOIN lecture_versions v':'JOIN assessment_versions v'} ON v.workbook_id=w.id AND v.version=w.version
    WHERE w.id=? AND co.organization_id=? AND w.status='published' AND w.version=? AND w.mode=?
      AND w.module_id=? AND w.title=? AND w.duration_minutes=? AND w.dual_display_allowed=?
      AND v.id=? AND v.integrity_hash=? AND v.manifest_json=?
      ${row.mode==='lecture'?'':"AND v.status='published' AND v.viewer_core_version=? AND v.dual_display_allowed=?"})`;
  const guardValues:unknown[]=[id,org,row.version,row.mode,row.module_id,row.title,row.duration_minutes,row.dual_display_allowed,
    row.manifest_id,row.integrity_hash,row.manifest_json,
    ...(row.mode==='lecture'?[]:[row.viewer_core_version,row.manifest_dual_display])];
  const snapshotGuards=keys.map(k=>`AND (${snapshotQueries[k]})=?`).join('\n');
  const auditGate=`EXISTS (SELECT 1 FROM audit_events WHERE id=? AND integrity_hash=? AND target_id=? AND reason=?)`;
  const gateValues=[request.requestId,auditHash,draftId,reason];
  const statements=[env.DB.prepare(`INSERT INTO audit_events
    (id,sequence,actor_id,action,target_type,target_id,outcome,reason,occurred_at,integrity_hash)
    SELECT ?,?,?,?,'workbook',?,'success',?,?,? WHERE ${authority} AND ${sourceGuard}
    ${snapshotGuards} AND COALESCE((SELECT sequence FROM audit_events ORDER BY sequence DESC LIMIT 1),0)=?
    AND COALESCE((SELECT integrity_hash FROM audit_events ORDER BY sequence DESC LIMIT 1),'GENESIS')=?`)
    .bind(request.requestId,sequence,auth.userId,action,draftId,reason,now,auditHash,auth.userId,org,...guardValues,
      ...keys.flatMap(k=>[id,snap[k]]),previous?.sequence??0,prevHash),
    env.DB.prepare(`INSERT INTO workbooks (id,module_id,title,mode,version,status,duration_minutes,dual_display_allowed)
      SELECT ?,?,?,?,1,'draft',?,? WHERE ${auditGate}`)
      .bind(draftId,row.module_id,row.title,row.mode,row.duration_minutes,row.dual_display_allowed,...gateValues)];
  const expectedChanges=[1,1];
  if(row.mode==='lecture') {
    statements.push(env.DB.prepare(`INSERT INTO lecture_drafts (workbook_id,slides_json,review_hash,updated_at)
      SELECT ?,?,NULL,? WHERE ${auditGate}`).bind(draftId,JSON.stringify((manifest as Awaited<ReturnType<typeof parseAndVerifyLectureManifest>>).slides),now,...gateValues));
    expectedChanges.push(1);
  } else {
    const casePayload=JSON.stringify(cases.map(c=>({id:c.id,position:c.position})));
    statements.push(env.DB.prepare(`INSERT INTO workbook_cases (workbook_id,case_id,position)
      SELECT ?,json_extract(value,'$.id'),json_extract(value,'$.position') FROM json_each(?) WHERE ${auditGate}`)
      .bind(draftId,casePayload,...gateValues));
    expectedChanges.push(cases.length);
    if(edits.length) {
      statements.push(env.DB.prepare(`INSERT INTO workbook_draft_question_edits
      (workbook_id,question_id,prompt,revision,updated_by,updated_at)
      SELECT ?,json_extract(value,'$.question_id'),json_extract(value,'$.prompt'),json_extract(value,'$.revision'),?,?
      FROM json_each(?) WHERE ${auditGate}`).bind(draftId,auth.userId,now,JSON.stringify(edits),...gateValues));
      expectedChanges.push(edits.length);
    }
    if(row.mode==='teaching') {
      if(blocks.length) {
        statements.push(env.DB.prepare(`INSERT INTO teaching_content_blocks
        (id,workbook_id,case_id,type,title,body,url,position,version,status,created_by,created_at,updated_at)
        SELECT json_extract(value,'$.new_id'),?,json_extract(value,'$.case_id'),json_extract(value,'$.type'),
        json_extract(value,'$.title'),json_extract(value,'$.body'),json_extract(value,'$.url'),
        json_extract(value,'$.position'),1,'draft',?,?,? FROM json_each(?) WHERE ${auditGate}`)
        .bind(draftId,auth.userId,now,now,JSON.stringify(blocks.map(b=>({...b,new_id:crypto.randomUUID()}))),...gateValues));
        expectedChanges.push(blocks.length);
      }
      if(polls.length) {
        statements.push(env.DB.prepare(`INSERT INTO teaching_polls
        (id,workbook_id,case_id,prompt,selection_mode,options_json,correct_option_ids_json,explanation,
         position,version,status,created_by,created_at,updated_at)
        SELECT json_extract(value,'$.new_id'),?,json_extract(value,'$.case_id'),json_extract(value,'$.prompt'),
        json_extract(value,'$.selection_mode'),json_extract(value,'$.options_json'),
        json_extract(value,'$.correct_option_ids_json'),json_extract(value,'$.explanation'),
        json_extract(value,'$.position'),1,'draft',?,?,? FROM json_each(?) WHERE ${auditGate}`)
        .bind(draftId,auth.userId,now,now,JSON.stringify(polls.map(p=>({...p,new_id:crypto.randomUUID()}))),...gateValues));
        expectedChanges.push(polls.length);
      }
    }
  }
  const counts=[`(SELECT COUNT(*) FROM workbooks WHERE id=?)=1`,
    ...(row.mode==='lecture' ? [`(SELECT COUNT(*) FROM lecture_drafts WHERE workbook_id=?)=1`] :
      [`(SELECT COUNT(*) FROM workbook_cases WHERE workbook_id=?)=${cases.length}`,
       `(SELECT COUNT(*) FROM workbook_draft_question_edits WHERE workbook_id=?)=${edits.length}`,
       ...(row.mode==='teaching' ? [`(SELECT COUNT(*) FROM teaching_content_blocks WHERE workbook_id=?)=${blocks.length}`,
         `(SELECT COUNT(*) FROM teaching_polls WHERE workbook_id=?)=${polls.length}`] : [])])];
  statements.push(env.DB.prepare(`INSERT INTO workbook_authorship (workbook_id,author_id,created_at)
    SELECT ?,CASE WHEN ${counts.join(' AND ')} THEN ? ELSE NULL END,?
    WHERE ${auditGate}`).bind(draftId,...counts.map(()=>draftId),auth.userId,now,...gateValues));
  expectedChanges.push(1);
  let result: D1Result[];
  try { result=await env.DB.batch(statements); }
  catch(error) {
    if(error instanceof Error && /(?:UNIQUE constraint failed: audit_events\.(?:id|sequence)|constraint failed: audit_events)/i.test(error.message))
      throw stale();
    throw error;
  }
  if(result.length!==expectedChanges.length || result.some((entry,index)=>Number(entry.meta.changes)!==expectedChanges[index])) throw stale();
  return {ok:true,action:request.action,requestId:request.requestId,sourceWorkbookId:id,
    sourceVersion:row.version,sourceHash:row.integrity_hash,mode:row.mode,draftWorkbookId:draftId,
    draftVersion:1,draftStatus:'draft',auditId:request.requestId,auditHash,createdAt:now};
}
