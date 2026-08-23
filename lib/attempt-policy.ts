export type AttemptWriteDecision =
  | { allowed: true }
  | {
      allowed: false;
      expire: boolean;
      reason: "preflight-required" | "not-open" | "deadline-expired";
    };

export function decideAttemptWrite(input: {
  state: string;
  deadlineAt: string | null;
  preflightPassedAt: string | null;
  now: Date;
}): AttemptWriteDecision {
  if (!input.preflightPassedAt)
    return { allowed: false, expire: false, reason: "preflight-required" };
  if (!new Set(["in-progress", "reopened"]).has(input.state))
    return { allowed: false, expire: false, reason: "not-open" };

  const deadline = input.deadlineAt ? Date.parse(input.deadlineAt) : Number.NaN;
  if (!Number.isFinite(deadline) || deadline <= input.now.getTime())
    return { allowed: false, expire: true, reason: "deadline-expired" };
  return { allowed: true };
}

export function remainingAttemptSeconds(
  deadlineAt: string | null,
  now: Date,
): number | null {
  if (!deadlineAt) return null;
  const deadline = Date.parse(deadlineAt);
  if (!Number.isFinite(deadline)) return null;
  return Math.max(0, Math.ceil((deadline - now.getTime()) / 1_000));
}
