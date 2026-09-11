'use client';
/* oxlint-disable next/no-html-link-for-pages -- Dispatch-owned sign-in and static licence HTML require full, non-prefetched navigation. */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  ClipboardCheck,
  Download,
  Plus,
  Save,
  RefreshCw,
} from 'lucide-react';
import { Brand } from '../brand';
import { structures, quizQuestions } from '../anatomy-data';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  tracks,
  trackLabels,
  checklist,
  checklistVersion,
  currentRevision,
  blankReview,
  staleReview,
  decisionLabel,
  approvalProblems,
  type ReviewTrack,
  type ReviewDraft,
  type SavedReview,
  type ReviewIssue,
} from '@/lib/review-workspace';

type Entry = {
  draft: ReviewDraft;
  expectedVersion: number;
  revisionHash: string | null;
};
const keyOf = (id: string, track: ReviewTrack) => `${id}/${track}`;
type HistoryPage = { history: SavedReview[]; nextBefore: number | null };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, cache: 'no-store' });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data &&
        typeof data === 'object' &&
        'error' in data &&
        typeof data.error === 'string'
        ? data.error
        : 'Request failed. Please retry.',
    );
  // Successful responses are emitted by our authenticated, validated review API.
  if (!data || typeof data !== 'object')
    throw new Error('Unexpected review response. Please retry.');
  return data as T;
}
export function ReviewDashboard({ initialId }: { initialId: string }) {
  const [selectedId, setSelectedId] = useState(initialId),
    [track, setTrack] = useState<ReviewTrack>('geometry');
  const [saved, setSaved] = useState<SavedReview[]>([]),
    [drafts, setDrafts] = useState<Record<string, Entry>>({});
  const [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  const [search, setSearch] = useState(''),
    [filter, setFilter] = useState('all');
  const [histories, setHistories] = useState<Record<string, HistoryPage>>({});
  const [historyBusy, setHistoryBusy] = useState(false);
  const selected = structures.find((s) => s.id === selectedId)!;
  const key = keyOf(selectedId, track),
    previous = saved.find(
      (r) => r.structureId === selectedId && r.track === track,
    );
  const entry = drafts[key],
    draft = entry?.draft ?? previous ?? blankReview(selectedId, track);
  const isStale = !!previous && staleReview(previous) && !entry;
  const hasUnsaved = Object.keys(drafts).length > 0;
  const checks = checklist(selectedId, track),
    passed = checks.filter((c) => draft.checks[c.id]).length;
  const problems = approvalProblems(draft, selectedId, track);
  const savedApprovals = saved.filter(
    (r) => r.status === 'approved' && !staleReview(r),
  ).length;
  const openIssues = saved.reduce(
    (sum, r) => sum + r.issues.filter((i) => !i.resolved).length,
    0,
  );

  useEffect(() => {
    let active = true;
    api<{ reviews: SavedReview[] }>('/api/reviews')
      .then((data) => {
        if (active) {
          setSaved(data.reviews);
          setLoaded(true);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!hasUnsaved) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasUnsaved]);
  function edit(patch: Partial<ReviewDraft>) {
    if (busy || !loaded || isStale) return;
    setDrafts((all) => ({
      ...all,
      [key]: {
        expectedVersion: entry?.expectedVersion ?? previous?.version ?? 0,
        revisionHash: entry?.revisionHash ?? currentRevision(selectedId, track),
        draft: { ...draft, status: 'draft', attested: false, ...patch },
      },
    }));
    setMessage('');
  }
  async function refresh() {
    setBusy(true);
    setError('');
    try {
      const data = await api<{ reviews: SavedReview[] }>('/api/reviews');
      setSaved(data.reviews);
      setLoaded(true);
      setMessage(
        'Saved reviews refreshed. Any unsaved edits are still held separately.',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not refresh.');
    } finally {
      setBusy(false);
    }
  }
  async function save(approve = false) {
    if (!loaded || busy || isStale || !entry) return;
    const savingKey = key;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const data = await api<{ review: SavedReview }>('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structureId: selectedId,
          track,
          expectedVersion: entry?.expectedVersion ?? previous?.version ?? 0,
          revisionHash:
            entry?.revisionHash ?? currentRevision(selectedId, track),
          checklistVersion,
          draft: {
            ...draft,
            status: approve
              ? 'approved'
              : draft.status === 'changes-required'
                ? 'changes-required'
                : 'draft',
            attested: approve && draft.attested,
          },
        }),
      });
      setSaved((all) => [
        ...all.filter((r) => keyOf(r.structureId, r.track) !== savingKey),
        data.review,
      ]);
      setDrafts((all) => {
        const next = { ...all };
        delete next[savingKey];
        return next;
      });
      setHistories((all) => {
        const next = { ...all };
        delete next[savingKey];
        return next;
      });
      setMessage(
        approve
          ? 'Review approval recorded for this revision. This is not atlas-wide clinical certification.'
          : 'Review saved. Previous versions remain in the history.',
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Save failed. Your edits have not been discarded.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function history(older = false) {
    const historyKey = key,
      before = older ? histories[key]?.nextBefore : null;
    setHistoryBusy(true);
    setError('');
    try {
      const data = await api<HistoryPage>(
        `/api/reviews?history=1&structureId=${encodeURIComponent(selectedId)}&track=${track}${before ? `&before=${before}` : ''}`,
      );
      setHistories((all) => ({
        ...all,
        [historyKey]: {
          ...data,
          history: [
            ...(older ? (all[historyKey]?.history ?? []) : []),
            ...data.history,
          ],
        },
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load history.');
    } finally {
      setHistoryBusy(false);
    }
  }
  function exportSaved() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            schemaVersion: 1,
            exportedAt: new Date().toISOString(),
            scope:
              'Signed-in user; latest saved snapshots only; not clinical certification',
            reviews: saved,
          },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = 'visible-medicine-shoulder-reviews.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const queue = structures
    .filter((s) =>
      `${s.name} ${s.shortId}`.toLowerCase().includes(search.toLowerCase()),
    )
    .filter((s) => {
      const reviews = saved.filter((r) => r.structureId === s.id);
      return (
        filter === 'all' ||
        (filter === 'issues' &&
          reviews.some((r) => r.issues.some((i) => !i.resolved))) ||
        (filter === 'stale' && reviews.some(staleReview)) ||
        (filter === 'pending' &&
          !reviews.some((r) => r.status === 'approved' && !staleReview(r)))
      );
    });
  function updateIssue(index: number, patch: Partial<ReviewIssue>) {
    edit({
      issues: draft.issues.map((i, n) =>
        n === index ? { ...i, ...patch } : i,
      ),
    });
  }

  return (
    <div
      className="review-app"
      onClickCapture={(event) => {
        const target = event.target;
        const anchor = target instanceof Element ? target.closest('a') : null;
        if (hasUnsaved && anchor && anchor.target !== '_blank') {
          event.preventDefault();
          event.stopPropagation();
          setError(
            'Save or discard your unsaved track drafts before leaving this workspace. Your edits are still here.',
          );
        }
      }}
    >
      <header className="review-header">
        <Brand />
        <span>Review workspace</span>
        <Link href="/review/body">Whole-body worksheets</Link>
        <Link href="/shoulder">
          Anatomy explorer <ArrowUpRight size={16} />
        </Link>
      </header>
      <main className="review-shell">
        <div className="review-title">
          <div>
            <p className="review-eyebrow">
              RIGHT SHOULDER · PRIVATE REVIEW RECORDS
            </p>
            <h1>Shoulder teaching pilot</h1>
            <p>
              Work through each structure. Record evidence, corrections and the
              scope you have reviewed.
            </p>
          </div>
          <div className="review-actions">
            <Button variant="outline" onClick={refresh} disabled={busy}>
              <RefreshCw />
              Refresh saved reviews
            </Button>
            <Button
              variant="outline"
              onClick={exportSaved}
              disabled={!loaded || busy}
            >
              <Download />
              Export saved reviews
            </Button>
          </div>
        </div>
        <div className="review-metrics">
          <div>
            <strong>9</strong>
            <span>structures in the pilot</span>
          </div>
          <div>
            <strong>{loaded ? savedApprovals : '—'} / 27</strong>
            <span>current track approvals</span>
          </div>
          <div>
            <strong>{loaded ? openIssues : '—'}</strong>
            <span>saved open issues</span>
          </div>
          <div>
            <strong>{Object.keys(drafts).length}</strong>
            <span>unsaved track drafts</span>
          </div>
        </div>
        <p className="review-boundary">
          Saved records belong to your signed-in account. Reviewer
          qualifications are self-declared, not independently verified. No
          patient data. No acquired scans are loaded.
        </p>
        {error && (
          <div role="alert" className="review-error">
            {error}
            {!loaded && (
              <p>
                <a
                  href="/signin-with-chatgpt?return_to=%2Freview"
                  target="_top"
                >
                  Sign in with ChatGPT
                </a>{' '}
                · <button onClick={refresh}>Retry loading</button>
              </p>
            )}
          </div>
        )}
        {message && <output className="review-message">{message}</output>}
        <div className="review-grid">
          <aside>
            <label className="review-field" htmlFor="review-search">
              Find a structure
              <Input
                id="review-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or anatomical ID"
              />
            </label>
            <Select value={filter} onValueChange={(v) => v && setFilter(v)}>
              <SelectTrigger aria-label="Filter review queue">
                <SelectValue>
                  {({ value }) =>
                    ({
                      all: 'All structures',
                      issues: 'Open issues',
                      stale: 'Re-review required',
                      pending: 'No current approval',
                    })[String(value)]
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {[
                  ['all', 'All structures'],
                  ['issues', 'Open issues'],
                  ['stale', 'Re-review required'],
                  ['pending', 'No current approval'],
                ].map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <nav aria-label="Review structures" className="review-queue">
              {queue.map((s) => (
                <button
                  className={`review-queue-item ${s.id === selectedId ? 'active' : ''}`}
                  key={s.id}
                  onClick={() => {
                    setSelectedId(s.id);
                    setMessage('');
                    setError('');
                  }}
                  disabled={busy}
                  aria-current={s.id === selectedId ? 'true' : undefined}
                >
                  <strong>{s.name}</strong>
                  <small>{s.shortId}</small>
                  <span>
                    {tracks.filter((t) => !!drafts[keyOf(s.id, t)]).length
                      ? 'Unsaved edits'
                      : decisionLabel(
                          saved.find(
                            (r) => r.structureId === s.id && r.track === track,
                          ),
                        )}
                  </span>
                </button>
              ))}
              {!queue.length && <p>No matching structures.</p>}
            </nav>
            <details className="review-gap">
              <summary>Missing-structure queue</summary>
              <ol>
                <li>Capsule, labrum, bursae and ligament detail</li>
                <li>Brachial plexus and peripheral nerves</li>
                <li>Validated imaging and registration</li>
              </ol>
              <p>
                Each addition needs a rights record, spatial validation and a
                new review. These are not loaded structures.
              </p>
            </details>
          </aside>
          <section
            className="review-paper"
            aria-label={`${selected.name} review`}
          >
            <div className="review-title">
              <div>
                <p className="review-eyebrow">{selected.shortId}</p>
                <h2>{selected.name}</h2>
                <p>{selected.latinName}</p>
              </div>
              <Link
                className="review-model-link"
                target="_blank"
                rel="noopener noreferrer"
                href={`/shoulder?structure=${encodeURIComponent(selectedId)}`}
              >
                Inspect structure in new tab <ArrowUpRight size={16} />
              </Link>
            </div>
            <Tabs
              value={track}
              onValueChange={(v) => {
                setTrack(v as ReviewTrack);
                setMessage('');
                setError('');
              }}
            >
              <TabsList aria-label="Review track">
                {tracks.map((t) => (
                  <TabsTrigger key={t} value={t} disabled={busy}>
                    {trackLabels[t]}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value={track} className="review-tab-content">
                <div className="review-track-meta">
                  <span
                    className={`review-state ${previous?.status === 'approved' && !isStale ? 'signed' : ''}`}
                  >
                    {entry ? 'Unsaved draft' : decisionLabel(previous)}
                  </span>
                  <span>
                    {previous
                      ? `Saved version ${previous.version} · ${new Date(previous.savedAt).toLocaleString('en-GB')}`
                      : 'No saved review'}
                  </span>
                </div>
                {isStale && (
                  <div className="review-error">
                    <strong>Material changed since this review.</strong>
                    <p>
                      Previous checks and any approval do not apply to the
                      current version. Notes and issues can be carried forward,
                      but each check must be repeated.
                    </p>
                    <Button
                      onClick={() =>
                        setDrafts((all) => ({
                          ...all,
                          [key]: {
                            expectedVersion: previous!.version,
                            revisionHash: currentRevision(selectedId, track),
                            draft: {
                              ...previous!,
                              status: 'draft',
                              checks: blankReview(selectedId, track).checks,
                              attested: false,
                            },
                          },
                        }))
                      }
                    >
                      Start re-review of current material
                    </Button>
                  </div>
                )}
                {track === 'imaging' && (
                  <p className="review-boundary">
                    Imaging is not loaded. Record sourcing tasks and issues
                    here; approval stays unavailable until validated images are
                    ingested.
                  </p>
                )}
                <fieldset
                  disabled={!loaded || busy || isStale}
                  className="review-editor"
                >
                  <legend className="sr-only">
                    {trackLabels[track]} review details
                  </legend>
                  <div className="review-check-title">
                    <h3>Review checklist</h3>
                    <span>
                      {passed} / {checks.length} checked
                    </span>
                  </div>
                  <div className="review-checklist">
                    {checks.map((c) => (
                      <label key={c.id} htmlFor={`review-check-${c.id}`}>
                        <Checkbox
                          id={`review-check-${c.id}`}
                          checked={!!draft.checks[c.id]}
                          onCheckedChange={(v) =>
                            edit({
                              checks: { ...draft.checks, [c.id]: v === true },
                            })
                          }
                          aria-label={c.label}
                        />
                        <span>{c.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="review-form-grid">
                    <label className="review-field" htmlFor="reviewer-name">
                      Reviewer name
                      <Input
                        id="reviewer-name"
                        value={draft.reviewer}
                        maxLength={150}
                        onChange={(e) => edit({ reviewer: e.target.value })}
                      />
                    </label>
                    <label className="review-field" htmlFor="reviewer-role">
                      Professional role / qualification
                      <Input
                        id="reviewer-role"
                        value={draft.qualification}
                        maxLength={200}
                        onChange={(e) =>
                          edit({ qualification: e.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label className="review-field" htmlFor="review-scope">
                    Scope of this review
                    <Textarea
                      id="review-scope"
                      value={draft.scope}
                      maxLength={2000}
                      onChange={(e) => edit({ scope: e.target.value })}
                      placeholder="Views and content checked, intended learners, limitations…"
                    />
                  </label>
                  <label className="review-field" htmlFor="review-notes">
                    Review notes
                    <Textarea
                      id="review-notes"
                      value={draft.notes}
                      maxLength={6000}
                      onChange={(e) => edit({ notes: e.target.value })}
                      placeholder="Observations and supporting reasoning; no patient identifiers."
                    />
                  </label>
                  <div className="review-check-title">
                    <h3>Supporting evidence</h3>
                    <Button
                      variant="outline"
                      disabled={draft.evidence.length >= 12}
                      onClick={() =>
                        edit({
                          evidence: [
                            ...draft.evidence,
                            { title: '', url: '', note: '' },
                          ],
                        })
                      }
                    >
                      <Plus />
                      Add evidence
                    </Button>
                  </div>
                  {!draft.evidence.length && (
                    <p className="review-muted">
                      No evidence added. A source licence alone does not
                      establish anatomical correctness.
                    </p>
                  )}
                  {draft.evidence.map((evidence, index) => (
                    <div className="review-evidence" key={index}>
                      <label
                        className="review-field"
                        htmlFor={`evidence-title-${index}`}
                      >
                        Source title {index + 1}
                        <Input
                          id={`evidence-title-${index}`}
                          value={evidence.title}
                          maxLength={180}
                          onChange={(e) =>
                            edit({
                              evidence: draft.evidence.map((v, n) =>
                                n === index
                                  ? { ...v, title: e.target.value }
                                  : v,
                              ),
                            })
                          }
                        />
                      </label>
                      <label
                        className="review-field"
                        htmlFor={`evidence-url-${index}`}
                      >
                        HTTPS evidence URL {index + 1}
                        <Input
                          id={`evidence-url-${index}`}
                          type="url"
                          value={evidence.url}
                          maxLength={2048}
                          onChange={(e) =>
                            edit({
                              evidence: draft.evidence.map((v, n) =>
                                n === index ? { ...v, url: e.target.value } : v,
                              ),
                            })
                          }
                        />
                      </label>
                      <label
                        className="review-field"
                        htmlFor={`evidence-note-${index}`}
                      >
                        What this source supports
                        <Textarea
                          id={`evidence-note-${index}`}
                          value={evidence.note}
                          maxLength={1000}
                          onChange={(e) =>
                            edit({
                              evidence: draft.evidence.map((v, n) =>
                                n === index
                                  ? { ...v, note: e.target.value }
                                  : v,
                              ),
                            })
                          }
                        />
                      </label>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          edit({
                            evidence: draft.evidence.filter(
                              (_, n) => n !== index,
                            ),
                          })
                        }
                      >
                        Remove evidence from this draft
                      </Button>
                    </div>
                  ))}
                  <div className="review-check-title">
                    <h3>Issues & corrections</h3>
                    <Button
                      variant="outline"
                      disabled={draft.issues.length >= 20}
                      onClick={() =>
                        edit({
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
                      <Plus />
                      Add issue
                    </Button>
                  </div>
                  {!draft.issues.length && (
                    <p className="review-muted">
                      No issues recorded. This does not mean the structure has
                      passed review.
                    </p>
                  )}
                  {draft.issues.map((issue, index) => (
                    <div className="review-issue" key={issue.id}>
                      <label
                        className="review-field"
                        htmlFor={`issue-title-${index}`}
                      >
                        Issue {index + 1}
                        <Textarea
                          id={`issue-title-${index}`}
                          value={issue.title}
                          maxLength={500}
                          onChange={(e) =>
                            updateIssue(index, { title: e.target.value })
                          }
                        />
                      </label>
                      <Select
                        value={issue.severity}
                        onValueChange={(v) =>
                          v &&
                          updateIssue(index, {
                            severity: v as ReviewIssue['severity'],
                          })
                        }
                      >
                        <SelectTrigger
                          aria-label={`Issue ${index + 1} severity`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['blocker', 'major', 'minor'].map((v) => (
                            <SelectItem value={v} key={v}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <label
                        className="review-check"
                        htmlFor={`issue-resolved-${index}`}
                      >
                        <Checkbox
                          id={`issue-resolved-${index}`}
                          checked={issue.resolved}
                          onCheckedChange={(v) =>
                            updateIssue(index, { resolved: v === true })
                          }
                        />
                        Resolved
                      </label>
                      <label
                        className="review-field"
                        htmlFor={`issue-resolution-${index}`}
                      >
                        Resolution / next action
                        <Textarea
                          id={`issue-resolution-${index}`}
                          value={issue.resolution}
                          maxLength={1500}
                          onChange={(e) =>
                            updateIssue(index, { resolution: e.target.value })
                          }
                        />
                      </label>
                    </div>
                  ))}
                  <label className="review-check" htmlFor="review-changes">
                    <Checkbox
                      id="review-changes"
                      checked={draft.status === 'changes-required'}
                      onCheckedChange={(v) =>
                        edit({ status: v ? 'changes-required' : 'draft' })
                      }
                    />
                    Mark changes required
                  </label>
                  <label
                    className="review-check review-attestation"
                    htmlFor="review-attestation"
                  >
                    <Checkbox
                      id="review-attestation"
                      checked={draft.attested}
                      onCheckedChange={(v) => edit({ attested: v === true })}
                    />
                    I personally performed the review described above and
                    confirm my stated role and evidence. This records my review,
                    not independent credential verification.
                  </label>
                </fieldset>
                {problems.length > 0 && (
                  <details className="review-approval-help">
                    <summary>
                      Before approval can be recorded ({problems.length})
                    </summary>
                    <ul>
                      {problems.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </details>
                )}
                <div className="review-savebar">
                  <Button
                    onClick={() => save()}
                    disabled={!loaded || busy || isStale || !entry}
                  >
                    <Save />
                    {busy ? 'Saving…' : 'Save review draft'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => save(true)}
                    disabled={
                      !loaded || busy || isStale || !entry || !!problems.length
                    }
                  >
                    <ClipboardCheck />
                    Record approval
                  </Button>
                  {entry && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setDrafts((all) => {
                          const next = { ...all };
                          delete next[key];
                          return next;
                        });
                        setMessage(
                          'Unsaved changes for this track discarded. Saved history is unchanged.',
                        );
                      }}
                      disabled={busy}
                    >
                      Discard unsaved changes for this track
                    </Button>
                  )}
                </div>
                {!!entry &&
                  previous &&
                  entry.expectedVersion !== previous.version && (
                    <p className="review-error">
                      A newer saved version exists. Your unsaved draft is
                      preserved for comparison. Copy any needed notes, then
                      discard this draft to start from the latest saved version.
                    </p>
                  )}
                <details className="review-material">
                  <summary>Current material & source provenance</summary>
                  <p>
                    <a href="/models/bodyparts3d/credits.html">
                      BodyParts3D source and commercial licence
                    </a>{' '}
                    · This is provenance, not clinical evidence.
                  </p>
                  <p>
                    Review fingerprint:{' '}
                    <code>
                      {currentRevision(selectedId, track) ?? 'No imaging asset'}
                    </code>
                  </p>
                  <p>Checklist: {checklistVersion}</p>
                  {track === 'teaching' && (
                    <>
                      {Object.entries(selected.sections).map(
                        ([name, section]) => (
                          <section key={name}>
                            <h3>
                              {name.toUpperCase()} · {section.title}
                            </h3>
                            <p>{section.body}</p>
                            {section.bullets && (
                              <ul>
                                {section.bullets.map((b) => (
                                  <li key={b}>{b}</li>
                                ))}
                              </ul>
                            )}
                            {section.note && <p>{section.note}</p>}
                          </section>
                        ),
                      )}
                      <h3>Identification exam questions for this structure</h3>
                      {quizQuestions
                        .filter((q) => q.answer === selectedId)
                        .map((q) => (
                          <p key={q.prompt}>
                            {q.prompt}
                            <br />
                            Configured answer: {selected.name}
                          </p>
                        ))}
                    </>
                  )}
                </details>
                <section className="review-history">
                  <div className="review-check-title">
                    <h3>Saved history</h3>
                    <Button
                      variant="outline"
                      onClick={() => history()}
                      disabled={!loaded || historyBusy}
                    >
                      {historyBusy ? 'Loading…' : 'Load history'}
                    </Button>
                  </div>
                  <p className="review-muted">
                    Every save adds a snapshot. Earlier versions are retained;
                    no edit here deletes history.
                  </p>
                  {histories[key]?.history.map((r) => (
                    <details key={r.version}>
                      <summary>
                        Version {r.version} ·{' '}
                        {r.status === 'approved'
                          ? 'Approval recorded'
                          : r.status}{' '}
                        · {new Date(r.savedAt).toLocaleString('en-GB')}
                      </summary>
                      <p>
                        {r.reviewer || 'Reviewer not specified'} ·{' '}
                        {r.qualification || 'Role not specified'}
                      </p>
                      <p>{r.scope || 'No scope recorded'}</p>
                      <p>{r.notes || 'No notes recorded'}</p>
                      <p>
                        {Object.values(r.checks).filter(Boolean).length} checks
                        · {r.issues.filter((i) => !i.resolved).length} open
                        issues
                      </p>
                      <ul>
                        {r.evidence.map((e, i) => (
                          <li key={i}>
                            <a
                              href={e.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {e.title}
                            </a>{' '}
                            — {e.note}
                          </li>
                        ))}
                      </ul>
                      {r.issues.map((i) => (
                        <p key={i.id}>
                          {i.severity} · {i.resolved ? 'Resolved' : 'Open'}:{' '}
                          {i.title} — {i.resolution}
                        </p>
                      ))}
                      <code>{r.revisionHash ?? 'No imaging asset'}</code>
                    </details>
                  ))}
                  {histories[key]?.history.length === 0 && (
                    <p>No history yet.</p>
                  )}
                  {histories[key]?.nextBefore && (
                    <Button
                      variant="outline"
                      onClick={() => history(true)}
                      disabled={historyBusy}
                    >
                      Load earlier versions
                    </Button>
                  )}
                </section>
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </main>
    </div>
  );
}
