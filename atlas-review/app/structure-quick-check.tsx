"use client";

import { useId, useRef, useState } from "react";
import "./structure-quick-check.css";

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
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const feedback = useRef<HTMLDivElement>(null);
  const firstChoice = useRef<HTMLInputElement>(null);
  const hasKey = typeof correctAnswer === "string" && correctAnswer.trim().length > 0
    && choices.filter(choice => choice === correctAnswer).length === 1
    && choices.every(choice => choice.trim().length > 0)
    && new Set(choices.map(choice => choice.trim())).size === choices.length;

  return (
    <section className="structure-quick-check" aria-label="Structure check">
      <p className="structure-quick-check-status">Formative draft · not a scored assessment</p>
      <fieldset aria-describedby={`${id}-availability`}>
        <legend>{question}</legend>
        {choices.map((choice, index) => (
          <label className="structure-quick-check-choice" key={index}>
            <input ref={index === 0 ? firstChoice : undefined} type="radio" name={`${id}-choice`}
              value={index} checked={selected === index}
              onChange={() => { setSelected(index); setChecked(false); }} />
            <span>{choice}</span>
          </label>
        ))}
      </fieldset>
      <p id={`${id}-availability`} className="structure-quick-check-availability">
        {hasKey ? "Choose an answer, then check it." : "This draft cannot be marked because its answer key is missing or ambiguous. You can still read the question and choices."}
      </p>
      {hasKey && <button type="button" disabled={selected === null} onClick={() => {
        setChecked(true);
        feedback.current?.focus({ preventScroll: true });
      }}>Check answer</button>}
      <div ref={feedback} className="structure-quick-check-feedback" tabIndex={-1} aria-live="polite" aria-atomic="true">
        {checked && hasKey && <>
          <p>{choices[selected ?? -1] === correctAnswer ? "Correct." : "Incorrect."} Correct answer: {correctAnswer}</p>
          {explanation && <p>{explanation}</p>}
        </>}
      </div>
      {checked && <button type="button" onClick={() => {
        setSelected(null);
        setChecked(false);
        firstChoice.current?.focus({ preventScroll: true });
      }}>Try again</button>}
    </section>
  );
}
