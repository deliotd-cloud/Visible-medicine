type ReviewerFields = { reviewer: string; qualification: string };
const reviewers = new Map<string, ReviewerFields>();

/** The server must explicitly scope reuse; an absent or malformed header fails closed. */
export function reviewContext(response: Response): string | null {
  const value = response.headers.get('X-Clinical-Review-Context');
  return value && value.length <= 256 && /^[A-Za-z0-9._:-]+$/.test(value)
    ? value
    : null;
}

export function rememberReviewer(
  context: string | null,
  records: readonly ReviewerFields[],
) {
  if (!context) return;
  const ownRecord = records.find(
    (record) => record.reviewer.trim() && record.qualification.trim(),
  );
  if (ownRecord)
    reviewers.set(context, {
      reviewer: ownRecord.reviewer,
      qualification: ownRecord.qualification,
    });
}

export function withRememberedReviewer<T extends ReviewerFields>(
  context: string | null,
  draft: T,
): T {
  const profile = context ? reviewers.get(context) : undefined;
  if (!profile) return draft;
  return {
    ...draft,
    reviewer: draft.reviewer || profile.reviewer,
    qualification: draft.qualification || profile.qualification,
  };
}

export function mayAutosaveDraft({
  loaded,
  dirty,
  busy,
  blocked,
  current,
  status,
  attested,
}: {
  loaded: boolean;
  dirty: boolean;
  busy: boolean;
  blocked: boolean;
  current: boolean;
  status: string;
  attested: boolean;
}) {
  return loaded && dirty && !busy && !blocked && current &&
    status === 'draft' && !attested;
}
