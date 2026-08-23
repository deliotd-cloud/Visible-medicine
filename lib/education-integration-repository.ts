import { env } from "cloudflare:workers";
import type { AuthContext } from "@/lib/auth";
import { appendAudit, ensureEducationUser } from "@/db/bootstrap";
import { EducationApiError } from "@/lib/education-api";
import {
  validateLtiDraft,
  type LtiIntegrationView,
} from "@/lib/education-integrations";

type Row = Record<string, string | number | null>;

async function requireAdministrator(auth: AuthContext) {
  await ensureEducationUser(auth);
  const user = await env.DB.prepare(`SELECT roles FROM users WHERE id = ?`)
    .bind(auth.userId)
    .first<{ roles: string }>();
  if (!user?.roles.split(",").includes("administrator"))
    throw new EducationApiError(
      "Only an education administrator can manage interoperability settings.",
      403,
    );
}

function map(row: Row): LtiIntegrationView {
  return {
    id: String(row.id),
    issuer: String(row.issuer),
    clientId: String(row.client_id),
    deploymentId: String(row.deployment_id),
    authorizationEndpoint: String(row.authorization_endpoint),
    tokenEndpoint: String(row.token_endpoint),
    jwksEndpoint: String(row.jwks_endpoint),
    status: "draft",
    version: Number(row.version),
    updatedAt: String(row.updated_at),
  };
}

export async function getEducationIntegrations(auth: AuthContext) {
  await requireAdministrator(auth);
  const row = await env.DB.prepare(
    `SELECT * FROM education_integrations WHERE kind = 'lti-1.3'`,
  ).first<Row>();
  return {
    oidc: {
      status: "host-adapter",
      purpose: "Course website single sign-on",
      productionRegistrationRequired: true,
    },
    lti: row ? map(row) : null,
    activation: {
      status: "inactive",
      launchEndpointImplemented: false,
      institutionalRegistrationRequired: true,
      secretsAcceptedByThisForm: false,
    },
    refreshedAt: new Date().toISOString(),
  };
}

export async function saveLtiDraft(
  auth: AuthContext,
  value: unknown,
  expectedVersionValue: unknown,
) {
  await requireAdministrator(auth);
  const draft = validateLtiDraft(value);
  const expectedVersion = Number(expectedVersionValue);
  if (!Number.isInteger(expectedVersion) || expectedVersion < 0)
    throw new EducationApiError(
      "expectedVersion must be a non-negative integer.",
      422,
    );
  const current = await env.DB.prepare(
    `SELECT id, version FROM education_integrations WHERE kind = 'lti-1.3'`,
  ).first<{ id: string; version: number }>();
  if ((current?.version ?? 0) !== expectedVersion)
    throw new EducationApiError(
      "The LTI draft changed before it could be saved. Refresh and try again.",
      409,
    );
  const now = new Date().toISOString();
  const nextVersion = expectedVersion + 1;
  const id = current?.id ?? crypto.randomUUID();
  if (current) {
    const result = await env.DB.prepare(
      `UPDATE education_integrations
       SET issuer = ?, client_id = ?, deployment_id = ?, authorization_endpoint = ?,
           token_endpoint = ?, jwks_endpoint = ?, status = 'draft', version = ?,
           updated_at = ?
       WHERE id = ? AND version = ?`,
    )
      .bind(
        draft.issuer,
        draft.clientId,
        draft.deploymentId,
        draft.authorizationEndpoint,
        draft.tokenEndpoint,
        draft.jwksEndpoint,
        nextVersion,
        now,
        id,
        expectedVersion,
      )
      .run();
    if (Number(result.meta.changes ?? 0) !== 1)
      throw new EducationApiError("The LTI draft has a version conflict.", 409);
  } else {
    await env.DB.prepare(
      `INSERT INTO education_integrations (id, kind, issuer, client_id, deployment_id, authorization_endpoint, token_endpoint, jwks_endpoint, status, version, created_by, created_at, updated_at)
       VALUES (?, 'lti-1.3', ?, ?, ?, ?, ?, ?, 'draft', 1, ?, ?, ?)`,
    )
      .bind(
        id,
        draft.issuer,
        draft.clientId,
        draft.deploymentId,
        draft.authorizationEndpoint,
        draft.tokenEndpoint,
        draft.jwksEndpoint,
        auth.userId,
        now,
        now,
      )
      .run();
  }
  await appendAudit(
    auth.userId,
    "integration.lti-draft-saved",
    "education-integration",
    id,
    "success",
    `version=${nextVersion};status=draft;activation=not-authorized;secrets=not-accepted`,
  );
  return getEducationIntegrations(auth);
}
