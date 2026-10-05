import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'fcb76d094696a937de4777820274a62f4062ca785fb80c7a09b0e846cc89fef6',
} as const satisfies AtlasDeliveryPolicy;
