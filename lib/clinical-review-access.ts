/** Website-only personal review permission. Never provisions users or grants
 * learner, case, lecture, publication or institution-signature authority. */
export class ClinicalReviewAccessError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

export async function clinicalReviewPrincipal(db: Pick<D1Database, 'withSession'>, subject: string | null) {
  if (!subject) throw new ClinicalReviewAccessError(401, 'Sign in to open Clinical Review.');
  const session = db.withSession('first-primary');
  const userId = `edu:${subject}`;
  const row = await session.prepare(`SELECT u.roles, m.organization_id, m.role
    FROM users u JOIN account_security_profiles s ON s.user_id = u.id
    JOIN organization_memberships m ON m.user_id = u.id
    JOIN organizations o ON o.id = m.organization_id
    WHERE u.id = ? AND u.external_subject = ? AND s.status = 'active'
      AND m.status = 'active' AND o.status = 'active'
      AND m.role IN ('owner', 'administrator')
    ORDER BY o.created_at, o.id LIMIT 1`).bind(userId, `sites:${subject}`)
    .first<{ roles: string; organization_id: string; role: string }>();
  // Explicit initial reviewer policy: a website administrator who also has an
  // active owner/administrator membership. General staff visibility is insufficient.
  if (!row || !row.roles.split(',').includes('administrator'))
    throw new ClinicalReviewAccessError(403, 'Clinical Review requires an active administrator account and institution owner or administrator membership.');
  return {
    userId, organizationId: row.organization_id, session,
    // Stable, versioned and collision-free adapter. No raw Atlas records or
    // personal decisions from another institution are silently inherited.
    storageKey: JSON.stringify(['vm-website-personal-review-1', userId, row.organization_id]),
  };
}
