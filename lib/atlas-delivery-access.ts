import { AtlasModelError } from './atlas-model-storage.ts';

export type AtlasDeliveryPolicy = {
  audience: 'administrator-review' | 'reviewed-learner';
  manifestRevision: string;
  approvedRevision?: string;
};

/** No provisioning, schema creation, role changes, entitlement defaults or cache.
 * A primary read ensures a revoked membership is not served from a replica. */
export async function authorizeAtlasDelivery(
  db: Pick<D1Database, 'withSession'>,
  subject: string | null,
  policy: AtlasDeliveryPolicy,
  now = new Date(),
): Promise<void> {
  if (!subject) throw new AtlasModelError('Sign in to Visible Medicine to open this model.', 401);
  if (!/^[a-f0-9]{64}$/.test(policy.manifestRevision)) throw new AtlasModelError('Atlas release is unavailable.', 503);
  const session = db.withSession('first-primary');
  const userId = `edu:${subject}`;
  const user = await session.prepare(`SELECT u.roles, s.status
    FROM users u JOIN account_security_profiles s ON s.user_id = u.id
    WHERE u.id = ? AND u.external_subject = ?`).bind(userId, `sites:${subject}`).first<{ roles: string; status: string }>();
  if (!user || user.status !== 'active') throw new AtlasModelError('An active education account is required.', 403);
  if (policy.audience === 'administrator-review') {
    if (user.roles.split(',').includes('administrator')) return;
    throw new AtlasModelError('This draft Atlas is available for administrator review only.', 403);
  }
  if (policy.audience !== 'reviewed-learner' || policy.approvedRevision !== policy.manifestRevision) {
    throw new AtlasModelError('This Atlas revision has not been released for learners.', 403);
  }
  // Atlas grants do not consult course enrolment, Studio access or case rights.
  // Unknown, revoked, expired and malformed-expiry entitlements fail closed.
  const permitted = await session.prepare(`SELECT m.organization_id
    FROM organization_memberships m
    JOIN organizations o ON o.id = m.organization_id
    JOIN organization_entitlements e ON e.organization_id = o.id
    WHERE m.user_id = ? AND m.status = 'active' AND o.status = 'active'
      AND e.atlas_access = 1 AND e.status IN ('active', 'evaluation')
      AND (e.valid_until IS NULL OR (
        strftime('%Y-%m-%dT%H:%M:%fZ', e.valid_until) = e.valid_until
        AND julianday(e.valid_until) > julianday(?)
      )) LIMIT 1`).bind(userId, now.toISOString()).first();
  if (!permitted) throw new AtlasModelError('A current Atlas entitlement is required. Lecture and imaging access are separate.', 403);
}
