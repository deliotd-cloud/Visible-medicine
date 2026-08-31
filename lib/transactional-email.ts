export type TransactionalEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type EmailDeliveryResult = {
  status: "sent" | "held" | "failed";
  reason: string;
  sentAt: string | null;
};

export type EmailProviderConfig = {
  provider: string;
  accountId: string;
  apiToken: string;
  fromAddress: string;
  publicSiteUrl: string;
};

export function getEmailProviderConfig(source: Record<string, string | undefined> = process.env): EmailProviderConfig {
  return {
    provider: source.EMAIL_PROVIDER?.trim().toLowerCase() ?? "disabled",
    accountId: source.CLOUDFLARE_ACCOUNT_ID?.trim() ?? "",
    apiToken: source.CLOUDFLARE_EMAIL_API_TOKEN?.trim() ?? "",
    fromAddress: source.EMAIL_FROM_ADDRESS?.trim() ?? "",
    publicSiteUrl: (source.PUBLIC_SITE_URL?.trim() ?? "").replace(/\/$/, ""),
  };
}

export function emailProviderReadiness(config = getEmailProviderConfig()) {
  if (config.provider === "disabled" || !config.provider) return { ready: false, reason: "EMAIL_PROVIDER_DISABLED" };
  if (config.provider !== "cloudflare-email") return { ready: false, reason: "EMAIL_PROVIDER_UNSUPPORTED" };
  if (!config.accountId || !config.apiToken || !config.fromAddress || !config.publicSiteUrl)
    return { ready: false, reason: "EMAIL_PROVIDER_INCOMPLETE" };
  if (!/^https:\/\//i.test(config.publicSiteUrl)) return { ready: false, reason: "EMAIL_PUBLIC_URL_INVALID" };
  return { ready: true, reason: "READY" };
}

export async function sendTransactionalEmail(message: TransactionalEmail): Promise<EmailDeliveryResult> {
  const config = getEmailProviderConfig();
  const readiness = emailProviderReadiness(config);
  if (!readiness.ready) return { status: "held", reason: readiness.reason, sentAt: null };

  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(config.accountId)}/email/sending/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: message.to, from: config.fromAddress, subject: message.subject, html: message.html, text: message.text }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return { status: "failed", reason: "EMAIL_PROVIDER_REJECTED", sentAt: null };
    return { status: "sent", reason: "DELIVERED_TO_PROVIDER", sentAt: new Date().toISOString() };
  } catch {
    return { status: "failed", reason: "EMAIL_PROVIDER_UNAVAILABLE", sentAt: null };
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

export function organizationInvitationEmail(input: { organizationName: string; role: string; invitationUrl: string; expiresAt: string }): Omit<TransactionalEmail, "to"> {
  const organization = input.organizationName.trim() || "a Visible Medicine institution";
  const subject = `Invitation to join ${organization} on Visible Medicine`;
  const text = `You have been invited to join ${organization} as ${input.role}. Accept the invitation: ${input.invitationUrl}\n\nThis education-only invitation expires ${input.expiresAt}. If you were not expecting it, you can ignore this email.`;
  const html = `<h1>Join ${escapeHtml(organization)}</h1><p>You have been invited to join as <strong>${escapeHtml(input.role)}</strong>.</p><p><a href="${escapeHtml(input.invitationUrl)}">Accept invitation</a></p><p>This education-only invitation expires ${escapeHtml(input.expiresAt)}. If you were not expecting it, you can ignore this email.</p>`;
  return { subject, text, html };
}

export function courseEnrolmentEmail(input: { courseTitle: string; courseUrl: string }): Omit<TransactionalEmail, "to"> {
  return {
    subject: `You are enrolled: ${input.courseTitle}`,
    text: `Your Visible Medicine enrolment in ${input.courseTitle} is confirmed. Continue your course: ${input.courseUrl}`,
    html: `<h1>Enrolment confirmed</h1><p>You are enrolled in <strong>${escapeHtml(input.courseTitle)}</strong>.</p><p><a href="${escapeHtml(input.courseUrl)}">Continue your course</a></p>`,
  };
}
