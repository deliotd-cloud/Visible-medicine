'use client';

import { useCallback, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Button } from '@/atlas-review/components/ui/button';
import {
  createPracticeSession,
  initialPractice,
  missedPracticeIds,
  practiceReducer,
  practiceRenderIds,
  practiceScore,
  type PracticeMode,
} from '@/atlas-review/lib/anatomy-practice';
import { nestedPracticeKind, nestedPracticeReady } from '@/atlas-review/lib/nested-practice';
import type { NestedStudy } from '@/atlas-review/lib/nested-anatomy';
import type { RendererHealth } from '@/atlas-review/lib/renderer-health';
import { initialInspection } from '@/atlas-review/lib/inspection-state';
import { BodyScene, retryBodyAssets } from './body-scene';
import { allBodySystems, type BodyCatalog, type BodyStructure } from './body-types';
import type { DissectionView } from './dissection-data';
import './nested-practice.css';

export function NestedPractice({
  catalog,
  structures,
  study,
  mode,
  view,
  assetBase = '',
  onClose,
}: {
  catalog: BodyCatalog;
  structures: BodyStructure[];
  study: NestedStudy;
  mode: PracticeMode;
  view: DissectionView;
  assetBase?: string;
  onClose: () => void;
}) {
  const kind = nestedPracticeKind(study) ?? 'structure';
  const [practice, dispatch] = useReducer(
    practiceReducer,
    undefined,
    () =>
      createPracticeSession(
        structures,
        [...new Set(structures.map((s) => s.bundle))],
        {
          id: 1,
          mode,
          count: Math.min(5, structures.length),
          sampling: 'all',
        },
      ) ?? initialPractice,
  );
  const [health, setHealth] = useState<RendererHealth>('starting');
  const [loaded, setLoaded] = useState<string[]>([]);
  const [failed, setFailed] = useState<string[]>([]);
  const [retry, setRetry] = useState(0);
  const [separated, setSeparated] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const feedback = useRef<HTMLOutputElement>(null);
  useLayoutEffect(() => {
    heading.current?.focus();
  }, [practice.id, practice.index, practice.status]);

  const rendered = useMemo(() => {
    if (practice.status === 'complete') return structures;
    const ids = new Set(practiceRenderIds(practice));
    return structures.filter((structure) => ids.has(structure.id));
  }, [practice, structures]);
  const required = useMemo(
    () => [...new Set(rendered.map((structure) => structure.bundle))],
    [rendered],
  );
  const ready = nestedPracticeReady(health, required, loaded, failed);
  const question = practice.questions[practice.index];
  const target = structures.find((structure) => structure.id === question?.target);
  const answered = practice.responses.length > practice.index;
  const currentResponse = practice.responses[practice.index];
  useLayoutEffect(() => {
    if (answered && practice.status !== 'complete') feedback.current?.focus();
  }, [answered, practice.id, practice.index, practice.status]);
  const appearance = useMemo(
    () =>
      Object.fromEntries(
        structures.map((structure) => [
          structure.id,
          { color: '#a7adb2', opacity: 1 },
        ]),
      ),
    [structures],
  );
  const onLoaded = useCallback((id: string) => {
    setLoaded((value) => (value.includes(id) ? value : [...value, id]));
    setFailed((value) => value.filter((failedId) => failedId !== id));
  }, []);
  const onFailure = useCallback((id: string) => {
    setFailed((value) => (value.includes(id) ? value : [...value, id]));
  }, []);

  function answer(chosen: string | null) {
    if (!ready || !question || answered) return;
    dispatch({
      type: 'answer',
      sessionId: practice.id,
      index: practice.index,
      chosen,
    });
  }
  function next() {
    if (!ready || !answered) return;
    dispatch({ type: 'next', sessionId: practice.id, index: practice.index });
  }
  function retryMissed() {
    const session = createPracticeSession(
      structures,
      [...new Set(structures.map((s) => s.bundle))],
      {
        id: practice.id + 1,
        mode,
        count: Math.min(5, structures.length),
        sampling: 'all',
        retryIds: missedPracticeIds(practice.responses),
      },
    );
    if (session) {
      setHealth('starting');
      setLoaded([]);
      setFailed([]);
      dispatch({ type: 'start', session });
    }
  }

  const complete = practice.status === 'complete';
  return (
    <div className="nested-practice eye-layer-workbench">
      <section className="eye-layer-viewport" aria-label="Nested anatomy identification model">
        {rendered.length > 0 && (
          <BodyScene
            key={practice.id}
            assetBase={assetBase}
            catalog={catalog}
            structures={rendered}
            selectedId={null}
            systems={allBodySystems}
            isolated={false}
            hiddenIds={[]}
            ghostRemoved={false}
            illustrated
            labels={false}
            landmarks={[]}
            contextIds={[]}
            explode={0}
            layout="spatial"
            anchorSkeleton={false}
            showOrigins={false}
            view={view}
            zoom={1}
            reset={practice.id + practice.index}
            focus
            exam
            practiceTray={kind === 'structure' && practice.mode === 'find' && separated}
            inspection={initialInspection}
            plate={false}
            appearance={appearance}
            retries={Object.fromEntries(catalog.bundles.map((bundle) => [bundle.id, retry]))}
            onSelect={(id) => {
              if (practice.mode === 'find') answer(id);
            }}
            onLoaded={onLoaded}
            onFailure={onFailure}
            onRendererHealth={setHealth}
          />
        )}
        {!complete && !ready && (
          <div className="eye-layer-status" role={failed.some((id) => required.includes(id)) ? 'alert' : 'status'}>
            {failed.some((id) => required.includes(id))
              ? 'Practice is paused because required anatomy could not load.'
              : 'Preparing the identification model…'}
            {failed.some((id) => required.includes(id)) && (
              <Button
                size="sm"
                onClick={() => {
                  retryBodyAssets(
                    catalog.bundles
                      .filter((bundle) => required.includes(bundle.id) && failed.includes(bundle.id))
                      .map((bundle) => bundle.url),
                    assetBase,
                  );
                  setLoaded((value) => value.filter((id) => !failed.includes(id)));
                  setFailed([]);
                  setRetry((value) => value + 1);
                }}
              >
                Retry
              </Button>
            )}
          </div>
        )}
      </section>
      <aside className="eye-layer-controls nested-practice-controls" aria-label="Identification practice">
        <Button variant="outline" size="sm" onClick={onClose}>
          Back to dissection
        </Button>
        <h3 ref={heading} tabIndex={-1}>
          {complete
            ? 'Practice complete'
            : practice.mode === 'find'
              ? `Find ${target?.name ?? `the named ${kind}`}`
              : `Name the isolated ${kind}`}
        </h3>
        <p>{kind === 'space' ? 'Source spaces only, not chamber walls.' : 'Source-defined structures and named groups only, not complete organs or validated clinical anatomy.'} Labels, teaching and selection hints are hidden.</p>
        <p>Formative practice only; this is not a validated assessment.</p>
        {!complete && question && target && (
          <>
            <p>
              Question {practice.index + 1} of {practice.questions.length}
            </p>
            {practice.mode === 'name' ? (
              <div className="nested-practice-choices">
                {question.choices.map((id) => (
                  <Button
                    key={`${practice.id}:${practice.index}:${id}`}
                    variant="outline"
                    disabled={!ready || answered}
                    onClick={() => answer(id)}
                  >
                    {structures.find((structure) => structure.id === id)?.name}
                  </Button>
                ))}
              </div>
            ) : (
              <>
                <p>Select the named surface in the model.</p>
                {kind === 'structure' && (
                  <>
                    <Button variant="outline" aria-pressed={separated} onClick={() => setSeparated(value => !value)}>
                      {separated ? 'Restore anatomical positions' : 'Separate overlapping structures'}
                    </Button>
                    {separated && <p role="status">Separated shapes for identification, not anatomical positions.</p>}
                  </>
                )}
              </>
            )}
            <output ref={feedback} tabIndex={-1} className="block">
              {!ready
                ? 'Answering is paused until the model is ready.'
                : answered
                  ? currentResponse?.chosen === target.id
                    ? `Correct: ${target.name}.`
                    : `Answer: ${target.name}.`
                  : 'Choose once, or skip to reveal the answer.'}
            </output>
            {answered ? (
              <Button onClick={next} disabled={!ready}>
                {practice.index + 1 === practice.questions.length ? 'Finish round' : `Next ${kind}`}
              </Button>
            ) : (
              <Button variant="ghost" disabled={!ready} onClick={() => answer(null)}>
                Skip &amp; reveal
              </Button>
            )}
          </>
        )}
        {complete && (
          <section className="nested-practice-results">
            <p>
              {practiceScore(practice)} of {practice.responses.length} correct.
            </p>
            <ul>
              {practice.responses.map((response) => (
                <li key={response.target}>
                  {structures.find((structure) => structure.id === response.target)?.name} ·{' '}
                  {response.chosen === response.target ? 'Correct' : 'Review'}
                </li>
              ))}
            </ul>
            <div className="eye-layer-actions">
              <Button
                variant="outline"
                disabled={!missedPracticeIds(practice.responses).length}
                onClick={retryMissed}
              >
                Retry missed
              </Button>
              <Button onClick={onClose}>Return to dissection</Button>
            </div>
          </section>
        )}
        <p className="muted">
          Your visibility, selection and history are preserved. The camera may reframe when you return.
          {study === 'ventricles' ? ' These are ventricular spaces, not solid tissue.' : ''}
        </p>
      </aside>
    </div>
  );
}
