import { bodyLinkEntries, shoulderLinkEntries } from './anatomy-link-registry';
import type { AnatomyRepresentation } from './learning-resource-types';

/** Reuse the verified reference registries; do not reconstruct IDs from names. */
export function learningAnatomyRepresentations(
  catalog: Parameters<typeof bodyLinkEntries>[0],
  shoulderManifest: Parameters<typeof shoulderLinkEntries>[0],
  shoulderNames: Parameters<typeof shoulderLinkEntries>[1],
): AnatomyRepresentation[] {
  return [
    ...bodyLinkEntries(catalog).map((entry) => ({
      scope: 'body' as const,
      structureId: entry.id,
      sources: structuredClone(entry.sources),
    })),
    ...shoulderLinkEntries(shoulderManifest, shoulderNames).map((entry) => ({
      scope: 'shoulder-pilot' as const,
      structureId: entry.id,
      sources: structuredClone(entry.sources),
    })),
  ];
}
