import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '6008e206b2d12a06020ff52b2679ed5b769b645b94f2da9a83af27029dab0608',
} as const satisfies AtlasDeliveryPolicy;
