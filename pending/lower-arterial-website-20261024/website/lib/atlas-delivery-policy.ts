import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '792ae8536b673c5cba24b16bc024c7fb6d0dbd2ca9196cc1cb7f24187a944c51',
} as const satisfies AtlasDeliveryPolicy;
