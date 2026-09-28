import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '369ba3207a79aa93f16f8352a56e4c85d6dab79b088dab90bd4e198588953990',
} as const satisfies AtlasDeliveryPolicy;
