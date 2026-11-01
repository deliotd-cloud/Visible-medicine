'use client';

import { clinicalReviewFetch } from './clinical-review-fetch.ts';

export const REVIEW_INBOX_PAGE_TIMEOUT_MS = 45_000;

type Clock = { schedule(callback: () => void, delayMs: number): () => void };
const realClock: Clock = {
  schedule(callback, delayMs) {
    const timer = setTimeout(callback, delayMs);
    return () => clearTimeout(timer);
  },
};

const inboxPageUrl = /^\/api\/atlas-review\/inbox\?page=([1-9]\d*)(?:&revision=([a-f0-9]{64}))?&batch=2$/;
const timeoutMessage = 'Review statuses took too long to load. Resume to retry this page.';

// The transport seam keeps existing component test harnesses independent of
// the browser fetch. Production callers use clinicalReviewFetch unchanged.
export function requestReviewInboxPage(
  url: string,
  signal: AbortSignal,
  transport: typeof clinicalReviewFetch = clinicalReviewFetch,
  clock: Clock = realClock,
  validateResponse?: (response: Response) => void,
): Promise<{ response: Response; body: unknown }> {
  const match = inboxPageUrl.exec(url);
  const page = match && Number(match[1]);
  if (!match || !Number.isSafeInteger(page) || (page === 1) === Boolean(match[2]))
    return Promise.reject(new TypeError('Expected a relative Clinical Review inbox page URL.'));
  if (signal.aborted) return Promise.reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));

  return new Promise((resolve, reject) => {
    const inner = new AbortController();
    let settled = false;
    let cancelTimer: (() => void) | undefined;
    const finish = (error?: unknown, result?: { response: Response; body: unknown }) => {
      if (settled) return;
      settled = true;
      cancelTimer?.();
      signal.removeEventListener('abort', onAbort);
      if (result) resolve(result);
      else reject(error);
    };
    const onAbort = () => {
      inner.abort(signal.reason);
      finish(signal.reason ?? new DOMException('Aborted', 'AbortError'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
    // Close the gap between the initial check and listener registration.
    if (signal.aborted) { onAbort(); return; }
    try {
      cancelTimer = clock.schedule(() => {
        inner.abort();
        finish(new Error(timeoutMessage));
      }, REVIEW_INBOX_PAGE_TIMEOUT_MS);
      // Observe fetch and body rejections even if the deadline settles first.
      void (async () => {
        const response = await transport(url, {
          method: 'GET', cache: 'no-store', credentials: 'same-origin', signal: inner.signal,
        });
        if (settled) return;
        if (!response.ok) { finish(undefined, { response, body: undefined }); return; }
        // Check access/context headers before waiting for a potentially stalled body.
        validateResponse?.(response);
        const body: unknown = await response.json();
        finish(undefined, { response, body });
      })().catch(error => finish(error));
    } catch (error) {
      inner.abort();
      finish(error);
    }
  });
}
