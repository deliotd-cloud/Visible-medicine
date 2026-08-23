export type WorkbookAccessRule = {
  availableFrom: string | null;
  expiresAt: string | null;
  prerequisiteWorkbookId: string | null;
  prerequisiteMinPercent: number;
  prerequisitePercent: number | null;
};

export type WorkbookAccessDecision =
  | { allowed: true; reason: "available" }
  | { allowed: false; reason: "not-yet-open" | "expired" | "prerequisite-incomplete" };

export function decideWorkbookAccess(
  rule: WorkbookAccessRule,
  now = new Date(),
): WorkbookAccessDecision {
  const nowMs = now.getTime();
  if (rule.availableFrom && Date.parse(rule.availableFrom) > nowMs)
    return { allowed: false, reason: "not-yet-open" };
  if (rule.expiresAt && Date.parse(rule.expiresAt) <= nowMs)
    return { allowed: false, reason: "expired" };
  if (
    rule.prerequisiteWorkbookId &&
    (rule.prerequisitePercent ?? 0) < rule.prerequisiteMinPercent
  )
    return { allowed: false, reason: "prerequisite-incomplete" };
  return { allowed: true, reason: "available" };
}

export function validateAssignmentWindow(
  availableFrom: string | null,
  dueAt: string | null,
  expiresAt: string | null,
) {
  const available = availableFrom ? Date.parse(availableFrom) : null;
  const due = dueAt ? Date.parse(dueAt) : null;
  const expires = expiresAt ? Date.parse(expiresAt) : null;
  if ([available, due, expires].some((value) => value !== null && Number.isNaN(value)))
    return false;
  if (available !== null && due !== null && due < available) return false;
  if (available !== null && expires !== null && expires <= available) return false;
  if (due !== null && expires !== null && expires < due) return false;
  return true;
}
