'use client';
import { reviewModelHref } from '@/lib/clinical-review-links';
import { clinicalReviewFetch } from '@/lib/clinical-review-fetch';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ReviewSignInLink } from '@/atlas-review/components/review-sign-in-link';
import { Brand } from '../../brand';
import { Button } from '@/atlas-review/components/ui/button';
import { Input } from '@/atlas-review/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/atlas-review/components/ui/select';
import { bodySystems } from '../../body-types';
import {
  bodyReviewQueue,
  type BodyReviewSummary,
} from '@/atlas-review/lib/body-review-search';
import type { BodyReviewMaterial } from '@/atlas-review/lib/body-review-material';
import { parseBodyReviewResponse } from '@/atlas-review/lib/body-review-response';
import { BodyDecisionEditor } from './body-decision-editor';

const labels = {
  anatomy: 'Anatomy',
  function: 'Function',
  ct: 'CT',
  mri: 'MRI',
  xray: 'X-ray',
  ultrasound: 'Ultrasound',
  pathology: 'Pathology',
  clinical: 'Clinical',
  quiz: 'Quiz notes',
};
const readiness = {
  draft: 'Draft',
  pending: 'Pending',
  'identity-only': 'Identity only',
  'generated-identification': 'Identification prompt only',
};
export function BodyReviewDashboard({
  rows,
  regions,
  initialId,
  initialRegion,
}: {
  rows: BodyReviewSummary[];
  regions: { id: string; name: string }[];
  initialId: string | null;
  initialRegion: string;
}) {
  const [region, setRegion] = useState(initialRegion),
    [system, setSystem] = useState('all'),
    [query, setQuery] = useState('');
  const [page, setPage] = useState(0),
    [selected, setSelected] = useState(initialId);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);
  function canLeave() {
    return (
      !dirty ||
      window.confirm(
        'Leave this structure and discard unsaved review edits? Export or save them first if needed.',
      )
    );
  }
  const [material, setMaterial] = useState<BodyReviewMaterial | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false),
    [attempt, setAttempt] = useState(0);
  const matches = useMemo(
    () => bodyReviewQueue(rows, region, system, query),
    [rows, region, system, query],
  );
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(matches.length / 20) - 1),
  );
  const visible = matches.slice(currentPage * 20, currentPage * 20 + 20);
  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    setMaterial(null);
    setError('');
    if (!selected) {
      setLoading(false);
      return () => controller.abort();
    }
    setLoading(true);
    clinicalReviewFetch(`/api/atlas-review/body-review?structure=${encodeURIComponent(selected)}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data &&
              typeof data === 'object' &&
              'error' in data &&
              typeof data.error === 'string'
              ? data.error
              : 'Unable to load the worksheet.',
          );
        const parsed = parseBodyReviewResponse(data, selected);
        if (!parsed) throw new Error('Unexpected worksheet. Please retry.');
        if (current) setMaterial(parsed);
      })
      .catch((e) => {
        if (current && !controller.signal.aborted)
          setError(
            e instanceof Error ? e.message : 'Unable to load the worksheet.',
          );
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
      controller.abort();
    };
  }, [selected, attempt]);
  function resetSelection() {
    setDirty(false);
    setPage(0);
    setSelected(null);
    setMaterial(null);
    setError('');
  }
  return (
    <div
      className="body-review-app"
      onClickCapture={(event) => {
        const anchor = (event.target as Element).closest('a');
        if (
          !anchor ||
          anchor.target === '_blank' ||
          anchor.hasAttribute('download') ||
          anchor.getAttribute('href')?.startsWith('/api/atlas-review/body-review')
        )
          return;
        if (!canLeave()) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <header className="body-review-header">
        <Brand />
        <span>Body review workspace</span>
        <Link href="/workspace/atlas-review">Clinical review home</Link>
        <Link href="/atlas">Back to atlas</Link>
      </header>
      <main className="body-review-shell">
        <h1>Review the wider body</h1>
        <p>
          Source details and current teaching for {rows.length.toLocaleString()}{' '}
          body selections. Keep private, versioned corrections and review
          records without adding controls to the learner's atlas.
        </p>
        <div className="body-review-grid">
          <aside className="body-review-queue" aria-label="Body review queue">
            <label htmlFor="body-review-query">Find a structure</label>
            <Input
              id="body-review-query"
              value={query}
              maxLength={256}
              placeholder="Name or anatomical ID"
              onChange={(e) => {
                if (!canLeave()) return;
                setQuery(e.target.value);
                resetSelection();
              }}
            />
            <label id="body-review-region-label">Region</label>
            <Select
              value={region}
              onValueChange={(v) => {
                if (v && canLeave()) {
                  setRegion(v);
                  resetSelection();
                }
              }}
            >
              <SelectTrigger aria-labelledby="body-review-region-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All regions</SelectItem>
                {regions.map((r) => (
                  <SelectItem value={r.id} key={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label id="body-review-system-label">System</label>
            <Select
              value={system}
              onValueChange={(v) => {
                if (v && canLeave()) {
                  setSystem(v);
                  resetSelection();
                }
              }}
            >
              <SelectTrigger aria-labelledby="body-review-system-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All systems</SelectItem>
                {Object.entries(bodySystems).map(([id, s]) => (
                  <SelectItem value={id} key={id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p role="status">{matches.length} matching selections</p>
            <ul>
              {visible.map((s) => (
                <li key={s.id}>
                  <Button
                    variant={selected === s.id ? 'secondary' : 'ghost'}
                    aria-pressed={selected === s.id}
                    onClick={() => {
                      if (!canLeave()) return;
                      setDirty(false);
                      setMaterial(null);
                      setError('');
                      setSelected(s.id);
                      setAttempt((n) => n + 1);
                    }}
                  >
                    {s.name}
                    <small>
                      {s.fmaId} · {s.laterality}
                    </small>
                  </Button>
                </li>
              ))}
            </ul>
            {!matches.length && <p>No matches. Try another region or name.</p>}
            <nav aria-label="Review queue pages">
              <Button
                variant="outline"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </Button>
              <span>
                {matches.length ? currentPage + 1 : 0} /{' '}
                {Math.ceil(matches.length / 20)}
              </span>
              <Button
                variant="outline"
                disabled={(currentPage + 1) * 20 >= matches.length}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </Button>
            </nav>
          </aside>
          <section
            className="body-review-paper"
            aria-label="Selected review worksheet"
            aria-busy={loading}
          >
            {loading && (
              <p role="status">Loading the selected source and teaching…</p>
            )}
            {error && (
              <div role="alert">
                <p>{error}</p>
                <Button
                  variant="outline"
                  onClick={() => setAttempt((n) => n + 1)}
                >
                  Retry
                </Button>
                <p>
                  <ReviewSignInLink target={{ scope: 'body', structure: selected }}>
                    Sign in to the review workspace
                  </ReviewSignInLink>
                  . No review decision has been saved.
                </p>
              </div>
            )}
            {!selected && (
              <p>Choose a structure to inspect its source and teaching.</p>
            )}
            {material?.structureId === selected && (
              <>
                <BodyReviewDetails material={material} />
                <BodyDecisionEditor
                  key={`${material.structureId}-${material.materialHash}`}
                  id={material.structureId}
                  materialHash={material.materialHash}
                  onDirty={setDirty}
                />
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export function BodyReviewDetails({
  material,
}: {
  material: BodyReviewMaterial;
}) {
  const s = material.source.structure;
  return (
    <>
      <h2>{s.name}</h2>
      <p>
        {s.fmaId} · {s.laterality} · {s.sources.length} source parts
      </p>
      <div className="body-review-actions">
        {material.atlasLink && (
          <Link href={reviewModelHref(material.atlasLink)}>Open this model</Link>
        )}
        <a
          href={`/api/atlas-review/body-review?structure=${encodeURIComponent(s.id)}&download=1`}
        >
          Download review worksheet
        </a>
      </div>
      {s.coverageNote && (
        <p className="body-review-caution">{s.coverageNote}</p>
      )}
      <details>
        <summary>Source & scope</summary>
        <p>{material.source.credit}</p>
        <p>
          {material.source.licence} · source version{' '}
          {material.source.sourceVersion} · {s.sourceTree}
        </p>
        <code>{s.id}</code>
        <p>Canonical model checksum</p>
        <code>{material.source.bundle.sha256}</code>
        <p>Worksheet material fingerprint (not an approval or signature)</p>
        <code>{material.materialHash}</code>
        {s.presentationParts && <details>
          <summary>Source-file display parts · not separate FMA identities</summary>
          <p>Both sides uses the complete group. Unilateral views use only the corresponding original file. Verify this mapping and its displayed bounds before sign-off.</p>
          <ul>{s.presentationParts.map(p => <li key={p.nodeName}>
            {p.displaySide} display · {p.source.file} · node <code>{p.nodeName}</code>
            <code>{p.source.sha256}</code>
            <p>Scene bounds: {p.bounds.min.join(', ')} to {p.bounds.max.join(', ')}. Label anchor: {p.anchor.join(', ')}.</p>
          </li>)}</ul>
        </details>}
        <ul>
          {s.sources.map((p) => (
            <li key={p.file}>
              {p.file}
              <code>{p.sha256}</code>
            </li>
          ))}
        </ul>
        <ul>
          {material.limits.map((limit) => (
            <li key={limit}>{limit}</li>
          ))}
        </ul>
      </details>
      <h3>Current teaching</h3>
      <p>
        Readiness describes available copy, not clinical approval. Expand a
        topic to review it.
      </p>
      {material.topics.map((topic) => (
        <details key={topic.tab}>
          <summary>
            {labels[topic.tab]} <span>{readiness[topic.readiness]}</span>
          </summary>
          <h4>{topic.title}</h4>
          <p>{topic.body}</p>
          {topic.bullets && (
            <ul>
              {topic.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
          {topic.correctAnswer && <p><strong>Draft answer key:</strong> {topic.correctAnswer}</p>}
          {topic.explanation && <p><strong>Draft explanation:</strong> {topic.explanation}</p>}
          {topic.note && <p>{topic.note}</p>}
          {topic.citations?.map((url, i) =>
            /^https?:\/\//i.test(url) ? (
              <a
                className="body-review-reference"
                href={url}
                target="_blank"
                rel="noreferrer"
                key={`${url}-${i}`}
              >
                Reference {i + 1} ↗
              </a>
            ) : (
              <p key={i}>{url}</p>
            ),
          )}
        </details>
      ))}
      {material.guidedTours.map(evidence=><details key={evidence.tour.id}>
        <summary>Guided learning · {evidence.tour.title} · Draft</summary>
        <p>{evidence.limitations}</p>
        <p>Revision {evidence.tour.revision} · {evidence.transitionMs/1000}s camera sweep · {evidence.transition} · no separation</p>
        <ol>{evidence.tour.steps.map(step=><li key={step.id}>
          <h4>{step.title}</h4><p>{step.caption}</p>
          <p>{step.view} · {step.durationMs/1000}s · {step.fadeOthers?'Others faded':'Full context'} · <code>{step.selectedId}</code></p>
          {step.references.map(url=><a key={url} href={url} target="_blank" rel="noreferrer">Anatomy reference ↗</a>)}
        </li>)}</ol>
        <details><summary>Exact source surfaces & bundles</summary>
          {evidence.structures.map(s=><p key={s.id}>{s.name} · <code>{s.id}</code> · {s.sources.map(p=>`${p.file}: ${p.sha256}`).join('; ')}</p>)}
          {evidence.bundles.map(b=><p key={b.id}>{b.id}: <code>{b.sha256}</code></p>)}
        </details>
        <p>Use Guided learning in the thorax learner to inspect framing and transitions. This material does not approve images or linked lectures.</p>
      </details>)}
      <details>
        <summary>Interactive reasoning · Draft</summary>
        {material.reasoning ? (
          <>
            <h4>{material.reasoning.prompt}</h4>
            <p>Draft answer key for review. This question is not clinically approved.</p>
            <ul>
              {material.reasoning.choices.map(choice => (
                <li key={choice.id}>
                  <strong>{choice.id === material.reasoning?.answerId ? 'Correct answer' : 'Alternative'}:</strong>{' '}
                  {choice.name} · {choice.laterality}
                </li>
              ))}
            </ul>
            <p><strong>Draft explanation:</strong> {material.reasoning.explanation}</p>
            {material.reasoning.references.map((reference, i) => (
              <a className="body-review-reference" href={reference.url} target="_blank"
                rel="noreferrer" key={`${reference.url}-${i}`}>
                {reference.title} ↗
              </a>
            ))}
            <p>{material.reasoning.scope}</p>
            <p>Question <code>{material.reasoning.key}</code> · revision {material.reasoning.revision}</p>
            <details>
              <summary>Exact choice sources & checksums · {material.reasoning.choices.length} choices</summary>
              {material.reasoning.choices.map(choice => (
                <details key={choice.id}>
                  <summary>{choice.name} · {choice.id === material.reasoning?.answerId ? 'Correct answer' : 'Alternative'}</summary>
                  <p>{choice.fmaId} · {choice.laterality} · {choice.regions.join(', ')} · {choice.sourceTree}</p>
                  <code>{choice.id}</code>
                  <p>Node <code>{choice.nodeName}</code> · bundle <code>{choice.bundle}</code></p>
                  <p>Canonical model checksum</p>
                  <code>{choice.bundleSha256}</code>
                  <ul>{choice.sources.map(part => (
                    <li key={part.file}>{part.file}<code>{part.sha256}</code></li>
                  ))}</ul>
                </details>
              ))}
            </details>
          </>
        ) : (
          <p>No eligible interactive reasoning question is available for this exact source selection. This does not indicate review or approval.</p>
        )}
      </details>
      <details>
        <summary>Review checklist & handoff</summary>
        <p>
          Download the worksheet to record reviewer details, evidence and
          corrections externally. The worksheet cannot be imported as a
          sign-off. Use the separate private record below to save revision-bound
          decisions.
        </p>
        {Object.entries(material.checklist).map(([track, items]) => (
          <section key={track}>
            <h4>{track}</h4>
            <ul>
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </details>
    </>
  );
}
