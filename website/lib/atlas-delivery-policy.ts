import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '73fa9dc074b57ce53acc7da13cee273f65b6a3bf25d2d603a08355c2717e8ccf',
} as const satisfies AtlasDeliveryPolicy;
