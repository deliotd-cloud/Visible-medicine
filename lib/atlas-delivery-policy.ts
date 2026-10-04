import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'd7e0208e54c39f8ffb434c48d5a14bd8f2d385e438e695c44ef225932e4c3fcb',
} as const satisfies AtlasDeliveryPolicy;
