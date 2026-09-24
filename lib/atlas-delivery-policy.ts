import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '0b09baa2c0608c58284c35ed31170875af08afaa62a7af0ab1300fd8b6f8c850',
} as const satisfies AtlasDeliveryPolicy;
