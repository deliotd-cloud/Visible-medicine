import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'bebc2adb99b6d5acdf4ca610d99f100c627e61321bdfa8cf472c29a3c2774adb',
} as const satisfies AtlasDeliveryPolicy;
