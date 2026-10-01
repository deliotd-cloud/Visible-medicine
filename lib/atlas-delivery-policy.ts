import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'bdbfc7c4b0eec3d14998e3e51ee1a65f12d17b7da1648db0f413ad2ade72317f',
} as const satisfies AtlasDeliveryPolicy;
