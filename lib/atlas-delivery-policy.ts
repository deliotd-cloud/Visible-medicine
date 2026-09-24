import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'fab230faa8565b7cd5d5fd6b96056568abbf874f271237a476de5c8db9a5dfe0',
} as const satisfies AtlasDeliveryPolicy;
