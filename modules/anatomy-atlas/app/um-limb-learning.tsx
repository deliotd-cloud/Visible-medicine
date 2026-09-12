'use client';
import { useEffect, useRef, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BodyScene } from './body-scene';
import { allBodySystems } from './body-types';
import { initialInspection } from '@/lib/inspection-state';
import { rendererReady, type RendererHealth } from '@/lib/renderer-health';
import type { SpecimenDefinition, SpecimenSurface } from '@/lib/independent-specimen';
import type { DissectionView } from './dissection-data';
import { createIdentification, reduceIdentification, specimenTeachingFor, type IdentificationState } from '@/lib/um-limb-teaching';
import type { SpecimenPracticeAdapter } from '@/lib/specimen-identification';
import type { SpecimenTopic } from '@/lib/specimen-links';
import { specimenTopicLabels } from '@/lib/specimen-links';
import { specimenClinicalReferences } from '@/content/um-limb-clinical';
import type { SpecimenLesson } from '@/content/um-limb-teaching';

const clinicalTopics = ['clinical', 'pathology'] as const;
const imagingTopics = ['ct', 'mri', 'xray', 'ultrasound'] as const;
function ClinicalReferences({ urls, titles }: { urls: readonly string[]; titles?: Readonly<Record<string, string>> }) {
  return urls.length ? <ul aria-label="Topic references">{urls.map(url => <li key={url}><a href={url} target="_blank" rel="noreferrer">{titles?.[url] ?? Object.values(specimenClinicalReferences).find(r => r.url === url)?.title ?? new URL(url).hostname}</a></li>)}</ul> : null;
}

export function SpecimenLearning({ definition, selected, initialTopic, resolveLesson = specimenTeachingFor, attachmentLabels, referenceTitles }: {
  definition: SpecimenDefinition; selected: SpecimenSurface; initialTopic?: SpecimenTopic | null;
  resolveLesson?: (definition: SpecimenDefinition, selected: SpecimenSurface) => SpecimenLesson | null;
  attachmentLabels?: { proximal: string; distal: string }; referenceTitles?: Readonly<Record<string, string>>;
}) {
  // An adapter's null result must remain unavailable, never fall back to UM.
  const lesson = resolveLesson(definition, selected);
  const group = initialTopic && clinicalTopics.includes(initialTopic as typeof clinicalTopics[number]) ? 'clinical' : initialTopic && imagingTopics.includes(initialTopic as typeof imagingTopics[number]) ? 'imaging' : 'anatomy';
  return <details className="um-knee-details um-limb-learning" key={`${selected.id}:${initialTopic ?? 'closed'}`} open={!!initialTopic}>
    <summary>Learn · anatomy, clinical & imaging</summary>
    {!lesson ? <p>Teaching unavailable for this source binding; no substitute was used.</p> : <>
      <p className="um-knee-scene-caption">Teaching draft · specialist review pending. Education, not diagnosis or treatment.</p>
      <Tabs defaultValue={group}>
        <TabsList aria-label="Specimen information groups" variant="line"><TabsTrigger value="anatomy">Anatomy</TabsTrigger><TabsTrigger value="clinical">Clinical</TabsTrigger><TabsTrigger value="imaging">Imaging</TabsTrigger></TabsList>
        <TabsContent value="anatomy"><Tabs defaultValue={initialTopic === 'function' ? 'function' : 'anatomy'}>
        <TabsList aria-label="Specimen teaching topics" variant="line"><TabsTrigger value="anatomy">Anatomy</TabsTrigger><TabsTrigger value="function">Function</TabsTrigger></TabsList>
        <TabsContent value="anatomy"><p>{lesson.anatomy}</p>{lesson.attachments && <dl>
          <dt>{attachmentLabels?.proximal ?? 'Proximal attachment'}</dt><dd>{lesson.attachments.proximal}</dd><dt>{attachmentLabels?.distal ?? 'Distal attachment'}</dt><dd>{lesson.attachments.distal}</dd>
        </dl>}</TabsContent>
        <TabsContent value="function"><p>{lesson.function}</p>{lesson.attachments && <dl><dt>Motor supply</dt><dd>{lesson.attachments.motor}</dd></dl>}
          <p>Typical function, not simulated motion. Nerve routes and attachment footprints are not reconstructed.</p>
        </TabsContent>
        </Tabs></TabsContent>
        {(['clinical', 'imaging'] as const).map(g => <TabsContent key={g} value={g}>
          <Tabs defaultValue={group === g && initialTopic ? initialTopic : g === 'clinical' ? 'clinical' : (['mri', 'ct', 'xray', 'ultrasound'] as const).find(t => lesson.extended?.topics[t]) ?? 'mri'}>
            <TabsList aria-label={g === 'clinical' ? 'Clinical topics' : 'Imaging modalities'} variant="line">
              {(g === 'clinical' ? clinicalTopics : imagingTopics).map(t => <TabsTrigger key={t} value={t}>{specimenTopicLabels[t]}</TabsTrigger>)}
            </TabsList>
            {(g === 'clinical' ? clinicalTopics : imagingTopics).map(t => {
              const draft = lesson.extended?.topics[t];
              return <TabsContent key={t} value={t}>{draft ? <><p>{draft.body}</p><ClinicalReferences urls={draft.references} titles={referenceTitles} /></> : <p>{specimenTopicLabels[t]} teaching is pending for this source selection. No generic lesson or different structure has been substituted.</p>}
                {g === 'imaging' && <p className="um-knee-scene-caption">Modality teaching only · No patient images, scan alignment or measured pathology.</p>}
              </TabsContent>;
            })}
          </Tabs>
          {lesson.extended && <p className="um-source-caution">Model limit: {lesson.extended.modelLimit}</p>}
        </TabsContent>)}
      </Tabs>
      <details><summary>Self-check</summary><p>Recall this structure’s functional role before revealing the answer.</p><details><summary>Reveal answer</summary><p>{lesson.function}</p></details></details>
      {lesson.extended && <details><summary>Clinical self-check</summary><p>{lesson.extended.selfCheck.question}</p><details><summary>Reveal explanation</summary><p>{lesson.extended.selfCheck.answer}</p><ClinicalReferences urls={lesson.extended.selfCheck.references} titles={referenceTitles} /></details></details>}
      <details><summary>References & next content</summary><ul>{lesson.references.map((url, i) => <li key={url}><a href={url} target="_blank" rel="noreferrer">{referenceTitles?.[url] ?? `Reference ${i + 1} · ${new URL(url).hostname}`}</a></li>)}</ul>
        <p>Clinical/pathology and imaging coverage is incomplete; each topic shows its own draft or pending state. No scan correspondence or separately paid lecture access is implied.</p>
      </details>
    </>}
  </details>;
}

export function SpecimenIdentification({ definition, initial, visibleIds, initialView, onClose, adapter, assetBase }: {
  definition: SpecimenDefinition; initial: IdentificationState; visibleIds: string[]; initialView: DissectionView; onClose: () => void;
  adapter?: SpecimenPracticeAdapter;
  assetBase?: string;
}) {
  const [state, setState] = useState(initial), [view, setView] = useState(initialView), [zoom, setZoom] = useState(1), [reset, setReset] = useState(0);
  const [zoomStep, setZoomStep] = useState(0);
  const [health, setHealth] = useState<RendererHealth>('starting'), [loaded, setLoaded] = useState<string[]>([]), [failed, setFailed] = useState<string[]>([]);
  const questionHeading = useRef<HTMLHeadingElement | null>(null);
  useEffect(() => { questionHeading.current?.focus(); }, [state.index, state.questions]);
  const question = state.questions[state.index], target = definition.surfaces.find(s => s.id === question?.targetId);
  const answered = state.feedback === 'correct' || state.feedback === 'revealed';
  const hidden = definition.surfaces.filter(s => !visibleIds.includes(s.id)).map(s => s.id);
  const required = definition.catalog.bundles.filter(b => definition.surfaces.some(s => visibleIds.includes(s.id) && s.bundle === b.id));
  const ready = rendererReady(health) && required.every(b => loaded.includes(b.id) && !failed.includes(b.id));
  function next() { setState(s => reduceIdentification(s, { type: 'next' })); setZoom(1); setReset(n => n + 1); }
  function again(missed: boolean) {
    const round = (adapter?.createRound ?? createIdentification)(definition, visibleIds, Math.random, missed ? state.results.filter(r => !r.firstTry).map(r => r.targetId) : undefined);
    if (round) { setState(round); setZoom(1); setReset(n => n + 1); }
  }
  return <div className="eye-layer-workbench um-knee-workbench">
    <section className="um-knee-image" aria-label="Structure identification model">
      <div className="um-knee-camera-tools"><Button size="sm" variant="outline" onClick={onClose}>Back to dissection</Button>
        <Select value={view} items={['anterior','posterior','left','right','superior','inferior'].map(v=>({value:v,label:v[0].toUpperCase()+v.slice(1)}))} onValueChange={v => { if (['anterior', 'posterior', 'left', 'right', 'superior', 'inferior'].includes(v ?? '')) setView(v as DissectionView); }}>
          <SelectTrigger aria-label="Practice camera direction"><SelectValue /></SelectTrigger><SelectContent>{['anterior', 'posterior', 'left', 'right', 'superior', 'inferior'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
        </Select>
        <Button size="sm" variant="outline" aria-label="Zoom out" onClick={() => setZoomStep(s => s - 1)}>−</Button>
        <Button size="sm" variant="outline" aria-label="Zoom in" onClick={() => setZoomStep(s => s + 1)}>+</Button>
      </div>
      <div className="eye-layer-viewport">{target && <BodyScene assetBase={assetBase} catalog={definition.catalog} structures={definition.catalog.structures}
        selectedId={target.id} hiddenIds={hidden} systems={allBodySystems} isolated ghostRemoved={false} illustrated
        landmarks={[]} explode={0} layout="spatial" anchorSkeleton={false} showOrigins={false} labels={false} view={view} zoom={zoom} zoomStep={zoomStep}
        reset={reset + state.index} focus exam={false} inspection={initialInspection} cameraBounds={null} plate={false}
        onSelect={() => {}} onLoaded={id => setLoaded(p => p.includes(id) ? p : [...p, id])}
        onFailure={id => setFailed(p => p.includes(id) ? p : [...p, id])} onRendererHealth={setHealth} />}
        {!target && <div className="eye-layer-status">Round complete</div>}
        {target && !ready && <div className="eye-layer-status">{failed.length ? 'Some tissues could not load. Return to dissection to retry.' : 'Preparing the identification model…'}</div>}
      </div>
      <p className="um-knee-scene-caption">Highlight identifies the question’s surface. Other tissues fade; names and origin guides are hidden.</p>
    </section>
    <aside className="eye-layer-controls um-knee-controls" aria-label="Identification practice">
      <h3 ref={questionHeading} tabIndex={-1}>{target ? 'Name the highlighted structure' : 'Round complete'}</h3>
      <p>Practice only · source labels, not clinical certification.</p>
      {question && target ? <>
        <p>Question {state.index + 1} of {state.questions.length}</p>
        <div className="um-limb-answer-options">{question.options.map(id => <Button key={id} variant="outline" disabled={!ready || answered || state.wrong.includes(id)}
          onClick={() => setState(s => reduceIdentification(s, { type: 'answer', id }))}>{definition.surfaces.find(s => s.id === id)?.name}</Button>)}</div>
        <p role="status">{!ready ? 'Answering is paused until the model is ready.' : state.feedback === 'wrong' ? 'Not this surface. Rotate the model and try again.' : answered ? `${state.feedback === 'revealed' ? 'Answer' : 'Correct'}: ${target.name}` : 'Choose an answer using the buttons.'}</p>
        {answered ? <><p>{adapter ? adapter.feedback(definition, target) : specimenTeachingFor(definition, target)?.function}</p><Button onClick={next}>{state.index + 1 === state.questions.length ? 'Finish round' : 'Next structure'}</Button></>
          : <Button variant="ghost" disabled={!ready} onClick={() => setState(s => reduceIdentification(s, { type: 'reveal' }))}>Reveal answer</Button>}
      </> : <>
        <p>{state.results.filter(r => r.firstTry).length} of {state.results.length} identified on the first try. Revealed answers do not count as correct.</p>
        <div className="eye-layer-actions"><Button onClick={() => again(false)}>New round</Button><Button variant="outline" disabled={state.results.every(r => r.firstTry)} onClick={() => again(true)}>Retry missed</Button></div>
        <ul>{state.results.map(r => <li key={r.targetId}>{definition.surfaces.find(s => s.id === r.targetId)?.name} · {r.firstTry ? 'First try' : r.revealed ? 'Revealed' : 'After retry'}</li>)}</ul>
      </>}
      <p>{adapter?.scopeNote ?? 'Rounds use up to ten of the tissues visible when you started. Your dissection and its history are preserved on return. Progress lasts only for this round.'}</p>
    </aside>
  </div>;
}
