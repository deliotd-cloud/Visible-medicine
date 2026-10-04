import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '22f6ab9f78aaf949bde083abf35aa0936d4ec80a9e67308f74b593f76b0d6988',
} as const satisfies AtlasDeliveryPolicy;
