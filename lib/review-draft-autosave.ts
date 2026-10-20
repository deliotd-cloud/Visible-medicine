/** Private, in-memory debounce only. Callers still enforce their authenticated save gate. */
export type DraftAutosaveGuard = {
  status: string;
  attested: boolean;
  dirty: boolean;
  loaded: boolean;
  currentHistory: boolean;
  busy: boolean;
  uncertain: boolean;
  reloadRequired: boolean;
};

export function mayAutosaveDraft(guard: DraftAutosaveGuard): boolean {
  return guard.status === 'draft' && !guard.attested && guard.dirty &&
    guard.loaded && guard.currentHistory && !guard.busy &&
    !guard.uncertain && !guard.reloadRequired;
}

export function reviewDraftStamp(scope: unknown, version: number, draft: unknown): string {
  return JSON.stringify([scope, version, draft]);
}

/** Use only after the caller parsed an authenticated history response. */
export function reviewerFromAuthorizedHistory(
  record: {reviewer: string; qualification: string} | null,
  sameSource: boolean,
  dirty: boolean,
): {reviewer: string; qualification: string} | null {
  if (!record || !sameSource || dirty) return null;
  return {reviewer: record.reviewer, qualification: record.qualification};
}

const reviewerByContext = new Map<string, {reviewer: string; qualification: string}>();
export function rememberReviewerForContext(token: string | null, profile: {reviewer: string; qualification: string}): void {
  if (!token) return;
  reviewerByContext.set(token, {reviewer: profile.reviewer, qualification: profile.qualification});
}
export function reviewerForContext(token: string | null): {reviewer: string; qualification: string} | null {
  const profile = token ? reviewerByContext.get(token) : null;
  return profile ? {...profile} : null;
}

export function createReviewDraftAutosave(
  delayMs = 2500,
  scheduleTimer: (callback: () => void, delay: number) => ReturnType<typeof setTimeout> = setTimeout,
  cancelTimer: (timer: ReturnType<typeof setTimeout>) => void = clearTimeout,
) {
  let generation = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const cancel = () => {
    generation++;
    if (timer !== null) cancelTimer(timer);
    timer = null;
  };
  const schedule = (stamp: string, isCurrent: (stamp: string) => boolean, save: () => void) => {
    cancel();
    const ticket = generation;
    timer = scheduleTimer(() => {
      timer = null;
      if (ticket === generation && isCurrent(stamp)) save();
    }, delayMs);
  };
  return {schedule, cancel};
}
