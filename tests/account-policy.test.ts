import assert from "node:assert/strict";
import test from "node:test";

import {
  accountMayWrite,
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
  identityProviderForSubject,
  learnerOnboardingStatus,
} from "../lib/account-policy.ts";

test("requires both current terms and privacy consent for completed onboarding", () => {
  assert.equal(learnerOnboardingStatus({ profileStatus: "complete", termsVersion: "old", privacyVersion: "old", termsAcceptedAt: "2026-01-01", privacyAcceptedAt: "2026-01-01" }), "consent-required");
  assert.equal(learnerOnboardingStatus({ profileStatus: "complete", termsVersion: CURRENT_TERMS_VERSION, privacyVersion: CURRENT_PRIVACY_VERSION, termsAcceptedAt: "2026-08-31", privacyAcceptedAt: "2026-08-31" }), "complete");
});

test("restricted lifecycle states cannot create new education records", () => {
  assert.equal(accountMayWrite("active"), true);
  assert.equal(accountMayWrite("restricted"), false);
  assert.equal(accountMayWrite("deletion-pending"), false);
  assert.equal(accountMayWrite("deactivated"), false);
});

test("records the authentication boundary without treating it as a clinical identity", () => {
  assert.equal(identityProviderForSubject("sites:123"), "openai-sites");
  assert.equal(identityProviderForSubject("local:demo"), "local-evaluation");
  assert.equal(identityProviderForSubject("hospital:subject"), "external-identity");
});
