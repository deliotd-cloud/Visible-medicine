import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'ee4e4d433d0eae7cd97e9ea4e7b042a9577db1395ac95d3e3c6e43277a05bd5c',
} as const satisfies AtlasDeliveryPolicy;
