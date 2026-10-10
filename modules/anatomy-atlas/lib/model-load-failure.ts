export type ModelLoadFailure = 'sign-in' | 'access-denied' | 'unavailable';

export function modelLoadAccessNotice(
  failures: readonly ModelLoadFailure[],
): {message: string; retryLabel: string} | null {
  if (failures.includes('sign-in')) {
    return {
      message: 'Some model files require sign-in. Sign in to the website hosting this atlas, then check access again. Your view settings are retained.',
      retryLabel: 'Check access again',
    };
  }
  if (failures.includes('access-denied')) {
    return {
      message: 'The website refused access to some model files. Check your access with the site owner, then check again. Your view settings are retained.',
      retryLabel: 'Check access again',
    };
  }
  return null;
}

/** Classify only a response for the bundle that this scene actually requested. */
export function modelLoadFailure(error: unknown, expectedUrl: string): ModelLoadFailure {
  let requested: URL;
  try {
    requested = new URL(expectedUrl);
    if (
      (requested.protocol !== 'http:' && requested.protocol !== 'https:') ||
      requested.href !== expectedUrl ||
      requested.hash
    ) return 'unavailable';
  } catch {
    return 'unavailable';
  }

  try {
    if (error === null || typeof error !== 'object') return 'unavailable';

    // A present response is authoritative. Do not fall back to a possibly
    // conflicting message if its URL or status cannot be verified.
    if ('response' in error) {
      const response = error.response;
      if (response === null || typeof response !== 'object') return 'unavailable';
      if (!('url' in response) || response.url !== expectedUrl) return 'unavailable';
      if (!('status' in response)) return 'unavailable';
      return failureForStatus(response.status);
    }

    if (!(error instanceof Error)) return 'unavailable';
    const match = /^Could not load ([^\r\n]+): fetch for "([^"\r\n]+)" responded with (401: Unauthorized|403: Forbidden)$/.exec(error.message);
    if (!match) return 'unavailable';
    const loaderUrl = requested.pathname + requested.search;
    if ((match[1] !== loaderUrl && match[1] !== expectedUrl) || match[2] !== expectedUrl) {
      return 'unavailable';
    }
    return match[3] === '401: Unauthorized' ? 'sign-in' : 'access-denied';
  } catch {
    // Unknown and hostile error values must never break the scene boundary.
    return 'unavailable';
  }
}

function failureForStatus(status: unknown): ModelLoadFailure {
  if (status === 401) return 'sign-in';
  if (status === 403) return 'access-denied';
  return 'unavailable';
}
