import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '3751fe90b3d91a607206c918f7bdee5db1261b7b4308da5fadfea7d100128750',
} as const satisfies AtlasDeliveryPolicy;
