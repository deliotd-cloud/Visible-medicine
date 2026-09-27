import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '31f75f575f81ace41fba0e5afc26d370a36de940f927840900e17d0050fa8cf3',
} as const satisfies AtlasDeliveryPolicy;
