import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '932a49872e49ae9445f0192ee8b4a5bd12e3aed827ec051e15f0a7d9d16239a8',
} as const satisfies AtlasDeliveryPolicy;
