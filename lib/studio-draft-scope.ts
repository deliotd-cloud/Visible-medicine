// Device recovery namespace only. Studio mutations still use server authorization.
export type StudioDraftScope = { actorId: string; organizationId: string };

function validPart(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 256 &&
    value.trim() === value && !/[\u0000-\u001f\u007f]/.test(value);
}

export function studioDraftScopedKey(scope: StudioDraftScope | undefined, formKey: string): string | null {
  if (!scope || !validPart(scope.actorId) || !validPart(scope.organizationId) ||
      !scope.actorId.startsWith("edu:") || !validPart(scope.actorId.slice(4)) || !validPart(formKey)) return null;
  return JSON.stringify(["v1", scope.actorId, scope.organizationId, formKey]);
}

export function studioDraftBoundaryKey(scope: StudioDraftScope | undefined, formKey: string): string {
  const scoped = studioDraftScopedKey(scope, formKey);
  if (scoped) return scoped;
  // Invalid contexts never touch storage. Distinguish their render boundaries
  // so a changed malformed prop cannot keep the previous open DOM input.
  return JSON.stringify(["unavailable", typeof scope?.actorId === "string" ? scope.actorId : null,
    typeof scope?.organizationId === "string" ? scope.organizationId : null, formKey]);
}
