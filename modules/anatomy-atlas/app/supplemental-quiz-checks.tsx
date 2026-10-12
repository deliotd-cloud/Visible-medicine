"use client";

import { useRef, useState } from "react";
import type { ContentQuizCheck } from "./anatomy-data";
import { StructureQuickCheck } from "./structure-quick-check";
import "./supplemental-quiz-checks.css";

function safeReference(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
}

function available(check: ContentQuizCheck, duplicateKey: boolean): boolean {
  return !duplicateKey
    && typeof check.key === "string" && !!check.key.trim()
    && typeof check.body === "string" && !!check.body.trim()
    && Array.isArray(check.bullets) && check.bullets.length >= 2
    && check.bullets.every(choice => typeof choice === "string" && !!choice.trim())
    && new Set(check.bullets.map(choice => choice.trim())).size === check.bullets.length
    && typeof check.correctAnswer === "string"
    && check.bullets.filter(choice => choice === check.correctAnswer).length === 1
    && typeof check.explanation === "string" && !!check.explanation.trim()
    && typeof check.note === "string" && !!check.note.trim()
    && Array.isArray(check.citations) && check.citations.length > 0
    && check.citations.every(url => typeof url === "string" && safeReference(url));
}

export function SupplementalQuizChecks({ checks }: { checks: readonly ContentQuizCheck[] }) {
  if (!Array.isArray(checks) || checks.length === 0) return null;
  // React remounts all local state when any question, key, source or limitation changes.
  return <SupplementalAttempt key={JSON.stringify(checks)} checks={checks} />;
}

function SupplementalAttempt({ checks }: { checks: readonly ContentQuizCheck[] }) {
  const [index, setIndex] = useState(0);
  const focusOnQuestion = useRef(false);
  const keys = checks.map(check => check?.key);
  const check = checks[index];
  const duplicateKey = keys.filter(key => key === check?.key).length !== 1;
  const valid = !!check && available(check, duplicateKey);

  function navigate(next: number) {
    if (next < 0 || next >= checks.length || next === index) return;
    focusOnQuestion.current = true;
    setIndex(next);
  }

  return (
    <details className="supplemental-quiz-checks">
      <summary>More checks · Nerve relationships</summary>
      {checks.length > 1 && <div className="supplemental-quiz-checks-nav" aria-label="Supplemental check navigation">
        <button type="button" disabled={index === 0} onClick={() => navigate(index - 1)}>Previous</button>
        <span>Question {index + 1} of {checks.length}</span>
        <button type="button" disabled={index === checks.length - 1} onClick={() => navigate(index + 1)}>Next</button>
      </div>}
      <div className="supplemental-quiz-checks-question" role="group" tabIndex={-1}
        aria-label={`Supplemental question ${index + 1} of ${checks.length}`}
        ref={node => {
          if (node && focusOnQuestion.current) {
            focusOnQuestion.current = false;
            node.focus({ preventScroll: true });
          }
        }}>
        {valid ? <>
          <StructureQuickCheck key={JSON.stringify(check)} question={check.body}
            choices={check.bullets} correctAnswer={check.correctAnswer}
            explanation={check.explanation} />
          <details className="supplemental-quiz-checks-sources" key={JSON.stringify([check.citations, check.note])}>
            <summary>Sources &amp; limitations</summary>
            <p>{check.note}</p>
            {check.citations.map((url, referenceIndex) => <a key={`${referenceIndex}:${url}`}
              href={url} target="_blank" rel="noopener noreferrer">Reference {referenceIndex + 1} ↗</a>)}
          </details>
        </> : <p role="status" className="supplemental-quiz-checks-unavailable">
          This supplemental check is unavailable because its answer key or source details are missing or ambiguous.
        </p>}
      </div>
    </details>
  );
}
