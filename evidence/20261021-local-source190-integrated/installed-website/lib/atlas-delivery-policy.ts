import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'b61341f4a0476ceaef85ae39a56706db29c1ff7c9fbba574ea096777c8eb9022',
} as const satisfies AtlasDeliveryPolicy;
