import type { StudioInvitation, StudioInvitationPage } from "./education-platform";

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function keys(value: Record<string, unknown>, expected: string[]) {
  return Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key));
}
function text(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max && value.trim() === value && !/[\u0000-\u001f\u007f]/.test(value);
}
function date(value: unknown): value is string { return text(value, 64) && Number.isFinite(Date.parse(value)); }
export function parseStudioInvitationPage(value: unknown, releaseId: string): StudioInvitationPage | null {
  if (!record(value) || !keys(value, ["ok", "action", "releaseId", "checkedAt", "invitations", "nextCursor"]) ||
      value.ok !== true || value.action !== "list-course-invitations" || value.releaseId !== releaseId || !date(value.checkedAt) ||
      !Array.isArray(value.invitations) || value.invitations.length > 50) return null;
  const ids = new Set<string>(), invitations: StudioInvitation[] = [];
  for (const row of value.invitations) {
    if (!record(row) || !keys(row, ["id", "label", "status", "uses", "maxUses", "createdAt", "expiresAt"]) ||
        !text(row.id, 160) || !text(row.label, 200) || !text(row.status, 64) || !date(row.createdAt) || !date(row.expiresAt) ||
        !Number.isSafeInteger(row.uses) || Number(row.uses) < 0 || !Number.isSafeInteger(row.maxUses) || Number(row.maxUses) < 1 || ids.has(row.id)) return null;
    ids.add(row.id);
    invitations.push({ id: row.id, label: row.label, status: row.status, uses: Number(row.uses), maxUses: Number(row.maxUses), createdAt: row.createdAt, expiresAt: row.expiresAt });
  }
  const cursor = value.nextCursor, last = invitations.at(-1);
  if (cursor !== null && (!record(cursor) || !keys(cursor, ["createdAt", "id"]) || !last || invitations.length !== 50 || cursor.id !== last.id || cursor.createdAt !== last.createdAt)) return null;
  return { releaseId, checkedAt: value.checkedAt, invitations, nextCursor: cursor === null ? null : { id: last!.id, createdAt: last!.createdAt } };
}
export function isStudioInvitationRevocation(value: unknown, invitationId: string): boolean {
  return record(value) && keys(value, ["ok", "action", "invitationId", "status"]) && value.ok === true &&
    value.action === "revoke-course-invitation" && value.invitationId === invitationId && value.status === "revoked";
}
