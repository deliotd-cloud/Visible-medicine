import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'a9c16e1be9fcc03d891731d4d79b35e5bc4dbfbbffe5d8e736460bd0866cebcb',
} as const satisfies AtlasDeliveryPolicy;
