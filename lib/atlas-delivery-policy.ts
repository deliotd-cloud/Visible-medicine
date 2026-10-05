import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'c85d491cc14cc45446f86b4e0090c46612f3e9db2fa5d1405449f6df8038bc8d',
} as const satisfies AtlasDeliveryPolicy;
