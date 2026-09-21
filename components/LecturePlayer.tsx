"use client";

import { useState } from "react";
import type { LectureSlide } from "@/lib/lecture-content";
import "./lecture-editor.css";

function safeReference(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname && !url.username && !url.password ? value : "";
  } catch { return ""; }
}

export function LecturePlayer({ title, slides, version }: { title: string; slides: LectureSlide[]; version?: number }) {
  const [index, setIndex] = useState(0);
  const lastIndex = Math.max(0, slides.length - 1);
  const currentIndex = Math.min(index, lastIndex);
  const selected = slides[currentIndex];
  const referenceUrl = selected ? safeReference(selected.referenceUrl) : "";

  function move(next: number) {
    setIndex(Math.max(0, Math.min(next, lastIndex)));
  }

  if (!slides.length) return <section className="lecture-player lecture-player-empty" aria-label={`${title} preview`}><p>No slides to preview yet.</p></section>;

  return <section
    className="lecture-player"
    aria-label={`${title} presentation`}
    tabIndex={0}
    onKeyDown={(event) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); move(currentIndex - 1); }
      if (event.key === "ArrowRight") { event.preventDefault(); move(currentIndex + 1); }
    }}
  >
    <header><div><small>{version ? `Version ${version} · ` : "Draft preview · "}Slide {currentIndex + 1} of {slides.length}</small><h2>{title}</h2></div></header>
    <article className="lecture-player-slide" aria-live="polite">
      <p className="lecture-player-position">{String(currentIndex + 1).padStart(2, "0")}</p>
      <h3>{selected.title}</h3>
      <div className="lecture-player-body">{selected.body.split(/\r?\n/).map((line, lineIndex) => <p key={lineIndex}>{line || <>&nbsp;</>}</p>)}</div>
      {referenceUrl && <a href={referenceUrl} target="_blank" rel="noreferrer">Open source reference</a>}
    </article>
    <footer>
      <button type="button" onClick={() => move(currentIndex - 1)} disabled={currentIndex === 0}>Previous</button>
      <span>{currentIndex + 1} / {slides.length}</span>
      <button type="button" onClick={() => move(currentIndex + 1)} disabled={currentIndex === lastIndex}>Next</button>
    </footer>
    <details className="lecture-player-outline"><summary>Slide outline</summary><ol>{slides.map((slide, slideIndex) => <li key={slide.id}><button type="button" aria-current={slideIndex === currentIndex ? "step" : undefined} onClick={() => move(slideIndex)}>{slide.title || `Slide ${slideIndex + 1}`}</button></li>)}</ol></details>
  </section>;
}
