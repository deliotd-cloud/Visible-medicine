import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'bb3a931dfb370fb25306df5a94824a396ce3849f5ff01227d4fb62487da51d61',
} as const satisfies AtlasDeliveryPolicy;
