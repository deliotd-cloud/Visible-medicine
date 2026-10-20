'use client';

type Criterion = {id: string; label: string};

export function exactReviewChecks<T extends string>(criteria: readonly {id: T; label: string}[], confirmed: boolean): Record<T, boolean> {
  return Object.fromEntries(criteria.map(({id}) => [id, confirmed])) as Record<T, boolean>;
}

export function GroupedReviewConfirmation({criteria, attestation, checked, onChange, summary}: {
  criteria: readonly Criterion[];
  attestation: string;
  checked: boolean;
  onChange: (confirmed: boolean) => void;
  summary: string;
}) {
  return <div className="head-review-checks">
    <label><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)}/><span>I have reviewed every criterion below and confirm: {attestation}</span></label>
    <details><summary>{summary} · {criteria.length} criteria</summary><ul>{criteria.map(check => <li key={check.id}>{check.label}</li>)}</ul></details>
  </div>;
}

export function NotesConsiderations({criteria, checked, onChange}: {
  criteria: readonly Criterion[];
  checked: boolean;
  onChange: (considered: boolean) => void;
}) {
  return <div className="head-review-checks">
    <label><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)}/><span>I reviewed these considerations for my notes. This does not approve the material.</span></label>
    <details><summary>Considerations · {criteria.length}</summary><ul>{criteria.map(check => <li key={check.id}>{check.label}</li>)}</ul></details>
  </div>;
}
