import { getAuthContext, type AuthContext } from "@/lib/auth";
import { PresentationValidationError } from "@/lib/education-presentations";
import { SpatialLinkError } from "@/lib/education-viewer-adapter";
import { TeachingPollValidationError } from "@/lib/teaching-polls";
import { TeachingSessionValidationError } from "@/lib/teaching-sessions";
import { TeachingContentValidationError } from "@/lib/teaching-content";
import { QuestionBankValidationError } from "@/lib/question-bank";
import { IntegrationValidationError } from "@/lib/education-integrations";

export class EducationApiError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

export async function authenticateEducationApi(): Promise<AuthContext> {
  const auth = await getAuthContext();
  if (!auth)
    throw new EducationApiError(
      "Sign in through the authorized education site to continue.",
      401,
    );
  return auth;
}

export async function readEducationJson(
  request: Request,
  maximumBytes = 128_000,
) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maximumBytes)
    throw new EducationApiError("Request is too large.", 413);
  const body: unknown = await request.json();
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new EducationApiError("A JSON object is required.");
  return body as Record<string, unknown>;
}

export function educationApiErrorResponse(error: unknown) {
  if (error instanceof EducationApiError)
    return Response.json({ error: error.message }, { status: error.status });
  if (
    error instanceof PresentationValidationError ||
    error instanceof SpatialLinkError ||
    error instanceof TeachingPollValidationError ||
    error instanceof TeachingSessionValidationError ||
    error instanceof TeachingContentValidationError ||
    error instanceof QuestionBankValidationError ||
    error instanceof IntegrationValidationError
  )
    return Response.json({ error: error.message }, { status: 422 });
  console.error("Elivion Education scoped API error", error);
  return Response.json(
    { error: "The education service could not complete this request." },
    { status: 500 },
  );
}
