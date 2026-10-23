import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'bdfa5cd1de346f40c4656d5be2ad72b577cfa09e803c4bd4701ed8d446478a82',
} as const satisfies AtlasDeliveryPolicy;
