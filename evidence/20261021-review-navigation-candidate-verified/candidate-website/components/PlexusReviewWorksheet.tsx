'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { exactReviewChecks } from './GroupedReviewConfirmation';
import { createReviewDraftAutosave, mayAutosaveDraft, reviewDraftStamp } from '../lib/review-draft-autosave';
import { clinicalReviewFetch } from '@/lib/clinical-review-fetch';
import { registerClinicalReviewNavigationGuard } from '../lib/clinical-review-navigation-guard';
import {
  plexusReviewTracks,
  type PlexusReviewContext,
  type PlexusReviewTrack,
} from '@/lib/plexus-review-contract';
import {
  blankPlexusReview,
  plexusApprovalProblems,
  plexusReviewStale,
  plexusDecisionLabel,
  parseSavedPlexusReview,
  validPlexusReviewContext,
  type PlexusReviewDraft,
  type SavedPlexusReview,
} from '@/lib/plexus-review-decisions';
import './plexus-review.css';

type TrackState = {
  draft: PlexusReviewDraft;
  draftBaseVersion: number;
  dirty: boolean;
  ready: boolean;
  busy: boolean;
  needsReconcile: boolean;
  freshAfterConflict: boolean;
  latest: SavedPlexusReview | null;
  history: SavedPlexusReview[];
  historyExhausted: boolean;
  error: string;
  message: string;
};
type States = Record<PlexusReviewTrack, TrackState>;
const titles: Record<PlexusReviewTrack, string> = {
  topology: 'Topology', presentation: 'Presentation',
};
const version = (record: SavedPlexusReview | null) => record?.version ?? 0;
const copyDraft = (record: SavedPlexusReview, context: PlexusReviewContext, track: PlexusReviewTrack): PlexusReviewDraft => ({
  status: 'draft', reviewer: record.reviewer, qualification: record.qualification,
  scope: record.scope, notes: record.notes,
  checks: plexusReviewStale(record, context) || record.context.materialHash !== context.materialHash ||
    record.context.sourceCommit !== context.sourceCommit
    ? Object.fromEntries(context.checklists[track].map((check) => [check.id, false]))
    : Object.fromEntries(context.checklists[track].map((check) => [check.id, record.checks[check.id] === true])),
  evidence: record.evidence.map((item) => ({ ...item })),
  issues: record.issues.map((item) => ({ ...item })), attested: false,
});
const initialTrackState = (context: PlexusReviewContext, track: PlexusReviewTrack): TrackState => ({
    draft: blankPlexusReview(context, track), draftBaseVersion: 0, dirty: false, ready: false,
    busy: false, needsReconcile: false, freshAfterConflict: false,
    latest: null, history: [], historyExhausted: false, error: '', message: '',
});
const initialState = (context: PlexusReviewContext): States => ({topology:initialTrackState(context,'topology'),presentation:initialTrackState(context,'presentation')});
function responseError(data: unknown, fallback: string) {
  return data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
    ? data.error : fallback;
}
function matchingContext(received: PlexusReviewContext, expected: PlexusReviewContext) {
  return received.catalogScope === expected.catalogScope &&
    received.candidateId === expected.candidateId &&
    received.sourceCommit === expected.sourceCommit &&
    received.materialHash === expected.materialHash &&
    received.checklistVersion === expected.checklistVersion &&
    received.topologyHash === expected.topologyHash &&
    received.presentationHash === expected.presentationHash &&
    received.revisions.topology === expected.revisions.topology &&
    received.revisions.presentation === expected.revisions.presentation &&
    received.frame.kind === 'diagrammatic' && received.frame.units === 'arbitrary' &&
    received.frame.patientRegistration === false && received.learnerCatalogAdmission === false &&
    received.clinicalApproved === false;
}
function parsePage(value: unknown, context: PlexusReviewContext, track: PlexusReviewTrack, before?: number) {
  if (!value || typeof value !== 'object' || !('context' in value) || !('history' in value))
    throw new Error('Unexpected private review response.');
  const page = value as { context: unknown; history: unknown };
  if (!validPlexusReviewContext(page.context) || !matchingContext(page.context, context) || !Array.isArray(page.history))
    throw new Error('The schematic revision changed. Export edits and reload this page before saving.');
  if (page.history.length > 20) throw new Error('Saved history exceeded the expected page size.');
  const history = page.history.map(parseSavedPlexusReview);
  for (let index = 0; index < history.length; index++) {
    const record = history[index];
    if (record.track !== track || record.context.candidateId !== context.candidateId ||
      (before !== undefined && record.version >= before) ||
      (index > 0 && record.version >= history[index - 1].version))
      throw new Error('Saved history did not match this review track.');
  }
  return history;
}
function mergeIssues(draft: PlexusReviewDraft, latest: SavedPlexusReview | null): PlexusReviewDraft {
  if (!latest) return draft;
  const known = new Set(draft.issues.map((issue) => issue.id));
  return {
    ...draft, status: 'draft', attested: false,
    issues: [...draft.issues, ...latest.issues.filter((issue) => !known.has(issue.id)).map((issue) => ({ ...issue }))],
  };
}
export function restoredPlexusDraft(record: SavedPlexusReview, latest: SavedPlexusReview | null, context: PlexusReviewContext, track: PlexusReviewTrack): PlexusReviewDraft {
  return mergeIssues(copyDraft(record, context, track), latest);
}
export function retainDraftsOnPropChange(states: States): States {
  return Object.fromEntries(plexusReviewTracks.map((track) => [track, {
    ...states[track], ready: false, busy: false, needsReconcile: true,
    freshAfterConflict: false, error: 'The server-provided schematic revision changed. Export this bound working copy, then reload the page.',
  }])) as States;
}
function downloadDraft(context: PlexusReviewContext, track: PlexusReviewTrack, draft: PlexusReviewDraft) {
  const payload = {
    schema: 'vm-plexus-review-working-copy-1', catalogScope: context.catalogScope,
    candidateId: context.candidateId, frame: context.frame, sourceCommit: context.sourceCommit,
    materialHash: context.materialHash, revisionHash: context.revisions[track],
    checklistVersion: context.checklistVersion, track,
    draft: { ...draft, attested: false, status: 'draft' },
    note: 'Private unsaved working copy. This does not record a decision or grant learner access.',
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `plexus-${track}-working-copy.json`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function PlexusReviewWorksheet({ context: incomingContext }: { context: PlexusReviewContext }) {
  const [context] = useState(() => incomingContext);
  const [track, setTrack] = useState<PlexusReviewTrack>('topology');
  const [states, setStates] = useState<States>(() => initialState(context));
  const statesRef = useRef(states);
  const mounted = useRef(true);
  const incomingRef = useRef(incomingContext);
  incomingRef.current = incomingContext;
  const requestId = useRef<Record<PlexusReviewTrack, number>>({ topology: 0, presentation: 0 });
  const saveId = useRef<Record<PlexusReviewTrack, number>>({ topology: 0, presentation: 0 });
  const autosave = useRef(createReviewDraftAutosave());
  const autosaveStamp = useRef(''), autosaveAllowed = useRef(false);
  const incomingKey = [incomingContext.candidateId, incomingContext.materialHash, incomingContext.revisions.topology, incomingContext.revisions.presentation, incomingContext.checklistVersion].join('|');
  const propChanged = !matchingContext(incomingContext, context);
  const patchState = useCallback((target: PlexusReviewTrack, patch: Partial<TrackState> | ((current: TrackState) => Partial<TrackState>)) => {
    if (!mounted.current) return;
    setStates((previous) => {
      const next = { ...previous, [target]: { ...previous[target], ...(typeof patch === 'function' ? patch(previous[target]) : patch) } };
      statesRef.current = next;
      return next;
    });
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => { autosave.current.cancel(); mounted.current = false; requestId.current.topology++; requestId.current.presentation++; saveId.current.topology++; saveId.current.presentation++; };
  }, []);
  useEffect(() => {
    if (!propChanged) return;
    autosave.current.cancel();
    requestId.current.topology++;
    requestId.current.presentation++;
    saveId.current.topology++;
    saveId.current.presentation++;
    setStates((previous) => {
      const retained = retainDraftsOnPropChange(previous);
      statesRef.current = retained;
      return retained;
    });
  }, [incomingKey, propChanged]);
  useEffect(() => {
    if (!Object.values(states).some((state) => state.dirty)) return;
    const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', guard);
    const unregister = registerClinicalReviewNavigationGuard(document, () => true);
    return () => { window.removeEventListener('beforeunload', guard); unregister(); };
  }, [states]);
  const load = useCallback(async (target: PlexusReviewTrack, before?: number) => {
    autosave.current.cancel();
    const request = ++requestId.current[target];
    patchState(target, { busy: true, error: '', message: '' });
    try {
      const response = await clinicalReviewFetch(`/api/atlas-review/plexus-review?track=${target}${before ? `&before=${before}` : ''}`, { cache: 'no-store' });
      const data: unknown = await response.json();
      if (!response.ok) throw new Error(responseError(data, 'Unable to load private review history.'));
      const history = parsePage(data, context, target, before);
      if (!mounted.current || request !== requestId.current[target] || !matchingContext(incomingRef.current, context)) return;
      patchState(target, (current) => {
        const combined = before ? [...current.history, ...history] : history;
        const byVersion = new Map(combined.map((record) => [record.version, record]));
        const records = [...byVersion.values()].sort((a, b) => b.version - a.version);
        const latest = records[0] ?? null;
        const retain = current.dirty || current.needsReconcile;
        return {
          history: records, latest, ready: true, busy: false, error: '',
          historyExhausted: before ? history.length === 0 : history.length === 0,
          draft: retain ? current.draft : latest ? copyDraft(latest, context, target) : blankPlexusReview(context, target),
          draftBaseVersion: retain ? current.draftBaseVersion : version(latest),
          dirty: retain ? current.dirty : false,
          needsReconcile: retain ? current.needsReconcile : false,
          freshAfterConflict: current.needsReconcile ? true : current.freshAfterConflict,
          message: before ? 'Older recorded versions loaded.' : retain
            ? 'Saved records refreshed. Compare them with your retained edits before saving.'
            : 'Private records loaded.',
        };
      });
    } catch (error) {
      if (mounted.current && request === requestId.current[target] && matchingContext(incomingRef.current, context))
        patchState(target, { busy: false, ready: false, error: error instanceof Error ? error.message : 'Unable to load records. Edits remain here.' });
    }
  }, [context, patchState]);
  useEffect(() => { if (!propChanged) void load(track); }, [track, propChanged, load]);
  function change(patch: Partial<PlexusReviewDraft>) {
    autosave.current.cancel();
    patchState(track, (current) => ({ draft: { ...current.draft, attested: false, ...patch }, draftBaseVersion: current.dirty ? current.draftBaseVersion : version(current.latest), dirty: true, message: '' }));
  }
  async function save(status: PlexusReviewDraft['status'], advance = false, automatic = false) {
    autosave.current.cancel();
    const target = track;
    const current = statesRef.current[target];
    if (automatic && (status !== 'draft' || !current.dirty || current.draft.status !== 'draft' || current.draft.attested || current.draftBaseVersion !== version(current.latest))) return;
    if (!current.ready || current.busy || current.needsReconcile || !matchingContext(incomingRef.current, context)) return;
    if (status === 'approved' && plexusApprovalProblems(current.draft, context, target).length) return;
    const request = ++saveId.current[target];
    patchState(target, { busy: true, error: '', message: '' });
    try {
      const response = await clinicalReviewFetch('/api/atlas-review/plexus-review', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catalogScope: context.catalogScope, candidateId: context.candidateId,
          frame: context.frame, sourceCommit: context.sourceCommit, track: target,
          materialHash: context.materialHash, revisionHash: context.revisions[target],
          checklistVersion: context.checklistVersion, expectedVersion: version(current.latest),
          draft: { ...current.draft, status },
        }),
      });
      const data: unknown = await response.json();
      if (!response.ok) throw new Error(responseError(data, `Save returned ${response.status}. Reload saved records and reconcile before retrying.`));
      const saved = parseSavedPlexusReview(data && typeof data === 'object' && 'review' in data ? data.review : null);
      if (saved.track !== target || saved.version !== version(current.latest) + 1 ||
        saved.revisionHash !== context.revisions[target] ||
        !validPlexusReviewContext(saved.context) || !matchingContext(saved.context, context))
        throw new Error('Save response did not match this revision. Reload saved records before retrying.');
      if (!mounted.current || request !== saveId.current[target] || !matchingContext(incomingRef.current, context)) return;
      patchState(target, (now) => ({
        busy: false, latest: saved, history: [saved, ...now.history], draft: copyDraft(saved, context, target), draftBaseVersion: saved.version,
        dirty: false, needsReconcile: false, freshAfterConflict: false,
        message: `${titles[target]} review recorded as version ${saved.version}. This is a private, revision-bound schematic decision.`,
      }));
      if (advance) {
        const next = plexusReviewTracks[plexusReviewTracks.indexOf(target) + 1];
        if (next) setTrack(next);
      }
    } catch (error) {
      if (mounted.current && request === saveId.current[target] && matchingContext(incomingRef.current, context)) patchState(target, {
        busy: false, needsReconcile: true, freshAfterConflict: false,
        error: `${error instanceof Error ? error.message : 'Save could not be confirmed.'} Your working copy is retained.`,
      });
    }
  }
  const current = states[track];
  const autoStamp = reviewDraftStamp({context, track}, current.draftBaseVersion, current.draft);
  autosaveStamp.current = autoStamp;
  const autoReady = mayAutosaveDraft({status: current.draft.status, attested: current.draft.attested, dirty: current.dirty, loaded: current.ready, currentHistory: current.draftBaseVersion === version(current.latest) && !current.needsReconcile && !current.error && !propChanged, busy: current.busy, uncertain: current.needsReconcile, reloadRequired: propChanged});
  autosaveAllowed.current = autoReady;
  useEffect(() => {
    if (!autoReady) return () => autosave.current.cancel();
    autosave.current.schedule(autoStamp, expected => mounted.current && autosaveAllowed.current && autosaveStamp.current === expected && !statesRef.current[track].busy, () => { void save('draft', false, true); });
    return () => autosave.current.cancel();
  }, [autoStamp, autoReady]);
  const nextTrack = plexusReviewTracks[plexusReviewTracks.indexOf(track) + 1];
  const approvalProblems = plexusApprovalProblems(current.draft, context, track);
  const updateIssue = (index: number, patch: Partial<PlexusReviewDraft['issues'][number]>) =>
    change({ issues: current.draft.issues.map((issue, i) => i === index ? { ...issue, ...patch } : issue) });
  return (
    <section className="plexus-review" aria-label="Private plexus schematic review">
      <header className="plexus-review__header">
        <div><p className="plexus-review__eyebrow">Private review worksheet</p><h1>{context.candidateName}</h1></div>
        <p className="plexus-review__privacy">Account and institution access required. Review records stay private; credentials are not verified by this form.</p>
      </header>
      <p className="plexus-review__scope">Original right C5–T1 schematic · {context.partCount} named parts · {context.connectionCount} named connections. Diagram coordinates use arbitrary units. This is not a validated spatial nerve mesh, acquired-image registration, clinical approval or learner publication. Do not enter patient data or identifiers.</p>
      <nav className="plexus-review__tabs" aria-label="Schematic review tracks">
        {plexusReviewTracks.map((option) => <button type="button" key={option} className={option === track ? 'is-active' : ''} aria-current={option === track ? 'page' : undefined} onClick={() => { autosave.current.cancel(); setTrack(option); }}>{titles[option]}<span>{states[option].latest?.status === 'approved' && !plexusReviewStale(states[option].latest!, context) ? `${titles[option]} review recorded` : states[option].latest ? plexusDecisionLabel(states[option].latest!, context) : 'Not recorded'}</span>{states[option].dirty && <i aria-label="Unsaved edits">•</i>}</button>)}
      </nav>
      {propChanged && <p className="plexus-review__alert" role="alert">This page received a different schematic revision. Your working fields remain bound to the original revision for export. Reload the full page to review the new material.</p>}
      <div className="plexus-review__toolbar">
        <span role="status">{current.busy ? 'Working…' : current.dirty ? 'Unsaved edits' : current.ready ? 'No unsaved edits' : 'Records not loaded'}</span>
        <button type="button" onClick={() => void load(track)} disabled={current.busy || propChanged}>Reload saved records</button>
        <button type="button" onClick={() => downloadDraft(context, track, current.draft)}>Export working copy</button>
      </div>
      {current.error && <p role="alert" className="plexus-review__alert">{current.error} For account or institution changes, sign in again and reload this page.</p>}
      {current.message && <p role="status" className="plexus-review__message">{current.message}</p>}
      {!current.ready && !current.error && <p role="status">Loading private records…</p>}
      {current.needsReconcile && <div className="plexus-review__alert" role="alert"><p>Saving is paused. Reload saved records, inspect the version history, then choose how to reconcile your edits. Keeping edits resets the checklist and attestation and preserves recorded issue IDs.</p><div className="plexus-review__actions"><button type="button" disabled={!current.freshAfterConflict || current.busy} onClick={() => patchState(track, (state) => ({ draft: state.latest ? copyDraft(state.latest, context, track) : blankPlexusReview(context, track), draftBaseVersion: version(state.latest), dirty: false, needsReconcile: false, freshAfterConflict: false, error: '', message: 'Loaded saved records as an unattested draft.' }))}>Use saved record</button><button type="button" disabled={!current.freshAfterConflict || current.busy} onClick={() => patchState(track, (state) => ({ draft: { ...mergeIssues(state.draft, state.latest), checks: Object.fromEntries(context.checklists[track].map((check) => [check.id, false])) }, draftBaseVersion: version(state.latest), dirty: true, needsReconcile: false, freshAfterConflict: false, error: '', message: 'Edits retained. Repeat this track’s checklist before approval.' }))}>Keep my edits</button></div></div>}
      <p className="plexus-review__revision">{titles[track]} revision: <code>{context.revisions[track]}</code>{current.latest && <> · latest version {current.latest.version}{plexusReviewStale(current.latest, context) && ' · re-review required'}</>}</p>
      <fieldset className="plexus-review__fields" disabled={!current.ready || current.busy || current.needsReconcile || propChanged}>
        <legend>{titles[track]} review details</legend>
        <div className="plexus-review__two"><label>Reviewer name<input value={current.draft.reviewer} maxLength={150} onChange={(event) => change({ reviewer: event.target.value })} /></label><label>Professional role / qualification<input value={current.draft.qualification} maxLength={200} onChange={(event) => change({ qualification: event.target.value })} /></label></div>
        <label>Exact reviewed scope<textarea rows={2} maxLength={2000} value={current.draft.scope} onChange={(event) => change({ scope: event.target.value })} /></label>
        <label>Notes, corrections and limitations<textarea rows={3} maxLength={6000} value={current.draft.notes} onChange={(event) => change({ notes: event.target.value })} /></label>
        <label className="plexus-review__check"><input type="checkbox" checked={current.draft.attested && context.checklists[track].every((check) => current.draft.checks[check.id] === true)} onChange={(event) => change({ checks: exactReviewChecks(context.checklists[track], event.target.checked), attested: event.target.checked })} />I personally reviewed every criterion for this {titles[track].toLowerCase()} track and this exact schematic revision within the stated scope.</label>
        <details><summary>Review criteria · {context.checklists[track].length}</summary><ul>{context.checklists[track].map((check) => <li key={check.id}>{check.label}</li>)}</ul></details>
        <details><summary>HTTPS evidence · {current.draft.evidence.length}</summary>{current.draft.evidence.map((item, index) => <fieldset key={index}><legend>Evidence {index + 1}</legend><label>Title<input maxLength={180} value={item.title} onChange={(event) => change({ evidence: current.draft.evidence.map((entry, i) => i === index ? { ...entry, title: event.target.value } : entry) })} /></label><label>HTTPS URL<input type="url" inputMode="url" maxLength={2048} value={item.url} onChange={(event) => change({ evidence: current.draft.evidence.map((entry, i) => i === index ? { ...entry, url: event.target.value } : entry) })} /></label><label>Evidence note<textarea maxLength={1000} value={item.note} onChange={(event) => change({ evidence: current.draft.evidence.map((entry, i) => i === index ? { ...entry, note: event.target.value } : entry) })} /></label><button type="button" onClick={() => change({ evidence: current.draft.evidence.filter((_, i) => i !== index) })}>Remove unsaved evidence {index + 1}</button></fieldset>)}<button type="button" disabled={current.draft.evidence.length >= 12} onClick={() => change({ evidence: [...current.draft.evidence, { title: '', url: '', note: '' }] })}>Add evidence</button></details>
        <details><summary>Issues · {current.draft.issues.filter((issue) => !issue.resolved).length} open</summary><p>Saved issue IDs remain in later versions. Resolve each issue with a reason.</p>{current.draft.issues.map((issue, index) => <fieldset key={issue.id}><legend>Issue {index + 1}</legend><label>Correction needed<textarea maxLength={500} value={issue.title} onChange={(event) => updateIssue(index, { title: event.target.value })} /></label><label>Severity<select value={issue.severity} onChange={(event) => updateIssue(index, { severity: event.target.value as typeof issue.severity })}><option value="blocker">Blocker</option><option value="major">Major</option><option value="minor">Minor</option></select></label><label className="plexus-review__check"><input type="checkbox" checked={issue.resolved} onChange={(event) => updateIssue(index, { resolved: event.target.checked })} />Resolved</label><label>Resolution and reason<textarea maxLength={1500} value={issue.resolution} onChange={(event) => updateIssue(index, { resolution: event.target.value })} /></label>{!current.latest?.issues.some((saved) => saved.id === issue.id) && <button type="button" onClick={() => change({ issues: current.draft.issues.filter((_, i) => i !== index) })}>Remove unsaved issue</button>}</fieldset>)}<button type="button" disabled={current.draft.issues.length >= 20} onClick={() => change({ issues: [...current.draft.issues, { id: crypto.randomUUID(), title: '', severity: 'major', resolved: false, resolution: '' }] })}>Add issue</button></details>
      </fieldset>
      <div className="plexus-review__approval"><h2>Requirements for a recorded review</h2>{approvalProblems.length ? <ul>{approvalProblems.map((problem) => <li key={problem}>{problem}</li>)}</ul> : <p>Software requirements met. Your professional judgment and exact review scope remain your responsibility.</p>}</div>
      <div className="plexus-review__actions"><button type="button" disabled={!current.ready || current.busy || current.needsReconcile || propChanged} onClick={() => void save('draft')}>Save draft</button><button type="button" disabled={!current.ready || current.busy || current.needsReconcile || propChanged} onClick={() => void save('changes-required', Boolean(nextTrack))}>Changes needed</button><button type="button" disabled={!current.ready || current.busy || current.needsReconcile || propChanged || approvalProblems.length > 0} onClick={() => void save('approved', Boolean(nextTrack))}>{nextTrack ? 'Approve & next' : 'Record review'}</button>{nextTrack&&<button type="button" disabled={!current.ready||current.busy||current.dirty||current.needsReconcile||propChanged} onClick={()=>setTrack(nextTrack)}>Skip for now</button>}</div>
      <details className="plexus-review__history"><summary>Version history · {titles[track]} · {current.history.length} loaded</summary><p>Each version is append-only and bound to its recorded revision. Restoring a version creates a new unattested draft; it does not erase history.</p>{current.history.map((record) => <details key={record.version}><summary>Version {record.version} · {record.status} · {record.savedAt} · {record.revisionHash}</summary><p>{record.reviewer} · {record.qualification}</p><p>{record.scope}</p><p>{record.notes}</p><button type="button" disabled={!current.ready || current.busy || current.needsReconcile} onClick={() => patchState(track, (state) => ({ draft: restoredPlexusDraft(record, state.latest, context, track), draftBaseVersion: version(state.latest), dirty: true, message: `Version ${record.version} restored as an unattested draft.`, error: '' }))}>Restore as draft</button></details>)}{current.history.length > 0 && !current.historyExhausted && <button type="button" disabled={current.busy} onClick={() => void load(track, Math.min(...current.history.map((record) => record.version)))}>Load older versions</button>}</details>
    </section>
  );
}
