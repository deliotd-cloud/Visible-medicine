'use client';

/** Shared by the existing Education exam and private imaging review. */
export function EducationQuestionResponse({ question, index, response, revision, editable, onChange }: {
  question: { id: string; prompt: string; maxMarks: number }; index: number;
  response: string; revision: number; editable: boolean; onChange: (questionId: string, response: string) => void;
}) {
  const fieldId = `candidate-answer-${question.id}`;
  return <section className="case-question">
    <h2>Question {index + 1}<small>{question.maxMarks} marks</small></h2>
    <p>{question.prompt}</p>
    <label htmlFor={fieldId}>Your answer</label>
    <textarea id={fieldId} disabled={!editable} value={response} maxLength={20000}
      onChange={event => onChange(question.id, event.target.value)}
      placeholder={editable ? 'Enter your structured educational response…' : 'This submitted answer is read-only.'} />
    <div className="answer-meta"><span>{response.trim().split(/\s+/).filter(Boolean).length} words</span><span>Revision {revision}</span></div>
  </section>;
}
