import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '3bf87845650919940d520d158e4c06abaeaef0e474e0fbb235688490908b4ab1',
} as const satisfies AtlasDeliveryPolicy;
