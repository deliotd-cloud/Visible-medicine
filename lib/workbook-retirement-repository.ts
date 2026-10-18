import { env } from 'cloudflare:workers';
import type { AuthContext } from '@/lib/auth';
import { ensureEducationUser } from '@/db/bootstrap';
import { getPlatformSnapshot } from '@/db/platform';
import { parseWorkbookRetirementRequest, type WorkbookRetirementReceipt } from '@/lib/workbook-retirement-contract';

export class WorkbookRetirementError extends Error {
  constructor(message: string, public status = 400) { super(message); this.name = 'WorkbookRetirementError'; }
}

// These predicates are used in both preflight and the atomic commit. A platform
// snapshot is navigation context, not sufficient evidence of current authority.
const authority = `EXISTS (
  SELECT 1 FROM users u
  JOIN account_security_profiles p ON p.user_id = u.id
  JOIN organization_memberships om ON om.user_id = u.id
  JOIN organizations o ON o.id = om.organization_id
  JOIN organization_entitlements e ON e.organization_id = o.id
  WHERE u.id = ? AND o.id = ? AND p.status = 'active'
    AND om.status = 'active' AND o.status = 'active'
    AND e.status = 'active' AND e.studio_access = 1
    AND (e.valid_until IS NULL OR
      (e.valid_until = strftime('%Y-%m-%dT%H:%M:%fZ', e.valid_until)
       AND e.valid_until > strftime('%Y-%m-%dT%H:%M:%fZ','now')))
    AND (instr(',' || u.roles || ',', ',instructor,') > 0
      OR instr(',' || u.roles || ',', ',examiner,') > 0
      OR instr(',' || u.roles || ',', ',administrator,') > 0)
)`;
const noPrerequisites = `NOT EXISTS (
  SELECT 1 FROM workbook_assignment_rules r JOIN workbook_assignments a ON a.id = r.assignment_id
  WHERE r.prerequisite_workbook_id = ? AND a.status = 'active'
) AND NOT EXISTS (
  SELECT 1 FROM cohort_workbook_assignments ca JOIN cohorts c ON c.id = ca.cohort_id
  WHERE ca.prerequisite_workbook_id = ? AND ca.status = 'active' AND c.status = 'active'
)`;
const noOpenActivity = `NOT EXISTS (
  SELECT 1 FROM teaching_sessions WHERE workbook_id = ? AND state = 'live'
) AND NOT EXISTS (
  SELECT 1 FROM attempts a JOIN assessment_versions av ON av.id = a.assessment_version_id
  WHERE av.workbook_id = ? AND a.state IN ('assigned','in-progress','reopened','expired','submitting')
)`;

export async function retireStudioWorkbook(auth: AuthContext, id: string, input: unknown): Promise<WorkbookRetirementReceipt> {
  const request = parseWorkbookRetirementRequest(input, id);
  if (!request) throw new WorkbookRetirementError('Confirm the current published version, disposition and a reason of up to 1,000 characters.', 422);
  const user = await ensureEducationUser(auth);
  if (user.status !== 'active' || !user.roles.some(role => ['instructor','examiner','administrator'].includes(role)))
    throw new WorkbookRetirementError('Active Studio educator access is required.', 403);
  const platform = await getPlatformSnapshot(auth);
  const organizationId = platform.organization?.id;
  if (!organizationId || !platform.entitlement?.studioAccess ||
      !await env.DB.prepare(`SELECT 1 AS allowed WHERE ${authority}`).bind(auth.userId, organizationId).first())
    throw new WorkbookRetirementError('Active Studio access for this institution is required.', 403);
  const workbook = await env.DB.prepare(`SELECT w.id, w.title, w.mode, w.status, w.version
    FROM workbooks w JOIN modules m ON m.id = w.module_id
    JOIN course_ownership co ON co.course_id = m.course_id
    WHERE w.id = ? AND co.organization_id = ?`).bind(id, organizationId)
    .first<{id: string; title: string; mode: string; status: string; version: number}>();
  if (!workbook) throw new WorkbookRetirementError('Workbook not found in this institution.', 404);
  if (workbook.status !== 'published' || workbook.version !== request.expectedVersion)
    throw new WorkbookRetirementError('Only the current published version can be archived or withdrawn. Refresh before continuing.', 409);
  if (!await env.DB.prepare(`SELECT 1 AS allowed WHERE ${noPrerequisites}`).bind(id,id).first())
    throw new WorkbookRetirementError('Remove this workbook from active prerequisite rules before retiring it.', 409);
  if (request.disposition === 'archived' && !await env.DB.prepare(`SELECT 1 AS allowed WHERE ${noOpenActivity}`).bind(id,id).first())
    throw new WorkbookRetirementError('End live teaching and open attempts before routine archival. Withdrawal is an urgent access stop.', 409);

  const previous = await env.DB.prepare('SELECT sequence, integrity_hash FROM audit_events ORDER BY sequence DESC LIMIT 1')
    .first<{sequence: number; integrity_hash: string}>();
  if (previous && (!Number.isSafeInteger(previous.sequence) || previous.sequence < 1 || !/^[a-f0-9]{64}$/.test(previous.integrity_hash)))
    throw new WorkbookRetirementError('The audit chain requires administrator review before this change.', 503);
  const sequence = (previous?.sequence ?? 0) + 1;
  if (!Number.isSafeInteger(sequence)) throw new WorkbookRetirementError('The audit chain requires administrator review before this change.',503);
  const previousHash = previous?.integrity_hash ?? 'GENESIS';
  const retiredAt = new Date().toISOString();
  const auditId = crypto.randomUUID();
  const action = `workbook.${request.disposition}`;
  const reason = JSON.stringify({schema:'vm-workbook-retirement-audit-1',workbookVersion:request.expectedVersion,
    title:workbook.title,mode:workbook.mode,disposition:request.disposition,reason:request.reason,organizationId,evidencePreserved:true});
  const hashBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(
    `${previousHash}|${sequence}|${auth.userId}|${action}|workbook|${id}|success|${reason}|${retiredAt}`));
  const auditHash = Array.from(new Uint8Array(hashBytes), byte => byte.toString(16).padStart(2,'0')).join('');

  // The fresh audit UUID is the operation gate, not an already-retired status.
  // D1 batch is transactional: any statement failure rolls back every effect.
  const auditGate = `EXISTS (SELECT 1 FROM audit_events WHERE id = ? AND integrity_hash = ?)`;
  const auditGuardValues = [auth.userId,organizationId,id,organizationId,request.expectedVersion,workbook.title,workbook.mode,
    previous?.sequence ?? 0,previousHash,id,id,...(request.disposition === 'archived' ? [id,id] : [])];
  const statements = [
    env.DB.prepare(`INSERT INTO audit_events
      (id,sequence,actor_id,action,target_type,target_id,outcome,reason,occurred_at,integrity_hash)
      SELECT ?,?,?,?,'workbook',?,'success',?,?,? WHERE ${authority}
      AND EXISTS (SELECT 1 FROM workbooks w JOIN modules m ON m.id=w.module_id
        JOIN course_ownership co ON co.course_id=m.course_id
        WHERE w.id=? AND co.organization_id=? AND w.status='published' AND w.version=? AND w.title=? AND w.mode=?)
      AND COALESCE((SELECT sequence FROM audit_events ORDER BY sequence DESC LIMIT 1),0)=?
      AND COALESCE((SELECT integrity_hash FROM audit_events ORDER BY sequence DESC LIMIT 1),'GENESIS')=?
      AND ${noPrerequisites}${request.disposition === 'archived' ? ` AND ${noOpenActivity}` : ''}`)
      .bind(auditId,sequence,auth.userId,action,id,reason,retiredAt,auditHash,...auditGuardValues),
    env.DB.prepare(`UPDATE workbooks SET status=? WHERE id=? AND status='published' AND version=? AND ${auditGate}`)
      .bind(request.disposition,id,request.expectedVersion,auditId,auditHash),
    env.DB.prepare(`UPDATE workbook_assignments SET status='revoked',revoked_at=?,version=version+1
      WHERE workbook_id=? AND status='active' AND ${auditGate}`).bind(retiredAt,id,auditId,auditHash),
    env.DB.prepare(`UPDATE cohort_workbook_assignments SET status='revoked',revoked_at=?,version=version+1
      WHERE workbook_id=? AND status='active' AND ${auditGate}`).bind(retiredAt,id,auditId,auditHash),
    env.DB.prepare(`UPDATE teaching_poll_runs SET state='closed',closed_at=?,version=version+1
      WHERE poll_id IN (SELECT id FROM teaching_polls WHERE workbook_id=?) AND state='open' AND ${auditGate}`)
      .bind(retiredAt,id,auditId,auditHash),
    env.DB.prepare(`UPDATE teaching_sessions SET state='ended',ended_at=?,updated_at=?,version=version+1
      WHERE workbook_id=? AND state='live' AND ${auditGate}`).bind(retiredAt,retiredAt,id,auditId,auditHash),
  ];
  if (request.disposition === 'withdrawn') statements.push(
    env.DB.prepare(`UPDATE attempts SET state='voided'
      WHERE assessment_version_id IN (SELECT id FROM assessment_versions WHERE workbook_id=?)
      AND state IN ('assigned','in-progress','reopened','expired','submitting')
      AND NOT EXISTS (SELECT 1 FROM submissions s WHERE s.attempt_id=attempts.id) AND ${auditGate}`)
      .bind(id,auditId,auditHash));
  const committed = await env.DB.batch(statements);
  if (Number(committed[0]?.meta.changes ?? 0) !== 1)
    throw new WorkbookRetirementError('The workbook, access, activity or audit chain changed. Refresh and review before trying again.', 409);
  // No snapshot read here: a failed postcommit read must not invite a replay.
  return {ok:true,action:request.action,workbookId:id,workbookVersion:request.expectedVersion,
    disposition:request.disposition,auditId,auditHash,retiredAt};
}
