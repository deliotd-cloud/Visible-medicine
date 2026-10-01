import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '92cc027f54772b1a106048d18ac5efcd78cc17be9d2fe037ce5e551870c2f23d',
} as const satisfies AtlasDeliveryPolicy;
