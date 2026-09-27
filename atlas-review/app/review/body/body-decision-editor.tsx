'use client';
import { clinicalReviewFetch } from '@/lib/clinical-review-fetch';
import { useEffect, useState } from 'react';
import { Button } from '@/atlas-review/components/ui/button';
import { ReviewSignInLink } from '@/atlas-review/components/review-sign-in-link';
import {
  bodyApprovalProblems,
  bodyDecisionLabel,
  bodyReviewTracks,
  parseSavedBodyReview,
  type BodyReviewDraft,
  type BodyReviewTrack,
} from '@/atlas-review/lib/body-review-decisions';
import {
  bodyDraftsFromPage,
  parseBodyDecisionPage,
  reconcileBodyDrafts,
  type BodyDecisionPage,
} from '@/atlas-review/lib/body-review-client';

const titles = {
  geometry: '3D anatomy',
  teaching: 'Teaching copy',
  imaging: 'Imaging',
};
function responseError(value: unknown, fallback: string) {
  return value &&
    typeof value === 'object' &&
    'error' in value &&
    typeof value.error === 'string'
    ? value.error
    : fallback;
}
async function readPage(
  id: string,
  materialHash: string,
  track: BodyReviewTrack,
  before?: number,
  signal?: AbortSignal,
) {
  const response = await clinicalReviewFetch(
    `/api/atlas-review/body-review/decisions?structureId=${encodeURIComponent(id)}&track=${track}${before ? `&before=${before}` : ''}`,
    { cache: 'no-store', signal },
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error(responseError(data, 'Unable to load saved reviews.'));
  return parseBodyDecisionPage(data, id, materialHash, track);
}
function download(value: unknown, filename: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function BodyDecisionEditor({
  id,
  materialHash,
  onDirty,
}: {
  id: string;
  materialHash: string;
  onDirty: (dirty: boolean) => void;
}) {
  const [page, setPage] = useState<BodyDecisionPage | null>(null);
  const [drafts, setDrafts] = useState<ReturnType<
    typeof bodyDraftsFromPage
  > | null>(null);
  const [track, setTrack] = useState<BodyReviewTrack>('geometry');
  const [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [reconcile, setReconcile] = useState(false);
  const [mustRefresh, setMustRefresh] = useState(false);
  const [error, setError] = useState(''),
    [message, setMessage] = useState('');
  const [history, setHistory] = useState<BodyDecisionPage | null>(null),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    readPage(id, materialHash, 'geometry', undefined, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) {
          setPage(value);
          setDrafts(bodyDraftsFromPage(value));
          setHistory(value);
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : 'Unable to load reviews.');
      });
    return () => controller.abort();
  }, [id, materialHash, attempt]);
  useEffect(() => {
    onDirty(dirty || busy);
  }, [dirty, busy, onDirty]);
  const draft = drafts?.[track];
  function change(patch: Partial<BodyReviewDraft>) {
    if (!drafts || busy) return;
    setDrafts({
      ...drafts,
      [track]: { ...drafts[track], attested: false, ...patch },
    });
    setDirty(true);
    setMessage('');
  }
  async function refresh() {
    setBusy(true);
    setError('');
    try {
      const value = await readPage(id, materialHash, track);
      setPage(value);
      setHistory(value);
      setMustRefresh(false);
      if (dirty) {
        setReconcile(true);
        setMessage(
          'Saved records refreshed. Compare their history with your retained edits, then choose how to proceed.',
        );
      } else {
        setDrafts(bodyDraftsFromPage(value));
        setReconcile(false);
        setMessage('Saved records refreshed.');
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Refresh failed. Your edits remain here.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function save(status: BodyReviewDraft['status']) {
    if (!page || !draft || !drafts || busy || reconcile) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await clinicalReviewFetch('/api/atlas-review/body-review/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catalogScope: page.context.catalogScope,
          structureId: id,
          track,
          expectedVersion:
            page.reviews.find((r) => r.track === track)?.version ?? 0,
          materialHash: page.context.materialHash,
          revisionHash: page.context.revisions[track],
          checklistVersion: page.context.checklistVersion,
          draft: { ...draft, status },
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(responseError(data, 'Save could not be confirmed.'));
      const saved = parseSavedBodyReview(
        data && typeof data === 'object' && 'review' in data
          ? data.review
          : null,
      );
      if (
        saved.structureId !== id ||
        saved.track !== track ||
        saved.version !==
          (page.reviews.find((r) => r.track === track)?.version ?? 0) + 1 ||
        saved.revisionHash !== page.context.revisions[track]
      )
        throw new Error('Save response did not match this review.');
      const next = {
        ...page,
        reviews: [...page.reviews.filter((r) => r.track !== track), saved],
      };
      setPage(next);
      setHistory(null);
      const clean = bodyDraftsFromPage(next);
      const updated = { ...drafts, [track]: clean[track] };
      setDrafts(updated);
      // Other tracks may still contain unsaved edits.
      setDirty(
        bodyReviewTracks.some(
          (t) => JSON.stringify(updated[t]) !== JSON.stringify(clean[t]),
        ),
      );
      setMessage(
        `${titles[track]} version ${saved.version} saved privately. This is not clinical certification or an atlas-wide approval.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save could not be confirmed.');
      setReconcile(true); // Never blindly retry an uncertain write.
      setMustRefresh(true);
    } finally {
      setBusy(false);
    }
  }
  async function loadHistory(before?: number) {
    setBusy(true);
    setError('');
    try {
      const value = await readPage(id, materialHash, track, before);
      setHistory((previous) =>
        before && previous?.track === track
          ? { ...value, history: [...previous.history, ...value.history] }
          : value,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'History could not be loaded.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="body-decisions"
      aria-label="Private body review decisions"
    >
      <h3>Private review record</h3>
      <p>
        Record corrections separately for 3D anatomy, available teaching drafts
        and future imaging. These are your own records, not verified
        professional credentials or public approval badges.
      </p>
      {error && <p role="alert">{error} Your edits are not discarded.</p>}
      {message && <p role="status">{message}</p>}
      {!page && !error && <p role="status">Loading private records…</p>}
      {!page && error && (
        <>
          <Button onClick={() => setAttempt((n) => n + 1)}>
            Retry records
          </Button>
          <p>
            <ReviewSignInLink target={{ scope: 'body', structure: id }} />
          </p>
        </>
      )}
      {page && drafts && draft && (
        <>
          <div className="body-decision-tabs" aria-label="Review tracks">
            {bodyReviewTracks.map((t) => (
              <Button
                key={t}
                variant={track === t ? 'secondary' : 'outline'}
                aria-pressed={track === t}
                disabled={busy}
                onClick={() => setTrack(t)}
              >
                {titles[t]}
                <small>
                  {bodyDecisionLabel(
                    page.reviews.find((r) => r.track === t),
                    page.context,
                  )}
                </small>
              </Button>
            ))}
          </div>
          <div className="body-review-actions">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                void refresh();
              }}
            >
              Refresh saved records
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                download(
                  {
                    schema: 'vm-body-review-working-copy-1',
                    context: page.context,
                    drafts,
                    note: 'Unsaved working copy; not importable as an approval.',
                  },
                  'body-review-working-copy.json',
                )
              }
            >
              Export my working copy
            </Button>
            <span role="status">
              {busy ? 'Working…' : dirty ? 'Unsaved edits' : 'No unsaved edits'}
            </span>
          </div>
          {reconcile && (
            <div className="body-review-caution" role="alert">
              <p>
                Saving is paused. Refresh saved records first; inspect history
                before replacing or keeping edits. Keeping edits resets
                checklist confirmations and attestation, and retains all saved
                issues.
              </p>
              <Button
                variant="outline"
                disabled={busy || mustRefresh}
                onClick={() => {
                  setDrafts(bodyDraftsFromPage(page));
                  setDirty(false);
                  setReconcile(false);
                  setMessage('Loaded the displayed saved records.');
                }}
              >
                Use displayed saved records
              </Button>
              <Button
                variant="outline"
                disabled={busy || mustRefresh}
                onClick={() => {
                  setDrafts(reconcileBodyDrafts(drafts, page));
                  setReconcile(false);
                  setDirty(true);
                  setMessage(
                    'Edits retained. Repeat the checklist and attest before approval.',
                  );
                }}
              >
                Keep edits against displayed records
              </Button>
            </div>
          )}
          <p className="body-review-caution">
            {track === 'teaching'
              ? `Approval scope: available draft topics (${page.context.teachingTabs.join(', ')}), the displayed source-specific reasoning question and any displayed guided-tour sequences. Pending topics, other questions and undisplayed tours are excluded.`
              : track === 'geometry'
                ? 'Approval scope: this root-body selection and renderer only. Nested dissections and independent specimens require separate reviews.'
                : 'Planning and correction notes can be saved, but imaging cannot be approved until validated images and registration exist.'}
          </p>
          <BodyDecisionFields
            draft={draft}
            checklist={page.context.checklists[track]}
            savedIssueIds={
              page.reviews
                .find((r) => r.track === track)
                ?.issues.map((i) => i.id) ?? []
            }
            disabled={busy || reconcile}
            change={change}
          />
          <details>
            <summary>Approval requirements</summary>
            <ul>
              {bodyApprovalProblems(draft, page.context, track).map(
                (problem) => (
                  <li key={problem}>{problem}</li>
                ),
              )}
            </ul>
            {!bodyApprovalProblems(draft, page.context, track).length && (
              <p>
                Software gates met. Your personal review and accuracy remain
                your responsibility.
              </p>
            )}
          </details>
          <div className="body-review-actions">
            <Button
              disabled={busy || reconcile}
              onClick={() => {
                void save('draft');
              }}
            >
              Save draft
            </Button>
            <Button
              variant="outline"
              disabled={busy || reconcile}
              onClick={() => {
                void save('changes-required');
              }}
            >
              Save changes required
            </Button>
            <Button
              variant="outline"
              disabled={
                busy ||
                reconcile ||
                !!bodyApprovalProblems(draft, page.context, track).length
              }
              onClick={() => {
                void save('approved');
              }}
            >
              Record scoped approval
            </Button>
          </div>
          <details>
            <summary>Saved history · {titles[track]}</summary>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                void loadHistory();
              }}
            >
              Load latest history
            </Button>
            {history?.track === track && (
              <>
                <p>
                  {history.history.length} loaded versions. Export contains only
                  these loaded records, not your full account history.
                </p>
                <Button
                  variant="outline"
                  onClick={() =>
                    download(
                      {
                        scope: page.context.catalogScope,
                        structureId: id,
                        track,
                        history: history.history,
                        olderVersionsBefore: history.nextBefore,
                      },
                      'body-review-loaded-history.json',
                    )
                  }
                >
                  Export loaded history
                </Button>
                {history.history.map((record) => (
                  <details key={record.version}>
                    <summary>
                      Version {record.version} · {record.status} ·{' '}
                      {record.savedAt}
                    </summary>
                    <p>
                      {record.reviewer} · {record.qualification}
                    </p>
                    <p>{record.scope}</p>
                    <p>{record.notes}</p>
                    <ul>
                      {record.issues.map((i) => (
                        <li key={i.id}>
                          {i.severity}: {i.title} —{' '}
                          {i.resolved ? i.resolution : 'Unresolved'}
                        </li>
                      ))}
                    </ul>
                    <details>
                      <summary>Full recorded snapshot</summary>
                      <pre>{JSON.stringify(record, null, 2)}</pre>
                    </details>
                  </details>
                ))}
                {history.nextBefore && (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      void loadHistory(history.nextBefore!);
                    }}
                  >
                    Load older versions
                  </Button>
                )}
              </>
            )}
          </details>
        </>
      )}
    </section>
  );
}

export function BodyDecisionFields({
  draft,
  checklist,
  disabled,
  change,
  savedIssueIds = [],
}: {
  draft: BodyReviewDraft;
  checklist: { id: string; label: string }[];
  disabled: boolean;
  change: (patch: Partial<BodyReviewDraft>) => void;
  savedIssueIds?: string[];
}) {
  return (
    <fieldset disabled={disabled} className="body-decision-fields">
      <legend>Review details</legend>
      <div className="body-decision-name-row">
        <label>
          Reviewer name
          <input
            value={draft.reviewer}
            maxLength={150}
            onChange={(e) => change({ reviewer: e.target.value })}
          />
        </label>
        <label>
          Professional role / qualification
          <input
            value={draft.qualification}
            maxLength={200}
            onChange={(e) => change({ qualification: e.target.value })}
          />
        </label>
      </div>
      <label>
        Exact scope of this review
        <textarea
          rows={2}
          value={draft.scope}
          maxLength={2000}
          onChange={(e) => change({ scope: e.target.value })}
        />
      </label>
      <label>
        Notes and limitations
        <textarea
          rows={3}
          value={draft.notes}
          maxLength={6000}
          onChange={(e) => change({ notes: e.target.value })}
        />
      </label>
      <details>
        <summary>
          Checklist · {checklist.filter((c) => draft.checks[c.id]).length}/
          {checklist.length}
        </summary>
        {checklist.map((c) => (
          <label className="body-decision-check" key={c.id}>
            <input
              type="checkbox"
              checked={draft.checks[c.id] ?? false}
              onChange={(e) =>
                change({
                  checks: { ...draft.checks, [c.id]: e.target.checked },
                })
              }
            />
            {c.label}
          </label>
        ))}
      </details>
      <details>
        <summary>Evidence · {draft.evidence.length}</summary>
        {draft.evidence.map((e, index) => (
          <fieldset key={index}>
            <legend>Evidence {index + 1}</legend>
            <label>
              Title
              <input
                maxLength={180}
                value={e.title}
                onChange={(event) =>
                  change({
                    evidence: draft.evidence.map((v, i) =>
                      i === index ? { ...v, title: event.target.value } : v,
                    ),
                  })
                }
              />
            </label>
            <label>
              HTTPS reference
              <input
                type="url"
                maxLength={2048}
                value={e.url}
                onChange={(event) =>
                  change({
                    evidence: draft.evidence.map((v, i) =>
                      i === index ? { ...v, url: event.target.value } : v,
                    ),
                  })
                }
              />
            </label>
            <label>
              Evidence note
              <textarea
                maxLength={1000}
                value={e.note}
                onChange={(event) =>
                  change({
                    evidence: draft.evidence.map((v, i) =>
                      i === index ? { ...v, note: event.target.value } : v,
                    ),
                  })
                }
              />
            </label>
            <Button
              variant="outline"
              onClick={() =>
                change({
                  evidence: draft.evidence.filter((_, i) => i !== index),
                })
              }
            >
              Remove evidence {index + 1}
            </Button>
          </fieldset>
        ))}
        <Button
          variant="outline"
          disabled={draft.evidence.length >= 12}
          onClick={() =>
            change({
              evidence: [...draft.evidence, { title: '', url: '', note: '' }],
            })
          }
        >
          Add evidence
        </Button>
      </details>
      <details>
        <summary>
          Corrections · {draft.issues.filter((i) => !i.resolved).length} open
        </summary>
        <p>
          Issues remain in the record. Resolve them with an explanation; do not
          delete saved issues.
        </p>
        {draft.issues.map((issue, index) => {
          const update = (patch: Partial<typeof issue>) =>
            change({
              issues: draft.issues.map((v, i) =>
                i === index ? { ...v, ...patch } : v,
              ),
            });
          return (
            <fieldset key={issue.id}>
              <legend>Issue {index + 1}</legend>
              <label>
                Correction needed
                <textarea
                  maxLength={500}
                  value={issue.title}
                  onChange={(e) => update({ title: e.target.value })}
                />
              </label>
              <label>
                Severity
                <select
                  value={issue.severity}
                  onChange={(e) =>
                    update({
                      severity: e.target.value as typeof issue.severity,
                    })
                  }
                >
                  <option value="blocker">Blocker</option>
                  <option value="major">Major</option>
                  <option value="minor">Minor</option>
                </select>
              </label>
              <label className="body-decision-check">
                <input
                  type="checkbox"
                  checked={issue.resolved}
                  onChange={(e) => update({ resolved: e.target.checked })}
                />
                Resolved
              </label>
              <label>
                Resolution and reason
                <textarea
                  maxLength={1500}
                  value={issue.resolution}
                  onChange={(e) => update({ resolution: e.target.value })}
                />
              </label>
              {!savedIssueIds.includes(issue.id) && (
                <Button
                  variant="outline"
                  onClick={() =>
                    change({
                      issues: draft.issues.filter((_, i) => i !== index),
                    })
                  }
                >
                  Remove unsaved issue {index + 1}
                </Button>
              )}
            </fieldset>
          );
        })}
        <Button
          variant="outline"
          disabled={draft.issues.length >= 20}
          onClick={() =>
            change({
              issues: [
                ...draft.issues,
                {
                  id: crypto.randomUUID(),
                  title: '',
                  severity: 'major',
                  resolved: false,
                  resolution: '',
                },
              ],
            })
          }
        >
          Add correction
        </Button>
      </details>
      <label className="body-decision-check">
        <input
          type="checkbox"
          checked={draft.attested}
          onChange={(e) => change({ attested: e.target.checked })}
        />
        I personally performed the stated review; this is a scoped educational
        review, not certification of clinical fitness.
      </label>
    </fieldset>
  );
}
