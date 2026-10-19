import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'c2df2d6c4f48a90cbc79ed9c3d07c95b2d6cb2d44600f99eb6403ed7c9d542a1',
} as const satisfies AtlasDeliveryPolicy;
