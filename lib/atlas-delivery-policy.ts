import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'd64267746511da4c2052827c06fe98cdd82edbf1c82bc66e35d05c56584c210e',
} as const satisfies AtlasDeliveryPolicy;
