import assert from "node:assert/strict";
import test from "node:test";

import { emailProviderReadiness, getEmailProviderConfig, organizationInvitationEmail } from "../lib/transactional-email.ts";

test("email delivery stays held until every Cloudflare provider setting exists", () => {
  assert.deepEqual(emailProviderReadiness(getEmailProviderConfig({})), { ready: false, reason: "EMAIL_PROVIDER_DISABLED" });
  assert.deepEqual(emailProviderReadiness(getEmailProviderConfig({ EMAIL_PROVIDER: "cloudflare-email" })), { ready: false, reason: "EMAIL_PROVIDER_INCOMPLETE" });
  assert.deepEqual(emailProviderReadiness(getEmailProviderConfig({ EMAIL_PROVIDER: "cloudflare-email", CLOUDFLARE_ACCOUNT_ID: "account", CLOUDFLARE_EMAIL_API_TOKEN: "secret", EMAIL_FROM_ADDRESS: "education@example.org", PUBLIC_SITE_URL: "https://example.org/" })), { ready: true, reason: "READY" });
});

test("invitation templates contain an expiring link and escape supplied HTML", () => {
  const message = organizationInvitationEmail({ organizationName: "A & B <School>", role: "learner", invitationUrl: "https://example.org/join/token?a=1&b=2", expiresAt: "2026-09-14" });
  assert.match(message.text, /https:\/\/example\.org\/join\/token/);
  assert.match(message.html, /A &amp; B &lt;School&gt;/);
  assert.doesNotMatch(message.html, /<School>/);
});
