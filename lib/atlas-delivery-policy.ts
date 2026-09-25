import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '89cc3b29d8913d4e6bd1ffa82b1f91f8696edf16d85dbb9cfd7359da0a179d46',
} as const satisfies AtlasDeliveryPolicy;
