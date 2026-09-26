import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '963b47c9c2736dfdec60ab387939e9890c0b6eddd72d42f2644ae38e4f889d09',
} as const satisfies AtlasDeliveryPolicy;
