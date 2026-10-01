import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'c9d69f25db3550a8cea7a5aa3f4bcfd4731014e5796d37195e738dac120fd338',
} as const satisfies AtlasDeliveryPolicy;
