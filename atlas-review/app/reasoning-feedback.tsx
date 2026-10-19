import { reasoningFeedback, type PracticeSession } from '../lib/atlas-practice';

export function ReasoningFeedback({
  session,
  index,
}: {
  session: PracticeSession;
  index?: number;
}) {
  const feedback = reasoningFeedback(session, index);
  if (!feedback) return null;
  return (
    <div className="vm-reasoning-feedback">
      <p>{feedback.explanation}</p>
      <details>
        <summary>Sources &amp; scope</summary>
        <p>
          Original draft question · anatomical and educator review pending. Not
          a diagnostic test or validated assessment.
        </p>
        <ul>
          {feedback.references.map((reference) => (
            <li key={reference.url}>
              <a href={reference.url} target="_blank" rel="noreferrer">
                {reference.title}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
