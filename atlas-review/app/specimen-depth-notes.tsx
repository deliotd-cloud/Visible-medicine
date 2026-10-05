import type { SpecimenDepthLesson, SpecimenDepthNote } from '@/atlas-review/content/um-calf-depth';
import { specimenDepthReviewName } from '@/atlas-review/lib/specimen-depth-scope';

function Note({ title, note }: { title: string; note: SpecimenDepthNote }) {
  return <section><h4>{title}</h4><p>{note.body}</p>
    <ul aria-label={`${title} references`}>{note.references.map(reference => <li key={reference.url}>
      <a href={reference.url} target="_blank" rel="noreferrer">{reference.title}</a>
    </li>)}</ul>
  </section>;
}

/** Compact in the learner's existing tabs; fully visible in the review packet.
 * Reading links are references, never an entitlement or imaging registration. */
export function SpecimenDepthNotes({ depth, section }: {
  depth: SpecimenDepthLesson; section: 'anatomy' | 'clinical' | 'review';
}) {
  const regionName = specimenDepthReviewName(depth);
  if (!regionName) return <p>Additional depth is unavailable for this source/revision scope; no other region was substituted.</p>;
  const content = <>
    <p className="um-knee-scene-caption">Additional teaching draft · specialist review pending.</p>
    {section !== 'clinical' && <><Note title="Relationships" note={depth.relationships} />
      <Note title="Typical arterial supply" note={depth.arterialSupply} /></>}
    {section !== 'anatomy' && <Note title="Clinical pitfall" note={depth.clinicalPitfall} />}
    <p className="um-source-caution">Model limit: {depth.modelLimit}</p>
  </>;
  return section === 'review' ? <section aria-label={`${regionName} depth to review`}>
    <h3>{regionName} relationships, blood supply & clinical depth · Draft</h3>
    <p>Revision: <code>{depth.revision}</code>. Review the actual source surfaces; these notes do not establish absent tissue geometry or scan alignment.</p>
    {content}
  </section> : <details className="um-knee-details">
    <summary>{section === 'anatomy' ? 'Relationships & blood supply' : 'Clinical depth · pitfall'}</summary>
    {content}
  </details>;
}
