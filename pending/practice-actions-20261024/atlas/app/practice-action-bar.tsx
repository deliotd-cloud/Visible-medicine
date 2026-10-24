import type { ReactNode } from 'react';
import './practice-action-bar.css';

/** Presentation only: each player retains its own answer/loading/event guards. */
export function PracticeActionBar({
  correct,
  answered,
  label = 'Score',
  children,
}: {
  correct: number;
  answered: number;
  label?: string;
  children: ReactNode;
}) {
  return (
    <div className="vm-practice-action-bar" role="group" aria-label="Practice progress and actions">
      <div className="vm-practice-action-score">
        <span>{label}</span>
        <strong>{correct} / {answered}</strong>
      </div>
      <div className="vm-practice-action-buttons">{children}</div>
    </div>
  );
}
