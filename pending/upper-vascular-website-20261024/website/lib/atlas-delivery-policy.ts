import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '039cf2fda8eb3e47d665fbe0e8ad2d00e4cc3b307e1a84a8bd5dd5c801cb3b55',
} as const satisfies AtlasDeliveryPolicy;
