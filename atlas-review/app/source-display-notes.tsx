import { splitSourceDisplayNotes } from '@/atlas-review/lib/source-display-notes';

export function SourceDisplayNotes({ note }: { note: string }) {
  const { visibleNote, sourceDetails, excludedCount } = splitSourceDisplayNotes(note);
  return (
    <div className="body-content-note">
      {visibleNote && <div>{visibleNote}</div>}
      {sourceDetails && (
        <details className="body-source-details" key={note}>
          <summary>Source representation · {excludedCount} separated structures</summary>
          <p>{sourceDetails}</p>
        </details>
      )}
    </div>
  );
}
