import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '7bd7e137233f76ee708806282cd20561a2ba8a1e2ad4c418676ae1a8de129e3a',
} as const satisfies AtlasDeliveryPolicy;
