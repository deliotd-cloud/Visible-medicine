import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'e3c710201a263ef9f6b61a4e1e06c3dc369e3da82013cfef2ffd171a0c94397f',
} as const satisfies AtlasDeliveryPolicy;
