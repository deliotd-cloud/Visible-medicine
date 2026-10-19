// Temporary fail-closed hold until atomic invitation redemption and retry safety
// are implemented and verified. No environment or client override is supported.
export const INVITATION_SELF_ENROLMENT_ENABLED = false;
export const INVITATION_SELF_ENROLMENT_HOLD_MESSAGE =
  "Invitation self-enrolment is temporarily unavailable during private evaluation. Existing or instructor-assigned course access is unchanged.";
