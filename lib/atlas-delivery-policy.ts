import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '738aa9e908da0afbcbcc9c3a72987b65f1aac708fcbdb5e6d36076a961ca2846',
} as const satisfies AtlasDeliveryPolicy;
