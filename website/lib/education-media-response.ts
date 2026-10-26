import {
  EducationMediaDeliveryError,
  readEducationMediaObject,
  type EducationMediaDependencies,
  type EducationMediaRequest,
} from './education-media-delivery.ts';

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
} as const;
const REFUSAL = 'Protected Education images are unavailable for this request.';

/**
 * Inert server-only HTTP boundary for one verified Education DICOM instance.
 * The caller must obtain actorId from current server authentication and inject
 * trusted dependencies. This function does not register a route, select a
 * bucket/database, issue a media URL, or grant assessment readiness.
 */
export async function respondWithEducationMediaObject(
  request: EducationMediaRequest,
  dependencies: EducationMediaDependencies,
): Promise<Response> {
  try {
    const verified = await readEducationMediaObject(request, dependencies);
    // Response owns a separate bounded buffer; no caller-held provider view is
    // released while the body is being consumed.
    const body = new Uint8Array(verified.bytes).buffer;
    return new Response(body, {
      status: 200,
      headers: { ...PRIVATE_HEADERS, 'Content-Type': 'application/dicom' },
    });
  } catch (error) {
    let status = 503;
    if (error instanceof EducationMediaDeliveryError) {
      if (error.code === 'invalid-request') status = 400;
      else if (
        error.code === 'access-denied' ||
        error.code === 'revision-mismatch' ||
        error.code === 'source-unavailable' ||
        error.code === 'object-unavailable'
      ) status = 404;
    }
    return new Response(REFUSAL, {
      status,
      headers: { ...PRIVATE_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
