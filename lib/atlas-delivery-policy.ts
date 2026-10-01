import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'fa4c3d94f300dea8b13157c9dd638d604c498d5fe0b29e99a033e5f9fdfcc6f9',
} as const satisfies AtlasDeliveryPolicy;
