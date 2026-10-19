import type { ReviewChangeSummary } from '../../lib/review-change-summary';
import './review-change-notice.css';

/** A passive explanation beside the existing authoritative review status. */
export function ReviewChangeNotice({ change }: { change: ReviewChangeSummary | null }) {
  if (!change) return null;
  return <aside className="review-change-notice" role="note" aria-label="Why this review needs attention">
    <p>{change.headline}</p>
    <details>
      <summary>What changed?</summary>
      {change.comparisons.length > 0 && <table>
        <caption>Recorded revision comparison</caption>
        <thead><tr><th scope="col">Item</th><th scope="col">Compared with saved review</th></tr></thead>
        <tbody>{change.comparisons.map(row => <tr key={row.key}>
          <th scope="row">{row.label}</th>
          <td>{row.state === 'same' ? 'Matches saved' : row.state === 'changed' ? 'Changed' : 'Unavailable'}</td>
        </tr>)}</tbody>
      </table>}
      <p>{change.explanation}</p>
    </details>
  </aside>;
}
