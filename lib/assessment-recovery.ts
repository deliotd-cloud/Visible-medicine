export const ASSESSMENT_RECOVERY_TARGET_SCHEMA =
  "didanix-education-assessment-manifest-v2";

export const ASSESSMENT_RECOVERY_EXCLUSIONS = [
  "attempts",
  "answers",
  "annotations",
  "key images",
  "marks",
  "moderation decisions",
  "results",
  "candidate assignments",
] as const;

export function assessmentRecoveryEligibility(input: {
  mode: string;
  status: string;
  integrityVerified: boolean;
  roles: readonly string[];
}) {
  if (!input.roles.includes("administrator"))
    return { eligible: false, reason: "Administrator access is required." } as const;
  if (input.mode !== "assessment" || input.status !== "published")
    return {
      eligible: false,
      reason: "Only an unavailable published assessment can be recovered.",
    } as const;
  if (input.integrityVerified)
    return {
      eligible: false,
      reason: "This assessment is already integrity-verified; use the normal clone action.",
    } as const;
  return {
    eligible: true,
    reason: "Create a new draft from the current reviewed case links.",
  } as const;
}

export function assessmentRecoveryDraftTitle(sourceTitle: string) {
  const suffix = " — v2 recovery draft";
  const available = Math.max(1, 160 - suffix.length);
  return `${sourceTitle.trim().slice(0, available).trimEnd()}${suffix}`;
}
