function errorDetails(error: unknown): string[] {
  const details: string[] = [];
  const visited = new Set<unknown>();
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current && !visited.has(current); depth += 1) {
    visited.add(current);
    if (current instanceof Error) details.push(current.message, current.name);
    if (typeof current === "object") {
      const record = current as Record<string, unknown>;
      for (const key of ["message", "code", "cause"] as const) {
        const value = record[key];
        if (typeof value === "string") details.push(value);
      }
      current = record.cause;
    } else current = null;
  }
  return details;
}

export function isAuditSequenceCollision(error: unknown): boolean {
  const details = errorDetails(error).join(" ").toLowerCase();
  const namesAuditSequence =
    details.includes("audit_events.sequence") ||
    details.includes("idx_audit_sequence");
  const isUniqueConstraint =
    details.includes("unique constraint failed") ||
    details.includes("sqlite_constraint_unique");
  return namesAuditSequence && isUniqueConstraint;
}
