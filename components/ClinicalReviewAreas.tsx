import './clinical-review-areas.css';

const areas = [
  {id:'structures',href:'/workspace/atlas-review',label:'3D anatomy & teaching',description:'Shoulder, whole body, internal anatomy and specimens'},
  {id:'head-learning',href:'/workspace/atlas-review/head-learning',label:'CT/MRI head learning',description:'Teaching, guided sequences, checks and comparisons'},
  {id:'source-comparisons',href:'/workspace/atlas-review/source-comparisons',label:'Held source comparisons',description:'Uncertain anatomy and alternative source candidates'},
] as const;

/** Discovery only. No decisions, counts, source substitutions or access grants.
 * Native new-tab links retain the original worksheet and its unsaved edits. */
export function ClinicalReviewAreas({current}:{current:typeof areas[number]['id']}) {
  return <aside className="clinical-review-areas" aria-label="Find clinical review material">
    <nav aria-label="Clinical Review areas">
      {areas.map(area=>area.id===current
        ? <span key={area.id} aria-current="page"><strong>{area.label}</strong><small>{area.description}</small></span>
        : <a key={area.id} href={area.href} target="_blank" rel="noopener noreferrer"
            aria-label={`${area.label} (opens in a new tab)`}>
            <strong>{area.label}<span aria-hidden="true"> ↗</span></strong><small>{area.description}</small>
          </a>)}
    </nav>
    <p>Other areas open in a new tab, keeping this worksheet in place. Review capabilities differ by packet; this is not a combined pending-approval queue.</p>
  </aside>;
}
