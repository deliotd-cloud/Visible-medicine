import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '5eddb97ed2b0375f6ac9feb7f0c47f050f7ea804f0a2b0b7625cc1c52a582b11',
} as const satisfies AtlasDeliveryPolicy;
