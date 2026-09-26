import type { BodyCatalog } from '../app/body-types';
import { bodySideMatches } from './body-presentation-parts';
import { matchesRule, stageStructures, type DissectionProfile } from '../app/dissection-data';

/** Revalidate supplied targets against the prospective side, not screen pixels
 * or enabled systems. Context alone cannot keep a focused study available. */
export function dissectionScopeAction(
  catalog: BodyCatalog | null,
  profile: DissectionProfile,
  region: string,
  side: string,
) {
  const scope = catalog?.structures.filter(s =>
    (region === 'whole-body' || s.regions.includes(region)) && bodySideMatches(s, side),
  ) ?? [];
  return {
    type: 'scope' as const,
    availableFocusIds: profile.focuses.filter(f =>
      stageStructures(scope, profile, 'free', f.id).some(s => matchesRule(s, f.rule)),
    ).map(f => f.id),
  };
}
