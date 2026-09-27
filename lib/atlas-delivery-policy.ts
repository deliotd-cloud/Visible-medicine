import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '4660c9ce28c888775c0d0155f265a81683e85279f5cca196ea8d4d1a0be5cff5',
} as const satisfies AtlasDeliveryPolicy;
