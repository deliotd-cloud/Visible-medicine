import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '2fff73f4067fbad15372ee0f844ea0b714ee601243fc2381362da56a6343f892',
} as const satisfies AtlasDeliveryPolicy;
