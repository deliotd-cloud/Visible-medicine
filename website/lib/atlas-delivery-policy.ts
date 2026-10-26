import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '1a55c365be177d5cfcd5bb8de860ba60a0ab5b95547e062d091a72f8d7d45c09',
} as const satisfies AtlasDeliveryPolicy;
