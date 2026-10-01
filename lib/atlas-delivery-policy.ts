import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '765a9f2c4c1c8702a328a3d6854cd94c1d365c833d6d4e5c0b9bb8d51e0c106b',
} as const satisfies AtlasDeliveryPolicy;
