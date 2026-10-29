"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import "./structure-quick-check.css";
import { orderQuickCheckChoices } from "../lib/quick-check-choice-order";

export type StructureQuickCheckProps = {
  question: string;
  choices: readonly string[];
  correctAnswer: string | null;
  explanation?: string;
};

export function StructureQuickCheck(props: StructureQuickCheckProps) {
  // Bind a response to the complete content, including revisions with the same prompt.
  return <QuickCheckAttempt key={JSON.stringify(props)} {...props} />;
}

function QuickCheckAttempt({ question, choices, correctAnswer, explanation }: StructureQuickCheckProps) {
  const id = useId();
  const displayChoices = orderQuickCheckChoices(question, choices);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const feedback = useRef<HTMLDivElement>(null);
  const firstChoice = useRef<HTMLInputElement>(null);
  const pendingFocus = useRef<{target: "feedback" | "choice"; origin: Element | null} | null>(null);
  const hasKey = typeof correctAnswer === "string" && correctAnswer.trim().length > 0
    && choices.filter(choice => choice === correctAnswer).length === 1
    && choices.every(choice => choice.trim().length > 0)
    && new Set(choices.map(choice => choice.trim())).size === choices.length;
  const isCorrect = hasKey && selected !== null && displayChoices[selected] === correctAnswer;

  // Move focus only after the checked answer or cleared radio state is committed.
  // A later focus choice wins while a render is delayed; no timer outlives an attempt.
  useLayoutEffect(() => {
    const request = pendingFocus.current;
    pendingFocus.current = null;
    if (!request || document.hidden) return;
    const stillOwned = document.activeElement === request.origin
      || (!!request.origin && !request.origin.isConnected && document.activeElement === document.body);
    if (!stillOwned) return;
    if (request.target === "feedback" && checked && hasKey && selected !== null)
      feedback.current?.focus({ preventScroll: true });
    if (request.target === "choice" && !checked && selected === null)
      firstChoice.current?.focus({ preventScroll: true });
  });

  return (
    <section className="structure-quick-check" aria-label="Structure check">
      <p className="structure-quick-check-status">Formative draft · not a scored assessment</p>
      <fieldset aria-describedby={`${id}-availability`}>
        <legend>{question}</legend>
        {displayChoices.map((choice, index) => (
          <label className="structure-quick-check-choice" key={index}>
            <input ref={index === 0 ? firstChoice : undefined} type="radio" name={`${id}-choice`}
              value={index} checked={selected === index}
              onChange={() => { pendingFocus.current = null; setSelected(index); setChecked(false); }} />
            <span>{choice}</span>
          </label>
        ))}
      </fieldset>
      <p id={`${id}-availability`} className="structure-quick-check-availability">
        {hasKey ? "Choose an answer, then check it." : "This draft cannot be marked because its answer key is missing or ambiguous. You can still read the question and choices."}
      </p>
      {hasKey && <button type="button" disabled={selected === null} onClick={() => {
        if (checked) { feedback.current?.focus({ preventScroll: true }); return; }
        pendingFocus.current = {target: "feedback", origin: document.activeElement};
        setChecked(true);
      }}>Check answer</button>}
      <div ref={feedback} className="structure-quick-check-feedback" tabIndex={-1} aria-live="polite" aria-atomic="true">
        {checked && hasKey && <>
          <p>{isCorrect ? "Correct." : "Incorrect."} Correct answer: {correctAnswer}</p>
          {explanation && <p>{explanation}</p>}
        </>}
      </div>
      {checked && <button type="button" onClick={() => {
        pendingFocus.current = {target: "choice", origin: document.activeElement};
        setSelected(null);
        setChecked(false);
      }}>{isCorrect ? "Practise again" : "Try again"}</button>}
    </section>
  );
}
