import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '7d7dcaa7b8d15cae26e0fcc8b1d9f2d8305d574a555a737f601355d24ed98ee4',
} as const satisfies AtlasDeliveryPolicy;
