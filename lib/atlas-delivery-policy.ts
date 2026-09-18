import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'c0ec8284a7b01b71b9a40b86258fe137fcd9e0d7d2c8b6200c8d1028463b9cf8',
} as const satisfies AtlasDeliveryPolicy;
