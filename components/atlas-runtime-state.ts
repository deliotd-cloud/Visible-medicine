export type AtlasDocumentPhase = 'opening' | 'document' | 'delayed' | 'error';

export function sameAtlasDocument(expectedSource: string, actualHref: string, baseHref: string): boolean {
  try {
    const expected = new URL(expectedSource, baseHref);
    const actual = new URL(actualHref, baseHref);
    return actual.href === expected.href && actual.protocol !== 'about:';
  } catch {
    return false;
  }
}

/** One iframe attempt owns one soft timer. A retired attempt cannot report state. */
export function createAtlasDocumentAttempt({
  source, baseHref, report, schedule, cancel, timeoutMs = 12000,
}: {
  source: string;
  baseHref: string;
  report: (phase: AtlasDocumentPhase) => void;
  schedule: (callback: () => void, delay: number) => number;
  cancel: (handle: number) => void;
  timeoutMs?: number;
}) {
  let phase: AtlasDocumentPhase = 'opening';
  let retired = false;
  let timer: number | null = schedule(() => {
    timer = null;
    if (retired || phase !== 'opening') return;
    phase = 'delayed';
    report(phase);
  }, timeoutMs);
  const clear = () => {
    if (timer !== null) cancel(timer);
    timer = null;
  };
  return {
    get phase() { return phase; },
    loaded(actualHref: string) {
      if (retired || !sameAtlasDocument(source, actualHref, baseHref)) return false;
      clear();
      if (phase !== 'document') {
        phase = 'document';
        report(phase);
      }
      return true;
    },
    failed() {
      if (retired || phase === 'document' || phase === 'error') return;
      clear();
      phase = 'error';
      report(phase);
    },
    retire() {
      retired = true;
      clear();
    },
  };
}
