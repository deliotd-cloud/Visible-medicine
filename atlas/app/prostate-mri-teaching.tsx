'use client';

import { useState, type KeyboardEvent } from 'react';
import type { ProstateZoneKey } from '../lib/prostate-zones';
import { checkProstateMriAnswer, prostateMriLessons, prostateMriReferences } from '../lib/prostate-mri-teaching';

export function closeProstateTeachingDisclosure(event: KeyboardEvent<HTMLDetailsElement>) {
  if (event.key !== 'Escape' || event.defaultPrevented || !event.currentTarget.open) return;
  event.preventDefault(); event.stopPropagation();
  event.currentTarget.open = false;
  event.currentTarget.querySelector('summary')?.focus();
}

/** Keyed by zone in the parent; the state also rejects a mismatched zone. */
export function ProstateMriTeaching({ zone }: { zone: ProstateZoneKey }) {
  const lesson = prostateMriLessons[zone];
  const reference = prostateMriReferences[lesson.reference];
  const [choice, setChoice] = useState<{zone: ProstateZoneKey; id: string; checked: boolean} | null>(null);
  const answer = choice?.zone === zone ? choice.id : null;
  const result = choice?.zone === zone && choice.checked ? checkProstateMriAnswer(zone, answer) : 'unanswered';
  const feedbackId = `prostate-mri-feedback-${zone}`;
  return <div className="prostate-mri-teaching">
    <details onKeyDown={closeProstateTeachingDisclosure}>
      <summary>MRI recognition tips</summary>
      <p><b>Landmark.</b> {lesson.landmark}</p>
      <p><b>T2 appearance.</b> {lesson.signal}</p>
      <p>{lesson.caution}</p>
      <a href={reference.href} target="_blank" rel="noopener noreferrer">Read the source ↗</a>
      <small>{reference.title} · {reference.section}</small>
      {lesson.cautionReference && <p><a href={prostateMriReferences[lesson.cautionReference].href} target="_blank" rel="noopener noreferrer">Why CZ and TZ remain separate ↗</a></p>}
    </details>
    <details onKeyDown={closeProstateTeachingDisclosure}>
      <summary>Quick anatomy check</summary>
      <fieldset aria-describedby={feedbackId}>
        <legend>{lesson.question}</legend>
        {lesson.choices.map(choice => <label key={choice.id}>
          <input type="radio" name={`prostate-mri-${zone}`} value={choice.id} checked={answer === choice.id}
            onChange={() => setChoice({zone, id: choice.id, checked: false})} />
          <span>{choice.label}</span>
        </label>)}
      </fieldset>
      <button type="button" disabled={!answer} onClick={() => {
        if (answer) setChoice({zone, id: answer, checked: true});
      }}>Check answer</button>
      <p id={feedbackId} role="status" aria-live="polite" aria-atomic="true">
        {result === 'correct' ? `Correct. ${lesson.explanation}` : result === 'incorrect' ? 'Not quite. Use the MRI recognition tips and try again.' : 'Choose one answer, then check it.'}
      </p>
      <small>Practice only · draft teaching awaiting clinical review.</small>
    </details>
  </div>;
}
