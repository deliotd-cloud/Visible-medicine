/** Group only the exporter's repeated technical suffix, never clinical caveats. */
export function splitSourceDisplayNotes(note: string) {
  const unchanged = { visibleNote: note, sourceDetails: '', excludedCount: 0 };
  const marker = 'Display aggregate excludes the separately selectable ';
  const start = note.indexOf(marker);
  if (start < 0 || (start > 0 && note[start - 1] !== ' ')) return unchanged;
  const suffix = note.slice(start);
  const sentences = suffix.match(
    /Display aggregate excludes the separately selectable [^.\n]+ surface\. Source coordinates are unchanged\./g,
  );
  // Exact reconstruction rejects unknown text, interleaved caveats and changed
  // source semantics. In those cases the complete original note stays visible.
  if (!sentences || sentences.length < 2 || sentences.join(' ') !== suffix) {
    return unchanged;
  }
  return {
    visibleNote: start === 0 ? '' : note.slice(0, start - 1),
    sourceDetails: suffix,
    excludedCount: sentences.length,
  };
}
