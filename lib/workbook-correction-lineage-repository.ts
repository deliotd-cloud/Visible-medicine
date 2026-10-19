import { env } from 'cloudflare:workers';
import type { AuthContext } from '@/lib/auth';
import { ensureEducationUser } from '@/db/bootstrap';
import { getPlatformSnapshot } from '@/db/platform';
import { lookupStudioWorkbookCorrection } from '@/lib/workbook-correction-repository';
import { sha256 } from '@/lib/domain';
import { parseAndVerifyAssessmentManifest } from '@/lib/assessment-manifest';
import { parseAndVerifyLectureManifest } from '@/lib/lecture-manifest';
import { WorkbookCorrectionError, WORKBOOK_CORRECTION_LOOKUP_ACTION,
  parseWorkbookCorrectionLookupRequest } from '@/lib/workbook-correction-contract';
import { WORKBOOK_CORRECTION_LINEAGE_ACTION, parseWorkbookCorrectionLineageRequest,
  parseWorkbookCorrectionLineage, type WorkbookCorrectionLineage } from '@/lib/workbook-correction-lineage-contract';

// Identical to the existing correction authority predicate; focused tests bind both.
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
const stale = () => new WorkbookCorrectionError('Correction lineage is unavailable. Refresh and check your Studio access.',409);
const targetFrom = `FROM workbooks d JOIN modules dm ON dm.id=d.module_id
  JOIN course_ownership dc ON dc.course_id=dm.course_id
  JOIN workbook_authorship da ON da.workbook_id=d.id AND da.author_id=?`;
const targetGuard = `${authority} AND dc.organization_id=? AND d.id=? AND d.version=? AND d.mode=? AND d.status='draft'`;
const auditSnapshot = `json_object('id',a.id,'sequence',a.sequence,'actor',a.actor_id,'action',a.action,
  'type',a.target_type,'target',a.target_id,'outcome',a.outcome,'reason',a.reason,'time',a.occurred_at,
  'hash',a.integrity_hash,'previous',previous.integrity_hash)`;
const sourceMetadataSnapshot = `json_object('id',w.id,'module',w.module_id,'title',w.title,'mode',w.mode,'status',w.status,
  'version',w.version,'duration',w.duration_minutes,'dual',w.dual_display_allowed,'manifest',v.id,
  'hash',v.integrity_hash)`;

/** Workbook/audit/learner reads only. Normal authentication provisioning can write.
 * Reuse the production recovery verifier, then bind its evidence and current target
 * to one final primary DB SELECT. Never infer lineage from a title or copied rows.
 */
export async function getStudioWorkbookCorrectionLineage(auth:AuthContext,id:string,input:unknown):Promise<WorkbookCorrectionLineage> {
  const request=parseWorkbookCorrectionLineageRequest(input,id);
  if(!request) throw new WorkbookCorrectionError('The exact draft workbook context is required.',422);
  const user=await ensureEducationUser(auth);
  if(user.status!=='active' || !user.roles.some(role=>['instructor','examiner','administrator'].includes(role)))
    throw new WorkbookCorrectionError('Active Studio educator access is required.',403);
  const platform=await getPlatformSnapshot(auth),org=platform.organization?.id;
  if(!org || !platform.entitlement?.studioAccess) throw new WorkbookCorrectionError('Active Studio institution access is required.',403);
  const targetValues=[auth.userId,auth.userId,org,org,id,request.expectedVersion,request.expectedMode];
  const target=await env.DB.prepare(`SELECT d.module_id,d.title ${targetFrom} WHERE ${targetGuard}`)
    .bind(...targetValues).first<{module_id:string;title:string}>();
  if(!target) throw stale();
  const base={ok:true as const,action:WORKBOOK_CORRECTION_LINEAGE_ACTION,workbookId:id,
    workbookVersion:request.expectedVersion,mode:request.expectedMode,status:'draft' as const};
  const events=await env.DB.prepare(`SELECT a.id,
      CASE WHEN length(CAST(a.reason AS BLOB))<=8000 THEN a.reason ELSE NULL END AS reason,
      CASE WHEN length(CAST(a.reason AS BLOB))<=8000 THEN ${auditSnapshot} ELSE NULL END AS snapshot
    FROM audit_events a LEFT JOIN audit_events previous ON previous.sequence=a.sequence-1
    WHERE a.target_id=? AND a.actor_id=? AND a.action='workbook.correction-draft-created'
      AND a.target_type='workbook' AND a.outcome='success' LIMIT 2`)
    .bind(id,auth.userId).all<{id:string;reason:string|null;snapshot:string|null}>();
  if(!events.results.length) return {...base,outcome:'unavailable',source:null};
  if(events.results.length!==1) throw stale();
  const event=events.results[0];
  if(!event.reason || !event.snapshot) throw stale();
  let data:Record<string,unknown>;
  try { data=JSON.parse(event.reason); } catch { throw stale(); }
  if(!data || typeof data!=='object' || Array.isArray(data) || typeof data.sourceWorkbookId!=='string') throw stale();
  const identity=parseWorkbookCorrectionLookupRequest({action:WORKBOOK_CORRECTION_LOOKUP_ACTION,
    id:data.sourceWorkbookId,expectedVersion:data.sourceVersion,expectedMode:data.mode,
    expectedSourceHash:data.sourceHash,requestId:event.id},data.sourceWorkbookId);
  if(!identity || identity.expectedMode!==request.expectedMode || identity.id===id) throw stale();
  const manifestTable=request.expectedMode==='lecture'?'lecture_versions':'assessment_versions';
  const extraSource=request.expectedMode==='lecture'?"'lecture'":`json_array(v.status,v.viewer_core_version,v.dual_display_allowed)`;
  const sourceFrom=`FROM workbooks w JOIN modules m ON m.id=w.module_id
    JOIN course_ownership co ON co.course_id=m.course_id JOIN ${manifestTable} v ON v.workbook_id=w.id AND v.version=w.version`;
  const sourceGuard=`w.id=? AND co.organization_id=? AND w.status='published' AND w.version=? AND w.mode=?
    AND w.module_id=? AND v.integrity_hash=? AND length(CAST(v.manifest_json AS BLOB))<=2000000`;
  const sourceValues=[identity.id,org,identity.expectedVersion,identity.expectedMode,target.module_id,identity.expectedSourceHash];
  // Keep the manifest as its original string. JSON-encoding it inside another
  // snapshot can exceed D1's value limit even when the published row is valid.
  const source=await env.DB.prepare(`SELECT ${sourceMetadataSnapshot} AS snapshot,v.manifest_json AS manifest_json,${extraSource} AS extra ${sourceFrom} WHERE ${sourceGuard}`)
    .bind(...sourceValues).first<{snapshot:string;manifest_json:string;extra:string}>();
  if(!source) throw stale();
  const verified=await lookupStudioWorkbookCorrection(auth,identity.id,identity);
  if(verified.outcome!=='confirmed' || verified.receipt.draftWorkbookId!==id) throw stale();
  // Equality across reads alone is insufficient if corrupt rows are briefly repaired
  // during verification and then restored. Bind these exact snapshots to the hashes.
  try {
    const audit:Record<string,string|number|null>=JSON.parse(event.snapshot);
    const auditHash=await sha256(`${audit.sequence===1?'GENESIS':audit.previous}|${audit.sequence}|${audit.actor}|${audit.action}|${audit.type}|${audit.target}|${audit.outcome}|${audit.reason}|${audit.time}`);
    if(auditHash!==verified.receipt.auditHash || audit.hash!==auditHash) throw stale();
    const saved:{title:string;duration:number;dual:number}=JSON.parse(source.snapshot);
    const manifest=await (request.expectedMode==='lecture'?parseAndVerifyLectureManifest:parseAndVerifyAssessmentManifest)(source.manifest_json,identity.expectedSourceHash);
    if(manifest.workbook.id!==identity.id || manifest.workbook.version!==identity.expectedVersion ||
      manifest.workbook.mode!==identity.expectedMode || manifest.workbook.title!==saved.title) throw stale();
    if('assessment' in manifest) {
      const [status,viewer,dual]:unknown[]=JSON.parse(source.extra);
      if(status!=='published' || viewer!==manifest.viewer.coreVersion || saved.duration!==manifest.assessment.durationMinutes ||
        ![0,1].includes(saved.dual) || dual!==saved.dual || (saved.dual===1)!==manifest.assessment.displayPolicy.dualDisplayAllowed) throw stale();
    } else if(saved.duration!==0 || saved.dual!==0) throw stale();
  } catch { throw stale(); }
  // Direct binding queries stay on the primary; no replication configuration changes.
  const final=await env.DB.prepare(`SELECT 1 AS allowed ${targetFrom}
    JOIN audit_events a ON a.id=? LEFT JOIN audit_events previous ON previous.sequence=a.sequence-1
    WHERE ${targetGuard} AND d.module_id=? AND d.title=? AND ${auditSnapshot}=?
    AND (SELECT COUNT(*) FROM audit_events duplicate WHERE duplicate.target_id=d.id AND duplicate.actor_id=da.author_id
      AND duplicate.action='workbook.correction-draft-created' AND duplicate.target_type='workbook' AND duplicate.outcome='success')=1
    AND EXISTS (SELECT 1 ${sourceFrom} WHERE ${sourceGuard} AND ${sourceMetadataSnapshot}=? AND v.manifest_json=? AND ${extraSource}=?)`)
    .bind(auth.userId,event.id,...targetValues.slice(1),target.module_id,target.title,event.snapshot,
      ...sourceValues,source.snapshot,source.manifest_json,source.extra).first();
  if(!final) throw stale();
  const result=parseWorkbookCorrectionLineage({...base,outcome:'verified',source:{workbookId:identity.id,
    version:identity.expectedVersion,hash:identity.expectedSourceHash}},request);
  if(!result) throw stale();
  return result;
}
