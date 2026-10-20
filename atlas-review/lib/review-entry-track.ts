/** A URL preference for the initial tab, not a review identity or permission. */
export function reviewEntryTrack(value: unknown): 'geometry' | 'teaching' {
  return value === 'teaching' ? 'teaching' : 'geometry';
}
