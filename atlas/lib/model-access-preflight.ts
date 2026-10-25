export type PreflightDecision = 'proceed' | 'sign-in' | 'access-denied';

type RequestedBundle = { id: string; url: string; sha256: string };

/** Equivalent fresh React arrays share an epoch; any source or retry change does not. */
export function modelPreflightSignature(
  assetBase: string | undefined,
  scopeKey: string,
  bundles: readonly RequestedBundle[],
  retries: Record<string, number> | undefined,
): string {
  return JSON.stringify([assetBase, scopeKey,
    bundles.map(bundle => [bundle.id, bundle.url, bundle.sha256, retries?.[bundle.id] ?? 0])]);
}

/** Standalone Atlas has no website delivery prefix and keeps its original loaders. */
export function containedModelPreflight(
  assetBase: string | undefined,
  requestedUrl: string | null,
  origin: string,
  signal?: AbortSignal,
  fetcher?: typeof fetch,
  timeoutMs?: number,
): Promise<PreflightDecision> {
  if (!assetBase || !requestedUrl) return Promise.resolve('proceed');
  return modelAccessPreflight(requestedUrl, origin, signal, fetcher, timeoutMs);
}

/** A HEAD result is only useful as a narrow negative signal for this exact URL. */
export async function modelAccessPreflight(
  requestedUrl: string,
  origin: string,
  signal?: AbortSignal,
  fetcher: typeof fetch = fetch,
  timeoutMs = 4000,
): Promise<PreflightDecision> {
  let target: URL;
  try {
    target = new URL(requestedUrl, origin);
    if (!requestedUrl.startsWith('/') || requestedUrl.startsWith('//') ||
        !/^https?:$/.test(target.protocol) || target.origin !== origin ||
        target.hash || target.pathname + target.search !== requestedUrl) return 'proceed';
  } catch { return 'proceed'; }

  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) return 'proceed';
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, timeoutMs);
  let finishOnAbort: () => void = () => {};
  const aborted = new Promise<null>(resolve => {
    finishOnAbort = () => resolve(null);
    controller.signal.addEventListener('abort', finishOnAbort, { once: true });
  });
  try {
    const response = await Promise.race([fetcher(target.href, {
      method: 'HEAD', cache: 'no-store', credentials: 'same-origin',
      mode: 'same-origin', redirect: 'manual', signal: controller.signal,
    }), aborted]);
    if (!response || controller.signal.aborted || signal?.aborted || response.redirected ||
        response.type !== 'basic' || response.url !== target.href) return 'proceed';
    if (response.status === 401) return 'sign-in';
    if (response.status === 403) return 'access-denied';
    return 'proceed';
  } catch { return 'proceed'; }
  finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
    controller.signal.removeEventListener('abort', finishOnAbort);
  }
}
