import { safeText } from "@/lib/domain";

export type LtiDraft = {
  issuer: string;
  clientId: string;
  deploymentId: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  jwksEndpoint: string;
};

export type LtiIntegrationView = LtiDraft & {
  id: string;
  status: "draft";
  version: number;
  updatedAt: string;
};

export class IntegrationValidationError extends Error {}

function httpsUrl(value: unknown, label: string) {
  const text = safeText(value, 1_000).trim();
  try {
    const parsed = new URL(text);
    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      parsed.hash
    )
      throw new Error();
    return parsed.toString();
  } catch {
    throw new IntegrationValidationError(
      `${label} must be a valid HTTPS address without credentials or a fragment.`,
    );
  }
}

export function validateLtiDraft(value: unknown): LtiDraft {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new IntegrationValidationError("LTI configuration must be an object.");
  const input = value as Record<string, unknown>;
  const allowed = [
    "issuer",
    "clientId",
    "deploymentId",
    "authorizationEndpoint",
    "tokenEndpoint",
    "jwksEndpoint",
  ];
  const unsupported = Object.keys(input).find((key) => !allowed.includes(key));
  if (unsupported)
    throw new IntegrationValidationError(
      `LTI configuration contains unsupported field ${unsupported}.`,
    );
  const clientId = safeText(input.clientId, 240).trim();
  const deploymentId = safeText(input.deploymentId, 240).trim();
  if (!clientId || !deploymentId)
    throw new IntegrationValidationError(
      "LTI client and deployment identifiers are required.",
    );
  return {
    issuer: httpsUrl(input.issuer, "Issuer"),
    clientId,
    deploymentId,
    authorizationEndpoint: httpsUrl(
      input.authorizationEndpoint,
      "Authorization endpoint",
    ),
    tokenEndpoint: httpsUrl(input.tokenEndpoint, "Token endpoint"),
    jwksEndpoint: httpsUrl(input.jwksEndpoint, "JWKS endpoint"),
  };
}
