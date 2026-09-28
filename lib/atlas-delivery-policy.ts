import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '20361308b9cb4658aee347f04aed2d1281bcfd0b19216b8de4f32e21a5fd016b',
} as const satisfies AtlasDeliveryPolicy;
