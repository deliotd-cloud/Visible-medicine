import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '3cb552f95d2189b295f3faa616ffffe1fdec2fc2fe3f4b6ad6eee5cbd2dbd548',
} as const satisfies AtlasDeliveryPolicy;
