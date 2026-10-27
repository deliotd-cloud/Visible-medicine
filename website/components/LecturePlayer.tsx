"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LectureSlide } from "@/lib/lecture-content";
import {lectureLocationMatches, lectureSlideHref, parseLectureSlideRequest, resolveLectureSlideRequest} from '../lib/lecture-slide-navigation.ts';
import type {LectureSlideResolution, PublishedLectureNavigation} from '../lib/lecture-slide-navigation.ts';
import {resolveLectureAnatomyReference} from '../lib/lecture-anatomy-reference.ts';
import {lectureSlideAnatomyReferences} from '../lib/lecture-anatomy-collection.ts';
import {headImageHref} from '../lib/head-atlas-navigation.ts';
import {lectureSlideBodyReferences,resolveLectureBodyReference} from '../lib/lecture-body-reference.ts';
import {bodyRelatedLectureHref} from '../lib/lecture-body-related-links.ts';
import "./lecture-editor.css";

function safeReference(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname && !url.username && !url.password ? value : "";
  } catch { return ""; }
}

type Selection = { identity: object; result: LectureSlideResolution };
type DraftPreviewSelection = { selectedSlideId: string; onSelectSlide: (slideId: string) => void };

function initialSelection(navigation: PublishedLectureNavigation | undefined, slides: LectureSlide[]): LectureSlideResolution {
  return navigation ? resolveLectureSlideRequest(navigation.request, navigation.revision, slides) : {kind: 'ready', index: 0};
}

function unavailableMessage(reason: Exclude<LectureSlideResolution, {kind: 'ready'}>['reason']): string {
  switch (reason) {
    case 'stale-revision': return 'This slide link belongs to an earlier edition of the lecture.';
    case 'missing-slide': return 'The requested slide is unavailable in this edition of the lecture.';
    case 'invalid-publication': return 'This lecture edition cannot be verified for slide navigation.';
    default: return 'This slide link is invalid or unavailable.';
  }
}

export function LecturePlayer({ title, slides, version, navigation, draftPreview }: { title: string; slides: LectureSlide[]; version?: number; navigation?: PublishedLectureNavigation; draftPreview?: DraftPreviewSelection }) {
  const previewIdentity = useRef<object>({});
  // Published address navigation always takes precedence over editor-controlled draft selection.
  const controlledPreview = navigation ? undefined : draftPreview;
  const controlledIdentity = useMemo(() => ({}), [slides, controlledPreview?.selectedSlideId, controlledPreview?.onSelectSlide]);
  const slideIds = slides.map(slide => slide.id).join('\0');
  const publishedIdentity = useMemo(() => ({}), [slideIds, navigation?.workbookId, navigation?.courseSlug, navigation?.revision, navigation?.request.kind, navigation?.request.kind === 'requested' ? navigation.request.slideId : undefined, navigation?.request.kind === 'requested' ? navigation.request.revision : undefined,JSON.stringify(navigation?.tourContext)]);
  const identity = navigation ? publishedIdentity : controlledPreview ? controlledIdentity : previewIdentity.current;
  const activeIdentity = useRef<object | null>(identity);
  activeIdentity.current = identity;
  const draftIndex = controlledPreview ? slides.findIndex(slide => slide.id === controlledPreview.selectedSlideId) : -1;
  const controlledSelection: Selection | null = controlledPreview ? {identity, result: {kind: 'ready', index: draftIndex < 0 ? 0 : draftIndex}} : null;
  const [selection, setSelection] = useState<Selection>(() => ({identity, result: initialSelection(navigation, slides)}));
  const renderedSelection = controlledSelection ?? (selection.identity === identity ? selection : {identity, result: initialSelection(navigation, slides)});
  const activeSelection = useRef<Selection>(renderedSelection);
  activeSelection.current = renderedSelection;
  const result = renderedSelection.result;
  useEffect(() => {
    activeIdentity.current = identity;
    if (!controlledPreview && selection.identity !== identity) {
      const next = {identity, result: initialSelection(navigation, slides)};
      activeSelection.current = next;
      setSelection(next);
    }
    if (!navigation || typeof window === 'undefined') return () => { if (activeIdentity.current === identity) activeIdentity.current = null; };
    const onPopState = () => {
      if (activeIdentity.current !== identity) return;
      const next = lectureLocationMatches(navigation, window.location)
        ? resolveLectureSlideRequest(parseLectureSlideRequest(new URLSearchParams(window.location.search)), navigation.revision, slides)
        : {kind: 'unavailable', reason: 'invalid-link'} as const;
      const updated = {identity, result: next};
      activeSelection.current = updated;
      setSelection(updated);
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      if (activeIdentity.current === identity) activeIdentity.current = null;
      window.removeEventListener('popstate', onPopState);
    };
  }, [identity]);

  const lastIndex = Math.max(0, slides.length - 1);
  const currentIndex = result.kind === 'ready' ? (navigation ? result.index : Math.min(result.index, lastIndex)) : -1;
  const selected = currentIndex >= 0 ? slides[currentIndex] : undefined;
  const referenceUrl = selected ? safeReference(selected.referenceUrl) : "";
  const anatomyReferences=selected?lectureSlideAnatomyReferences(selected):[];
  const anatomy=anatomyReferences.length===1?resolveLectureAnatomyReference(anatomyReferences[0]):null;
  const bodyReferences=selected?lectureSlideBodyReferences(selected):[];

  function move(next: number) {
    if (activeIdentity.current !== identity || activeSelection.current !== renderedSelection || result.kind !== 'ready') return;
    const target = Math.max(0, Math.min(next, lastIndex));
    if (target === currentIndex) return;
    if (controlledPreview) {
      const slide = slides[target];
      if (slide) controlledPreview.onSelectSlide(slide.id);
      return;
    }
    if (!navigation) {
      const updated: Selection = {identity, result: {kind: 'ready', index: target}};
      activeSelection.current = updated;
      setSelection(updated);
      return;
    }
    if (typeof window === 'undefined' || !lectureLocationMatches(navigation, window.location)) return;
    const addressed = resolveLectureSlideRequest(parseLectureSlideRequest(new URLSearchParams(window.location.search)), navigation.revision, slides);
    if (addressed.kind !== 'ready' || addressed.index !== currentIndex) return;
    const slide = slides[target];
    const href = slide && lectureSlideHref(navigation, slide.id);
    if (!href) return;
    try {
      window.history.replaceState(window.history.state, '', href);
      const actual = window.location.pathname + window.location.search;
      if (actual !== href || activeIdentity.current !== identity || activeSelection.current !== renderedSelection) return;
      const updated: Selection = {identity, result: {kind: 'ready', index: target}};
      activeSelection.current = updated;
      setSelection(updated);
    } catch { /* Keep the visible slide consistent with the unchanged address. */ }
  }

  function startCurrentLecture() {
    if (!navigation || result.kind !== 'unavailable' || activeIdentity.current !== identity ||
        activeSelection.current !== renderedSelection || typeof window === 'undefined' ||
        !lectureLocationMatches(navigation, window.location)) return;
    const first = slides[0];
    const href = first && lectureSlideHref(navigation, first.id);
    if (!href || resolveLectureSlideRequest({kind: 'none'}, navigation.revision, slides).kind !== 'ready') return;
    try {
      window.history.replaceState(window.history.state, '', href);
      if (window.location.pathname + window.location.search !== href || activeIdentity.current !== identity ||
          activeSelection.current !== renderedSelection) return;
      const updated: Selection = {identity, result: {kind: 'ready', index: 0}};
      activeSelection.current = updated;
      setSelection(updated);
    } catch { /* Retain the unavailable state if the address cannot be updated. */ }
  }

  if (!navigation && !slides.length) return <section className="lecture-player lecture-player-empty" aria-label={`${title} preview`}><p>No slides to preview yet.</p></section>;

  if (result.kind === 'unavailable' || !selected) return <section className="lecture-player lecture-player-empty" aria-label={`${title} presentation`}>
    <header><h2>{title}</h2></header>
    <p role="status">{result.kind === 'unavailable' ? unavailableMessage(result.reason) : 'This lecture slide is unavailable.'}</p>
    {navigation && result.kind !== 'ready' && <button type="button" onClick={startCurrentLecture} disabled={result.reason === 'invalid-publication'}>Start current lecture</button>}
  </section>;

  const slideLink = navigation ? lectureSlideHref(navigation, selected.id) : null;

  return <section
    className="lecture-player"
    aria-label={`${title} presentation`}
    tabIndex={0}
    onKeyDown={(event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target as Element | null;
      if (typeof target?.closest === 'function' && target.closest('input, select, textarea, button, a, summary, [contenteditable]')) return;
      if (event.key === "ArrowLeft") { event.preventDefault(); move(currentIndex - 1); }
      if (event.key === "ArrowRight") { event.preventDefault(); move(currentIndex + 1); }
    }}
  >
    <header><div><small>{version ? `Version ${version} · ` : "Draft preview · "}Slide {currentIndex + 1} of {slides.length}</small><h2>{title}</h2>{slideLink && <a href={slideLink}>Slide link</a>}</div></header>
    <article className="lecture-player-slide" aria-live="polite">
      <p className="lecture-player-position">{String(currentIndex + 1).padStart(2, "0")}</p>
      <h3>{selected.title}</h3>
      <div className="lecture-player-body">{selected.body.split(/\r?\n/).map((line, lineIndex) => <p key={lineIndex}>{line || <>&nbsp;</>}</p>)}</div>
      {referenceUrl && <a href={referenceUrl} target="_blank" rel="noreferrer">Open source reference</a>}
      {(Object.hasOwn(selected,'anatomyReference')||Object.hasOwn(selected,'anatomyReferences'))&&<details className="lecture-anatomy-links" key={selected.id}>
        <summary>Explore linked anatomy{anatomyReferences.length>1?` · ${anatomyReferences.length} structures`:anatomy?` · ${anatomy.label}`:''}</summary>
        {!anatomyReferences.length&&<p role="status">The saved anatomy links cannot be verified. The lecture remains readable; no replacement anatomy has been chosen.</p>}
        {anatomyReferences.map(pin=>{
          const resolved=resolveLectureAnatomyReference(pin);
          const ctHref=resolved?headImageHref('CT',resolved.conceptId,null,resolved.headRevision):null;
          const mriHref=resolved?headImageHref('MRI',resolved.conceptId,null,resolved.headRevision):null;
          return <section className="lecture-anatomy-item" key={pin.conceptId} aria-label={resolved?.label??`Unavailable anatomy: ${pin.conceptId}`}>
            {resolved?<><h4>{resolved.label}</h4><nav aria-label={`Explore ${resolved.label} in the Atlas`}>
              {resolved.atlasHref&&<a href={resolved.atlasHref} target="_blank" rel="noopener noreferrer">3D Atlas</a>}
              {ctHref&&<a href={ctHref} target="_blank" rel="noopener noreferrer">CT</a>}
              {mriHref&&<a href={mriHref} target="_blank" rel="noopener noreferrer">MRI</a>}
            </nav>{!resolved.atlasHref&&<p>No exact 3D part is mapped for this annotation.</p>}<p>{resolved.scopeNote}</p></>:<p role="status">This anatomy link is unavailable because its source binding has changed or cannot be verified ({pin.conceptId}). The lecture remains readable; no replacement anatomy has been chosen.</p>}
          </section>;
        })}
        {anatomyReferences.length>0&&<p>Opens separately to keep your place in this lecture. Configured local previews load CT/MRI automatically; otherwise choose the approved atlas folder. Atlas and imaging access are independent. This lecture does not unlock another product.</p>}
      </details>}
      {Object.hasOwn(selected,'bodyAnatomyReferences')&&<details className="lecture-anatomy-links" key={`body:${selected.id}`}><summary>Explore linked 3D body anatomy · {bodyReferences.length} structures</summary>
        {!bodyReferences.length&&<p role="status">The saved body links cannot be verified. No replacement anatomy has been chosen.</p>}
        {bodyReferences.map(pin=>{const resolved=resolveLectureBodyReference(pin),learning=bodyRelatedLectureHref(pin);return <section className="lecture-anatomy-item" key={JSON.stringify(pin)} aria-label={resolved?.label??'Unavailable 3D reference'}>{resolved?<><h4>{resolved.label}</h4><nav aria-label={`Explore ${resolved.label} in the Atlas`}><a href={resolved.atlasHref} target="_blank" rel="noopener noreferrer">3D Atlas</a>{learning&&<a href={learning} target="_blank" rel="noopener noreferrer">Related teaching</a>}</nav><p>{resolved.scopeNote}</p></>:<p role="status">This 3D anatomy link is unavailable because its source binding changed or cannot be verified. The lecture remains readable; no replacement has been chosen.</p>}</section>;})}
        <p>Opens in a new tab to preserve this lecture. Atlas, cases and paid lectures retain independent access. These are 3D references, not inferred acquired-image matches or patient-space registration.</p>
      </details>}
    </article>
    <footer>
      <button type="button" onClick={() => move(currentIndex - 1)} disabled={currentIndex === 0}>Previous</button>
      <span>{currentIndex + 1} / {slides.length}</span>
      <button type="button" onClick={() => move(currentIndex + 1)} disabled={currentIndex === lastIndex}>Next</button>
    </footer>
    <details className="lecture-player-outline"><summary>Slide outline</summary><ol>{slides.map((slide, slideIndex) => <li key={slide.id}><button type="button" aria-current={slideIndex === currentIndex ? "step" : undefined} onClick={() => move(slideIndex)}>{slide.title || `Slide ${slideIndex + 1}`}</button></li>)}</ol></details>
  </section>;
}
