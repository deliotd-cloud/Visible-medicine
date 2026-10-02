import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '1dd78768a3149a34c5ca8039cb82f10e419efbf11a00b81e9ce7ac099666b10d',
} as const satisfies AtlasDeliveryPolicy;
