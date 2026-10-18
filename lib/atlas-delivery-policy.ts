import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'e936f59267a1f1d2043fab373e50d004f722562ae15d00035a7da7bdfcef448b',
} as const satisfies AtlasDeliveryPolicy;
