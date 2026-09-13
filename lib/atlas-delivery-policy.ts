import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '091481333b4d5a89fc1a3d05f38db397d125e8009280100b0c69c72e61a79b4b',
} as const satisfies AtlasDeliveryPolicy;
