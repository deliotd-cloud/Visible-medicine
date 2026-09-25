import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'c7f320a40a4fa01359efde4960f5c14678965255b030227b764e5a81f5b06760',
} as const satisfies AtlasDeliveryPolicy;
