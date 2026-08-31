export const CURRENT_TERMS_VERSION = "2026-08-31";
export const CURRENT_PRIVACY_VERSION = "2026-08-31";

export const ACCOUNT_STATUSES = [
  "active",
  "restricted",
  "deletion-pending",
  "deactivated",
] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export function identityProviderForSubject(externalSubject: string) {
  if (externalSubject.startsWith("sites:")) return "openai-sites";
  if (externalSubject.startsWith("local:")) return "local-evaluation";
  if (externalSubject.startsWith("seed:")) return "seed-fixture";
  return "external-identity";
}

export function accountMayWrite(status: string) {
  return status === "active";
}

export function consentIsCurrent(input: {
  termsVersion?: string | null;
  privacyVersion?: string | null;
  termsAcceptedAt?: string | null;
  privacyAcceptedAt?: string | null;
}) {
  return Boolean(
    input.termsAcceptedAt &&
      input.privacyAcceptedAt &&
      input.termsVersion === CURRENT_TERMS_VERSION &&
      input.privacyVersion === CURRENT_PRIVACY_VERSION,
  );
}

export function learnerOnboardingStatus(input: {
  profileStatus?: string | null;
  termsVersion?: string | null;
  privacyVersion?: string | null;
  termsAcceptedAt?: string | null;
  privacyAcceptedAt?: string | null;
}) {
  if (!input.profileStatus || input.profileStatus === "not-started") return "not-started";
  return consentIsCurrent(input) ? "complete" : "consent-required";
}

export function accountWriteBlockReason(status: string) {
  if (status === "restricted") return "This account is restricted while an account request is reviewed.";
  if (status === "deletion-pending") return "This account is awaiting deletion review and cannot make new changes.";
  if (status === "deactivated") return "This account is deactivated.";
  return null;
}
