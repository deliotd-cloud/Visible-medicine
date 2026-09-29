import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'c7b2b85935f2583554a5ff42327edd566d2588335fdaadc60bb519e77f000ac9',
} as const satisfies AtlasDeliveryPolicy;
