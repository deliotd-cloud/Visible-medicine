import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'cd0e7dc864e12bec321cf9a56c9b8f0c6546bbb6465390a1db1b7a312f60ccfa',
} as const satisfies AtlasDeliveryPolicy;
