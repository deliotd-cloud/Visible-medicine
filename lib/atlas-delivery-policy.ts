import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '373199ec73a83a3e79cbbaf1fba841b429be6d6e3c752d9336a63c2043d3fe65',
} as const satisfies AtlasDeliveryPolicy;
